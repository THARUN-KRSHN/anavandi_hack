"""Conductor model — synthetic prototype data (PEN-MOCK-XXXX)."""

from datetime import datetime, timezone
from app.extensions import db


class Conductor(db.Model):
    __tablename__ = "conductors"

    id = db.Column(db.Integer, primary_key=True)
    pen = db.Column(db.String(20), unique=True, nullable=False)  # PEN-MOCK-0001
    name = db.Column(db.String(120), nullable=False)              # Conductor 001
    phone = db.Column(db.String(20), nullable=True)               # Synthetic phone
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=True)
    status = db.Column(db.String(15), nullable=False, default="ACTIVE")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    depot = db.relationship("Depot", backref="conductors")
    assignments = db.relationship("DutyAssignment", back_populates="conductor", lazy="dynamic")
    action_tokens = db.relationship("ActionToken", back_populates="conductor", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "pen": self.pen,
            "name": self.name,
            "phone": self.phone,
            "depot_id": self.depot_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Conductor {self.pen} — {self.name}>"
