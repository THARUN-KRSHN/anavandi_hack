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


