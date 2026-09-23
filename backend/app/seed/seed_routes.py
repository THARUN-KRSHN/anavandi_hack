"""Seed routes — 2 synthetic routes per bus, 5 stops per route.

Route codes: R-{DEPOT}-{number}
Sources/destinations: Synthetic placeholder locations.
"""

from app.extensions import db
from app.models import Bus, Route, RouteStop, Depot
from app.seed.seed_buses import DEMO_DEPOTS

# Synthetic destination pairs per depot — prototype data
DESTINATION_PAIRS = [
    ("Bus Stand", "Junction A"),
    ("Main Road", "Town Center"),
]


def seed_routes():
    """Create 2 synthetic routes per bus with 5 stops each."""
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
                    estimated_duration=90 + (dest_idx * 30),  # 90 or 120 minutes
                    status="ACTIVE",
                )
                db.session.add(route)
                db.session.flush()  # Get route.id
                route_count += 1

                # 5 stops per route
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
