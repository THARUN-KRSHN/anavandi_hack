"""Dashboard service — statistics for depot heads and admins."""

from sqlalchemy import func
from app.extensions import db
from app.models import Complaint, Depot, Bus, Route, Conductor, DutyAssignment, COMPLAINT_CATEGORIES, COMPLAINT_STATUSES


def get_depot_dashboard(depot_id):
    """Get dashboard statistics for a specific depot."""
    base_query = Complaint.query.filter_by(depot_id=depot_id)

    total = base_query.count()

    # Status breakdown
    status_counts = {}
    for status in COMPLAINT_STATUSES:
        status_counts[status.lower()] = base_query.filter_by(status=status).count()

    # Category breakdown
    category_counts = {}
    for category in COMPLAINT_CATEGORIES:
        category_counts[category] = base_query.filter_by(category=category).count()

    # Depot info
    depot = Depot.query.get(depot_id)
    bus_count = Bus.query.filter_by(depot_id=depot_id).count()
    route_count = Route.query.filter_by(depot_id=depot_id).count()
    conductor_count = Conductor.query.filter_by(depot_id=depot_id).count()

    return {
        "depot": depot.to_dict() if depot else None,
        "total": total,
        **status_counts,
        "category_breakdown": category_counts,
        "bus_count": bus_count,
        "route_count": route_count,
        "conductor_count": conductor_count,
    }


def get_admin_dashboard():
    """Get system-wide dashboard statistics."""
    total_depots = Depot.query.count()
    total_complaints = Complaint.query.count()

    status_counts = {}
    for status in COMPLAINT_STATUSES:
        status_counts[status.lower()] = Complaint.query.filter_by(status=status).count()

    resolved = status_counts.get("resolved", 0)
    pending = total_complaints - resolved

    # Category breakdown
    category_counts = {}
    for category in COMPLAINT_CATEGORIES:
        category_counts[category] = Complaint.query.filter_by(category=category).count()

    return {
        "total_depots": total_depots,
        "total_complaints": total_complaints,
        "resolved": resolved,
        "pending": pending,
        **status_counts,
        "category_breakdown": category_counts,
    }


def get_depot_map_data():
    """Get all depots with complaint statistics for the admin map.

    Includes GREEN/YELLOW/RED status based on pending ratio.
    """
    depots = Depot.query.all()
    result = []

    for depot in depots:
        total = Complaint.query.filter_by(depot_id=depot.id).count()
        resolved = Complaint.query.filter_by(depot_id=depot.id, status="RESOLVED").count()
        escalated = Complaint.query.filter_by(depot_id=depot.id, status="ESCALATED").count()
        pending = total - resolved

        if total > 0:
            pending_ratio = pending / total
            resolution_rate = round((resolved / total) * 100, 1)
        else:
            pending_ratio = 0
            resolution_rate = 0

        # Status calculation per §39
        if pending_ratio <= 0.20:
            status_color = "GREEN"
        elif pending_ratio <= 0.40:
            status_color = "YELLOW"
        else:
            status_color = "RED"

        result.append({
            "depot_id": depot.id,
            "depot_code": depot.depot_code,
            "name": depot.name,
            "latitude": depot.latitude,
            "longitude": depot.longitude,
            "total": total,
            "resolved": resolved,
            "pending": pending,
            "escalated": escalated,
            "resolution_rate": resolution_rate,
            "status": status_color,
        })

    return result


def get_depot_detail(depot_id):
    """Get detailed info for a specific depot — admin view."""
    depot = Depot.query.get(depot_id)
    if not depot:
        return None

    dashboard = get_depot_dashboard(depot_id)

    # Recent complaints
    recent = (
        Complaint.query
        .filter_by(depot_id=depot_id)
        .order_by(Complaint.created_at.desc())
        .limit(10)
        .all()
    )

    # Escalated complaints
    escalated = (
        Complaint.query
        .filter_by(depot_id=depot_id, status="ESCALATED")
        .order_by(Complaint.created_at.desc())
        .all()
    )

    dashboard["recent_complaints"] = [c.to_dict() for c in recent]
    dashboard["escalated_complaints"] = [c.to_dict() for c in escalated]

    return dashboard
