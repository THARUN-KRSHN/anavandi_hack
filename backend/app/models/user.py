"""User model — passengers, depot heads, and admins."""

from datetime import datetime, timezone
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        db.String(20),
        nullable=False,
        default="USER",
    )  # USER | DEPOT_HEAD | ADMIN
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    depot = db.relationship("Depot", back_populates="depot_head_user", foreign_keys=[depot_id])
    complaints = db.relationship("Complaint", back_populates="user", lazy="dynamic")
    notifications = db.relationship("Notification", back_populates="recipient", lazy="dynamic")

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if self.role == "DEPOT_HEAD" and self.depot_id:
            data["depot_id"] = self.depot_id
        return data

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
