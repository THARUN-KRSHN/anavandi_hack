"""Activity / audit log — tracks all significant actions."""

from datetime import datetime, timezone
from app.extensions import db


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)  # null for system actions
    role = db.Column(db.String(20), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)   # COMPLAINT, DEPOT, etc.
    entity_id = db.Column(db.Integer, nullable=True)
    metadata_json = db.Column(db.Text, nullable=True)        # JSON string for extra data
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role": self.role,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ActivityLog {self.action} on {self.entity_type}:{self.entity_id}>"
