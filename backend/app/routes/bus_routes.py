"""Bus and route listing routes (public-ish, for complaint forms)."""

import csv
import os
from flask import Blueprint, request

from app.models import Bus, Route, Depot, Conductor
from app.utils.helpers import success_response, error_response

bus_bp = Blueprint("buses", __name__, url_prefix="/api")

# Path to mock CSV files (relative to this file's package root)
_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
_CONDUCTORS_CSV = os.path.abspath(os.path.join(_DATA_DIR, "mock_conductors.csv"))


def _load_conductors_from_csv(depot_id=None, pen=None):
    """Read conductors from the mock CSV file."""
    conductors = []
    try:
        with open(_CONDUCTORS_CSV, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if depot_id and row.get("depot_id") and row["depot_id"] != str(depot_id):
                    continue
                if pen and pen.strip().lower() not in (row.get("pen") or "").lower():
                    continue
                conductors.append({
                    "id": row.get("conductor_id", ""),
                    "pen": row.get("pen", ""),
                    "name": row.get("name", ""),
                    "phone": row.get("phone", ""),
                    "depot_id": row.get("depot_id", ""),
                    "status": row.get("status", "ACTIVE"),
                    "data_source": row.get("data_source", "MOCK"),
                })
    except Exception as exc:
        print(f"[WARN] Could not load mock conductors CSV: {exc}")
    return conductors


@bus_bp.route("/buses", methods=["GET"])
def list_buses():
    """GET /api/buses — list buses, optionally filtered by depot_id."""
    depot_id = request.args.get("depot_id", type=int)
    query = Bus.query.filter_by(status="ACTIVE")
    if depot_id:
        query = query.filter_by(depot_id=depot_id)
    buses = query.all()
    return success_response([b.to_dict() for b in buses])


@bus_bp.route("/routes", methods=["GET"])
def list_routes():
    """GET /api/routes — list routes, optionally filtered by depot_id."""
    depot_id = request.args.get("depot_id", type=int)
    query = Route.query.filter_by(status="ACTIVE")
    if depot_id:
        query = query.filter_by(depot_id=depot_id)
    routes = query.all()
    return success_response([r.to_dict() for r in routes])


@bus_bp.route("/depots", methods=["GET"])
def list_depots():
    """GET /api/depots — list all depots (for complaint form dropdowns and directory)."""
    depots = Depot.query.order_by(Depot.serial_no).all()
    return success_response([d.to_dict() for d in depots])


@bus_bp.route("/conductors", methods=["GET"])
def list_conductors():
    """GET /api/conductors — list conductors, optionally filtered by depot_id or pen.

    Tries the DB first; if no results, falls back to the mock CSV in backend/data/.
    """
    depot_id = request.args.get("depot_id", type=int)
    pen = request.args.get("pen")
    query = Conductor.query
    if depot_id:
        query = query.filter_by(depot_id=depot_id)
    if pen:
        query = query.filter(Conductor.pen.ilike(f"%{pen.strip()}%"))
    conductors = query.all()

    if conductors:
        return success_response([c.to_dict() for c in conductors])

    # No DB records — fall back to mock CSV
    print("[INFO] No conductors in DB — serving mock CSV data.")
    mock_conductors = _load_conductors_from_csv(depot_id=depot_id, pen=pen)
    return success_response(mock_conductors)
