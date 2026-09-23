"""Seed assignments and complaints.

Creates:
- Duty assignments: 3 shifts (MORNING/EVENING/NIGHT) per bus-route pair
- Synthetic complaints with realistic distributions for 3 "hero" depots:
  - ADOOR: Green (low pending ratio)
  - ERNAKULAM: Yellow (medium pending ratio)
  - ALUVA: Red (high pending ratio)
"""

import random
from datetime import datetime, timedelta, time as dt_time, timezone, date

from app.extensions import db
from app.models import (
    DutyAssignment, Complaint, ComplaintHistory, Bus, Route, Conductor, Depot, User,
    COMPLAINT_CATEGORIES,
)
from app.utils.helpers import generate_reference_number
from app.seed.seed_buses import DEMO_DEPOTS

# Prototype duty windows (not official KSRTC shift timings)
SHIFTS = [
    ("MORNING", dt_time(6, 0), dt_time(14, 0)),
    ("EVENING", dt_time(14, 0), dt_time(22, 0)),
    ("NIGHT",   dt_time(22, 0), dt_time(6, 0)),
]

# Hero depots with complaint distributions for demo
HERO_DEPOTS = {
    "ADOOR": {        # GREEN — low pending ratio
        "total": 70,
        "resolved": 55,
        "under_review": 5,
        "action_required": 3,
        "escalated": 2,
        "submitted": 3,
        "assigned": 2,
    },
    "ERNAKULAM": {    # YELLOW — medium pending ratio
        "total": 55,
        "resolved": 33,
        "under_review": 8,
        "action_required": 5,
        "escalated": 4,
        "submitted": 3,
        "assigned": 2,
    },
    "ALUVA": {        # RED — high pending ratio
        "total": 80,
        "resolved": 25,
        "under_review": 15,
        "action_required": 10,
        "escalated": 15,
        "submitted": 10,
        "assigned": 5,
    },
}


def seed_assignments():
    """Create duty assignments for demo depots: today ± 3 days."""
    print("[SEED] Creating duty assignments...")

    assignment_count = 0
    today = date.today()

    for depot_name in DEMO_DEPOTS:
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            continue

        buses = Bus.query.filter_by(depot_id=depot.id).all()
        routes = Route.query.filter_by(depot_id=depot.id).all()
        conductors = Conductor.query.filter_by(depot_id=depot.id).all()

        if not buses or not routes or not conductors:
            continue

        conductor_idx = 0

        for bus in buses:
            bus_routes = [r for r in routes][:2]  # Max 2 routes per bus

            for route in bus_routes:
                for day_offset in range(-3, 4):  # ±3 days
                    duty_date = today + timedelta(days=day_offset)

                    for shift_name, shift_start, shift_end in SHIFTS:
                        # Cycle through conductors
                        conductor = conductors[conductor_idx % len(conductors)]
                        conductor_idx += 1

                        # Check if assignment already exists
                        existing = DutyAssignment.query.filter_by(
                            bus_id=bus.id,
                            route_id=route.id,
                            duty_date=duty_date,
                            shift_start=shift_start,
                        ).first()
                        if existing:
                            continue

                        assignment = DutyAssignment(
                            bus_id=bus.id,
                            route_id=route.id,
                            conductor_id=conductor.id,
                            depot_id=depot.id,
                            duty_date=duty_date,
                            shift_start=shift_start,
                            shift_end=shift_end,
                            trip_number=1,
                            status="SCHEDULED",
                        )
                        db.session.add(assignment)
                        assignment_count += 1

    db.session.commit()
    print(f"[SEED] {assignment_count} duty assignments created (prototype data).")


