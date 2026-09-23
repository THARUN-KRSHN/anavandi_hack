"""Depot routes — dashboard, complaints, buses, routes, conductors for depot heads."""

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, get_jwt

from app.models import Bus, Route, Conductor, Depot, Complaint
from app.utils.auth import login_required, role_required, get_current_user
from app.utils.helpers import success_response, error_response
from app.services.complaint_service import get_depot_complaints, get_complaint_by_reference
from app.services.complaint_service import update_complaint_status
from app.services.dashboard_service import get_depot_dashboard
from app.services.assignment_service import find_conductor
from app.services.conductor_service import send_conductor_sms

depot_bp = Blueprint("depot", __name__, url_prefix="/api/depot")


def _get_depot_id():
    """Get depot_id from the authenticated depot head's JWT -- not from URL params."""
    claims = get_jwt()
    if claims and claims.get("depot_id"):
        return claims.get("depot_id")
    user = get_current_user()
    return user.depot_id if user else None


@depot_bp.route("/dashboard", methods=["GET"])
@role_required("DEPOT_HEAD")
def dashboard():
    """GET /api/depot/dashboard — depot head's own dashboard."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned to this account.", 403)

    data = get_depot_dashboard(depot_id)
    return success_response(data)


@depot_bp.route("/complaints", methods=["GET"])
@role_required("DEPOT_HEAD")
def complaints():
    """GET /api/depot/complaints — filtered complaints in own depot."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    filters = {
        "status": request.args.get("status"),
        "category": request.args.get("category"),
        "bus_id": request.args.get("bus_id"),
        "route_id": request.args.get("route_id"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
        "priority": request.args.get("priority"),
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v}

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    result = get_depot_complaints(depot_id, filters=filters, page=page, per_page=per_page)
    return success_response(result)


@depot_bp.route("/complaints/<int:complaint_id>", methods=["GET"])
@role_required("DEPOT_HEAD")
def complaint_detail(complaint_id):
    """GET /api/depot/complaints/<id> — complaint detail with conductor match."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    from app.models import Complaint
    complaint = Complaint.query.get(complaint_id)

    if not complaint:
        return error_response("COMPLAINT_NOT_FOUND", "Complaint not found.", 404)

    if complaint.depot_id != depot_id:
        return error_response("FORBIDDEN", "This complaint is not in your depot.", 403)

    data = complaint.to_dict(include_timeline=True)

    # Conductor matching
    if complaint.bus_id and complaint.route_id and complaint.reported_date and complaint.reported_time:
        from datetime import datetime
        reported_at = datetime.combine(complaint.reported_date, complaint.reported_time)
        conductor_match = find_conductor(complaint.bus_id, complaint.route_id, reported_at)
        data["possible_conductor"] = conductor_match
    else:
        data["possible_conductor"] = None

    return success_response(data)


@depot_bp.route("/complaints/<int:complaint_id>/status", methods=["PATCH"])
@role_required("DEPOT_HEAD")
def update_status(complaint_id):
    """PATCH /api/depot/complaints/<id>/status — transition a depot complaint."""
    depot_id = _get_depot_id()
    data = request.get_json() or {}
    complaint = Complaint.query.get(complaint_id)
    if not complaint or complaint.depot_id != depot_id:
        return error_response("COMPLAINT_NOT_FOUND", "Complaint not found in your depot.", 404)
    if not data.get("status"):
        return error_response("INVALID_INPUT", "Status is required.")
    updated, error = update_complaint_status(complaint_id, data["status"], changed_by=get_jwt_identity(), changed_by_role="DEPOT_HEAD", comment=data.get("comment"))
    if error:
        return error_response("STATUS_UPDATE_FAILED", error)
    return success_response(updated.to_dict(include_timeline=True))


@depot_bp.route("/complaints/<int:complaint_id>/notify-conductor", methods=["POST"])
@role_required("DEPOT_HEAD")
def notify_conductor(complaint_id):
    """POST /api/depot/complaints/<id>/notify-conductor — send SMS to matched conductor."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    from app.models import Complaint
    complaint = Complaint.query.get(complaint_id)

    if not complaint:
        return error_response("COMPLAINT_NOT_FOUND", "Complaint not found.", 404)

    if complaint.depot_id != depot_id:
        return error_response("FORBIDDEN", "This complaint is not in your depot.", 403)

    # Get conductor_id from request or find via matching
    data = request.get_json() or {}
    conductor_id = data.get("conductor_id")

    if not conductor_id:
        # Auto-match
        if complaint.bus_id and complaint.route_id and complaint.reported_date and complaint.reported_time:
            from datetime import datetime
            reported_at = datetime.combine(complaint.reported_date, complaint.reported_time)
            match = find_conductor(complaint.bus_id, complaint.route_id, reported_at)
            if match:
                conductor_id = match["conductor"]["id"]

    if not conductor_id:
        return error_response("NO_CONDUCTOR", "Could not determine conductor. Please specify conductor_id.")

    result, error = send_conductor_sms(complaint_id, conductor_id)
    if error:
        return error_response("SMS_ERROR", error)

    return success_response(result)


@depot_bp.route("/buses", methods=["GET"])
@role_required("DEPOT_HEAD")
def buses():
    """GET /api/depot/buses — list buses in this depot."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    bus_list = Bus.query.filter_by(depot_id=depot_id).all()
    return success_response([b.to_dict() for b in bus_list])


@depot_bp.route("/routes", methods=["GET"])
@role_required("DEPOT_HEAD")
def routes():
    """GET /api/depot/routes — list routes in this depot."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    route_list = Route.query.filter_by(depot_id=depot_id).all()
    return success_response([r.to_dict() for r in route_list])


@depot_bp.route("/conductors", methods=["GET"])
@role_required("DEPOT_HEAD")
def conductors():
    """GET /api/depot/conductors — list conductors in this depot."""
    depot_id = _get_depot_id()
    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    conductor_list = Conductor.query.filter_by(depot_id=depot_id).all()
    return success_response([c.to_dict() for c in conductor_list])
