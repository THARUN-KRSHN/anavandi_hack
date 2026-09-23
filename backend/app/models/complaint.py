"""Complaint and ComplaintImage models — the heart of the application."""

from datetime import datetime, timezone
from app.extensions import db


# Valid categories (canonical uppercase values stored in DB)
COMPLAINT_CATEGORIES = [
    "CLEANLINESS",
    "UNSAFE_DRIVING",
    "OVERCROWDING",
    "MISSED_STOP",
    "CONCESSION_DENIAL",
    "CONDUCTOR_STAFF",
    "DRIVER",
    "TICKETING",
    "BUS_CONDITION",
    "SAFETY",
    "ROUTE_TIMING",
    "OTHER",
]

# Map frontend/alternate category values → canonical DB values
CATEGORY_NORMALIZER = {
    "cleanliness": "CLEANLINESS",
    "unsafe_driving": "UNSAFE_DRIVING",
    "overcrowding": "OVERCROWDING",
    "missed_stop": "MISSED_STOP",
    "concession_denial": "CONCESSION_DENIAL",
    "conductor_staff": "CONDUCTOR_STAFF",
    "driver": "DRIVER",
    "ticketing": "TICKETING",
    "bus_condition": "BUS_CONDITION",
    "safety": "SAFETY",
    "route_timing": "ROUTE_TIMING",
    "other": "OTHER",
}

# Valid statuses — controlled state machine
COMPLAINT_STATUSES = [
    "SUBMITTED",
    "ASSIGNED",
    "UNDER_REVIEW",
    "ACTION_TAKEN",
    "UNABLE_TO_RESOLVE",
    "RESOLVED",
    "ESCALATED",
    "ACTION_REQUIRED",  # backward compatibility alias
]

# Priority levels
COMPLAINT_PRIORITIES = ["LOW", "NORMAL", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]


class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True)
    reference_number = db.Column(db.String(20), unique=True, nullable=False)  # GRV-2026-000001

    # Who
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Where
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=True)
    bus_id = db.Column(db.Integer, db.ForeignKey("buses.id"), nullable=True)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=True)

    # What
    category = db.Column(db.String(30), nullable=False)
    description = db.Column(db.Text, nullable=False)
    other_description = db.Column(db.Text, nullable=True)  # Mandatory when category=OTHER

    # When
    reported_date = db.Column(db.Date, nullable=True)
    reported_time = db.Column(db.Time, nullable=True)

    # Location
    location_name = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_source = db.Column(db.String(20), nullable=True)  # GPS | ROUTE_ESTIMATE | MANUAL

    # Status
    status = db.Column(db.String(20), nullable=False, default="SUBMITTED")
    priority = db.Column(db.String(10), nullable=False, default="MEDIUM")
    client_request_id = db.Column(db.String(128), unique=True, nullable=True)

    # Timestamps
    assigned_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    escalated_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = db.relationship("User", back_populates="complaints")
    depot = db.relationship("Depot", back_populates="complaints")
    bus = db.relationship("Bus", back_populates="complaints")
    route = db.relationship("Route", back_populates="complaints")
    history = db.relationship(
        "ComplaintHistory",
        back_populates="complaint",
        order_by="ComplaintHistory.created_at",
        lazy="select",
    )
    images = db.relationship("ComplaintImage", back_populates="complaint", lazy="select")
    action_tokens = db.relationship("ActionToken", back_populates="complaint", lazy="dynamic")

    def to_dict(self, include_timeline=False, include_conductor=False, public=False):
        data = {
            "id": self.id,
            "reference_number": self.reference_number,
            "category": self.category,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "reported_date": self.reported_date.isoformat() if self.reported_date else None,
            "reported_time": self.reported_time.strftime("%H:%M") if self.reported_time else None,
            "location_name": self.location_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if self.category == "OTHER":
            data["other_description"] = self.other_description

        # Include related entities
        if self.bus:
            data["bus"] = self.bus.to_dict()
        if self.route:
            data["route"] = self.route.to_dict()
        if self.depot:
            data["depot"] = self.depot.to_dict()

        if not public:
            data["user_id"] = self.user_id
            data["depot_id"] = self.depot_id
            data["bus_id"] = self.bus_id
            data["route_id"] = self.route_id
            data["latitude"] = self.latitude
            data["longitude"] = self.longitude
            data["location_source"] = self.location_source
            data["assigned_at"] = self.assigned_at.isoformat() if self.assigned_at else None
            data["resolved_at"] = self.resolved_at.isoformat() if self.resolved_at else None
            data["escalated_at"] = self.escalated_at.isoformat() if self.escalated_at else None

        if include_timeline:
            data["timeline"] = [h.to_dict() for h in self.history]

        data["images"] = [img.to_dict() for img in self.images] if self.images else []

        return data

    def __repr__(self):
        return f"<Complaint {self.reference_number} [{self.status}]>"


class ComplaintImage(db.Model):
    __tablename__ = "complaint_images"

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = db.relationship("Complaint", back_populates="images")

    def to_dict(self):
        return {
            "id": self.id,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
