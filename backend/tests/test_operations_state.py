from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.api.routes.operations import get_operational_state, update_operational_state
from app.schemas.frontend_state import FrontendStateUpdate


def state_payload():
    return {
        "vessels": [],
        "berths": [],
        "voyages": [],
        "fuelOperations": [],
        "paymentAccounts": [],
        "paymentTransactions": [],
        "vesselPositions": [],
        "manufacturerQueue": [],
        "operationalReadings": [],
        "delayEvents": [],
        "systemSettings": {"defaultUnloadingRateTph": 600},
    }


class FakeSession:
    def __init__(self):
        self.record = None

    def get(self, model, key):
        return self.record

    def scalar(self, statement):
        return self.record

    def add(self, record):
        self.record = record

    def commit(self):
        self.record.updated_at = datetime.now(timezone.utc)

    def refresh(self, record):
        return None


def test_state_initializes_and_roundtrips():
    db = FakeSession()
    empty = get_operational_state(db)
    assert empty.revision == 0
    assert empty.state is None

    created = update_operational_state(
        FrontendStateUpdate(state=state_payload(), expected_revision=0), db
    )
    assert created.revision == 1
    assert created.state["systemSettings"]["defaultUnloadingRateTph"] == 600
    assert get_operational_state(db).state == created.state


def test_state_rejects_stale_revision():
    db = FakeSession()
    update_operational_state(
        FrontendStateUpdate(state=state_payload(), expected_revision=0), db
    )
    with pytest.raises(HTTPException) as error:
        update_operational_state(
            FrontendStateUpdate(state=state_payload(), expected_revision=0), db
        )
    assert error.value.status_code == 409
