"""Frontend integration: atomic registration/editing and read-only forecasts.

No clearance approval or site-survey assumptions are encoded here.
"""
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, AwareDatetime, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.models import Berth, Vessel, VesselVisit, VisitStatus
from app.models.workflow import SiteConfiguration
from app.schemas.visit import VesselVisitResponse
from app.schemas.vessel import VesselResponse
from app.services.calculations import (
    calculate_remaining_cargo, calculate_progress_percentage,
    calculate_effective_rate, calculate_estimated_finish, calculate_berth_release,
)
from app.services.prediction_service import determine_data_quality

router = APIRouter(prefix="/integration", tags=["Frontend Integration"])


class VisitPlan(BaseModel):
    vesselId: UUID | None = None
    name: str = Field(min_length=1, max_length=150)
    reference: str = Field(default="", max_length=20)
    cargo: str = Field(min_length=1, max_length=100)
    cargoTotalT: Decimal = Field(gt=0, decimal_places=2)
    berthId: UUID
    status: VisitStatus = VisitStatus.PLANNED
    plannedArrival: AwareDatetime
    plannedUnloadStart: AwareDatetime | None = None
    plannedCompletion: AwareDatetime | None = None
    plannedRateTph: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    notes: str = ""

    @model_validator(mode="after")
    def validate_plan(self):
        if not self.name.strip() or not self.cargo.strip():
            raise ValueError("Name and cargo cannot be blank")
        if self.plannedUnloadStart and self.plannedUnloadStart < self.plannedArrival:
            raise ValueError("Planned unloading cannot precede arrival")
        if self.plannedCompletion and self.plannedCompletion <= (self.plannedUnloadStart or self.plannedArrival):
            raise ValueError("Planned completion must follow arrival and unloading start")
        return self


def commit(db):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Conflicting reference or invalid operation; nothing was saved.") from exc


def visit_pair(visit):
    return {
        "visit": VesselVisitResponse.model_validate(visit),
        "vessel": VesselResponse.model_validate(visit.vessel),
    }


def apply_plan(visit, payload):
    visit.berth_id = payload.berthId
    visit.cargo_type = payload.cargo.strip()
    visit.cargo_total_t = payload.cargoTotalT
    visit.planned_arrival = payload.plannedArrival
    visit.planned_unload_start = payload.plannedUnloadStart
    visit.planned_completion = payload.plannedCompletion
    visit.planned_rate_tph = payload.plannedRateTph
    visit.notes = payload.notes
    apply_status(visit, payload.status)


def apply_status(visit, status):
    now = datetime.now(timezone.utc)
    visit.status = status
    if status in (VisitStatus.ARRIVED, VisitStatus.BERTHED, VisitStatus.UNLOADING, VisitStatus.DELAYED):
        visit.actual_arrival = visit.actual_arrival or now
    if status == VisitStatus.UNLOADING:
        visit.unload_start = visit.unload_start or now
    if status == VisitStatus.COMPLETED:
        # Completion means discharge completion, NOT authorised departure.
        visit.unload_end = visit.unload_end or now


def load_visit(db, visit_id):
    visit = db.get(VesselVisit, visit_id)
    if not visit:
        raise HTTPException(404, "Vessel visit not found")
    return visit


@router.get("/visits")
def list_visits(db: Session = Depends(get_db)):
    visits = db.scalars(select(VesselVisit).options(selectinload(VesselVisit.vessel)).order_by(VesselVisit.created_at.desc())).all()
    return [visit_pair(v) for v in visits]


