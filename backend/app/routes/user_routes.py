"""User profile routes."""

from flask import Blueprint, request

from app.extensions import db
from app.models import User
from app.utils.auth import login_required, get_current_user
from app.utils.helpers import success_response, error_response

user_bp = Blueprint("users", __name__, url_prefix="/api/users")


@user_bp.route("/me", methods=["GET"])
@login_required
def get_profile():
    """GET /api/users/me — get current user profile."""
    user = get_current_user()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", 404)
    return success_response(user.to_dict())


@user_bp.route("/me", methods=["PUT"])
@login_required
def update_profile():
    """PUT /api/users/me — update current user profile."""
    user = get_current_user()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", 404)

    data = request.get_json()
    if not data:
        return error_response("INVALID_INPUT", "Request body is required.")

    # Updatable fields
    if data.get("name"):
        user.name = data["name"].strip()
    if data.get("phone"):
        user.phone = data["phone"].strip()

    db.session.commit()
    return success_response(user.to_dict())
