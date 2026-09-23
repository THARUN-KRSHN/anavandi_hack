"""Seed conductors — prefer the mock conductor dataset when available, otherwise fall back to synthetic demo conductors."""

import csv
import os

from app.extensions import db
from app.models import Conductor, Route, Depot
from app.seed.seed_buses import DEMO_DEPOTS


def seed_conductors():
    """Create conductors from the mock dataset when present, otherwise generate synthetic demo conductors."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    mock_csv = os.path.join(base_dir, "data", "mock_conductors.csv")

    if os.path.exists(mock_csv):
        print("[SEED] Loading mock conductors from CSV...")
        conductor_count = 0
        with open(mock_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                depot_code = (row.get("depot_id") or "").strip()
                depot = Depot.query.filter_by(depot_code=depot_code).first()
                if not depot:
                    continue

                pen = (row.get("pen") or "").strip()
                if not pen:
                    continue

                existing = Conductor.query.filter_by(pen=pen).first()
                if existing:
                    continue

                db.session.add(Conductor(
                    pen=pen,
                    name=(row.get("name") or "").strip() or "Mock Conductor",
                    phone=(row.get("phone") or "").strip() or None,
                    depot_id=depot.id,
                    status=(row.get("status") or "ACTIVE").strip() or "ACTIVE",
                ))
                conductor_count += 1

        db.session.commit()
        print(f"[SEED] {conductor_count} mock conductors loaded from CSV.")
        return

    print("[SEED] Creating synthetic conductors...")

    conductor_count = 0
    global_counter = 1

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            continue

        routes = Route.query.filter_by(depot_id=depot.id).all()

        for route in routes:
            for i in range(3):
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
