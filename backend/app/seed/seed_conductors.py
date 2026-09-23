"""Seed conductors — 3 synthetic conductors per route.

Conductor names: Conductor 001, Conductor 002, etc.
PEN: PEN-MOCK-0001, PEN-MOCK-0002, etc.
Phone: +91900000XXXX (synthetic)

Clearly marked as prototype data — do not represent real KSRTC employees.
"""

from app.extensions import db
from app.models import Conductor, Route, Depot
from app.seed.seed_buses import DEMO_DEPOTS


def seed_conductors():
    """Create 3 synthetic conductors per route in demo depots."""
    print("[SEED] Creating synthetic conductors...")

    conductor_count = 0
    global_counter = 1

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            continue

        routes = Route.query.filter_by(depot_id=depot.id).all()

        for route in routes:
            for i in range(3):  # 3 conductors per route
                pen = f"PEN-MOCK-{global_counter:04d}"

                existing = Conductor.query.filter_by(pen=pen).first()
                if existing:
                    global_counter += 1
                    continue

                conductor = Conductor(
                    pen=pen,
                    name=f"Conductor {global_counter:03d}",
                    phone=f"+9190000{global_counter:05d}",
                    depot_id=depot.id,
                    status="ACTIVE",
                )
                db.session.add(conductor)
                conductor_count += 1
                global_counter += 1

    db.session.commit()
    print(f"[SEED] {conductor_count} synthetic conductors created (prototype data -- not real employees).")
