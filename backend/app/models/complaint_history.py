"""Complaint history — immutable audit trail of status changes."""

from datetime import datetime, timezone
from app.extensions import db


class ComplaintHistory(db.Model):
    __tablename__ = "complaint_history"

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=False)
    old_status = db.Column(db.String(20), nullable=True)   # null for initial SUBMITTED
    new_status = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.Integer, nullable=True)       # user_id or null for system
    changed_by_role = db.Column(db.String(20), nullable=True)  # USER | DEPOT_HEAD | ADMIN | CONDUCTOR | SYSTEM
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    complaint = db.relationship("Complaint", back_populates="history")

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "old_status": self.old_status,
            "new_status": self.new_status,
            "changed_by": self.changed_by,
            "changed_by_role": self.changed_by_role,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ComplaintHistory {self.old_status} → {self.new_status}>"
