"""Authentication routes — login, signup, logout."""

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User
from app.utils.auth import hash_password, verify_password, create_token, login_required, get_current_user
from app.utils.helpers import success_response, error_response, log_activity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """POST /api/auth/login — authenticate with email + password."""
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return error_response("INVALID_INPUT", "Email and password are required.")

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user or not verify_password(user.password_hash, data["password"]):
        return error_response("INVALID_CREDENTIALS", "Invalid email or password.", 401)

    if not user.is_active:
        return error_response("ACCOUNT_DISABLED", "This account has been disabled.", 403)

    token = create_token(user)

    log_activity(
        user_id=user.id,
        role=user.role,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
    )

    return success_response({
        "token": token,
        "user": user.to_dict(),
    })


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """POST /api/auth/signup — register a new USER (passengers only)."""
    data = request.get_json()

    if not data:
        return error_response("INVALID_INPUT", "Request body is required.")

    # Validate required fields
    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return error_response("INVALID_INPUT", f"{field} is required.")

    email = data["email"].lower().strip()

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return error_response("EMAIL_EXISTS", "An account with this email already exists.")

    # Only USER role can self-register
    user = User(
        name=data["name"].strip(),
        phone=data.get("phone", "").strip() or None,
        email=email,
        password_hash=hash_password(data["password"]),
        role="USER",
    )
    db.session.add(user)
    db.session.commit()

    token = create_token(user)

    log_activity(
        user_id=user.id,
        role="USER",
        action="USER_SIGNUP",
        entity_type="USER",
        entity_id=user.id,
    )

    return success_response({
        "token": token,
        "user": user.to_dict(),
    }, status_code=201)


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """POST /api/auth/logout — logout (client discards token)."""
    # For JWT, logout is handled client-side by discarding the token.
    # In production, you'd add token to a blocklist.
    return success_response(message="Logged out successfully.")
