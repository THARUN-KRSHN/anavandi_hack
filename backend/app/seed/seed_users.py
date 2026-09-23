"""Seed users — admin, demo user, depot heads are created in seed_depots."""

from app.extensions import db
from app.models import User
from app.utils.auth import hash_password


def seed_users():
    """Create admin and demo user accounts."""
    print("[SEED] Creating admin and demo user accounts...")

    # Admin
    admin = User.query.filter_by(email="admin@demo.com").first()
    if not admin:
        admin = User(
            name="System Administrator",
            email="admin@demo.com",
            phone="+919000000001",
            password_hash=hash_password("admin123"),
            role="ADMIN",
            is_active=True,
        )
        db.session.add(admin)
        print("  [OK] Admin: admin@demo.com / admin123")

    # Demo passenger
    user = User.query.filter_by(email="user@demo.com").first()
    if not user:
        user = User(
            name="Demo Passenger",
            email="user@demo.com",
            phone="+919000000002",
            password_hash=hash_password("user123"),
            role="USER",
            is_active=True,
        )
        db.session.add(user)
        print("  [OK] User: user@demo.com / user123")

    db.session.commit()
    print(f"[SEED] Users created.")
