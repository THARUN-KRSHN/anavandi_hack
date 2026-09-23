"""Master seed orchestrator — resets DB and seeds complete demo dataset."""

import os
import sys

# Ensure backend root is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.models import (
    User, Depot, Bus, Route, RouteStop, Conductor, DutyAssignment,
    Complaint, ComplaintHistory, ComplaintImage, ActionToken, Notification, ActivityLog,
)
from app.seed.seed_depots import seed_depots
from app.seed.seed_users import seed_users
from app.seed.seed_buses import seed_buses
from app.seed.seed_routes import seed_routes
from app.seed.seed_conductors import seed_conductors
from app.seed.seed_assignments import seed_assignments, seed_complaints


def seed_all(drop_existing=True):
    """Reset database and seed all initial data."""
    app = create_app()
    with app.app_context():
        if drop_existing:
            print("[SEED] Resetting database tables...")
            db.drop_all()
            db.create_all()
            print("[SEED] Database schema created.")

        print("\n=== PHASE 1: Depots (from ksrtc_depots.csv) & Depot Heads ===")
        seed_depots()

        print("\n=== PHASE 2: Administrative and Demo Passenger Accounts ===")
        seed_users()

        print("\n=== PHASE 3: Synthetic Buses (Hero Depots) ===")
        seed_buses()

        print("\n=== PHASE 4: Synthetic Routes and Stops ===")
        seed_routes()

        print("\n=== PHASE 5: Synthetic Conductors ===")
        seed_conductors()

        print("\n=== PHASE 6: Duty Assignments (Shifts) ===")
        seed_assignments()

        print("\n=== PHASE 7: Demo Complaints with Realistic Distributions ===")
        seed_complaints()

        print("\n=======================================================")
        print("SEEDING COMPLETE -- SUMMARY:")
        print(f"  * Depots:          {Depot.query.count()}")
        print(f"  * Users:           {User.query.count()} (Admin, Passenger, Depot Heads)")
        print(f"  * Buses:           {Bus.query.count()}")
        print(f"  * Routes:          {Route.query.count()}")
        print(f"  * Route Stops:     {RouteStop.query.count()}")
        print(f"  * Conductors:      {Conductor.query.count()}")
        print(f"  * Assignments:     {DutyAssignment.query.count()}")
        print(f"  * Complaints:      {Complaint.query.count()}")
        print(f"  * History Entries: {ComplaintHistory.query.count()}")
        print("=======================================================\n")


if __name__ == "__main__":
    seed_all()
