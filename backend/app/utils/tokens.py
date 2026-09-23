"""Secure token generation and validation for conductor action links."""

import uuid
import hashlib
from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.action_token import ActionToken


def generate_action_token(complaint_id, conductor_id, expiry_hours=24):
    """Generate a secure, single-use action token for a conductor.

    Returns (raw_token, action_token_record).
    The raw_token is sent via SMS; only the hash is stored.
    """
    raw_token = uuid.uuid4().hex
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    action_token = ActionToken(
        token_hash=token_hash,
        complaint_id=complaint_id,
        conductor_id=conductor_id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
    )
    db.session.add(action_token)
    db.session.commit()

    return raw_token, action_token


def validate_action_token(raw_token):
    """Validate a raw token string. Returns (action_token, error_message).

    Checks:
    1. Token exists
    2. Not expired
    3. Not already used
    """
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    action_token = ActionToken.query.filter_by(token_hash=token_hash).first()

    if not action_token:
        return None, "Token not found."

    if action_token.is_expired:
        return None, "Token has expired."

    if action_token.is_used:
        return None, "Token has already been used."

    return action_token, None


def mark_token_used(action_token):
    """Mark an action token as used."""
    action_token.used_at = datetime.now(timezone.utc)
    db.session.commit()
