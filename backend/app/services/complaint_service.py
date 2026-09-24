"""Complaint service — core business logic for the complaint lifecycle."""

import os
from datetime import datetime, timezone
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    Complaint, ComplaintImage, ComplaintHistory, Bus, Route, Depot,
    COMPLAINT_CATEGORIES,
)
from app.utils.helpers import generate_reference_number, log_activity
from app.utils.validators import validate_complaint_data
from app.services.routing_service import determine_depot, estimate_location
from app.services.notification_service import notify_depot_head, notify_on_complaint_submitted, notify_on_status_change


def create_complaint(data, user, image_files=None, upload_folder=None):
    """Create a new complaint — the main §19 flow.

    Steps:
    1. Validate data
    2. Validate bus/route exist
    3. Generate reference number
    4. Determine depot
    5. Estimate location
    6. Create complaint
    7. Create SUBMITTED history
    8. Save images
    9. Notify depot head
    10. Return reference number
    """
    client_request_id = (data.get("client_request_id") or "").strip()
    if client_request_id:
        existing = Complaint.query.filter_by(client_request_id=client_request_id).first()
        if existing:
            return existing, {"code": "DUPLICATE_REQUEST", "message": "Duplicate complaint request detected.", "reference_number": existing.reference_number}

    # 1. Validate
    errors = validate_complaint_data(data)
    if errors:
        return None, errors

    # 2. Validate bus and route
    bus = None
    route = None
    if data.get("bus_id"):
        bus = Bus.query.get(int(data["bus_id"]))
        if not bus:
            return None, ["Bus not found."]

    if data.get("route_id"):
        route = Route.query.get(int(data["route_id"]))
        if not route:
            return None, ["Route not found."]

    # 3. Generate reference number
    reference_number = generate_reference_number()

    # 4. Determine depot
    depot_id = determine_depot(
        bus_id=data.get("bus_id"),
        route_id=data.get("route_id"),
    )

    # 5. Location
    location_data = estimate_location(data)

    # Parse reported_at
    reported_date = None
    reported_time = None
    if data.get("reported_at"):
        try:
            dt = datetime.fromisoformat(data["reported_at"].replace("Z", "+00:00"))
            reported_date = dt.date()
            reported_time = dt.time()
        except (ValueError, AttributeError):
            pass

    # Priority based on category
    priority = _determine_priority(data["category"])

    # 6. Create complaint
    complaint = Complaint(
        reference_number=reference_number,
        user_id=user.id,
        depot_id=depot_id,
        bus_id=int(data["bus_id"]) if data.get("bus_id") else None,
        route_id=int(data["route_id"]) if data.get("route_id") else None,
        category=data["category"],
        description=data["description"],
        other_description=data.get("other_description"),
        reported_date=reported_date,
        reported_time=reported_time,
        location_name=location_data.get("location_name"),
        latitude=location_data.get("latitude"),
        longitude=location_data.get("longitude"),
        location_source=location_data.get("location_source"),
        status="SUBMITTED",
        priority=priority,
        client_request_id=client_request_id or None,
    )
    db.session.add(complaint)
    db.session.flush()  # Get complaint.id

    # 7. Create SUBMITTED history
    history = ComplaintHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status="SUBMITTED",
        changed_by=user.id,
        changed_by_role="USER",
        comment="Complaint submitted by passenger.",
    )
    db.session.add(history)

    # 8. Save images
    if image_files and upload_folder:
        _save_images(complaint, image_files, upload_folder)

    db.session.commit()

    # 9. Notify depot head + user confirmation
    try:
        notify_on_complaint_submitted(complaint, user)
    except Exception as e:
        print(f"[WARN] Failed to send submission notifications: {e}")

    # 10. Log activity
    log_activity(
        user_id=user.id,
        role="USER",
        action="COMPLAINT_CREATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        metadata={"reference_number": reference_number},
    )

    # 11. Trigger background AI analysis (asynchronous, non-blocking)
    try:
        from threading import Thread
        from flask import current_app

        def _bg_ai_task(app_ctx, comp_id):
            with app_ctx:
                try:
                    from app.services.ai_service import analyze_complaint, detect_duplicates_for_complaint
                    analyze_complaint(comp_id)
                    detect_duplicates_for_complaint(comp_id)
                except Exception as ai_err:
                    print(f"[WARN] Background AI task notice: {ai_err}")

        app_obj = current_app._get_current_object()
        Thread(target=_bg_ai_task, args=(app_obj.app_context(), complaint.id), daemon=True).start()
    except Exception as thread_err:
        print(f"[WARN] Failed to launch background AI thread: {thread_err}")

    return complaint, None


