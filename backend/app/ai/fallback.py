"""Deterministic Rule-Based Fallback Engine (Level 2 AI Fallback).

Executes when AI is disabled, timed out, unreachable, or returns invalid outputs.
Ensures zero disruption to system operations under any circumstance.
"""

from datetime import datetime, timezone


def fallback_duplicate_detection(target_complaint_dict: dict, candidates: list[dict]) -> dict:
    """Deterministic rule-based duplicate detection."""
    target_bus = (target_complaint_dict.get("bus_number") or "").strip().upper()
    target_cat = (target_complaint_dict.get("category") or "").strip().upper()
    target_ref = target_complaint_dict.get("reference_number") or ""

    matching_ids = []
    reasons = []

    for cand in candidates:
        cand_ref = cand.get("reference_number")
        if not cand_ref or cand_ref == target_ref:
            continue

        cand_bus = (cand.get("bus_number") or "").strip().upper()
        cand_cat = (cand.get("category") or "").strip().upper()

        bus_match = target_bus and cand_bus and target_bus == cand_bus
        cat_match = target_cat and cand_cat and target_cat == cand_cat

        if bus_match and cat_match:
            matching_ids.append(cand_ref)
            reasons.append(f"Same bus ({target_bus}) and issue category ({target_cat})")
        elif bus_match:
            matching_ids.append(cand_ref)
            reasons.append(f"Same bus ({target_bus}) reported recently")

    is_duplicate = len(matching_ids) > 0
    confidence = 0.85 if is_duplicate else 0.0

    return {
        "possible_duplicate": is_duplicate,
        "confidence": confidence,
        "related_complaint_ids": matching_ids[:3],
        "reason": "; ".join(set(reasons)) if is_duplicate else "No rule-based duplicate signals detected.",
        "recommended_action": "REVIEW" if is_duplicate else "IGNORE",
        "provider": "RULE_FALLBACK",
    }


def fallback_complaint_analysis(description: str, user_category: str = None) -> dict:
    """Rule-based category verification and text summarization fallback."""
    desc_lower = (description or "").lower()

    suggested = "OTHER"
    if any(k in desc_lower for k in ["crowd", "overcrowd", "full", "standing", "pushing"]):
        suggested = "OVERCROWDING"
        priority = "HIGH"
    elif any(k in desc_lower for k in ["rash", "speed", "fast", "brake", "accident", "signal", "danger"]):
        suggested = "UNSAFE_DRIVING"
        priority = "URGENT"
    elif any(k in desc_lower for k in ["dirty", "trash", "smell", "clean", "waste", "garbage"]):
        suggested = "CLEANLINESS"
        priority = "MEDIUM"
    elif any(k in desc_lower for k in ["stop", "skip", "passed", "didn't stop", "wait"]):
        suggested = "MISSED_STOP"
        priority = "HIGH"
    elif any(k in desc_lower for k in ["concession", "student", "pass", "ticket", "fare"]):
        suggested = "CONCESSION_DENIAL"
        priority = "MEDIUM"
    else:
        priority = "NORMAL"

    summary = description[:120] + "..." if len(description) > 120 else description

    category_mismatch = False
    if user_category and user_category.upper() != suggested and suggested != "OTHER":
        category_mismatch = True

    return {
        "suggested_category": suggested,
        "category_mismatch": category_mismatch,
        "user_category": user_category,
        "suggested_priority": priority,
        "summary": summary,
        "confidence": 0.75,
        "provider": "RULE_FALLBACK",
    }


def fallback_anomaly_detection(submission_count: int, window_minutes: int = 10) -> dict:
    """Deterministic rate & frequency threshold check for anomalies."""
    is_anomaly = submission_count >= 8
    risk_level = "HIGH" if submission_count >= 15 else ("MEDIUM" if submission_count >= 8 else "LOW")

    return {
        "anomaly": is_anomaly,
        "risk_level": risk_level,
        "reason": f"Frequency threshold rule: {submission_count} submissions within {window_minutes} minutes.",
        "recommended_action": "ADMIN_REVIEW" if is_anomaly else "NONE",
        "provider": "RULE_FALLBACK",
    }


def fallback_trend_analysis(depot_summary_list: list) -> dict:
    """Rule-based aggregate trend generator."""
    issues = []
    for depot in depot_summary_list:
        total = depot.get("total_complaints", 0)
        unresolved = depot.get("unresolved", 0)
        if total > 0 and (unresolved / total) > 0.4:
            issues.append({
                "title": "High Backlog Ratio Alert",
                "depot_or_route": depot.get("name", "Depot"),
                "category": "Backlog Management",
                "affected_count": unresolved,
                "description": f"Potential emerging issue: {depot.get('name')} has {unresolved} unresolved complaints.",
                "recommendations": ["Review peak hour shift allocations", "Reassign available conductor staff"],
            })

    return {
        "emerging_issues": issues[:3],
        "system_health_summary": f"Network active. Analyzed {len(depot_summary_list)} depot nodes.",
        "provider": "RULE_FALLBACK",
    }
