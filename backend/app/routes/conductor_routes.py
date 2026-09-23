"""Conductor action routes — no authentication required.

The conductor interacts through the one-time SMS link.
"""

from flask import Blueprint, request

from app.utils.helpers import success_response, error_response
from app.services.conductor_service import get_complaint_for_conductor, process_conductor_action

conductor_bp = Blueprint("conductor", __name__, url_prefix="/api/conductor")


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
