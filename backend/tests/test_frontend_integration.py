"""Run against a dedicated PostgreSQL database: TEST_DATABASE_URL=.../smart_port_test.

Creates only an isolated randomly named schema, removed after each test.
No production or demo records are modified.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text, select, func
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.models import Berth, Vessel, VesselVisit
from app.api.routes.integration import VisitPlan


def plan(berth_id):
    now = datetime.now(timezone.utc)
    return dict(name="Integration vessel", reference="TEST-1", cargo="Cement",
                cargoTotalT="12500.00", berthId=str(berth_id), status="PLANNED",
                plannedArrival=now.isoformat(),
                plannedUnloadStart=(now + timedelta(hours=1)).isoformat(),
                plannedCompletion=(now + timedelta(hours=12)).isoformat(),
                plannedRateTph="475.00", notes="Test plan")


def test_plan_rejects_bad_schedule_and_berth():
    payload = plan(uuid.uuid4())
    assert VisitPlan(**payload).plannedRateTph == 475
    payload["berthId"] = "B01"
    with pytest.raises(ValueError):
        VisitPlan(**payload)
    payload = plan(uuid.uuid4())
    payload["plannedCompletion"] = payload["plannedArrival"]
    with pytest.raises(ValueError):
        VisitPlan(**payload)


@pytest.fixture
def api():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is required for PostgreSQL integration tests")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.fail("Use a dedicated database ending in _test")
    schema = "frontend_test_" + uuid.uuid4().hex
    admin = create_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    try:
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            berth = Berth(name="Real berth")
            db.add(berth)
            db.commit()
            berth_id = berth.id
            app.dependency_overrides[get_db] = lambda: db
            with TestClient(app) as client:
                yield client, db, berth_id
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


def test_registration_edit_and_cancel_roundtrip(api):
    client, db, berth = api
    payload = plan(berth)
    response = client.post("/api/v1/integration/visits", json=payload)
    assert response.status_code == 201, response.text
    visit = response.json()["visit"]
    assert float(visit["planned_rate_tph"]) == 475
    assert visit["planned_completion"] is not None
    payload.update(status="DELAYED", plannedRateTph="460.00")
    response = client.put(f'/api/v1/integration/visits/{visit["id"]}', json=payload)
    assert response.status_code == 200, response.text
    assert response.json()["visit"]["status"] == "DELAYED"
    response = client.patch(f'/api/v1/integration/visits/{visit["id"]}/status', json={"status": "CANCELLED"})
    assert response.status_code == 200
    assert response.json()["visit"]["status"] == "CANCELLED"


def test_bad_berth_does_not_create_stray_vessel(api):
    client, db, _ = api
    response = client.post("/api/v1/integration/visits", json=plan(uuid.uuid4()))
    assert response.status_code == 422
    assert db.scalar(select(func.count()).select_from(Vessel)) == 0


def test_repeated_reference_reuses_vessel(api):
    client, db, berth = api
    for _ in range(2):
        response = client.post("/api/v1/integration/visits", json=plan(berth))
        assert response.status_code == 201
    assert db.scalar(select(func.count()).select_from(Vessel)) == 1
    assert db.scalar(select(func.count()).select_from(VesselVisit)) == 2


def test_empty_predictions_are_read_only(api):
    client, db, berth = api
    client.post("/api/v1/integration/visits", json=plan(berth))
    response = client.get("/api/v1/integration/predictions")
    assert response.status_code == 200
    value = next(iter(response.json().values()))
    assert value["data_quality"] == "INSUFFICIENT"
    assert value["estimated_unload_finish"] is None
