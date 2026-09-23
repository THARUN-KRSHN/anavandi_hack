"""Authentication routes — login, signup, logout."""

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User
from app.utils.auth import hash_password, verify_password, create_token, login_required, get_current_user
from app.utils.helpers import success_response, error_response, log_activity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _phone_variants(value):
    """Return common local and E.164 forms for a phone login."""
    raw = str(value or "").strip()
    digits = "".join(character for character in raw if character.isdigit())
    variants = [raw]
    if len(digits) == 10:
        variants.append(digits)
        variants.append(f"+91{digits}")
    elif len(digits) == 12 and digits.startswith("91"):
        variants.append(digits[2:])
        variants.append(f"+{digits}")
    return list(dict.fromkeys(variants))


@auth_bp.route("/login", methods=["POST"])
def login():
    """POST /api/auth/login — authenticate with phone + password."""
    data = request.get_json()

    identifier = (data or {}).get("phone") or (data or {}).get("email")
    if not identifier or not data.get("password"):
        return error_response("INVALID_INPUT", "Phone number and password are required.")

    identifier = identifier.strip()
    user = None
    for phone in _phone_variants(identifier):
        user = User.query.filter_by(phone=phone).first()
        if user:
            break
    if not user:
        user = User.query.filter_by(email=identifier.lower()).first()
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
    required = ["name", "password"]
    for field in required:
        if not data.get(field):
            return error_response("INVALID_INPUT", f"{field} is required.")

    if not data.get("phone") and not data.get("email"):
        return error_response("INVALID_INPUT", "Phone number is required.")

    email = data.get("email", "").lower().strip()
    phone = data.get("phone", "").strip()
    if not phone:
        # Preserve compatibility for older clients while new accounts use phone login.
        phone = f"unverified-{email}"
    email = email or f"{phone}@passenger.demo"

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return error_response("EMAIL_EXISTS", "An account with this email already exists.")

    # Only USER role can self-register
    user = User(
        name=data["name"].strip(),
        phone=phone,
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
