"""AI Analysis model — separate table for persisting AI inference results."""

from datetime import datetime, timezone
import json
from app.extensions import db


class AIAnalysis(db.Model):
    """Stores AI analysis results (duplicate check, category verification, anomaly detection, trends)."""

    __tablename__ = "ai_analyses"

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=True)
    analysis_type = db.Column(db.String(50), nullable=False)  # DUPLICATE_DETECTION | COMPLAINT_ANALYSIS | ANOMALY_DETECTION | TREND_ANALYSIS
    model = db.Column(db.String(100), nullable=False, default="google/gemini-2.0-flash-lite-001")
    provider = db.Column(db.String(50), nullable=False, default="OPENROUTER")
    input_version = db.Column(db.String(20), nullable=False, default="v1.0")
    result_json = db.Column(db.Text, nullable=True)  # Formatted JSON string
    confidence = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="COMPLETED")  # COMPLETED | FAILED | PENDING
    error_code = db.Column(db.String(50), nullable=True)
    processing_time_ms = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    complaint = db.relationship("Complaint", backref=db.backref("ai_analyses", lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        parsed_result = None
        if self.result_json:
            try:
                parsed_result = json.loads(self.result_json)
            except Exception:
                parsed_result = {"raw": self.result_json}

        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "analysis_type": self.analysis_type,
            "model": self.model,
            "provider": self.provider,
            "result": parsed_result,
            "confidence": self.confidence,
            "status": self.status,
            "error_code": self.error_code,
            "processing_time_ms": self.processing_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AIAnalysis {self.id} type={self.analysis_type} status={self.status}>"
