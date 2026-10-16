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


def validate_ticket_scan_result(data: dict) -> dict | None:
    """Validate ticket scanner extraction response structure."""
    if not isinstance(data, dict):
        return None

    import re

    bus_number = data.get("bus_number")
    if bus_number:
        bus_number = str(bus_number).strip().upper()
        # Normalize formats like KL 15 A 1234 or KL15-A-1234 to KL-15-A-1234
        m = re.match(r'^(KL)[-\s]?(\d{1,2})[-\s]?([A-Z]{1,3})?[-\s]?(\d{1,4})$', bus_number)
        if m:
            parts = [m.group(1), m.group(2).zfill(2)]
            if m.group(3):
                parts.append(m.group(3))
            parts.append(m.group(4).zfill(4))
            bus_number = "-".join(parts)

    route_from = data.get("route_from")
    if route_from:
        route_from = str(route_from).strip().title()

    route_to = data.get("route_to")
    if route_to:
        route_to = str(route_to).strip().title()

    incident_time = data.get("incident_time")
    if incident_time:
        incident_time = str(incident_time).strip()

    ticket_number = data.get("ticket_number")
    if ticket_number:
        ticket_number = str(ticket_number).strip().upper()

    fare = None
    if data.get("fare") is not None:
        try:
            fare = round(float(data.get("fare")), 2)
        except (ValueError, TypeError):
            fare = None

    confidence = float(data.get("confidence", 0.8))
    confidence = round(min(max(confidence, 0.0), 1.0), 2)

    return {
        "bus_number": bus_number or None,
        "route_from": route_from or None,
        "route_to": route_to or None,
        "incident_time": incident_time or None,
        "travel_date": str(data.get("travel_date")).strip() if data.get("travel_date") else None,
        "ticket_number": ticket_number or None,
        "fare": fare,
        "service_type": str(data.get("service_type")).strip() if data.get("service_type") else None,
        "confidence": confidence,
        "raw_matched_text": str(data.get("raw_matched_text", "")),
    }

