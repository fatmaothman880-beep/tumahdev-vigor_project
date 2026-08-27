from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.models import (
    Berth,
    BerthStatus,
    OperationalReading,
    PackagingStatus,
    ReadingSource,
    UnloadingStatus,
    Vessel,
    VesselVisit,
    VisitStatus,
)


def seed_database() -> None:
    db = SessionLocal()

    try:
        existing_vessel = db.scalar(
            select(Vessel).where(Vessel.imo_reference == "IMO-DEMO-001")
        )

        if existing_vessel:
            print("Demo data already exists. Nothing added.")
            return

        vessel = Vessel(
            name="MV Tumaini",
            imo_reference="IMO-DEMO-001",
            capacity_t=Decimal("12500.00"),
            agent_name="Zanzibar Shipping Agency",
            agent_phone="+255700000001",
        )

        berth = db.scalar(
            select(Berth).where(Berth.name == "Berth A")
        )

        if berth is None:
            berth = Berth(
                name="Berth A",
                status=BerthStatus.OCCUPIED,
            )
            db.add(berth)

        db.add(vessel)
        db.flush()

        current_time = datetime.now(timezone.utc)

        visit = VesselVisit(
            vessel_id=vessel.id,
            berth_id=berth.id,
            cargo_type="Cement",
            cargo_total_t=Decimal("12500.00"),
            planned_arrival=current_time - timedelta(hours=8),
            actual_arrival=current_time - timedelta(hours=7, minutes=30),
            unload_start=current_time - timedelta(hours=7),
            planned_departure=current_time + timedelta(hours=20),
            post_unloading_minutes=45,
            status=VisitStatus.UNLOADING,
            notes="Demonstration vessel visit.",
        )

        db.add(visit)
        db.flush()

        readings = [
            OperationalReading(
                visit_id=visit.id,
                recorded_at=current_time - timedelta(hours=2),
                source=ReadingSource.DEMO,
                unloaded_t=Decimal("4000.00"),
                observed_rate_tph=Decimal("450.00"),
                buffer_level_t=Decimal("500.00"),
                buffer_capacity_t=Decimal("1000.00"),
                packaging_rate_tph=Decimal("380.00"),
                unloading_status=UnloadingStatus.ACTIVE,
                packaging_status=PackagingStatus.ACTIVE,
            ),
            OperationalReading(
                visit_id=visit.id,
                recorded_at=current_time - timedelta(hours=1),
                source=ReadingSource.DEMO,
                unloaded_t=Decimal("4475.00"),
                observed_rate_tph=Decimal("475.00"),
                buffer_level_t=Decimal("580.00"),
                buffer_capacity_t=Decimal("1000.00"),
                packaging_rate_tph=Decimal("395.00"),
                unloading_status=UnloadingStatus.ACTIVE,
                packaging_status=PackagingStatus.ACTIVE,
            ),
            OperationalReading(
                visit_id=visit.id,
                recorded_at=current_time,
                source=ReadingSource.DEMO,
                unloaded_t=Decimal("4950.00"),
                observed_rate_tph=Decimal("475.00"),
                buffer_level_t=Decimal("650.00"),
                buffer_capacity_t=Decimal("1000.00"),
                packaging_rate_tph=Decimal("400.00"),
                unloading_status=UnloadingStatus.ACTIVE,
                packaging_status=PackagingStatus.ACTIVE,
                notes="Latest demonstration reading.",
            ),
        ]

        db.add_all(readings)
        db.commit()

        print("Demo data created successfully.")
        print(f"Vessel: {vessel.name}")
        print(f"Visit ID: {visit.id}")
        print(f"Operational readings: {len(readings)}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()