@router.post("/visits", status_code=201)
def register_visit(payload: VisitPlan, db: Session = Depends(get_db)):
    if payload.status not in (VisitStatus.PLANNED, VisitStatus.ARRIVED, VisitStatus.BERTHED, VisitStatus.UNLOADING):
        raise HTTPException(422, "New visits must be planned, arrived, berthed or unloading")
    if not db.get(Berth, payload.berthId):
        raise HTTPException(422, "Select an existing berth")
    site = db.get(SiteConfiguration, "mangapwani")
    if site and payload.berthId != site.berth_id:
        raise HTTPException(422, "New site visits must use the configured Mangapwani berth")
    reference = payload.reference.strip() or None
    vessel = db.get(Vessel, payload.vesselId) if payload.vesselId else (db.scalar(select(Vessel).where(Vessel.imo_reference == reference)) if reference else None)
    if payload.vesselId and not vessel:
        raise HTTPException(422, "Selected registered vessel no longer exists")
    if vessel and vessel.name.casefold().strip() != payload.name.casefold().strip():
        raise HTTPException(409, "That reference belongs to a different vessel name")
    if not vessel:
        vessel = Vessel(name=payload.name.strip(), imo_reference=reference)
        db.add(vessel)
    visit = VesselVisit(vessel=vessel, post_unloading_minutes=45)
    apply_plan(visit, payload)
    db.add(visit)
    commit(db)
    db.refresh(visit)
    return visit_pair(visit)


@router.put("/visits/{visit_id}")
def edit_visit(visit_id: UUID, payload: VisitPlan, db: Session = Depends(get_db)):
    visit = load_visit(db, visit_id)
    if not db.get(Berth, payload.berthId):
        raise HTTPException(422, "Select an existing berth")
    if visit.status in (VisitStatus.COMPLETED, VisitStatus.DEPARTED, VisitStatus.CANCELLED):
        raise HTTPException(409, "Closed visits cannot be edited")
    if any(r.unloaded_t > payload.cargoTotalT for r in visit.readings):
        raise HTTPException(422, "Cargo total cannot be below recorded unloaded quantity")
    visit.vessel.name = payload.name.strip()
    visit.vessel.imo_reference = payload.reference.strip() or None
    apply_plan(visit, payload)
    commit(db)
    db.refresh(visit)
    return visit_pair(visit)


class StatusChange(BaseModel):
    status: VisitStatus


@router.patch("/visits/{visit_id}/status")
def change_status(visit_id: UUID, payload: StatusChange, db: Session = Depends(get_db)):
    visit = load_visit(db, visit_id)
    if payload.status not in (VisitStatus.COMPLETED, VisitStatus.CANCELLED):
        raise HTTPException(422, "Use the edit form for other status changes")
    if visit.status in (VisitStatus.COMPLETED, VisitStatus.DEPARTED, VisitStatus.CANCELLED) and visit.status != payload.status:
        raise HTTPException(409, "Visit is already closed")
    apply_status(visit, payload.status)
    commit(db)
    return visit_pair(visit)


@router.get("/predictions")
def live_predictions(db: Session = Depends(get_db)):
    """Compute without inserting prediction rows on every dashboard refresh."""
    now = datetime.now(timezone.utc)
    visits = db.scalars(select(VesselVisit).options(selectinload(VesselVisit.readings))).all()
    result = {}
    for v in visits:
        readings = sorted(v.readings, key=lambda r: r.recorded_at)
        latest = readings[-1] if readings else None
        unloaded = latest.unloaded_t if latest else Decimal(0)
        remaining = calculate_remaining_cargo(v.cargo_total_t, unloaded)
        rate = calculate_effective_rate(readings)
        quality = determine_data_quality(readings, now)
        # Anchor projections to measurement time. A ticking UI must not move
        # the estimate forward while no new cargo has been measured.
        finish = calculate_estimated_finish(latest.recorded_at, remaining, rate) if latest else None
        if quality.value != "VALID" or (latest and latest.unloading_status.value == "STOPPED"):
            finish = None
        if v.status in (VisitStatus.CANCELLED, VisitStatus.DEPARTED, VisitStatus.DELAYED):
            finish = None
        if v.status == VisitStatus.COMPLETED:
            finish = v.unload_end
        result[str(v.id)] = {
            "remaining_t": remaining, "unloaded_t": unloaded,
            "progress_pct": calculate_progress_percentage(v.cargo_total_t, unloaded),
            "effective_rate_tph": rate,
            "estimated_unload_finish": finish,
            "expected_berth_release": calculate_berth_release(finish, v.post_unloading_minutes),
            "data_quality": quality.value,
        }
    return result