def get_complaint_by_reference(reference_number, include_timeline=True):
    """Get a complaint by its reference number."""
    complaint = Complaint.query.filter_by(reference_number=reference_number).first()
    if not complaint:
        return None
    return complaint


def get_user_complaints(user_id, page=1, per_page=20):
    """Get all complaints for a user, paginated."""
    pagination = (
        Complaint.query
        .filter_by(user_id=user_id)
        .order_by(Complaint.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return {
        "complaints": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }


def get_depot_complaints(depot_id, filters=None, page=1, per_page=20):
    """Get complaints for a specific depot with filters."""
    query = Complaint.query.filter_by(depot_id=depot_id)

    if filters:
        if filters.get("status"):
            query = query.filter_by(status=filters["status"])
        if filters.get("category"):
            query = query.filter_by(category=filters["category"])
        if filters.get("bus_id"):
            query = query.filter_by(bus_id=int(filters["bus_id"]))
        if filters.get("route_id"):
            query = query.filter_by(route_id=int(filters["route_id"]))
        if filters.get("date_from"):
            try:
                date_from = datetime.fromisoformat(filters["date_from"]).date()
                query = query.filter(Complaint.reported_date >= date_from)
            except ValueError:
                pass
        if filters.get("date_to"):
            try:
                date_to = datetime.fromisoformat(filters["date_to"]).date()
                query = query.filter(Complaint.reported_date <= date_to)
            except ValueError:
                pass
        if filters.get("priority"):
            query = query.filter_by(priority=filters["priority"])

    pagination = (
        query
        .order_by(Complaint.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return {
        "complaints": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }


def update_complaint_status(complaint_id, new_status, changed_by=None, changed_by_role="SYSTEM", comment=None):
    """Update a complaint's status and create history entry."""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return None, "Complaint not found."

    old_status = complaint.status
    complaint.status = new_status

    if new_status == "ASSIGNED":
        complaint.assigned_at = datetime.now(timezone.utc)
    elif new_status == "RESOLVED":
        complaint.resolved_at = datetime.now(timezone.utc)
    elif new_status == "ESCALATED":
        complaint.escalated_at = datetime.now(timezone.utc)

    history = ComplaintHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        changed_by_role=changed_by_role,
        comment=comment,
    )
    db.session.add(history)
    db.session.commit()

    # Notify user on any meaningful status change
    notify_statuses = {"UNDER_REVIEW", "ASSIGNED", "ACTION_TAKEN", "RESOLVED", "UNABLE_TO_RESOLVE"}
    if new_status in notify_statuses:
        try:
            notify_on_status_change(complaint, new_status)
        except Exception as notify_err:
            print(f"[WARN] Status-change notification failed: {notify_err}")

    return complaint, None


def _determine_priority(category):
    """Determine complaint priority based on category."""
    priority_map = {
        "UNSAFE_DRIVING": "URGENT",
        "OVERCROWDING": "HIGH",
        "CLEANLINESS": "NORMAL",
        "MISSED_STOP": "MEDIUM",
        "CONCESSION_DENIAL": "MEDIUM",
        "OTHER": "LOW",
    }
    return priority_map.get(category, "NORMAL")


def _save_images(complaint, image_files, upload_folder):
    """Save uploaded images for a complaint."""
    complaint_folder = os.path.join(upload_folder, "complaints", complaint.reference_number)
    os.makedirs(complaint_folder, exist_ok=True)

    for i, file in enumerate(image_files[:3]):  # Max 3 images
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(complaint_folder, filename)
            file.save(file_path)

            relative_path = os.path.join("complaints", complaint.reference_number, filename)
            image = ComplaintImage(
                complaint_id=complaint.id,
                file_path=relative_path,
            )
            db.session.add(image)
