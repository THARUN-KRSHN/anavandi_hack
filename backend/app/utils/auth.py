"""Authentication utilities — JWT decorators, password hashing."""

from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    verify_jwt_in_request,
)
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db
from app.models.user import User


def hash_password(password):
    """Hash a password for storage."""
    return generate_password_hash(password)


def verify_password(stored_hash, password):
    """Verify a password against its hash."""
    return check_password_hash(stored_hash, password)


def create_token(user):
    """Create JWT token with user id as string identity and additional claims."""
    claims = {
        "user_id": user.id,
        "role": user.role,
        "depot_id": user.depot_id,
    }
    return create_access_token(identity=str(user.id), additional_claims=claims)


def get_current_user():
    """Get the current authenticated user from the JWT."""
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (ValueError, TypeError):
        if isinstance(identity, dict):
            user_id = identity.get("user_id")
        else:
            return None
    return db.session.get(User, user_id)


def login_required(f):
    """Decorator: require a valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({
                "success": False,
                "error": {"code": "AUTH_REQUIRED", "message": "Authentication required."}
            }), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """Decorator: require one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({
                    "success": False,
                    "error": {"code": "AUTH_REQUIRED", "message": "Authentication required."}
                }), 401

            claims = get_jwt()
            user_role = claims.get("role") if claims else None

            if not user_role:
                identity = get_jwt_identity()
                if identity:
                    try:
                        u = db.session.get(User, int(identity))
                        user_role = u.role if u else None
                    except Exception:
                        pass

            if user_role not in roles:
                return jsonify({
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "You do not have permission to access this resource."}
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
