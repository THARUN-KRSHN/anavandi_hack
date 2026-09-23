"""Seed routes — prefer the mock route dataset when available, otherwise fall back to synthetic routes."""

import csv
import os

from app.extensions import db
from app.models import Bus, Route, RouteStop, Depot
from app.seed.seed_buses import DEMO_DEPOTS

# Synthetic destination pairs per depot — prototype data
DESTINATION_PAIRS = [
    ("Bus Stand", "Junction A"),
    ("Main Road", "Town Center"),
]


def seed_routes():
    """Create routes from the mock CSV when present, otherwise generate synthetic demo routes."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    mock_csv = os.path.join(base_dir, "data", "mock_routes.csv")

    if os.path.exists(mock_csv):
        print("[SEED] Loading mock routes from CSV...")
        route_count = 0
        with open(mock_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                depot_code = (row.get("depot_id") or "").strip()
                depot = Depot.query.filter_by(depot_code=depot_code).first()
                if not depot:
                    continue

                route_code = (row.get("route_code") or "").strip()
                if not route_code:
                    continue

                existing = Route.query.filter_by(route_code=route_code).first()
                if existing:
                    continue

                db.session.add(Route(
                    route_code=route_code,
                    source=(row.get("source") or "").strip() or "UNKNOWN",
                    destination=(row.get("destination") or "").strip() or "UNKNOWN",
                    depot_id=depot.id,
                    estimated_duration=int((row.get("estimated_duration_minutes") or "0").strip() or 0),
                    status=(row.get("status") or "ACTIVE").strip() or "ACTIVE",
                ))
                route_count += 1

        db.session.commit()
        print(f"[SEED] {route_count} mock routes loaded from CSV.")
        return

    print("[SEED] Creating synthetic routes and stops...")

    route_count = 0
    stop_count = 0

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            continue

        short_name = depot_name.replace(" ", "")
        buses = Bus.query.filter_by(depot_id=depot.id).all()

        route_serial = 1
        for bus in buses:
            for dest_idx, (dest_a, dest_b) in enumerate(DESTINATION_PAIRS):
                route_code = f"R-{short_name}-{route_serial:03d}"

                existing = Route.query.filter_by(route_code=route_code).first()
                if existing:
                    route_serial += 1
                    continue

                source = f"{depot_name.title()} {dest_a}"
                destination = f"{depot_name.title()} {dest_b}"

                route = Route(
                    route_code=route_code,
                    source=source,
                    destination=destination,
                    depot_id=depot.id,
                    estimated_duration=90 + (dest_idx * 30),
                    status="ACTIVE",
                )
                db.session.add(route)
                db.session.flush()
                route_count += 1

                stop_names = [
                    source,
                    f"Stop {route_serial}A",
                    f"Stop {route_serial}B",
                    f"Stop {route_serial}C",
                    destination,
                ]
                for seq, stop_name in enumerate(stop_names, 1):
                    stop = RouteStop(
                        route_id=route.id,
                        stop_name=stop_name,
                        sequence_number=seq,
                        estimated_minutes_from_start=seq * 20,
                    )
                    db.session.add(stop)
                    stop_count += 1

                route_serial += 1

    db.session.commit()
    print(f"[SEED] {route_count} synthetic routes created with {stop_count} stops (prototype data).")
