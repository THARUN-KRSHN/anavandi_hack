"""Export routes — CSV and Excel download for depot heads."""

from flask import Blueprint, request, send_file
from flask_jwt_extended import get_jwt_identity, get_jwt

from app.utils.auth import role_required, get_current_user
from app.utils.helpers import success_response, error_response
from app.services.export_service import export_complaints_csv, export_complaints_xlsx

export_bp = Blueprint("export", __name__, url_prefix="/api/depot")


@export_bp.route("/export", methods=["GET"])
@role_required("DEPOT_HEAD")
def export_complaints():
    """GET /api/depot/export?format=csv|xlsx -- download complaint report."""
    claims = get_jwt()
    depot_id = claims.get("depot_id") if claims else None
    if not depot_id:
        user = get_current_user()
        depot_id = user.depot_id if user else None

    if not depot_id:
        return error_response("NO_DEPOT", "No depot assigned.", 403)

    export_format = request.args.get("format", "csv").lower()

    filters = {
        "status": request.args.get("status"),
        "category": request.args.get("category"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to"),
    }
    filters = {k: v for k, v in filters.items() if v}

    if export_format == "xlsx":
        buffer = export_complaints_xlsx(depot_id, filters)
        return send_file(
            buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="complaints_report.xlsx",
        )
    else:
        buffer = export_complaints_csv(depot_id, filters)
        from io import BytesIO
        byte_buffer = BytesIO(buffer.getvalue().encode("utf-8"))
        return send_file(
            byte_buffer,
            mimetype="text/csv",
            as_attachment=True,
            download_name="complaints_report.csv",
        )
