"""Depot model — seeded from ksrtc_depots.csv."""

from datetime import datetime, timezone
from app.extensions import db


class Depot(db.Model):
    __tablename__ = "depots"

    id = db.Column(db.Integer, primary_key=True)
    depot_code = db.Column(db.String(10), unique=True, nullable=False)  # D001, D002 …
    serial_no = db.Column(db.Integer, nullable=True)
    name = db.Column(db.String(100), nullable=False)  # ADOOR, ALAPPUZHA …
    mobile = db.Column(db.String(30), nullable=True)
    head_phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    latitude = db.Column(db.Float, nullable=True)   # Nullable — not in CSV
    longitude = db.Column(db.Float, nullable=True)   # Nullable — not in CSV
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    depot_head_user = db.relationship(
        "User",
        back_populates="depot",
        foreign_keys="User.depot_id",
        uselist=False,
    )
    buses = db.relationship("Bus", back_populates="depot", lazy="dynamic")
    routes = db.relationship("Route", back_populates="depot", lazy="dynamic")
    complaints = db.relationship("Complaint", back_populates="depot", lazy="dynamic")
    assignments = db.relationship("DutyAssignment", back_populates="depot", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "depot_code": self.depot_code,
            "serial_no": self.serial_no,
            "name": self.name,
            "mobile": self.mobile,
            "head_phone": self.head_phone,
            "head_name": self.depot_head_user.name if self.depot_head_user else None,
            "email": self.email,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Depot {self.depot_code} — {self.name}>"
