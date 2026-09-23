"""Duty assignment model — links bus + route + conductor + shift."""

from datetime import datetime, timezone
from app.extensions import db


class DutyAssignment(db.Model):
    __tablename__ = "duty_assignments"

    id = db.Column(db.Integer, primary_key=True)
    bus_id = db.Column(db.Integer, db.ForeignKey("buses.id"), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=False)
    conductor_id = db.Column(db.Integer, db.ForeignKey("conductors.id"), nullable=False)
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=False)
    duty_date = db.Column(db.Date, nullable=False)
    shift_start = db.Column(db.Time, nullable=False)  # 06:00, 14:00, 22:00
    shift_end = db.Column(db.Time, nullable=False)     # 14:00, 22:00, 06:00
    trip_number = db.Column(db.Integer, default=1)
    status = db.Column(
        db.String(15), nullable=False, default="SCHEDULED"
    )  # SCHEDULED | IN_PROGRESS | COMPLETED

    # Relationships
    bus = db.relationship("Bus", back_populates="assignments")
    route = db.relationship("Route", back_populates="assignments")
    conductor = db.relationship("Conductor", back_populates="assignments")
    depot = db.relationship("Depot", back_populates="assignments")

    def to_dict(self):
        return {
            "id": self.id,
            "bus_id": self.bus_id,
            "route_id": self.route_id,
            "conductor_id": self.conductor_id,
            "depot_id": self.depot_id,
            "duty_date": self.duty_date.isoformat() if self.duty_date else None,
            "shift_start": self.shift_start.strftime("%H:%M") if self.shift_start else None,
            "shift_end": self.shift_end.strftime("%H:%M") if self.shift_end else None,
            "trip_number": self.trip_number,
            "status": self.status,
        }

    def __repr__(self):
        return f"<DutyAssignment bus={self.bus_id} conductor={self.conductor_id} {self.duty_date}>"
