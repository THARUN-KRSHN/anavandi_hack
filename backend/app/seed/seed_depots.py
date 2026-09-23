"""Seed depots — loads all 97 depots from ksrtc_depots.csv.

Also creates a DEPOT_HEAD user for each depot.
"""

import csv
import os

from app.extensions import db
from app.models import Depot, User
from app.utils.auth import hash_password

TEST_DEPOT_PHONE = "9778585423"


def seed_depots(csv_path=None):
    """Load depots from the KSRTC CSV file and create depot head users."""
    if not csv_path:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        candidates = [
            os.path.join(base_dir, "data", "ksrtc_depots.csv"),
            os.path.join(base_dir, "..", "data", "ksrtc_depots.csv"),
            os.path.join(os.getcwd(), "data", "ksrtc_depots.csv"),
            os.path.join(os.getcwd(), "backend", "data", "ksrtc_depots.csv"),
        ]
        for p in candidates:
            if os.path.exists(p):
                csv_path = p
                break
        if not csv_path:
            csv_path = candidates[0]

    csv_path = os.path.abspath(csv_path)

    if not os.path.exists(csv_path):
        print(f"[ERROR] Depot CSV not found at: {csv_path}")
        return

    print(f"[SEED] Loading depots from {csv_path}...")

    depot_count = 0
    head_count = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            depot_code = row.get("depot_id", "").strip()
            if not depot_code:
                continue

            # Check if depot already exists
            existing = Depot.query.filter_by(depot_code=depot_code).first()
            if existing:
                continue

            name = row.get("depot_name", "").strip()
            serial_no = int(row.get("serial_no", 0)) if row.get("serial_no", "").strip() else None
            mobile = TEST_DEPOT_PHONE
            head_phone = TEST_DEPOT_PHONE
            email = row.get("depot_email", "").strip() or None

            # Clean up head_phone — "0" means no phone
            if head_phone == "0":
                head_phone = None

            depot = Depot(
                depot_code=depot_code,
                serial_no=serial_no,
                name=name,
                mobile=mobile,
                head_phone=head_phone,
                email=email,
                latitude=None,   # Not in CSV
                longitude=None,  # Not in CSV
            )
            db.session.add(depot)
            db.session.flush()  # Get depot.id
            depot_count += 1

            # Create depot head user
            head_email = f"head@{name.lower().replace(' ', '')}.demo"
            existing_head = User.query.filter_by(email=head_email).first()
            if not existing_head:
                depot_head = User(
                    name=f"{name.title()} Depot Head",
                    email=head_email,
                    phone=TEST_DEPOT_PHONE,
                    password_hash=hash_password("depot123"),
                    role="DEPOT_HEAD",
                    depot_id=depot.id,
                    is_active=True,
                )
                db.session.add(depot_head)
                head_count += 1

    db.session.commit()
    print(f"[SEED] {depot_count} depots created.")
    print(f"[SEED] {head_count} depot head users created (password: depot123).")
