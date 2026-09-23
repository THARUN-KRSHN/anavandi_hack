"""Response helpers and reference number generation."""

import json
from datetime import datetime, timezone
from flask import jsonify

from app.extensions import db
from app.models.activity_log import ActivityLog


def success_response(data=None, message=None, status_code=200):
    """Standard success response."""
    response = {"success": True}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return jsonify(response), status_code


def error_response(code, message, status_code=400, **extra):
    """Standard error response."""
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        }
    }
    if extra:
        payload["error"].update(extra)
    return jsonify(payload), status_code


def generate_reference_number():
    """Generate a unique complaint reference: GRV-{year}-{6-digit}.

    Uses the max existing reference to determine the next number.
    """
    from app.models.complaint import Complaint

    year = datetime.now(timezone.utc).year
    prefix = f"GRV-{year}-"

    # Find the latest reference number for this year
    latest = (
        Complaint.query
        .filter(Complaint.reference_number.like(f"{prefix}%"))
        .order_by(Complaint.id.desc())
        .first()
    )

    if latest:
        try:
            last_number = int(latest.reference_number.split("-")[-1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        next_number = 1

    return f"{prefix}{next_number:06d}"


def log_activity(user_id, role, action, entity_type=None, entity_id=None, metadata=None):
    """Create an audit log entry."""
    log = ActivityLog(
        user_id=user_id,
        role=role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.session.add(log)
    db.session.commit()
    return log


def allowed_file(filename, allowed_extensions):
    """Check if a file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions
