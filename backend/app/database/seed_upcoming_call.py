from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.models import (
    Berth,
    UpcomingCallStatus,
    UpcomingVesselCall,
    Vessel,
)


DEMO_IMO = "IMO-DEMO-002"


def seed_upcoming_call() -> None:
    with SessionLocal() as db:
        berth = db.scalar(
            select(Berth).where(Berth.name == "Berth A")
        )

        if berth is None:
            raise RuntimeError(
                "Berth A was not found. Run the main seed first."
            )

        vessel = db.scalar(
            select(Vessel).where(
                Vessel.imo_reference == DEMO_IMO
            )
        )

        if vessel is None:
            vessel = Vessel(
                name="MV Zanzibar Star",
                imo_reference=DEMO_IMO,
                capacity_t=Decimal("9000.00"),
                agent_name="Zanzibar Maritime Agency",
                agent_phone="+255700000002",
            )

            db.add(vessel)
            db.flush()

        existing_call = db.scalar(
            select(UpcomingVesselCall).where(
                UpcomingVesselCall.vessel_id == vessel.id,
                UpcomingVesselCall.status.in_(
                    [
                        UpcomingCallStatus.PLANNED,
                        UpcomingCallStatus.CONFIRMED,
                    ]
                ),
            )
        )

        if existing_call is not None:
            print("Upcoming demonstration call already exists.")
            return

        expected_arrival = (
            datetime.now(timezone.utc)
            + timedelta(hours=18)
        )

        upcoming_call = UpcomingVesselCall(
            vessel_id=vessel.id,
            berth_id=berth.id,
            expected_arrival=expected_arrival,
            cargo_type="Cement",
            cargo_quantity_t=Decimal("9000.00"),
            expected_rate_tph=Decimal("450.00"),
            call_alert_at=(
                expected_arrival - timedelta(hours=6)
            ),
            confirmation_due_at=(
                expected_arrival - timedelta(hours=3)
            ),
            berth_preparation_minutes=60,
            status=UpcomingCallStatus.PLANNED,
            notes="Upcoming demonstration vessel call.",
        )

        db.add(upcoming_call)
        db.commit()

        print("Upcoming demonstration call created.")
        print(f"Vessel: {vessel.name}")
        print(f"Expected arrival: {expected_arrival}")


if __name__ == "__main__":
    seed_upcoming_call()