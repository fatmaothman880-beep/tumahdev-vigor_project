"""Idempotent site setup. No visits, readings, arrivals or capacities invented."""
import argparse
from decimal import Decimal
from uuid import UUID
from sqlalchemy import select, func
from app.database.session import SessionLocal
from app.models.models import Berth, Vessel
from app.models.workflow import SiteConfiguration, SiteVessel

REPORTED_VESSELS = (
    ("polar-night", "Polar Night", "13800", False),
    ("ahmad-b", "MV Ahmad B", "8000", False),
    ("labatros", "Labatros", "3750", False),
    ("lpg-placeholder", "LPG Vessel", "1000", True),
)


def configure_site(db, berth_id=None):
    site = db.get(SiteConfiguration, "mangapwani")
    if site and berth_id and site.berth_id != berth_id:
        raise ValueError("Site is already linked to another berth; review it instead of overwriting")
    if not site:
        if berth_id:
            berth = db.get(Berth, berth_id)
            if not berth:
                raise ValueError("Selected berth does not exist")
        else:
            berths = list(db.scalars(select(Berth)).all())
            if len(berths) > 1:
                raise ValueError("Multiple berths exist. Rerun with --berth-id UUID for the actual Mangapwani berth. No rows were changed.")
            berth = berths[0] if berths else Berth(name="Mangapwani — Berth 1")
            if not berths:
                db.add(berth)
                db.flush()
        site = SiteConfiguration(key="mangapwani", name="Mangapwani", berth_id=berth.id, berth_label="Mangapwani — Berth 1")
        db.add(site)
        db.flush()
    for key, name, amount, temporary in REPORTED_VESSELS:
        if db.get(SiteVessel, key):
            continue  # Never reset an operator's later corrections.
        matches = list(db.scalars(select(Vessel).where(func.lower(Vessel.name) == name.lower())).all())
        if len(matches) > 1:
            raise ValueError(f"Multiple records match {name}; reconcile them before site setup")
        vessel = matches[0] if matches else Vessel(name=name, imo_reference=None, capacity_t=None)
        if not matches:
            db.add(vessel)
            db.flush()
        db.add(SiteVessel(key=key, site_key=site.key, vessel_id=vessel.id,
            reported_cargo_t=Decimal(amount), temporary_label=temporary,
            notes="Reported site-survey cargo amount, not a verified capacity or fixed shipment quantity. Names remain editable."))
    db.flush()
    return site


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--berth-id", type=UUID)
    args = parser.parse_args()
    with SessionLocal() as db:
        try:
            site = configure_site(db, args.berth_id)
            db.commit()
        except Exception:
            db.rollback()
            raise
        print(f"Configured {site.berth_label} with berth ID {site.berth_id}.")
        print("Site vessel records added/reused; existing rows retained. No visits or measurements created.")


if __name__ == "__main__":
    main()
