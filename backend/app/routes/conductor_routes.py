"""Conductor action routes — no authentication required.

The conductor interacts through the one-time SMS link.
"""

from flask import Blueprint, request

from app.utils.helpers import success_response, error_response
from app.services.conductor_service import (
    get_complaint_for_conductor,
    process_conductor_action,
    send_conductor_sms,
    send_conductor_email_direct,
)

conductor_bp = Blueprint("conductor", __name__, url_prefix="/api/conductor")


@conductor_bp.route("/send-email", methods=["POST"])
@conductor_bp.route("/send-sms", methods=["POST"])
def send_email_action():
    """POST /api/conductor/send-email (and legacy /send-sms alias)
    Sends action email with temporary link to the depot head's email address for duty conductor.
    """
    data = request.get_json() or {}
    complaint_id = data.get("complaint_id")
    recipient_email = data.get("recipient_email") or "tharunkrishnachoolikattil@gmail.com"
    conductor_name = data.get("conductor_name") or "Duty Conductor"
    custom_token = data.get("token")

    # If numeric complaint_id and complaint exists in DB
    numeric_id = None
    try:
        numeric_id = int(complaint_id)
    except (ValueError, TypeError):
        pass

    if numeric_id:
        conductor_id = data.get("conductor_id", 1)
        result, error = send_conductor_sms(numeric_id, conductor_id, recipient_email=recipient_email)
        if not error and result:
            return success_response(result)

    # Fallback or client-side complaint: dispatch directly via send_conductor_email_direct
    complaint_data = {
        "reference_number": data.get("complaint_ref") or str(complaint_id),
        "category": data.get("category_label") or data.get("category") or "General Issue",
        "bus_number": data.get("bus_number") or "KSRTC Fleet",
        "description": data.get("description") or "Passenger grievance requiring conductor response.",
        "route": data.get("route_code") or "Kerala State Route",
    }
    result = send_conductor_email_direct(
        complaint_data,
        recipient_email=recipient_email,
        conductor_name=conductor_name,
        custom_token=custom_token,
    )
    return success_response(result)


@conductor_bp.route("/action/<token>", methods=["GET"])
def get_action_page(token):
    """GET /api/conductor/action/<token> — view complaint info (no auth).

    The conductor opens this link from SMS.
    Shows: reference, bus, route, category, description.
    """
    data, error = get_complaint_for_conductor(token)
    if error:
        return error_response("INVALID_TOKEN", error, 400)

    return success_response(data)


@conductor_bp.route("/action/<token>", methods=["POST"])
def submit_action(token):
    """POST /api/conductor/action/<token> — update complaint status.

    Expected body:
    {
        "status": "UNDER_REVIEW" | "ACTION_REQUIRED" | "RESOLVED",
        "comment": "Issue acknowledged and action initiated."
    }

    After successful update, the token is invalidated (single-use).
    """
    data = request.get_json()
    if not data or not data.get("status"):
        return error_response("INVALID_INPUT", "Status is required.")

    complaint, error = process_conductor_action(
        raw_token=token,
        new_status=data["status"],
        comment=data.get("comment"),
    )

    if error:
        return error_response("ACTION_FAILED", error)

    return success_response({
        "reference_number": complaint.reference_number,
        "status": complaint.status,
        "message": "Status updated successfully. This link is now expired.",
    })
