"""AI API Routes — /api/ai endpoints and Hackathon Demo Security Simulator."""

from flask import Blueprint, request, jsonify, current_app
from app.utils.helpers import success_response, error_response
from app.services.ai_service import (
    analyze_complaint,
    detect_duplicates_for_complaint,
    detect_anomalies_for_user,
    detect_network_trends,
    get_latest_ai_analysis,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


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

    if scenario == "duplicate_complaint":
        return success_response({
            "scenario": "Duplicate Complaint Detection",
            "signals": ["Same bus KL-15-A-4021", "Same route Aluva -> Ernakulam", "Same category Overcrowding", "Timestamp within 8 mins"],
            "core_system": "Both complaints remain stored safely in database. Zero automatic deletion.",
            "ai_result": {
                "possible_duplicate": True,
                "confidence": 0.93,
                "related_complaint_ids": ["GRV-2026-000117"],
                "reason": "Similar description and matching bus/route within 8 minutes window.",
                "recommended_action": "REVIEW",
                "provider": "OPENROUTER",
            },
            "ui_action": "Depot Head receives Advisory Alert with [View Related] and [Not a Duplicate] options.",
        })

    elif scenario == "category_mismatch":
        return success_response({
            "scenario": "Category Mismatch Detection",
            "passenger_selected_category": "CLEANLINESS",
            "ai_suggested_category": "OVERCROWDING",
            "ai_result": {
                "suggested_category": "OVERCROWDING",
                "category_mismatch": True,
                "user_category": "CLEANLINESS",
                "suggested_priority": "HIGH",
                "summary": "Passenger reports severe overcrowding during evening peak hours despite selecting Cleanliness.",
                "confidence": 0.94,
                "provider": "OPENROUTER",
            },
            "core_system": "Passenger category preserved as CLEANLINESS. AI does not override user selection.",
            "ui_action": "Depot Head sees warning badge: ⚠ Category Mismatch Detected (AI suggests Overcrowding).",
        })

    elif scenario == "suspicious_activity":
        return success_response({
            "scenario": "High-Frequency Submission Anomaly",
            "simulation_metrics": {"submission_count": 30, "time_window": "10 minutes", "ip_subnet": "192.168.1.x"},
            "deterministic_rule": "Rate limit exceeded (30 submissions / 10 mins).",
            "ai_result": {
                "anomaly": True,
                "risk_level": "HIGH",
                "reason": "Unusually high submission frequency with repeated text structures.",
                "recommended_action": "ADMIN_REVIEW",
                "provider": "OPENROUTER",
            },
            "core_system": "Authentication & Database protected by rate limiter.",
            "ui_action": "Admin Dashboard displays: 'Unusual complaint activity detected (High Frequency)'",
        })

    elif scenario == "openrouter_failure":
        return success_response({
            "scenario": "OpenRouter API Failure / Timeout Resilience",
            "simulated_error": "OPENROUTER_TIMEOUT (HTTP 504 Gateway Timeout)",
            "ai_status": "UNAVAILABLE",
            "core_system": {
                "complaint_created": True,
                "reference_generated": "GRV-2026-99901",
                "depot_assigned": "Aluva Depot",
                "email_notification_sent": True,
                "status": "SUBMITTED",
            },
            "ui_notice": "AI analysis temporarily unavailable. Core complaint processing continued normally with 100% success.",
            "resilience_proof": "AI is strictly an advisory supporting layer. Zero system disruption.",
        })

    elif scenario == "malformed_ai_response":
        return success_response({
            "scenario": "Malformed AI Response Handling",
            "raw_model_output": "{ invalid_json: ... [truncated] }",
            "schema_validation": "FAILED (JSONDecodeError)",
            "fallback_engine": {
                "executed": True,
                "level": "Level 2 Deterministic Rule Fallback",
                "result": {
                    "suggested_category": "OVERCROWDING",
                    "category_mismatch": False,
                    "summary": "Rule fallback generated summary from description.",
                    "confidence": 0.75,
                    "provider": "RULE_FALLBACK",
                },
            },
            "core_system": "Grievance dossier preserved with rule-based fallback data.",
        })

    elif scenario == "failed_logins":
        return success_response({
            "scenario": "Multiple Failed Authentication Attempts",
            "attempts": 12,
            "window": "2 minutes",
            "deterministic_security": {
                "action": "ACCOUNT_LOCKED_TEMPORARY",
                "lock_duration": "15 minutes",
                "mechanism": "JWT Auth Rate Limiter (Non-AI)",
            },
            "ai_insight": {
                "title": "Authentication Security Insight",
                "pattern": "12 failed password attempts in 2 minutes for user demo-user.",
                "advisory": "Review security audit logs.",
            },
            "principle": "AI does NOT control authorization or authentication locks. Core security is 100% deterministic.",
        })

    elif scenario == "expired_token":
        return success_response({
            "scenario": "Expired Conductor Single-Use Action Token",
            "token": "tok_expired_984712",
            "token_status": "EXPIRED (Used at 2026-09-24 04:12:00)",
            "auth_check": "FAILED - HTTP 400 (INVALID_TOKEN)",
            "ui_message": "ACTION LINK EXPIRED: This secure action link is no longer valid. Token has expired or was already used.",
            "principle": "Critical authorization links enforced by cryptographic backend tokens, not AI.",
        })

    return error_response("INVALID_SCENARIO", f"Unknown scenario: {scenario}", 400)
