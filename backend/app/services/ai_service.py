"""Business-level AI Service — BUS സഹായി.

Orchestrates OpenRouter client, prompts, schemas, fallbacks, and DB persistence (AIAnalysis).
"""

from datetime import datetime, timezone, timedelta
import json
from flask import current_app
from app.extensions import db
from app.models import Complaint, AIAnalysis, ActivityLog, Depot
from app.ai.openrouter_client import call_openrouter
from app.ai.gemini_client import call_gemini
from app.ai.prompts import (
    DUPLICATE_DETECTION_SYSTEM,
    COMPLAINT_ANALYSIS_SYSTEM,
    ANOMALY_DETECTION_SYSTEM,
    TREND_ANALYSIS_SYSTEM,
    TICKET_SCANNER_SYSTEM,
)
from app.ai.schemas import (
    validate_duplicate_result,
    validate_analysis_result,
    validate_anomaly_result,
    validate_trend_result,
    validate_ticket_scan_result,
)
from app.ai.fallback import (
    fallback_duplicate_detection,
    fallback_complaint_analysis,
    fallback_anomaly_detection,
    fallback_trend_analysis,
    fallback_ticket_scan,
)
from app.ai.safeguards import sanitize_input_text


def _dispatch_ai_call(system_prompt: str, user_prompt: str, image_b64: str = None, mime_type: str = "image/jpeg"):
    """Dispatches AI inference to Google Gemini (primary) with fallback to OpenRouter."""
    cfg = current_app.config if current_app else {}
    provider = cfg.get("AI_PROVIDER", "gemini").lower()

    if provider == "gemini" or cfg.get("GEMINI_API_KEY"):
        res_dict, err_code, raw_text, elapsed_ms = call_gemini(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            image_b64=image_b64,
            mime_type=mime_type,
        )
        if not err_code and res_dict:
            return res_dict, None, raw_text, elapsed_ms, "GEMINI", cfg.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
        # If Gemini fails and OpenRouter is configured, try OpenRouter as secondary
        if cfg.get("OPENROUTER_API_KEY"):
            or_dict, or_err, or_text, or_elapsed = call_openrouter(system_prompt, user_prompt)
            if not or_err and or_dict:
                return or_dict, None, or_text, or_elapsed, "OPENROUTER", cfg.get("OPENROUTER_MODEL", "nex-agi/nex-n2.5-mini:free")
        return res_dict, err_code, raw_text, elapsed_ms, "GEMINI", cfg.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

    # Otherwise OpenRouter
    res_dict, err_code, raw_text, elapsed_ms = call_openrouter(system_prompt, user_prompt)
    return res_dict, err_code, raw_text, elapsed_ms, "OPENROUTER", cfg.get("OPENROUTER_MODEL", "nex-agi/nex-n2.5-mini:free")


def _save_ai_analysis(complaint_id, analysis_type, model, provider, result_dict, confidence, status, error_code, elapsed_ms) -> AIAnalysis:

    """Helper to persist AI results into ai_analyses table."""
    analysis = AIAnalysis(
        complaint_id=complaint_id,
        analysis_type=analysis_type,
        model=model or "google/gemini-2.0-flash-lite-001",
        provider=provider or "OPENROUTER",
        result_json=json.dumps(result_dict) if result_dict else None,
        confidence=confidence,
        status=status,
        error_code=error_code,
        processing_time_ms=elapsed_ms,
    )
    db.session.add(analysis)
    db.session.commit()
    return analysis


