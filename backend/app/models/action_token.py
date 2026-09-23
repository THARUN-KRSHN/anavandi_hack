"""Conductor action token — single-use, time-limited secure links."""

from datetime import datetime, timezone
from app.extensions import db


class ActionToken(db.Model):
    __tablename__ = "action_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token_hash = db.Column(db.String(128), unique=True, nullable=False)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=False)
    conductor_id = db.Column(db.Integer, db.ForeignKey("conductors.id"), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    complaint = db.relationship("Complaint", back_populates="action_tokens")
    conductor = db.relationship("Conductor", back_populates="action_tokens")

    @property
    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    @property
    def is_used(self):
        return self.used_at is not None

    @property
    def is_valid(self):
        return not self.is_expired and not self.is_used

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "conductor_id": self.conductor_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "is_valid": self.is_valid,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        status = "VALID" if self.is_valid else ("USED" if self.is_used else "EXPIRED")
        return f"<ActionToken [{status}] complaint={self.complaint_id}>"
