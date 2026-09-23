"""Bus model — synthetic prototype data per depot."""

from datetime import datetime, timezone
from app.extensions import db


class Bus(db.Model):
    __tablename__ = "buses"

    id = db.Column(db.Integer, primary_key=True)
    bus_number = db.Column(db.String(30), unique=True, nullable=False)  # BUS-ADOOR-001
    registration_number = db.Column(db.String(20), nullable=True)       # KL-XX-1001 (prototype)
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=False)
    bus_type = db.Column(
        db.String(20), nullable=False, default="ORDINARY"
    )  # ORDINARY | FAST_PASSENGER | SUPER_FAST | VOLVO
    status = db.Column(
        db.String(15), nullable=False, default="ACTIVE"
    )  # ACTIVE | INACTIVE | MAINTENANCE
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    depot = db.relationship("Depot", back_populates="buses")
    assignments = db.relationship("DutyAssignment", back_populates="bus", lazy="dynamic")
    complaints = db.relationship("Complaint", back_populates="bus", lazy="dynamic")

    def to_dict(self):
        from app.models.assignment import DutyAssignment
        latest_assignment = self.assignments.order_by(DutyAssignment.duty_date.desc()).first() if hasattr(self, 'assignments') else None
        return {
            "id": self.id,
            "bus_number": self.bus_number,
            "registration_number": self.registration_number,
            "depot_id": self.depot_id,
            "depot_name": self.depot.name if self.depot else "",
            "bus_type": self.bus_type,
            "status": self.status,
            "route_id": latest_assignment.route_id if latest_assignment else None,
            "route_name": f"{latest_assignment.route.source} - {latest_assignment.route.destination}" if (latest_assignment and latest_assignment.route) else "",
            "conductor_name": latest_assignment.conductor.name if (latest_assignment and latest_assignment.conductor) else "",
            "conductor_phone": latest_assignment.conductor.phone if (latest_assignment and latest_assignment.conductor) else "",
            "shift_schedule": f"{latest_assignment.shift_start.strftime('%I:%M %p')} - {latest_assignment.shift_end.strftime('%I:%M %p')}" if (latest_assignment and latest_assignment.shift_start and latest_assignment.shift_end) else "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Bus {self.bus_number}>"
