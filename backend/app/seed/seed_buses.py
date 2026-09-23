"""Seed buses — 3 synthetic buses per demo depot.

Bus numbers: BUS-{DEPOT_NAME}-001, BUS-{DEPOT_NAME}-002, BUS-{DEPOT_NAME}-003
Registration: KL-{serial}-{number} (clearly prototype data)

Only the 10 "hero" depots get detailed bus/route/conductor data.
All 97 depots remain in the database but only the demo depots have operational data.
"""

from app.extensions import db
from app.models import Bus, Depot

# 10 demo depots — includes 3 "hero" depots for RED/YELLOW/GREEN demo
DEMO_DEPOTS = [
    "ADOOR", "ALAPPUZHA", "ALUVA", "ATTINGAL", "ERNAKULAM",
    "KOTTAYAM", "KOLLAM", "THRISSUR", "TVM CENTRAL", "KOZHIKODE",
]

BUS_TYPES = ["ORDINARY", "FAST_PASSENGER", "SUPER_FAST"]


def seed_buses():
    """Create 3 synthetic buses per demo depot (30 total)."""
    print("[SEED] Creating synthetic buses...")

    bus_count = 0
    serial_counter = 1

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            print(f"  [!] Depot {depot_name} not found, skipping buses.")
            continue

        short_name = depot_name.replace(" ", "")

        for i in range(1, 4):  # 3 buses per depot
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
