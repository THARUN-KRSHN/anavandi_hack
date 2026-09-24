"""Business-level AI Service — BUS സഹായി.

Orchestrates OpenRouter client, prompts, schemas, fallbacks, and DB persistence (AIAnalysis).
"""

from datetime import datetime, timezone, timedelta
import json
from flask import current_app
from app.extensions import db
from app.models import Complaint, AIAnalysis, ActivityLog, Depot
from app.ai.openrouter_client import call_openrouter
from app.ai.prompts import (
    DUPLICATE_DETECTION_SYSTEM,
    COMPLAINT_ANALYSIS_SYSTEM,
    ANOMALY_DETECTION_SYSTEM,
    TREND_ANALYSIS_SYSTEM,
)
from app.ai.schemas import (
    validate_duplicate_result,
    validate_analysis_result,
    validate_anomaly_result,
    validate_trend_result,
)
from app.ai.fallback import (
    fallback_duplicate_detection,
    fallback_complaint_analysis,
    fallback_anomaly_detection,
    fallback_trend_analysis,
)
from app.ai.safeguards import sanitize_input_text


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

    # Call OpenRouter API
    res_dict, err_code, raw_text, elapsed_ms = call_openrouter(
        system_prompt=COMPLAINT_ANALYSIS_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_complaint_analysis(description, user_category)
        fallback_res["error_notice"] = f"AI Service error ({err_code}). Core processing unaffected."
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="COMPLAINT_ANALYSIS",
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
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
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code="MALFORMED_SCHEMA",
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated["provider"] = "OPENROUTER"
    _save_ai_analysis(
        complaint_id=complaint.id,
        analysis_type="COMPLAINT_ANALYSIS",
        model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
        provider="OPENROUTER",
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

    res_dict, err_code, raw_text, elapsed_ms = call_openrouter(
        system_prompt=DUPLICATE_DETECTION_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_duplicate_detection(target_dict, candidates_payload)
        fallback_res["error_notice"] = f"AI Service notice ({err_code}). Used rule fallback."
        _save_ai_analysis(
            complaint_id=complaint.id,
            analysis_type="DUPLICATE_DETECTION",
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
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
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
            result_dict=fallback_res,
            confidence=fallback_res.get("confidence"),
            status="FAILED",
            error_code="MALFORMED_SCHEMA",
            elapsed_ms=elapsed_ms,
        )
        return fallback_res

    validated["provider"] = "OPENROUTER"
    _save_ai_analysis(
        complaint_id=complaint.id,
        analysis_type="DUPLICATE_DETECTION",
        model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
        provider="OPENROUTER",
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

    res_dict, err_code, raw_text, elapsed_ms = call_openrouter(
        system_prompt=ANOMALY_DETECTION_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_anomaly_detection(recent_count, time_window_minutes)
        _save_ai_analysis(
            complaint_id=None,
            analysis_type="ANOMALY_DETECTION",
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
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

    validated["provider"] = "OPENROUTER"
    validated["recent_count_in_window"] = recent_count

    _save_ai_analysis(
        complaint_id=None,
        analysis_type="ANOMALY_DETECTION",
        model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
        provider="OPENROUTER",
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

    res_dict, err_code, raw_text, elapsed_ms = call_openrouter(
        system_prompt=TREND_ANALYSIS_SYSTEM,
        user_prompt=user_prompt,
    )

    if err_code or not res_dict:
        fallback_res = fallback_trend_analysis(depot_summary)
        _save_ai_analysis(
            complaint_id=None,
            analysis_type="TREND_ANALYSIS",
            model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
            provider="OPENROUTER",
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

    validated["provider"] = "OPENROUTER"
    _save_ai_analysis(
        complaint_id=None,
        analysis_type="TREND_ANALYSIS",
        model=cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001"),
        provider="OPENROUTER",
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
