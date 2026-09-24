"""Schema validators & sanitizers for AI model outputs.

Guarantees predictable JSON outputs before passing data to services or UI.
"""


def validate_duplicate_result(data: dict) -> dict | None:
    """Validate duplicate detection response structure."""
    if not isinstance(data, dict):
        return None

    possible_duplicate = bool(data.get("possible_duplicate", False))
    confidence = float(data.get("confidence", 0.0))
    related_ids = data.get("related_complaint_ids") or data.get("related_complaints") or []
    if not isinstance(related_ids, list):
        related_ids = [str(related_ids)]

    reason = str(data.get("reason", "Potential matching complaint signals detected."))
    recommended_action = str(data.get("recommended_action", "REVIEW"))

    return {
        "possible_duplicate": possible_duplicate,
        "confidence": round(min(max(confidence, 0.0), 1.0), 2),
        "related_complaint_ids": [str(rid) for rid in related_ids],
        "reason": reason,
        "recommended_action": recommended_action,
    }


def validate_analysis_result(data: dict, user_category: str = None) -> dict | None:
    """Validate complaint analysis & summary response structure."""
    if not isinstance(data, dict):
        return None

    suggested_category = str(data.get("suggested_category", "OTHER")).upper()
    suggested_priority = str(data.get("suggested_priority", "NORMAL")).upper()
    summary = str(data.get("summary", "")).strip()
    confidence = float(data.get("confidence", 0.0))

    valid_categories = {"UNSAFE_DRIVING", "OVERCROWDING", "CLEANLINESS", "MISSED_STOP", "CONCESSION_DENIAL", "OTHER"}
    if suggested_category not in valid_categories:
        suggested_category = "OTHER"

    valid_priorities = {"URGENT", "HIGH", "MEDIUM", "NORMAL", "LOW"}
    if suggested_priority not in valid_priorities:
        suggested_priority = "NORMAL"

    category_mismatch = False
    if user_category:
        clean_user_cat = user_category.strip().upper()
        if clean_user_cat in valid_categories and clean_user_cat != suggested_category:
            category_mismatch = True

    return {
        "suggested_category": suggested_category,
        "category_mismatch": category_mismatch,
        "user_category": user_category,
        "suggested_priority": suggested_priority,
        "summary": summary,
        "confidence": round(min(max(confidence, 0.0), 1.0), 2),
        "key_entities": data.get("key_entities", {}),
    }


def validate_anomaly_result(data: dict) -> dict | None:
    """Validate anomaly detection response structure."""
    if not isinstance(data, dict):
        return None

    anomaly = bool(data.get("anomaly", False))
    risk_level = str(data.get("risk_level", "LOW")).upper()
    if risk_level not in {"LOW", "MEDIUM", "HIGH"}:
        risk_level = "LOW"

    reason = str(data.get("reason", "Normal activity pattern."))
    recommended_action = str(data.get("recommended_action", "NONE"))

    return {
        "anomaly": anomaly,
        "risk_level": risk_level,
        "reason": reason,
        "recommended_action": recommended_action,
    }


def validate_trend_result(data: dict) -> dict | None:
    """Validate trend analysis response structure."""
    if not isinstance(data, dict):
        return None

    issues = data.get("emerging_issues", [])
    if not isinstance(issues, list):
        issues = []

    valid_issues = []
    for issue in issues:
        if isinstance(issue, dict):
            valid_issues.append({
                "title": str(issue.get("title", "Emerging Trend")),
                "depot_or_route": str(issue.get("depot_or_route", "Network-wide")),
                "category": str(issue.get("category", "General")),
                "affected_count": int(issue.get("affected_count", 0)),
                "description": str(issue.get("description", "")),
                "recommendations": issue.get("recommendations", []) if isinstance(issue.get("recommendations"), list) else [],
            })

    return {
        "emerging_issues": valid_issues,
        "system_health_summary": str(data.get("system_health_summary", "System operations running normally.")),
    }
