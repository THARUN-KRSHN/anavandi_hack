"""Notification routes — inbox for authenticated users."""

from flask import Blueprint, request

from app.utils.auth import login_required, get_current_user
from app.utils.helpers import success_response, error_response
from app.services.notification_service import get_user_notifications

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.route("/mine", methods=["GET"])
@login_required
def my_notifications():
    """GET /api/notifications/mine — get current user's notifications."""
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    result = get_user_notifications(user.id, page=page, per_page=per_page)
    return success_response(result)