def seed_complaints():
    """Create synthetic complaints with realistic distributions for hero depots."""
    print("[SEED] Creating synthetic complaints...")

    # Get or create demo user for complaint submissions
    demo_user = User.query.filter_by(email="user@demo.com").first()
    if not demo_user:
        print("  [!] Demo user not found. Run seed_users first.")
        return

    complaint_count = 0
    statuses_list = ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "ACTION_REQUIRED", "RESOLVED", "ESCALATED"]

    for depot_name, dist in HERO_DEPOTS.items():
        depot = Depot.query.filter_by(name=depot_name).first()
        if not depot:
            print(f"  [!] Hero depot {depot_name} not found, skipping.")
            continue

        buses = Bus.query.filter_by(depot_id=depot.id).all()
        routes = Route.query.filter_by(depot_id=depot.id).all()

        if not buses or not routes:
            print(f"  [!] No buses/routes for {depot_name}, skipping.")
            continue

        # Build complaint list per status
        complaints_to_create = []
        for _ in range(dist["resolved"]):
            complaints_to_create.append("RESOLVED")
        for _ in range(dist.get("under_review", 0)):
            complaints_to_create.append("UNDER_REVIEW")
        for _ in range(dist.get("action_required", 0)):
            complaints_to_create.append("ACTION_REQUIRED")
        for _ in range(dist.get("escalated", 0)):
            complaints_to_create.append("ESCALATED")
        for _ in range(dist.get("submitted", 0)):
            complaints_to_create.append("SUBMITTED")
        for _ in range(dist.get("assigned", 0)):
            complaints_to_create.append("ASSIGNED")

        random.shuffle(complaints_to_create)

        for idx, target_status in enumerate(complaints_to_create):
            bus = random.choice(buses)
            route = random.choice(routes)
            category = random.choice(COMPLAINT_CATEGORIES)

            # Spread complaints over the past 30 days
            days_ago = random.randint(0, 30)
            hours = random.randint(6, 22)
            created_dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours)

            # For escalated complaints, make them older so SLA is clearly exceeded
            if target_status == "ESCALATED":
                created_dt = datetime.now(timezone.utc) - timedelta(days=random.randint(2, 10))

            ref = generate_reference_number()

            descriptions = [
                "Bus was not cleaned properly before departure.",
                "Driver was overspeeding and driving recklessly.",
                "Bus was extremely overcrowded, passengers were standing dangerously.",
                "Bus did not stop at the designated stop despite signaling.",
                "Senior citizen concession was denied by the conductor.",
                "General issue reported by passenger.",
                "Air conditioning was not working inside the bus.",
                "Conductor was rude and uncooperative.",
                "Bus departed 30 minutes late from the scheduled time.",
                "No proper announcements were made for stops.",
            ]

            complaint = Complaint(
                reference_number=ref,
                user_id=demo_user.id,
                depot_id=depot.id,
                bus_id=bus.id,
                route_id=route.id,
                category=category,
                description=random.choice(descriptions),
                other_description="Additional details for this complaint." if category == "OTHER" else None,
                reported_date=created_dt.date(),
                reported_time=created_dt.time(),
                location_name=f"{route.source} → {route.destination}",
                location_source="ROUTE_ESTIMATE",
                status=target_status,
                priority=_priority_for_category(category),
                created_at=created_dt,
                assigned_at=created_dt + timedelta(hours=1) if target_status != "SUBMITTED" else None,
                resolved_at=created_dt + timedelta(hours=random.randint(2, 48)) if target_status == "RESOLVED" else None,
                escalated_at=created_dt + timedelta(hours=random.randint(2, 8)) if target_status == "ESCALATED" else None,
            )
            db.session.add(complaint)
            db.session.flush()

            # Create history entries
            _create_history_chain(complaint, target_status, created_dt)
            complaint_count += 1

    db.session.commit()
    print(f"[SEED] {complaint_count} synthetic complaints created across hero depots (prototype data).")


def _create_history_chain(complaint, target_status, created_dt):
    """Create a realistic chain of complaint history entries."""
    status_chain = {
        "SUBMITTED": ["SUBMITTED"],
        "ASSIGNED": ["SUBMITTED", "ASSIGNED"],
        "UNDER_REVIEW": ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW"],
        "ACTION_REQUIRED": ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "ACTION_REQUIRED"],
        "RESOLVED": ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "ACTION_REQUIRED", "RESOLVED"],
        "ESCALATED": ["SUBMITTED", "ASSIGNED", "ESCALATED"],
    }

    chain = status_chain.get(target_status, ["SUBMITTED"])
    prev_status = None

    for i, status in enumerate(chain):
        history = ComplaintHistory(
            complaint_id=complaint.id,
            old_status=prev_status,
            new_status=status,
            changed_by=None,
            changed_by_role="SYSTEM" if status == "ESCALATED" else "USER" if status == "SUBMITTED" else "DEPOT_HEAD",
            comment=f"Status changed to {status}.",
            created_at=created_dt + timedelta(hours=i),
        )
        db.session.add(history)
        prev_status = status


def _priority_for_category(category):
    priority_map = {
        "UNSAFE_DRIVING": "CRITICAL",
        "OVERCROWDING": "HIGH",
        "CLEANLINESS": "MEDIUM",
        "MISSED_STOP": "MEDIUM",
        "CONCESSION_DENIAL": "MEDIUM",
        "OTHER": "LOW",
    }
    return priority_map.get(category, "MEDIUM")
