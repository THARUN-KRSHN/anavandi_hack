"""Bus and route listing routes (public-ish, for complaint forms)."""

from flask import Blueprint, request

from app.models import Bus, Route, Depot
from app.utils.auth import login_required
from app.utils.helpers import success_response, error_response

bus_bp = Blueprint("buses", __name__, url_prefix="/api")


@bus_bp.route("/buses", methods=["GET"])
@login_required
def list_buses():
    """GET /api/buses — list buses, optionally filtered by depot_id."""
    depot_id = request.args.get("depot_id", type=int)
    query = Bus.query.filter_by(status="ACTIVE")
    if depot_id:
        query = query.filter_by(depot_id=depot_id)
    buses = query.all()
    return success_response([b.to_dict() for b in buses])


@bus_bp.route("/routes", methods=["GET"])
@login_required
def list_routes():
    """GET /api/routes — list routes, optionally filtered by depot_id."""
    depot_id = request.args.get("depot_id", type=int)
    query = Route.query.filter_by(status="ACTIVE")
    if depot_id:
        query = query.filter_by(depot_id=depot_id)
    routes = query.all()
    return success_response([r.to_dict() for r in routes])


@bus_bp.route("/depots", methods=["GET"])
@login_required
def list_depots():
    """GET /api/depots — list all depots (for complaint form dropdowns)."""
    depots = Depot.query.order_by(Depot.serial_no).all()
    return success_response([d.to_dict() for d in depots])
