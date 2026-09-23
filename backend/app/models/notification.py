"""Notification model — SMS, IN_APP, EMAIL channels."""

from datetime import datetime, timezone
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    recipient_type = db.Column(db.String(20), nullable=False)  # USER | DEPOT_HEAD | ADMIN | CONDUCTOR
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=True)
    channel = db.Column(db.String(10), nullable=False, default="IN_APP")  # SMS | IN_APP | EMAIL
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(15), nullable=False, default="PENDING")  # PENDING | SENT | FAILED
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    recipient = db.relationship("User", back_populates="notifications", foreign_keys=[recipient_id])
    complaint = db.relationship("Complaint", backref="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "recipient_type": self.recipient_type,
            "recipient_id": self.recipient_id,
            "complaint_id": self.complaint_id,
            "channel": self.channel,
            "title": self.title,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }

    def __repr__(self):
        return f"<Notification [{self.channel}] {self.title[:30]}>"
