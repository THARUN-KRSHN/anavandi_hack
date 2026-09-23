"""Escalation service — APScheduler job for SLA-based auto-escalation."""

from datetime import datetime, timezone

from flask import current_app
from app.extensions import db
from app.models import Complaint, ComplaintHistory
from app.services.notification_service import notify_escalation
from app.utils.helpers import log_activity


def check_escalations(app):
    """Scheduled job: find unresolved complaints past SLA and escalate them.

    Runs every SLA_CHECK_INTERVAL seconds (default: 60s).
    """
    with app.app_context():
        sla_hours = app.config.get("SLA_HOURS", {})
        now = datetime.now(timezone.utc)

        # Find complaints that are not resolved and not already escalated
        active_statuses = ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "ACTION_TAKEN", "ACTION_REQUIRED", "UNABLE_TO_RESOLVE"]
        complaints = Complaint.query.filter(
            Complaint.status.in_(active_statuses)
        ).all()

        escalated_count = 0

        for complaint in complaints:
            sla_limit = sla_hours.get(complaint.category, 6)  # Default 6 hours

            # Calculate elapsed time since creation
            created_at = complaint.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            elapsed = now - created_at
            elapsed_hours = elapsed.total_seconds() / 3600

            if elapsed_hours > sla_limit:
                # Escalate
                old_status = complaint.status
                complaint.status = "ESCALATED"
                complaint.escalated_at = now

                history = ComplaintHistory(
                    complaint_id=complaint.id,
                    old_status=old_status,
                    new_status="ESCALATED",
                    changed_by=None,
                    changed_by_role="SYSTEM",
                    comment=f"Auto-escalated: SLA of {sla_limit}h exceeded ({elapsed_hours:.1f}h elapsed).",
                )
                db.session.add(history)

                escalated_count += 1

                # Notify depot head
                if complaint.depot_id:
                    try:
                        notify_escalation(complaint.depot_id, complaint)
                    except Exception as e:
                        print(f"[WARN] Escalation notification failed: {e}")

                log_activity(
                    user_id=None,
                    role="SYSTEM",
                    action="COMPLAINT_ESCALATED",
                    entity_type="COMPLAINT",
                    entity_id=complaint.id,
                    metadata={
                        "sla_hours": sla_limit,
                        "elapsed_hours": round(elapsed_hours, 1),
                    },
                )

        if escalated_count > 0:
            db.session.commit()
            print(f"[ESCALATION] {escalated_count} complaint(s) escalated.")


def get_escalation_status(complaint):
    """Get escalation timing info for a complaint."""
    from flask import current_app

    sla_hours = current_app.config.get("SLA_HOURS", {})
    sla_limit = sla_hours.get(complaint.category, 6)

    now = datetime.now(timezone.utc)
    created_at = complaint.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    elapsed = now - created_at
    elapsed_hours = elapsed.total_seconds() / 3600
    remaining_hours = max(0, sla_limit - elapsed_hours)

    return {
        "sla_hours": sla_limit,
        "elapsed_hours": round(elapsed_hours, 1),
        "remaining_hours": round(remaining_hours, 1),
        "is_escalated": complaint.status == "ESCALATED",
        "is_overdue": elapsed_hours > sla_limit,
    }
