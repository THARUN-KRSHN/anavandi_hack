"""Assignment service — conductor matching engine.

Deterministic matching: bus + route + date + time → conductor.
Not "AI" — explainable match factors.
"""

from datetime import datetime, time as dt_time

from app.models import DutyAssignment, Conductor


def find_conductor(bus_id, route_id, reported_at):
    """Find the conductor assigned to a bus on a route at a specific time.

    Input:
        bus_id: int
        route_id: int
        reported_at: datetime or ISO string

    Returns:
        {
            "conductor": {...},
            "assignment": {...},
            "match_factors": ["Bus matched", "Route matched", ...]
        }
        or None if no match found.
    """
    if not bus_id or not route_id:
        return None

    # Parse reported_at
    if isinstance(reported_at, str):
        try:
            reported_at = datetime.fromisoformat(reported_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

    if not isinstance(reported_at, datetime):
        return None

    report_date = reported_at.date()
    report_time = reported_at.time()

    # Query assignments matching bus + route + date
    assignments = (
        DutyAssignment.query
        .filter_by(
            bus_id=int(bus_id),
            route_id=int(route_id),
            duty_date=report_date,
        )
        .all()
    )

    match_factors = []

    if not assignments:
        # Try matching just by bus + date (route might differ)
        assignments = (
            DutyAssignment.query
            .filter_by(
                bus_id=int(bus_id),
                duty_date=report_date,
            )
            .all()
        )
        if assignments:
            match_factors.append("Bus matched")
            match_factors.append(f"Date matched ({report_date})")
            # Don't add route match
        else:
            return None
    else:
        match_factors.append("Bus matched")
        match_factors.append("Route matched")
        match_factors.append(f"Date matched ({report_date})")

    # Find the assignment whose shift covers the reported time
    best_assignment = None
    for assignment in assignments:
        if _time_in_shift(report_time, assignment.shift_start, assignment.shift_end):
            best_assignment = assignment
            match_factors.append(
                f"Shift matched ({assignment.shift_start.strftime('%H:%M')} – {assignment.shift_end.strftime('%H:%M')})"
            )
            break

    if not best_assignment:
        # No exact shift match — return the closest one
        if assignments:
            best_assignment = assignments[0]
            match_factors.append("Shift approximate (no exact match)")
        else:
            return None

    conductor = Conductor.query.get(best_assignment.conductor_id)
    if not conductor:
        return None

    return {
        "conductor": conductor.to_dict(),
        "assignment": best_assignment.to_dict(),
        "match_factors": match_factors,
    }


def _time_in_shift(check_time, shift_start, shift_end):
    """Check if a time falls within a shift window.

    Handles overnight shifts (e.g., 22:00 → 06:00).
    """
    if shift_start <= shift_end:
        # Normal shift (e.g., 06:00 → 14:00)
        return shift_start <= check_time < shift_end
    else:
        # Overnight shift (e.g., 22:00 → 06:00)
        return check_time >= shift_start or check_time < shift_end
