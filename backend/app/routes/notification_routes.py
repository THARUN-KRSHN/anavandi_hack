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


@notification_bp.route("/<int:notification_id>/read", methods=["PATCH", "POST"])
@login_required
def mark_read(notification_id):
    """Mark a notification as read."""
    from app.extensions import db
    from app.models import Notification
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    notif = db.session.get(Notification, notification_id)
    if not notif:
        return error_response("NOT_FOUND", "Notification not found.", 404)

    notif.status = "READ"
    db.session.commit()
    return success_response({"id": notif.id, "read": True})


@notification_bp.route("/read-all", methods=["POST"])
@login_required
def mark_all_read():
    """Mark all notifications as read for current user."""
    from app.extensions import db
    from app.models import Notification
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    Notification.query.filter_by(recipient_id=user.id).update({"status": "READ"})
    db.session.commit()
    return success_response({"message": "All notifications marked as read."})

