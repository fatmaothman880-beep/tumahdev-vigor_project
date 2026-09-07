"""Pure checklist rules. No site timing or authority is inferred."""
from datetime import datetime, timezone
import math

STATUSES = ("NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "NOT_APPLICABLE")
TEMPLATES = (
    ("cargo_order", "Record cargo order", "CARGO_ORDER", False),
    ("pre_arrival", "Confirm pre-arrival communication", "PRE_ARRIVAL", False),
    ("pilot", "Arrange pilot", "PILOT", False),
    ("tugboat", "Arrange tugboat", "TUGBOAT", False),
    ("fuel", "Confirm fuel requirements / arrangements", "FUEL", False),
    ("payment", "Record payment clearance", "PAYMENT", True),
    ("port_clearance", "Record departure clearance (confirm exact requirements)", "PORT_CLEARANCE", True),
    ("discharge", "Confirm discharging completion", "DISCHARGE", False),
)


def utc(value):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def timing(status, due_at, completed_at, now):
    due_at, completed_at, now = utc(due_at), utc(completed_at), utc(now)
    if status == "NOT_APPLICABLE":
        return {"timeliness": "NOT_APPLICABLE", "delay_minutes": 0}
    if status == "COMPLETED":
        if not due_at:
            return {"timeliness": "COMPLETED_UNSCHEDULED", "delay_minutes": 0}
        late = max(0, math.ceil((completed_at - due_at).total_seconds() / 60))
        return {"timeliness": "COMPLETED_LATE" if late else "ON_TIME", "delay_minutes": late}
    if not due_at:
        return {"timeliness": "UNSCHEDULED", "delay_minutes": 0}
    late = max(0, math.ceil((now - due_at).total_seconds() / 60))
    return {"timeliness": "OVERDUE" if late else "SCHEDULED", "delay_minutes": late}


def checklist_state(tasks):
    if not tasks:
        return "NOT_CONFIGURED"
    required = [t for t in tasks if t.blocks_departure]
    if not required:
        return "NOT_CONFIGURED"
    if any(t.status not in ("COMPLETED", "NOT_APPLICABLE") for t in required):
        return "INCOMPLETE"
    return "CHECKLIST_COMPLETE"  # Never means official permission to depart.
