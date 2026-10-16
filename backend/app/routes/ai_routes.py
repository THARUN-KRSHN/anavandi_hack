"""AI API Routes — /api/ai endpoints and Hackathon Demo Security Simulator."""

from flask import Blueprint, request, jsonify, current_app
from app.utils.helpers import success_response, error_response
from app.services.ai_service import (
    analyze_complaint,
    detect_duplicates_for_complaint,
    detect_anomalies_for_user,
    detect_network_trends,
    get_latest_ai_analysis,
    scan_ticket_data,
    simulate_ai_scenario,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/scan-ticket", methods=["POST"])
def scan_ticket_endpoint():
    """Scan and extract journey details from ticket text or uploaded receipt."""
    data = request.get_json() or {}
    text = data.get("text", "")
    image_b64 = data.get("image", None)
    mime_type = data.get("mime_type", "image/jpeg")

    if not text and not image_b64:
        return error_response("MISSING_DATA", "Please provide ticket text or image.", 400)

    result = scan_ticket_data(ticket_text=text, image_b64=image_b64, mime_type=mime_type)
    return success_response(result)



@ai_bp.route("/analyze/<int:complaint_id>", methods=["POST", "GET"])
def analyze_complaint_endpoint(complaint_id):
    """Analyze complaint for classification, category verification, and executive summary."""
    if request.method == "GET":
        existing = get_latest_ai_analysis(complaint_id, "COMPLAINT_ANALYSIS")
        if existing:
            return success_response(existing)

    result = analyze_complaint(complaint_id)
    return success_response(result)



@ai_bp.route("/duplicates/<int:complaint_id>", methods=["POST", "GET"])
def duplicate_detection_endpoint(complaint_id):
    """Detect potential duplicate complaints."""
    if request.method == "GET":
        existing = get_latest_ai_analysis(complaint_id, "DUPLICATE_DETECTION")
        if existing:
            return success_response(existing)

    result = detect_duplicates_for_complaint(complaint_id)
    return success_response(result)


@ai_bp.route("/anomalies", methods=["GET"])
def anomaly_detection_endpoint():
    """Detect submission pattern frequency anomalies."""
    result = detect_anomalies_for_user(time_window_minutes=15)
    return success_response(result)


@ai_bp.route("/trends", methods=["GET"])
def trend_detection_endpoint():
    """Generate network-wide executive transit trends."""
    result = detect_network_trends()
    return success_response(result)


@ai_bp.route("/status/<int:complaint_id>", methods=["GET"])
def complaint_ai_status_endpoint(complaint_id):
    """Get aggregated AI status indicators for a complaint (Depot Head UI view)."""
    analysis = get_latest_ai_analysis(complaint_id, "COMPLAINT_ANALYSIS")
    duplicate = get_latest_ai_analysis(complaint_id, "DUPLICATE_DETECTION")

    cfg = current_app.config
    ai_active = cfg.get("AI_ENABLED", True)

    return success_response({
        "ai_enabled": ai_active,
        "ai_status": "COMPLETED" if (analysis and analysis["status"] == "COMPLETED") else ("UNAVAILABLE" if not ai_active else "PENDING"),
        "analysis": analysis["result"] if analysis else None,
        "duplicate_check": duplicate["result"] if duplicate else None,
    })


@ai_bp.route("/demo/simulate", methods=["POST"])
def demo_simulator_endpoint():
    """BUS സഹായി AI Lab & Security Simulator Endpoint.

    Simulates hackathon edge cases to demonstrate fallback resilience & advisory design.
    """
    body = request.get_json() or {}
    scenario = body.get("scenario", "duplicate_complaint")
    result = simulate_ai_scenario(scenario)
    if "error" in result and not result.get("scenario"):
        return error_response("INVALID_SCENARIO", result["error"], 400)
    return success_response(result)