def analyze_complaint(complaint_id: int) -> dict:
    """Analyze a single complaint for summary, category verification, and priority suggestion."""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return {"error": "Complaint not found"}

    cfg = current_app.config if current_app else {}
    ai_enabled = cfg.get("AI_ENABLED", True)
    sim_mode = cfg.get("AI_SIMULATION_MODE", False)

    description = sanitize_input_text(complaint.description or "")
    user_category = complaint.category or "OTHER"
    bus_number = complaint.bus.bus_number if complaint.bus else "N/A"
    route_str = f"{complaint.route.source} → {complaint.route.destination}" if complaint.route else "N/A"

    user_prompt = f"""Target Complaint Details:
Reference Number: {complaint.reference_number}
Selected Category: {user_category}
Bus Number: {bus_number}
Route: {route_str}
Description: {description}
"""

    if not ai_enabled or sim_mode:
        fallback_res = fallback_complaint_analysis(description, user_category)
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="COMPLAINT_ANALYSIS",
            model="rule-fallback",
            provider="RULE_FALLBACK",
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="COMPLETED",
            error_code="AI_DISABLED",
            elapsed_ms=5,
        )
        return fallback_res

    # Call Gemini (or OpenRouter) API via unified dispatcher
    res_dict, err_code, raw_text, elapsed_ms, provider_used, model_used = _dispatch_ai_call(
        system_prompt=COMPLAINT_ANALYSIS_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_complaint_analysis(description, user_category)
        fallback_res["error_notice"] = f"AI Service notice ({err_code}). Core processing unaffected."
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="COMPLAINT_ANALYSIS",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code=err_code,
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated = validate_analysis_result(res_dict, user_category)
    if not validated:
        fallback_res = fallback_complaint_analysis(description, user_category)
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="COMPLAINT_ANALYSIS",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code="MALFORMED_SCHEMA",
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated["provider"] = provider_used
    _save_ai_analysis(
        complaint_id=complaint.id,
        analysis_type="COMPLAINT_ANALYSIS",
        model=model_used,
        provider=provider_used,
        result_dict=validated,
        confidence=validated.get("confidence"),
        status="COMPLETED",
        error_code=None,
        elapsed_ms=elapsed_ms,
    )
    return validated



def detect_duplicates_for_complaint(complaint_id: int) -> dict:
    """Find potential duplicate complaints for a target complaint."""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return {"error": "Complaint not found"}

    cfg = current_app.config if current_app else {}
    ai_enabled = cfg.get("AI_ENABLED", True)

    # 1. Fetch candidate recent complaints (same bus OR same depot OR same category)
    candidates_query = Complaint.query.filter(Complaint.id != complaint.id)
    if complaint.bus_id:
        candidates_query = candidates_query.filter(
            (Complaint.bus_id == complaint.bus_id) | (Complaint.depot_id == complaint.depot_id)
        )
    elif complaint.depot_id:
        candidates_query = candidates_query.filter(Complaint.depot_id == complaint.depot_id)

    candidates_list = candidates_query.order_by(Complaint.created_at.desc()).limit(5).all()

    target_dict = {
        "reference_number": complaint.reference_number,
        "bus_number": complaint.bus.bus_number if complaint.bus else "",
        "category": complaint.category,
        "description": complaint.description,
        "route": f"{complaint.route.source} -> {complaint.route.destination}" if complaint.route else "",
        "reported_at": complaint.created_at.isoformat() if complaint.created_at else "",
    }

    candidates_payload = []
    for c in candidates_list:
        candidates_payload.append({
            "reference_number": c.reference_number,
            "bus_number": c.bus.bus_number if c.bus else "",
            "category": c.category,
            "description": c.description,
            "route": f"{c.route.source} -> {c.route.destination}" if c.route else "",
            "reported_at": c.created_at.isoformat() if c.created_at else "",
        })

    if not candidates_payload:
        empty_res = {
            "possible_duplicate": False,
            "confidence": 0.0,
            "related_complaint_ids": [],
            "reason": "No recent complaints found for candidate matching.",
            "recommended_action": "IGNORE",
            "provider": "RULE_FALLBACK",
        }
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="DUPLICATE_DETECTION",
            model="rule-fallback",
            provider="RULE_FALLBACK",
            result_dict=empty_res,
            confidence=0.0,
            status="COMPLETED",
            error_code=None,
            elapsed_ms=2,
        )
        return empty_res

    if not ai_enabled:
        fallback_res = fallback_duplicate_detection(target_dict, candidates_payload)
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="DUPLICATE_DETECTION",
            model="rule-fallback",
            provider="RULE_FALLBACK",
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="COMPLETED",
            error_code="AI_DISABLED",
            elapsed_ms=5,
        )
        return fallback_res

    user_prompt = f"""Target Complaint:
{json.dumps(target_dict, indent=2)}

Candidate Recent Complaints:
{json.dumps(candidates_payload, indent=2)}
"""

    res_dict, err_code, raw_text, elapsed_ms, provider_used, model_used = _dispatch_ai_call(
        system_prompt=DUPLICATE_DETECTION_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_duplicate_detection(target_dict, candidates_payload)
        fallback_res["error_notice"] = f"AI Service notice ({err_code}). Used rule fallback."
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="DUPLICATE_DETECTION",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code=err_code,
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated = validate_duplicate_result(res_dict)
    if not validated:
        fallback_res = fallback_duplicate_detection(target_dict, candidates_payload)
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="DUPLICATE_DETECTION",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code="MALFORMED_SCHEMA",
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated["provider"] = provider_used
    _save_ai_analysis(
        complaint_id=complaint.id,
        analysis_type="DUPLICATE_DETECTION",
        model=model_used,
        provider=provider_used,
        result_dict=validated,
        confidence=validated.get("confidence"),
        status="COMPLETED",
        error_code=None,
        elapsed_ms=elapsed_ms,
    )
    return validated



def detect_anomalies_for_user(time_window_minutes: int = 15) -> dict:
    """Analyze submission pattern frequencies for anomaly risk assessment."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
    recent_count = Complaint.query.filter(Complaint.created_at >= cutoff).count()

    cfg = current_app.config if current_app else {}
    ai_enabled = cfg.get("AI_ENABLED", True)

    if not ai_enabled:
        return fallback_anomaly_detection(recent_count, time_window_minutes)

    user_prompt = f"""Submissions in past {time_window_minutes} minutes: {recent_count}
Normal baseline rate: 1-3 complaints per 15 minutes.
Total complaints in database: {Complaint.query.count()}
"""

    res_dict, err_code, raw_text, elapsed_ms, provider_used, model_used = _dispatch_ai_call(
        system_prompt=ANOMALY_DETECTION_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_anomaly_detection(recent_count, time_window_minutes)
        _save_ai_analysis(
            complaint_id=None,
            analysis_type="ANOMALY_DETECTION",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=0.8,
            status="FAILED",
            error_code=err_code,
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated = validate_anomaly_result(res_dict)
    if not validated:
        validated = fallback_anomaly_detection(recent_count, time_window_minutes)

    validated["provider"] = provider_used
    validated["recent_count_in_window"] = recent_count

    _save_ai_analysis(
        complaint_id=None,
        analysis_type="ANOMALY_DETECTION",
        model=model_used,
        provider=provider_used,
        result_dict=validated,
        confidence=0.9,
        status="COMPLETED",
        error_code=None,
        elapsed_ms=elapsed_ms,
    )
    return validated


def detect_network_trends() -> dict:
    """Generate state-wide executive transit trends for Admin dashboard."""
    depots = Depot.query.all()
    depot_summary = []
    for d in depots:
        total = Complaint.query.filter_by(depot_id=d.id).count()
        unresolved = Complaint.query.filter(
            Complaint.depot_id == d.id, Complaint.status != "RESOLVED"
        ).count()
        depot_summary.append({
            "name": d.name,
            "total_complaints": total,
            "unresolved": unresolved,
        })

    cfg = current_app.config if current_app else {}
    ai_enabled = cfg.get("AI_ENABLED", True)

    if not ai_enabled:
        return fallback_trend_analysis(depot_summary)

    user_prompt = f"""Kerala Depots Complaint Data Overview:
{json.dumps(depot_summary, indent=2)}

Total State Complaints: {Complaint.query.count()}
Total Unresolved Complaints: {Complaint.query.filter(Complaint.status != 'RESOLVED').count()}
"""

    res_dict, err_code, raw_text, elapsed_ms, provider_used, model_used = _dispatch_ai_call(
        system_prompt=TREND_ANALYSIS_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_trend_analysis(depot_summary)
        _save_ai_analysis(
            complaint_id=None,
            analysis_type="TREND_ANALYSIS",
            model=model_used,
            provider=provider_used,
            result_dict=fallback_res,
            confidence=0.8,
            status="FAILED",
            error_code=err_code,
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated = validate_trend_result(res_dict)
    if not validated:
        validated = fallback_trend_analysis(depot_summary)

    validated["provider"] = provider_used
    _save_ai_analysis(
        complaint_id=None,
        analysis_type="TREND_ANALYSIS",
        model=model_used,
        provider=provider_used,
        result_dict=validated,
        confidence=0.92,
        status="COMPLETED",
        error_code=None,
        elapsed_ms=elapsed_ms,
    )
    return validated



def get_latest_ai_analysis(complaint_id: int, analysis_type: str = None) -> dict | None:
    """Retrieve the latest stored AI analysis for a complaint."""
    query = AIAnalysis.query.filter_by(complaint_id=complaint_id)
    if analysis_type:
        query = query.filter_by(analysis_type=analysis_type)

    latest = query.order_by(AIAnalysis.created_at.desc()).first()
    return latest.to_dict() if latest else None


def scan_ticket_data(ticket_text: str = "", image_b64: str = None, mime_type: str = "image/jpeg") -> dict:
    """Scan and parse bus ticket text or raw image into structured journey parameters.

    Extracts: bus_number, route_from, route_to, incident_time, travel_date, ticket_number, fare, service_type.
    Uses Google Gemini Vision when image_b64 is supplied.
    """
    cfg = current_app.config if current_app else {}
    ai_enabled = cfg.get("AI_ENABLED", True)

    clean_text = sanitize_input_text(ticket_text or "")
    if not clean_text and not image_b64:
        return fallback_ticket_scan("")

    # If AI is disabled, immediately use the deterministic regex/depot fallback
    if not ai_enabled:
        return fallback_ticket_scan(clean_text)

    if image_b64 and clean_text:
        user_prompt = f"""KSRTC Passenger Ticket Image with OCR assistance:
-----------------------------
OCR Hints: {clean_text}
-----------------------------
Carefully analyze the ticket photo and text. Extract all journey parameters into JSON matching the schema."""
    elif image_b64:
        user_prompt = "KSRTC Passenger Bus Ticket Image. Analyze the ticket photo and extract all journey parameters into JSON matching the schema."
    else:
        user_prompt = f"""KSRTC Passenger Ticket Details:
-----------------------------
{clean_text}
-----------------------------
Analyze and extract all journey parameters into JSON matching the schema."""

    res_dict, err_code, raw_text, elapsed_ms, provider_used, model_used = _dispatch_ai_call(
        system_prompt=TICKET_SCANNER_SYSTEM,
        user_prompt=user_prompt,
        image_b64=image_b64,
        mime_type=mime_type,
    )

    fallback_res = fallback_ticket_scan(clean_text)

    if err_code or not res_dict:
        fallback_res["error_notice"] = f"AI Service notice ({err_code}). Rule fallback applied."
        return fallback_res

    validated = validate_ticket_scan_result(res_dict)
    if not validated:
        return fallback_res

    # Enhance: If AI missed any core parameter that rule-based fallback detected, merge it
    if not validated.get("bus_number") and fallback_res.get("bus_number"):
        validated["bus_number"] = fallback_res["bus_number"]
    if not validated.get("route_from") and fallback_res.get("route_from"):
        validated["route_from"] = fallback_res["route_from"]
    if not validated.get("route_to") and fallback_res.get("route_to"):
        validated["route_to"] = fallback_res["route_to"]
    if not validated.get("incident_time") and fallback_res.get("incident_time"):
        validated["incident_time"] = fallback_res["incident_time"]
    if not validated.get("ticket_number") and fallback_res.get("ticket_number"):
        validated["ticket_number"] = fallback_res["ticket_number"]
    if not validated.get("service_type") and fallback_res.get("service_type"):
        validated["service_type"] = fallback_res["service_type"]
    if validated.get("fare") is None and fallback_res.get("fare") is not None:
        validated["fare"] = fallback_res["fare"]

    validated["provider"] = provider_used
    return validated


def simulate_ai_scenario(scenario: str) -> dict:
    """Execute or simulate AI Lab edge-case scenarios using live Gemini inference with fallback."""
    cfg = current_app.config if current_app else {}

    if scenario == "duplicate_complaint":
        user_prompt = """Target Complaint:
Reference: GRV-2026-000118
Bus: KL-15-A-4021
Route: Aluva to Ernakulam
Category: OVERCROWDING
Description: "The bus KL-15-A-4021 at 6:15 PM was dangerously crowded, people were hanging from the door and conductor didn't stop them."

Candidate Complaints:
1. Reference: GRV-2026-000117
Bus: KL-15-A-4021
Route: Aluva -> Ernakulam
Category: OVERCROWDING
Description: "Extreme overcrowding on Aluva Ernakulam bus 4021 around 6:20 PM today. Footboard passengers hanging outside."
"""
        res_dict, err_code, raw_text, elapsed_ms, provider, model = _dispatch_ai_call(
            system_prompt=DUPLICATE_DETECTION_SYSTEM,
            user_prompt=user_prompt
        )
        ai_res = validate_duplicate_result(res_dict) if res_dict else None
        if not ai_res:
            ai_res = {
                "possible_duplicate": True,
                "confidence": 0.94,
                "related_complaint_ids": ["GRV-2026-000117"],
                "reason": "Similar description and matching bus/route within 5-8 minutes window.",
                "recommended_action": "REVIEW",
            }
        ai_res["provider"] = provider
        ai_res["model"] = model
        ai_res["latency_ms"] = elapsed_ms
        return {
            "scenario": "Duplicate Complaint Detection",
            "signals": ["Same bus KL-15-A-4021", "Same route Aluva -> Ernakulam", "Same category Overcrowding", "Timestamp within 8 mins"],
            "core_system": "Both complaints remain stored safely in database. Zero automatic deletion.",
            "ai_result": ai_res,
            "ui_action": "Depot Head receives Advisory Alert with [View Related] and [Not a Duplicate] options.",
        }

    elif scenario == "category_mismatch":
        user_prompt = """Target Complaint Details:
Reference Number: GRV-2026-000119
Selected Category: CLEANLINESS
Bus Number: KL-15-A-4021
Route: Aluva → Ernakulam
Description: "The bus was extremely overcrowded during evening peak hours. Passengers were hanging from both footboards, people were pushing, and it was completely impossible to move or breathe. Conductor was unable to issue tickets because of heavy crowd."
"""
        res_dict, err_code, raw_text, elapsed_ms, provider, model = _dispatch_ai_call(
            system_prompt=COMPLAINT_ANALYSIS_SYSTEM,
            user_prompt=user_prompt
        )
        ai_res = validate_analysis_result(res_dict) if res_dict else None
        if not ai_res:
            ai_res = {
                "suggested_category": "OVERCROWDING",
                "category_mismatch": True,
                "user_category": "CLEANLINESS",
                "suggested_priority": "HIGH",
                "summary": "Passenger reports severe overcrowding during evening peak hours despite selecting Cleanliness.",
                "confidence": 0.95,
            }
        else:
            ai_res["user_category"] = "CLEANLINESS"
            if ai_res.get("suggested_category") != "CLEANLINESS":
                ai_res["category_mismatch"] = True
        ai_res["provider"] = provider
        ai_res["model"] = model
        ai_res["latency_ms"] = elapsed_ms
        return {
            "scenario": "Category Mismatch Detection",
            "passenger_selected_category": "CLEANLINESS",
            "ai_suggested_category": ai_res.get("suggested_category", "OVERCROWDING"),
            "ai_result": ai_res,
            "core_system": "Passenger category preserved as CLEANLINESS. AI does not override user selection.",
            "ui_action": f"Depot Head sees warning badge: ⚠ Category Mismatch Detected (AI suggests {ai_res.get('suggested_category', 'OVERCROWDING')}).",
        }

    elif scenario == "suspicious_activity":
        user_prompt = """Analyze recent submission patterns:
- Total complaints: 30
- Time window: 10 minutes
- Target Bus: KL-01-BK-5522
- Source IP Subnet: 192.168.1.x
- Description pattern: Templated repeated text submitted rapidly across multiple user sessions.
"""
        res_dict, err_code, raw_text, elapsed_ms, provider, model = _dispatch_ai_call(
            system_prompt=ANOMALY_DETECTION_SYSTEM,
            user_prompt=user_prompt
        )
        ai_res = validate_anomaly_result(res_dict) if res_dict else None
        if not ai_res:
            ai_res = {
                "anomaly": True,
                "risk_level": "HIGH",
                "reason": "Unusually high submission frequency (30 in 10 mins) with repeated text structures.",
                "recommended_action": "ADMIN_REVIEW",
            }
        ai_res["provider"] = provider
        ai_res["model"] = model
        ai_res["latency_ms"] = elapsed_ms
        return {
            "scenario": "High-Frequency Submission Anomaly",
            "simulation_metrics": {"submission_count": 30, "time_window": "10 minutes", "ip_subnet": "192.168.1.x"},
            "deterministic_rule": "Rate limit exceeded (30 submissions / 10 mins).",
            "ai_result": ai_res,
            "core_system": "Authentication & Database protected by rate limiter.",
            "ui_action": "Admin Dashboard displays: 'Unusual complaint activity detected (High Frequency)'",
        }

    elif scenario == "trend_detection":
        user_prompt = """Aggregated KSRTC Grievance Data across major depots over the past 7 days:
- Aluva Depot: 42 complaints (28 Overcrowding on Aluva-Ernakulam corridor between 17:00-19:30, 8 Missed Stop, 6 Cleanliness)
- Trivandrum Central: 22 complaints (12 Concession Denial, 6 Cleanliness, 4 Driver Speed)
- Kozhikode Depot: 18 complaints (10 Ticketing/UPI payment failures, 8 Cleanliness)
- Kannur Depot: 14 complaints (8 Missed Stop, 6 Cleanliness)

Generate statewide transit trend analysis with emerging issues and actionable recommendations."""
        res_dict, err_code, raw_text, elapsed_ms, provider, model = _dispatch_ai_call(
            system_prompt=TREND_ANALYSIS_SYSTEM,
            user_prompt=user_prompt
        )
        ai_res = validate_trend_result(res_dict) if res_dict else None
        if not ai_res:
            ai_res = {
                "emerging_issues": [
                    {
                        "title": "Evening Peak-Hour Corridor Congestion",
                        "depot_or_route": "Aluva -> Ernakulam corridor",
                        "category": "OVERCROWDING",
                        "affected_count": 28,
                        "description": "High concentration of overcrowding grievances on Aluva-Ernakulam route between 17:00 and 19:30.",
                        "recommendations": [
                            "Deploy 2 additional fast passenger buses during 17:00-19:30 window.",
                            "Review conductor footboard boarding enforcement at key stops."
                        ]
                    }
                ],
                "system_health_summary": "Transit network operating stably statewide, with isolated peak-hour congestion along the central Aluva-Ernakulam corridor.",
            }
        ai_res["provider"] = provider
        ai_res["model"] = model
        ai_res["latency_ms"] = elapsed_ms
        return {
            "scenario": "Network-Wide Executive Transit Trends",
            "depots_analyzed": ["Aluva Depot", "Ernakulam Depot", "Trivandrum Central", "Kozhikode Depot"],
            "ai_result": ai_res,
            "core_system": "Data aggregated safely from complaint table without altering database records.",
            "ui_action": "State HQ Dashboard displays Executive Trend Advisory Card.",
        }

    elif scenario == "ticket_scanner":
        sample_ticket = "KSRTC TICKET #T-89412\\nFROM: ALUVA TO: THIRUVANANTHAPURAM\\nBUS: KL-15-A-4021\\nDEP: 14:30\\nFARE: Rs. 240\\nCLASS: FAST PASSENGER"
        scan_res = scan_ticket_data(ticket_text=sample_ticket)
        return {
            "scenario": "Automated Ticket / SMS Journey Recognition",
            "sample_input": sample_ticket,
            "extracted_journey": scan_res,
            "core_system": "Auto-populates passenger grievance form and live Leaflet route geometry.",
            "ui_action": "Fills Step 2 fields and updates MiniLocationMap route without manual typing.",
        }

    elif scenario == "failed_logins":
        return {
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
                "advisory": "Account locked automatically. Review security audit logs for distributed IP pattern.",
                "provider": "GEMINI",
            },
            "principle": "AI does NOT control authorization or authentication locks. Core security is 100% deterministic.",
        }

    elif scenario == "expired_token":
        return {
            "scenario": "Expired Conductor Single-Use Action Token",
            "token": "tok_expired_984712",
            "token_status": "EXPIRED (Used at 2026-09-24 04:12:00)",
            "auth_check": "FAILED - HTTP 400 (INVALID_TOKEN)",
            "ui_message": "ACTION LINK EXPIRED: This secure action link is no longer valid. Token has expired or was already used.",
            "principle": "Critical authorization links enforced by cryptographic backend tokens, not AI.",
        }

    elif scenario in ("openrouter_failure", "gemini_failure"):
        return {
            "scenario": "Gemini / OpenRouter API Failure / Timeout Resilience",
            "simulated_error": "AI_API_TIMEOUT (HTTP 504 Gateway Timeout)",
            "ai_status": "UNAVAILABLE",
            "core_system": {
                "complaint_created": True,
                "reference_generated": "GRV-2026-99901",
                "depot_assigned": "Aluva Depot",
                "email_notification_sent": True,
                "status": "SUBMITTED",
            },
            "fallback_applied": "Level 2 Deterministic Rule Engine",
            "ui_notice": "AI analysis temporarily unavailable. Core complaint processing continued normally with 100% success.",
            "resilience_proof": "AI is strictly an advisory supporting layer. Zero system disruption.",
        }

    elif scenario == "malformed_ai_response":
        return {
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
        }

    return {"error": f"Unknown scenario: {scenario}"}



