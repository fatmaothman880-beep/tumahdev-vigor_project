from datetime import datetime, timezone
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, AwareDatetime, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from app.database.session import get_db
from app.models.models import VesselVisit, Vessel, VisitStatus
from app.models.workflow import SiteConfiguration, SiteVessel, OperationalTask, TaskHistory
from app.services.task_rules import TEMPLATES, timing, checklist_state, utc

router = APIRouter(prefix="/workflow", tags=["Operational Checklist"])


class Actor(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    performed_by: str = Field(min_length=1, max_length=150)


class TaskInput(Actor):
    title: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=50)
    owner_name: str | None = Field(default=None, max_length=150)
    due_at: AwareDatetime | None = None
    completed_at: AwareDatetime | None = None
    status: Literal["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "NOT_APPLICABLE"] = "NOT_STARTED"
    blocks_departure: bool = False
    reason: str = Field(default="", max_length=4000)
    evidence_reference: str = Field(default="", max_length=500)

    @model_validator(mode="after")
    def valid_state(self):
        if self.status in ("BLOCKED", "NOT_APPLICABLE") and not self.reason:
            raise ValueError("A reason is required when blocked or not applicable")
        if self.completed_at and self.status != "COMPLETED":
            raise ValueError("Only completed tasks can have a completion timestamp")
        if self.completed_at and self.completed_at > datetime.now(timezone.utc):
            raise ValueError("Completion time cannot be in the future")
        return self


class TaskUpdate(TaskInput):
    expected_version: int = Field(ge=1)
    change_reason: str = Field(min_length=1, max_length=1000)


def load_visit(db, visit_id, writing=False):
    query = select(VesselVisit).where(VesselVisit.id == visit_id)
    if writing:
        query = query.with_for_update()
    visit = db.scalar(query)
    if not visit:
        raise HTTPException(404, "Visit not found")
    if writing and visit.status in (VisitStatus.CANCELLED, VisitStatus.DEPARTED):
        raise HTTPException(409, "Cancelled/departed visits have a read-only checklist")
    return visit


def commit(db):
    try:
        db.commit()
    except (IntegrityError, StaleDataError) as exc:
        db.rollback()
        raise HTTPException(409, "Record changed or conflicts with another update. Reload before saving.") from exc


def snapshot(task):
    return {"id": str(task.id), "visit_id": str(task.visit_id), "title": task.title,
        "category": task.category, "owner_name": task.owner_name,
        "due_at": utc(task.due_at).isoformat() if task.due_at else None,
        "completed_at": utc(task.completed_at).isoformat() if task.completed_at else None,
        "status": task.status, "blocks_departure": task.blocks_departure,
        "reason": task.reason, "evidence_reference": task.evidence_reference, "version": task.version}


def task_view(task, now):
    return {**snapshot(task), **timing(task.status, task.due_at, task.completed_at, now)}


def record_change(db, task, before, actor, change_reason):
    if before:
        task.version = before["version"] + 1
    try:
        db.flush()  # Assign IDs/version before recording exactly what was saved.
    except (IntegrityError, StaleDataError) as exc:
        db.rollback()
        raise HTTPException(409, "Record changed. Reload before saving.") from exc
    db.add(TaskHistory(task_id=task.id, task_version=task.version, performed_by=actor, old_value=before,
        new_value={**snapshot(task), "change_reason": change_reason}))


@router.get("/site")
def site_catalogue(db: Session = Depends(get_db)):
    site = db.get(SiteConfiguration, "mangapwani")
    if not site:
        return {"configured": False, "vessels": []}
    entries = db.execute(select(SiteVessel, Vessel).join(Vessel, SiteVessel.vessel_id == Vessel.id).where(SiteVessel.site_key == site.key)).all()
    return {"configured": True, "name": site.name, "berth_id": str(site.berth_id), "berth_label": site.berth_label,
        "vessels": [{"vessel_id": str(v.id), "name": v.name, "reference": v.imo_reference or "",
            "reported_cargo_t": item.reported_cargo_t, "temporary_label": item.temporary_label,
            "notes": item.notes} for item, v in entries]}


@router.get("/visits/{visit_id}/tasks")
def list_tasks(visit_id: UUID, db: Session = Depends(get_db)):
    load_visit(db, visit_id)
    tasks = list(db.scalars(select(OperationalTask).where(OperationalTask.visit_id == visit_id).order_by(OperationalTask.created_at, OperationalTask.id)).all())
    now = datetime.now(timezone.utc)
    views = [task_view(t, now) for t in tasks]
    return {"tasks": views, "checklist_state": checklist_state(tasks), "as_of": now,
        "overdue_count": sum(t["timeliness"] == "OVERDUE" for t in views),
        "unassigned_count": sum(not t.owner_name and t.status not in ("COMPLETED", "NOT_APPLICABLE") for t in tasks),
        "unscheduled_count": sum(t["timeliness"] == "UNSCHEDULED" for t in views),
        "notice": "Operator-recorded checklist only. This is not official departure approval. Names are self-reported, not authenticated identities."}


@router.post("/visits/{visit_id}/tasks/templates")
def add_templates(visit_id: UUID, payload: Actor, db: Session = Depends(get_db)):
    load_visit(db, visit_id, writing=True)
    existing = set(db.scalars(select(OperationalTask.template_key).where(OperationalTask.visit_id == visit_id)).all())
    for key, title, category, blocks in TEMPLATES:
        if key not in existing:
            task = OperationalTask(visit_id=visit_id, template_key=key, title=title, category=category,
                status="NOT_STARTED", blocks_departure=blocks, reason="", evidence_reference="")
            db.add(task)
            record_change(db, task, None, payload.performed_by, "Added suggested checklist item; owner and deadline require confirmation")
    commit(db)
    return list_tasks(visit_id, db)


@router.post("/visits/{visit_id}/tasks", status_code=201)
def create_task(visit_id: UUID, payload: TaskInput, db: Session = Depends(get_db)):
    load_visit(db, visit_id, writing=True)
    values = payload.model_dump(exclude={"performed_by"})
    if payload.status == "COMPLETED":
        values["completed_at"] = payload.completed_at or datetime.now(timezone.utc)
    task = OperationalTask(visit_id=visit_id, **values)
    db.add(task)
    record_change(db, task, None, payload.performed_by, "Created task")
    commit(db)
    return task_view(task, datetime.now(timezone.utc))


@router.put("/visits/{visit_id}/tasks/{task_id}")
def update_task(visit_id: UUID, task_id: UUID, payload: TaskUpdate, db: Session = Depends(get_db)):
    load_visit(db, visit_id, writing=True)
    task = db.scalar(select(OperationalTask).where(OperationalTask.id == task_id, OperationalTask.visit_id == visit_id).with_for_update())
    if not task:
        raise HTTPException(404, "Task not found for this visit")
    if task.version != payload.expected_version:
        raise HTTPException(409, "Someone changed this task. Reload and review it before saving.")
    before = snapshot(task)
    values = payload.model_dump(exclude={"performed_by", "expected_version", "change_reason"})
    values["completed_at"] = (payload.completed_at or task.completed_at or datetime.now(timezone.utc)) if payload.status == "COMPLETED" else None
    for field, value in values.items():
        setattr(task, field, value)
    record_change(db, task, before, payload.performed_by, payload.change_reason)
    commit(db)
    return task_view(task, datetime.now(timezone.utc))


@router.get("/visits/{visit_id}/tasks/{task_id}/history")
def history(visit_id: UUID, task_id: UUID, db: Session = Depends(get_db)):
    load_visit(db, visit_id)
    task = db.get(OperationalTask, task_id)
    if not task or task.visit_id != visit_id:
        raise HTTPException(404, "Task not found for this visit")
    rows = db.scalars(select(TaskHistory).where(TaskHistory.task_id == task_id).order_by(TaskHistory.task_version)).all()
    return [{"id": str(r.id), "performed_by": r.performed_by, "occurred_at": utc(r.occurred_at), "old_value": r.old_value, "new_value": r.new_value} for r in rows]


@router.get("/overdue")
def overdue(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    rows = db.execute(select(OperationalTask, VesselVisit, Vessel)
        .join(VesselVisit, OperationalTask.visit_id == VesselVisit.id).join(Vessel, VesselVisit.vessel_id == Vessel.id)
        .where(OperationalTask.status.notin_(["COMPLETED", "NOT_APPLICABLE"]), OperationalTask.due_at < now,
            VesselVisit.status.notin_([VisitStatus.CANCELLED, VisitStatus.DEPARTED]))
        .order_by(OperationalTask.due_at)).all()
    return [{**task_view(t, now), "vessel_name": v.name} for t, visit, v in rows]
