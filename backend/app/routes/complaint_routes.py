"""Complaint routes — submission, retrieval, PDF download."""

import os
from flask import Blueprint, request, send_file, current_app

from app.utils.auth import login_required, role_required, get_current_user
from app.utils.helpers import success_response, error_response
from app.services.complaint_service import (
    create_complaint,
    get_complaint_by_reference,
    get_user_complaints,
    get_depot_complaints,
)
from app.models import Complaint, User
from app.services.pdf_service import generate_complaint_pdf

complaint_bp = Blueprint("complaints", __name__, url_prefix="/api/complaints")


@complaint_bp.route("", methods=["GET"])
@login_required
def list_complaints():
    """GET /api/complaints — list complaints based on caller's role.

    - DEPOT_HEAD: returns complaints for their depot
    - ADMIN: returns all complaints
    - USER: redirected to /mine (or returns their complaints)
    """
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    filters = {
        "status": request.args.get("status"),
        "category": request.args.get("category"),
        "priority": request.args.get("priority"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
    }
    filters = {k: v for k, v in filters.items() if v}
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    if user.role == "ADMIN":
        # Admin sees all complaints
        query = Complaint.query.order_by(Complaint.created_at.desc())
        total = query.count()
        complaints = query.offset((page - 1) * per_page).limit(per_page).all()
        return success_response([c.to_dict(include_timeline=False) for c in complaints])

    elif user.role == "DEPOT_HEAD":
        if not user.depot_id:
            return error_response("NO_DEPOT", "No depot assigned to this account.", 403)
        result = get_depot_complaints(user.depot_id, filters=filters, page=page, per_page=per_page)
        # Return just the list for frontend compatibility
        return success_response(result.get("complaints", result))

    else:
        # Regular user — return their own complaints
        result = get_user_complaints(user.id, page=page, per_page=per_page)
        return success_response(result.get("complaints", result))


@complaint_bp.route("", methods=["POST"])
@login_required
def submit_complaint():
    """POST /api/complaints — submit a new complaint.

    Supports JSON or multipart/form-data (for image uploads).
    """
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    # Parse data from JSON or form
    if request.content_type and "multipart" in request.content_type:
        data = {
            "category": request.form.get("category"),
            "description": request.form.get("description"),
            "other_description": request.form.get("other_description"),
            "bus_id": request.form.get("bus_id"),
            "route_id": request.form.get("route_id"),
            "reported_at": request.form.get("reported_at"),
            "latitude": request.form.get("latitude"),
            "longitude": request.form.get("longitude"),
        }
        image_files = request.files.getlist("images") or []
        if not image_files:
            # Try single image field
            single = request.files.get("image")
            if single:
                image_files = [single]
    else:
        data = request.get_json() or {}
        image_files = []

    upload_folder = current_app.config.get("UPLOAD_FOLDER")

    client_request_id = (data.get("client_request_id") or "").strip()
    if client_request_id:
        existing = Complaint.query.filter_by(client_request_id=client_request_id).first()
        if existing:
            return error_response(
                "DUPLICATE_REQUEST",
                "This complaint has already been submitted.",
                409,
                reference_number=existing.reference_number,
            )

    # Resolve bus_number → bus_id if frontend sent text instead of ID
    if not data.get("bus_id") and data.get("bus_number"):
        from app.models import Bus
        bus = Bus.query.filter(Bus.bus_number.ilike(data["bus_number"].strip())).first()
        if bus:
            data["bus_id"] = bus.id

    # Resolve route text → route_id if frontend sent from/to text
    if not data.get("route_id") and (data.get("route_from") or data.get("route_to")):
        from app.models import Route
        route_from = (data.get("route_from") or "").strip()
        route_to = (data.get("route_to") or "").strip()
        if route_from and route_to:
            route = Route.query.filter(
                Route.source.ilike(f"%{route_from}%"),
                Route.destination.ilike(f"%{route_to}%"),
            ).first()
            if not route:
                route = Route.query.filter(
                    Route.source.ilike(f"%{route_to}%"),
                    Route.destination.ilike(f"%{route_from}%"),
                ).first()
            if route:
                data["route_id"] = route.id

    complaint, errors = create_complaint(data, user, image_files, upload_folder)


    if errors:
        if isinstance(errors, dict) and errors.get("code") == "DUPLICATE_REQUEST":
            return error_response(
                errors["code"],
                errors["message"],
                409,
                reference_number=errors.get("reference_number"),
            )
        return error_response("VALIDATION_ERROR", "; ".join(errors))

    return success_response({
        "reference_number": complaint.reference_number,
        "status": complaint.status,
        "depot": complaint.depot.name if complaint.depot else None,
    }, status_code=201)


@complaint_bp.route("/mine", methods=["GET"])
@login_required
def my_complaints():
    """GET /api/complaints/mine — get current user's complaints."""
    user = get_current_user()
    if not user:
        return error_response("AUTH_REQUIRED", "Authentication required.", 401)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    result = get_user_complaints(user.id, page=page, per_page=per_page)
    return success_response(result)


@complaint_bp.route("/<reference_number>", methods=["GET"])
@login_required
def get_complaint(reference_number):
    """GET /api/complaints/<reference> — get complaint details with timeline."""
    user = get_current_user()
    complaint = get_complaint_by_reference(reference_number)

    if not complaint:
        return error_response("COMPLAINT_NOT_FOUND", "Complaint not found.", 404)

    # Users can only see their own complaints; depot heads/admins can see their depot's
    if user.role == "USER" and complaint.user_id != user.id:
        return error_response("FORBIDDEN", "You can only view your own complaints.", 403)

    if user.role == "DEPOT_HEAD" and complaint.depot_id != user.depot_id:
        return error_response("FORBIDDEN", "You can only view complaints in your depot.", 403)

    include_conductor = user.role in ("DEPOT_HEAD", "ADMIN")
    public = user.role == "USER"

    return success_response(complaint.to_dict(
        include_timeline=True,
        include_conductor=include_conductor,
        public=public,
    ))


@complaint_bp.route("/<reference_number>/pdf", methods=["GET"])
@login_required
def download_pdf(reference_number):
    """GET /api/complaints/<reference>/pdf — download complaint PDF."""
    user = get_current_user()
    complaint = get_complaint_by_reference(reference_number)

    if not complaint:
        return error_response("COMPLAINT_NOT_FOUND", "Complaint not found.", 404)

    # Check access
    if user.role == "USER" and complaint.user_id != user.id:
        return error_response("FORBIDDEN", "You can only download your own complaint PDF.", 403)

    pdf_buffer = generate_complaint_pdf(complaint)

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{complaint.reference_number}.pdf",
    )
