"""Fast local DB tests. SQLite checks are not PostgreSQL migration certification."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import importlib.util
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, func, event, inspect
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from alembic.migration import MigrationContext
from alembic.operations import Operations

from app.main import app
from app.database.base import Base
from app.database.session import get_db
from app.database.setup_site import configure_site
from app.models.models import Berth, Vessel, VesselVisit, VisitStatus
from app.models.workflow import OperationalTask, TaskHistory, SiteVessel
from app.services.task_rules import timing, checklist_state


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@pytest.fixture
def local_db():
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        yield db
    engine.dispose()


@pytest.fixture
def api(local_db):
    db = local_db
    site = configure_site(db)
    vessel_id = db.scalar(select(SiteVessel.vessel_id).where(SiteVessel.key == "polar-night"))
    visit = VesselVisit(vessel_id=vessel_id, berth_id=site.berth_id, cargo_type="Cement", cargo_total_t=Decimal("13800"), status=VisitStatus.PLANNED)
    db.add(visit); db.commit()
    visit_id = str(visit.id)
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            yield client, db, visit_id
    finally:
        app.dependency_overrides.pop(get_db, None)


def payload(**changes):
    return dict(performed_by="Test Recorder", title="Arrange pilot", category="PILOT", owner_name="Port Agent",
        due_at=(datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(), completed_at=None,
        status="NOT_STARTED", blocks_departure=True, reason="", evidence_reference="", **changes)


def test_setup_idempotent_no_visits_or_capacities(local_db):
    configure_site(local_db); local_db.commit()
    configure_site(local_db); local_db.commit()
    assert local_db.scalar(select(func.count()).select_from(Vessel)) == 4
    assert local_db.scalar(select(func.count()).select_from(VesselVisit)) == 0
    assert all(v.capacity_t is None for v in local_db.scalars(select(Vessel)))
    assert local_db.scalar(select(SiteVessel).where(SiteVessel.key == "lpg-placeholder")).temporary_label


def test_setup_keeps_existing_berth_and_edits(local_db):
    berth = Berth(name="Existing berth")
    local_db.add(berth); local_db.commit()
    site = configure_site(local_db); local_db.commit()
    assert site.berth_id == berth.id
    assert berth.name == "Existing berth"
    row = local_db.get(SiteVessel,"polar-night")
    row.reported_cargo_t = Decimal("14000")
    local_db.commit(); configure_site(local_db); local_db.commit()
    assert row.reported_cargo_t == 14000


def test_multiple_berths_require_explicit_choice(local_db):
    local_db.add_all([Berth(name="A"), Berth(name="B")]); local_db.commit()
    with pytest.raises(ValueError, match="Multiple berths"):
        configure_site(local_db)
    assert local_db.scalar(select(func.count()).select_from(Vessel)) == 0


def test_catalogue_and_registered_visit(api):
    client, db, visit_id = api
    catalogue = client.get("/api/v1/workflow/site").json()
    assert catalogue["berth_label"] == "Mangapwani — Berth 1"
    assert len(catalogue["vessels"]) == 4
    vessel = next(v for v in catalogue["vessels"] if v["name"] == "Polar Night")
    response = client.post("/api/v1/integration/visits", json={"vesselId":vessel["vessel_id"],"name":vessel["name"], "reference":"", "cargo":"Cement", "cargoTotalT":10000, "berthId":catalogue["berth_id"], "plannedArrival":datetime.now(timezone.utc).isoformat()})
    assert response.status_code == 201, response.text
    assert response.json()["visit"]["vessel_id"] == vessel["vessel_id"]
    assert db.scalar(select(func.count()).select_from(Vessel)) == 4


def test_templates_repeat_without_duplicate_or_assumed_deadlines(api):
    client, db, visit = api
    for _ in range(2):
        response = client.post(f"/api/v1/workflow/visits/{visit}/tasks/templates", json={"performed_by":"Recorder"})
        assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["tasks"]) == 8
    assert body["unscheduled_count"] == 8
    assert body["unassigned_count"] == 8
    assert body["checklist_state"] == "INCOMPLETE"
    assert db.scalar(select(func.count()).select_from(TaskHistory)) == 8


def test_overdue_complete_late_reopen_and_history(api):
    client, db, visit = api
    root = f"/api/v1/workflow/visits/{visit}/tasks"
    values = payload()
    created = client.post(root,json=values)
    assert created.status_code == 201, created.text
    task = created.json()
    assert task["timeliness"] == "OVERDUE"
    assert task["delay_minutes"] >= 60
    assert len(client.get("/api/v1/workflow/overdue").json()) == 1
    updated = client.put(f'{root}/{task["id"]}',json={**values,"status":"COMPLETED","expected_version":task["version"],"change_reason":"Pilot arranged"})
    assert updated.status_code == 200, updated.text
    completed = updated.json()
    assert completed["timeliness"] == "COMPLETED_LATE"
    assert completed["completed_at"]
    assert client.get(root).json()["checklist_state"] == "CHECKLIST_COMPLETE"
    assert not client.get("/api/v1/workflow/overdue").json()
    # Stale edits must not overwrite the latest state.
    stale = client.put(f'{root}/{task["id"]}',json={**values,"expected_version":task["version"],"change_reason":"Old edit"})
    assert stale.status_code == 409
    reopened = client.put(f'{root}/{task["id"]}',json={**values,"expected_version":completed["version"],"change_reason":"Confirmation withdrawn"})
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["completed_at"] is None
    changes = client.get(f'{root}/{task["id"]}/history').json()
    assert len(changes) == 3
    assert changes[1]["old_value"]["status"] == "NOT_STARTED"
    assert changes[1]["new_value"]["status"] == "COMPLETED"


@pytest.mark.parametrize("updates", [
    {"status":"BLOCKED", "reason":""}, {"status":"NOT_APPLICABLE", "reason":""},
    {"performed_by":" "}, {"due_at":"2026-09-02T10:00:00"},
    {"status":"COMPLETED", "completed_at":"2099-01-01T00:00:00Z"},
    {"status":"IN_PROGRESS", "completed_at":"2026-01-01T00:00:00Z"},
])
def test_reject_invalid_task(api, updates):
    client, db, visit = api
    response = client.post(f"/api/v1/workflow/visits/{visit}/tasks",json={**payload(), **updates})
    assert response.status_code == 422, response.text
    assert db.scalar(select(func.count()).select_from(OperationalTask)) == 0


def test_closed_visit_is_read_only_and_task_is_scoped(api):
    client, db, visit = api
    row = db.get(VesselVisit, __import__("uuid").UUID(visit))
    row.status = VisitStatus.CANCELLED; db.commit()
    assert client.post(f"/api/v1/workflow/visits/{visit}/tasks",json=payload()).status_code == 409
    assert client.get(f"/api/v1/workflow/visits/{visit}/tasks").status_code == 200
    assert client.get(f"/api/v1/workflow/visits/{uuid4()}/tasks").status_code == 404


def test_timing_exact_deadline_unscheduled_and_na():
    now = datetime.now(timezone.utc)
    assert timing("NOT_STARTED",now,None,now)["timeliness"] == "SCHEDULED"
    assert timing("COMPLETED",now,now,now)["timeliness"] == "ON_TIME"
    assert timing("NOT_STARTED",None,None,now)["timeliness"] == "UNSCHEDULED"
    assert timing("COMPLETED",None,now,now)["timeliness"] == "COMPLETED_UNSCHEDULED"
    assert timing("NOT_APPLICABLE",now,None,now)["timeliness"] == "NOT_APPLICABLE"
    assert checklist_state([]) == "NOT_CONFIGURED"


def test_new_migration_on_sqlite_for_table_shape():
    engine = create_engine("sqlite://")
    workflow_tables = {"site_configuration", "site_vessels", "operational_tasks", "task_history"}
    Base.metadata.create_all(engine, tables=[t for t in Base.metadata.sorted_tables if t.name not in workflow_tables])
    path = Path(__file__).resolve().parents[1] / "alembic/versions/b32c8d040002_site_checklists.py"
    spec = importlib.util.spec_from_file_location("site_migration",path)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    with engine.begin() as connection:
        with Operations.context(MigrationContext.configure(connection)):
            module.upgrade()
            inspector = inspect(connection)
            assert workflow_tables.issubset(inspector.get_table_names())
            for name in workflow_tables:
                assert {c["name"] for c in inspector.get_columns(name)} == set(Base.metadata.tables[name].columns.keys())
            module.downgrade()
            module.upgrade()
    engine.dispose()
