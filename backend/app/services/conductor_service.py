"""Conductor service — action token generation and processing."""

from datetime import datetime, timezone

from flask import current_app
from app.extensions import db
from app.models import Complaint, Conductor, ComplaintHistory
from app.utils.tokens import generate_action_token, validate_action_token, mark_token_used
from app.utils.helpers import log_activity
from app.services.notification_service import send_conductor_notification


def send_conductor_sms(complaint_id, conductor_id):
    """Generate action token and send SMS to conductor.

    Called when depot head clicks "Send SMS" / "Notify Conductor".
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return None, "Complaint not found."

    conductor = Conductor.query.get(conductor_id)
    if not conductor:
        return None, "Conductor not found."

    if not conductor.phone:
        return None, "Conductor has no phone number."

    # Generate token
    expiry_hours = current_app.config.get("ACTION_TOKEN_EXPIRY_HOURS", 24)
    raw_token, action_token = generate_action_token(
        complaint_id=complaint.id,
        conductor_id=conductor.id,
        expiry_hours=expiry_hours,
    )

    # Build action URL
    base_url = current_app.config.get("BASE_URL", "http://localhost:5000")
    action_url = f"{base_url}/api/conductor/action/{raw_token}"

    # Send SMS
    success, msg = send_conductor_notification(conductor, complaint, action_url)

    if success:
        # Update complaint status to ASSIGNED if still SUBMITTED
        if complaint.status == "SUBMITTED":
            complaint.status = "ASSIGNED"
            complaint.assigned_at = datetime.now(timezone.utc)

            history = ComplaintHistory(
                complaint_id=complaint.id,
                old_status="SUBMITTED",
                new_status="ASSIGNED",
                changed_by=None,
                changed_by_role="SYSTEM",
                comment=f"Conductor {conductor.name} notified via SMS.",
            )
            db.session.add(history)
            db.session.commit()

        log_activity(
            user_id=None,
            role="DEPOT_HEAD",
            action="CONDUCTOR_SMS_SENT",
            entity_type="COMPLAINT",
            entity_id=complaint.id,
            metadata={"conductor_id": conductor.id, "conductor_name": conductor.name},
        )

    return {
        "action_url": action_url,
        "conductor": conductor.to_dict(),
        "sms_status": "sent" if success else "failed",
        "token_expires_at": action_token.expires_at.isoformat(),
    }, None


def process_conductor_action(raw_token, new_status, comment=None):
    """Process a conductor's status update via action link.

    Steps:
    1. Validate token
    2. Validate status
    3. Update complaint
    4. Create history
    5. Mark token used
    """
    # 1. Validate token
    action_token, error = validate_action_token(raw_token)
    if error:
        return None, error

    complaint = Complaint.query.get(action_token.complaint_id)
    if not complaint:
        return None, "Complaint not found."

    conductor = Conductor.query.get(action_token.conductor_id)

    # 2. Validate status
    allowed_statuses = ["UNDER_REVIEW", "ACTION_TAKEN", "UNABLE_TO_RESOLVE", "RESOLVED"]
    status_value = new_status.upper()
    if status_value == "ACTION_REQUIRED":
        status_value = "ACTION_TAKEN"
    if status_value not in allowed_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"
    new_status = status_value

    # 3. Update complaint
    old_status = complaint.status
    complaint.status = new_status

    if new_status == "RESOLVED":
        complaint.resolved_at = datetime.now(timezone.utc)

    # 4. Create history
    history = ComplaintHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=None,
        changed_by_role="CONDUCTOR",
        comment=comment or f"Status updated by conductor {conductor.name if conductor else 'unknown'}.",
    )
    db.session.add(history)

    # 5. Mark token used
    mark_token_used(action_token)

    db.session.commit()

    log_activity(
        user_id=None,
        role="CONDUCTOR",
        action="COMPLAINT_STATUS_UPDATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        metadata={
            "old_status": old_status,
            "new_status": new_status,
            "conductor_id": action_token.conductor_id,
        },
    )

    return complaint, None


def get_complaint_for_conductor(raw_token):
    """Get complaint info for the conductor action page (no auth required)."""
    action_token, error = validate_action_token(raw_token)
    if error:
        return None, error

    complaint = Complaint.query.get(action_token.complaint_id)
    if not complaint:
        return None, "Complaint not found."

    conductor = Conductor.query.get(action_token.conductor_id)

    return {
        "reference_number": complaint.reference_number,
        "category": complaint.category,
        "description": complaint.description,
        "status": complaint.status,
        "bus": complaint.bus.to_dict() if complaint.bus else None,
        "route": complaint.route.to_dict() if complaint.route else None,
        "reported_date": complaint.reported_date.isoformat() if complaint.reported_date else None,
        "reported_time": complaint.reported_time.strftime("%H:%M") if complaint.reported_time else None,
        "conductor_name": conductor.name if conductor else None,
    }, None
