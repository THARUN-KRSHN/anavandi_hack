"""Input validation helpers."""

from app.models.complaint import COMPLAINT_CATEGORIES, COMPLAINT_STATUSES


STATUS_ALIASES = {
    "ACTION_REQUIRED": "ACTION_TAKEN",
}


def normalize_status(status):
    """Normalize legacy status values into the canonical state names."""
    if not status:
        return status
    canonical = STATUS_ALIASES.get(status.upper())
    return canonical or status.upper()


def validate_complaint_data(data):
    """Validate complaint submission data. Returns list of error strings."""
    errors = []

    if not data.get("category"):
        errors.append("Category is required.")
    elif data["category"] not in COMPLAINT_CATEGORIES:
        errors.append(f"Invalid category. Must be one of: {', '.join(COMPLAINT_CATEGORIES)}")

    if not data.get("description"):
        errors.append("Description is required.")

    if data.get("category") == "OTHER" and not data.get("other_description"):
        errors.append("Other description is required when category is OTHER.")

    if data.get("bus_id"):
        try:
            int(data["bus_id"])
        except (ValueError, TypeError):
            errors.append("Invalid bus_id.")

    if data.get("route_id"):
        try:
            int(data["route_id"])
        except (ValueError, TypeError):
            errors.append("Invalid route_id.")

    return errors


def validate_status_transition(current_status, new_status):
    """Validate that a status transition is allowed.

    Canonical statuses: SUBMITTED, ASSIGNED, UNDER_REVIEW, ACTION_TAKEN,
    UNABLE_TO_RESOLVE, RESOLVED, ESCALATED.
    """
    current_status = normalize_status(current_status)
    new_status = normalize_status(new_status)

    valid_transitions = {
        "SUBMITTED": ["ASSIGNED", "ESCALATED"],
        "ASSIGNED": ["UNDER_REVIEW", "ESCALATED"],
        "UNDER_REVIEW": ["ACTION_TAKEN", "UNABLE_TO_RESOLVE", "ESCALATED", "RESOLVED"],
        "ACTION_TAKEN": ["RESOLVED", "ESCALATED"],
        "UNABLE_TO_RESOLVE": ["RESOLVED", "ESCALATED"],
        "ESCALATED": ["UNDER_REVIEW", "RESOLVED", "ACTION_TAKEN"],
    }

    allowed = valid_transitions.get(current_status, [])
    if new_status not in allowed:
        return False, f"Cannot transition from {current_status} to {new_status}."
    return True, None


def validate_conductor_action_status(status):
    """Validate that a conductor can set this status."""
    status = normalize_status(status)
    allowed = ["UNDER_REVIEW", "ACTION_TAKEN", "UNABLE_TO_RESOLVE", "RESOLVED"]
    if status not in allowed:
        return False, f"Conductor can only set status to: {', '.join(allowed)}"
    return True, None
