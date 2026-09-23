"""Admin routes -- system-wide dashboard, depot map, depot details, notifications."""

from datetime import datetime, timezone
from flask import Blueprint, request

from app.extensions import db
from app.models import Depot, User, Notification, Complaint
from app.utils.auth import role_required
from app.utils.helpers import success_response, error_response, log_activity
from app.services.dashboard_service import (
    get_admin_dashboard,
    get_depot_map_data,
    get_depot_detail,
)
from app.services.notification_service import send_sms

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/dashboard", methods=["GET"])
@role_required("ADMIN")
def dashboard():
    """GET /api/admin/dashboard -- system-wide statistics."""
    data = get_admin_dashboard()
    return success_response(data)


@admin_bp.route("/depots/map", methods=["GET"])
@role_required("ADMIN")
def depots_map():
    """GET /api/admin/depots/map -- all depots with complaint stats for the map."""
    data = get_depot_map_data()
    return success_response(data)


@admin_bp.route("/depots/<int:depot_id>", methods=["GET"])
@role_required("ADMIN")
def depot_detail(depot_id):
    """GET /api/admin/depots/<id> -- detailed depot info with all stats."""
    data = get_depot_detail(depot_id)
    if not data:
        return error_response("DEPOT_NOT_FOUND", "Depot not found.", 404)
    return success_response(data)


@admin_bp.route("/depots/<int:depot_id>/notify", methods=["POST"])
@role_required("ADMIN")
def notify_depot(depot_id):
    """POST /api/admin/depots/<id>/notify -- send notification to depot head."""
    depot = db.session.get(Depot, depot_id)
    if not depot:
        return error_response("DEPOT_NOT_FOUND", "Depot not found.", 404)

    data = request.get_json()
    if not data or not data.get("message"):
        return error_response("INVALID_INPUT", "Message is required.")

    # Find depot head
    depot_head = User.query.filter_by(depot_id=depot_id, role="DEPOT_HEAD").first()

    subject = data.get("subject", "Notification from Admin")
    message = data["message"]

    # Send via SMS/mock
    if depot.head_phone and depot.head_phone != "0":
        send_sms(depot.head_phone, f"{subject}\n\n{message}")

    # Record notification
    notification = Notification(
        recipient_type="DEPOT_HEAD",
        recipient_id=depot_head.id if depot_head else None,
        complaint_id=None,
        channel="SMS",
        title=subject,
        message=message,
        status="SENT",
        sent_at=datetime.now(timezone.utc),
    )
    db.session.add(notification)
    db.session.commit()

    log_activity(
        user_id=None,
        role="ADMIN",
        action="ADMIN_NOTIFIED_DEPOT",
        entity_type="DEPOT",
        entity_id=depot_id,
        metadata={"subject": subject},
    )

    return success_response({"message": "Notification sent successfully."})


@admin_bp.route("/depots", methods=["GET"])
@role_required("ADMIN")
def list_depots():
    """GET /api/admin/depots -- list all depots."""
    depots = Depot.query.order_by(Depot.serial_no).all()
    return success_response([d.to_dict() for d in depots])


@admin_bp.route("/complaints", methods=["GET"])
@role_required("ADMIN")
def list_complaints():
    """GET /api/admin/complaints -- system-wide complaint queue."""
    query = Complaint.query.order_by(Complaint.created_at.desc())
    status = request.args.get("status")
    category = request.args.get("category")
    priority = request.args.get("priority")
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if priority:
        query = query.filter_by(priority=priority)
    complaints = query.limit(request.args.get("per_page", 100, type=int)).all()
    return success_response({"complaints": [complaint.to_dict() for complaint in complaints], "total": len(complaints)})
