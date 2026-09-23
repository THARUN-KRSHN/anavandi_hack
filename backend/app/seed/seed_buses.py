"""Seed buses — use the mock bus dataset when available, otherwise fall back to synthetic demo buses.

Bus numbers: BUS-{DEPOT_NAME}-001, BUS-{DEPOT_NAME}-002, BUS-{DEPOT_NAME}-003
Registration: KL-{serial}-{number} (clearly prototype data)

Only the 10 "hero" depots get detailed bus/route/conductor data.
All 97 depots remain in the database but only the demo depots have operational data.
"""

import csv
import os

from app.extensions import db
from app.models import Bus, Depot

# 10 demo depots — includes 3 "hero" depots for RED/YELLOW/GREEN demo
DEMO_DEPOTS = [
    "ADOOR", "ALAPPUZHA", "ALUVA", "ATTINGAL", "ERNAKULAM",
    "KOTTAYAM", "KOLLAM", "THRISSUR", "TVM CENTRAL", "KOZHIKODE",
]

BUS_TYPES = ["ORDINARY", "FAST_PASSENGER", "SUPER_FAST"]


def seed_buses():
    """Create buses from mock CSV if available, otherwise generate synthetic demo data."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    mock_csv = os.path.join(base_dir, "data", "mock_buses.csv")

    if os.path.exists(mock_csv):
        print("[SEED] Loading mock buses from CSV...")
        bus_count = 0
        with open(mock_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                depot_code = (row.get("depot_id") or "").strip()
                depot = Depot.query.filter_by(depot_code=depot_code).first()
                if not depot:
                    continue

                bus_number = (row.get("bus_number") or "").strip()
                if not bus_number:
                    continue

                existing = Bus.query.filter_by(bus_number=bus_number).first()
                if existing:
                    continue

                db.session.add(Bus(
                    bus_number=bus_number,
                    registration_number=(row.get("registration_number") or "").strip() or None,
                    depot_id=depot.id,
                    bus_type=(row.get("bus_type") or "ORDINARY").strip() or "ORDINARY",
                    status=(row.get("status") or "ACTIVE").strip() or "ACTIVE",
                ))
                bus_count += 1

        db.session.commit()
        print(f"[SEED] {bus_count} mock buses loaded from CSV.")
        return

    print("[SEED] Creating synthetic buses...")

    bus_count = 0
    serial_counter = 1

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            print(f"  [!] Depot {depot_name} not found, skipping buses.")
            continue

        short_name = depot_name.replace(" ", "")

        for i in range(1, 4):
            bus_number = f"BUS-{short_name}-{i:03d}"

            existing = Bus.query.filter_by(bus_number=bus_number).first()
            if existing:
                continue

            reg_number = f"KL-{serial_counter:02d}-{1000 + i}"

            bus = Bus(
                bus_number=bus_number,
                registration_number=reg_number,
                depot_id=depot.id,
                bus_type=BUS_TYPES[i - 1],
                status="ACTIVE",
            )
            db.session.add(bus)
            bus_count += 1

        serial_counter += 1

    db.session.commit()
    print(f"[SEED] {bus_count} synthetic buses created (prototype data).")
