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


def fallback_ticket_scan(ticket_text: str) -> dict:
    """Deterministic rule-based ticket text and SMS parser.

    Extracts bus plate numbers, Kerala stations, timestamps, and ticket IDs.
    """
    import re

    text = ticket_text or ""
    text_clean = text.strip()
    upper = text_clean.upper()

    # 1. Bus registration pattern (e.g. KL-15-A-1234, KL 07 CD 4455, KL15A1234, or ALUVA-BUS-01)
    bus_number = None
    bus_match = re.search(r'\b(KL[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4})\b', upper)
    if bus_match:
        raw_bus = bus_match.group(1)
        m = re.match(r'^(KL)[-\s]?(\d{1,2})[-\s]?([A-Z]{1,3})?[-\s]?(\d{1,4})$', raw_bus)
        if m:
            parts = [m.group(1), m.group(2).zfill(2)]
            if m.group(3):
                parts.append(m.group(3))
            parts.append(m.group(4).zfill(4))
            bus_number = "-".join(parts)
        else:
            bus_number = raw_bus.replace(" ", "-")
    else:
        # Check for simulated bus IDs
        internal_bus = re.search(r'\b([A-Z]{3,12}-BUS-\d{1,2})\b', upper)
        if internal_bus:
            bus_number = internal_bus.group(1)

    # 2. Known Kerala Depot Stations
    KNOWN_DEPOTS = [
        "ALUVA", "ERNAKULAM", "THIRUVANANTHAPURAM", "TRIVANDRUM", "KOZHIKODE",
        "THRISSUR", "KOTTAYAM", "PALAKKAD", "KANNUR", "KOLLAM", "MALAPPURAM",
        "KASARAGOD", "PATHANAMTHITTA", "CHERTHALA", "VYTTILA", "ANKAMALI",
        "ANGAMALY", "CHALAKUDY", "PERUMBAVOOR", "NEDUMBASSERY", "GURUVAYUR",
        "SULTHAN BATHERY", "MUNNAR", "KOTHAMANGALAM", "MUVATTUPUZHA", "PALA",
        "CHANGANASSERY", "KAYAMKULAM", "ADOOR", "ATTINGAL", "NEYYATTINKARA",
        "NEDUMANGAD", "THALASSERY", "VATAKARA", "MANANTHAVADY", "NILAMBUR",
        "TIRUR", "PONNANI", "SHORANUR", "OTTAPPALAM", "ALAPPUZHA", "CHENGANOOR",
        "CHENGANNUR", "IDUKKI", "WAYANAD", "KASARGOD", "THODUPUZHA", "VAIKOM"
    ]

    route_from = None
    route_to = None

    # Try explicit "FROM <Station> TO <Station>"
    from_to_match = re.search(r'(?:FROM|START|ORIGIN)[:\s]+([A-Z\s]+?)(?:TO|DEST|->|—|-|➔)[:\s]+([A-Z\s]+?)(?:\s+(?:VIA|BUS|FARE|TIME|DEP|\n|$))', upper)
    if from_to_match:
        cand_from = from_to_match.group(1).strip()
        cand_to = from_to_match.group(2).strip()
        for d in KNOWN_DEPOTS:
            if d in cand_from and not route_from:
                route_from = d.title()
            if d in cand_to and not route_to:
                route_to = d.title()

    # Try "A -> B" or "A TO B" pattern
    if not (route_from and route_to):
        arrow_match = re.search(r'([A-Z]{3,18})\s*(?:->|—|-|➔|TO)\s*([A-Z]{3,18})', upper)
        if arrow_match:
            c1, c2 = arrow_match.group(1), arrow_match.group(2)
            for d in KNOWN_DEPOTS:
                if d == c1 or d in c1:
                    route_from = d.title()
                if d == c2 or d in c2:
                    route_to = d.title()

    # Search known stations sequentially in text
    if not (route_from and route_to):
        found_depots = []
        for d in KNOWN_DEPOTS:
            pos = upper.find(d)
            if pos != -1:
                found_depots.append((pos, d))
        found_depots.sort(key=lambda x: x[0])
        if len(found_depots) >= 2:
            route_from = found_depots[0][1].title()
            route_to = found_depots[1][1].title()
        elif len(found_depots) == 1:
            route_from = found_depots[0][1].title()

    # Normalize Trivandrum / Thiruvananthapuram
    if route_from == "Trivandrum":
        route_from = "Thiruvananthapuram"
    if route_to == "Trivandrum":
        route_to = "Thiruvananthapuram"
    if route_from == "Angamaly":
        route_from = "Ankamali"
    if route_to == "Angamaly":
        route_to = "Ankamali"

    # 3. Incident / Travel Time
    incident_time = None
    time_match = re.search(r'\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\s*(AM|PM|am|pm)?\b', text)
    if time_match:
        incident_time = time_match.group(0).strip()

    # 4. Travel Date
    travel_date = None
    date_match = re.search(r'\b(202\d[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]202\d)\b', text)
    if date_match:
        travel_date = date_match.group(0).strip()

    # 5. Ticket / PNR Number
    ticket_number = None
    tkt_match = re.search(r'(?:TKT|TICKET|PNR|REC(?:EIPT)?|NO)[.:\s#]*([A-Z0-9\-_]{4,15})\b', upper)
    if tkt_match:
        ticket_number = tkt_match.group(1).strip()

    # 6. Fare Amount
    fare = None
    fare_match = re.search(r'(?:RS\.?|INR|₹|FARE)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)', upper)
    if fare_match:
        try:
            fare = round(float(fare_match.group(1)), 2)
        except (ValueError, TypeError):
            fare = None

    # 7. Service Type
    service_type = None
    for stype in ["SUPER FAST", "FAST PASSENGER", "SUPER EXPRESS", "SUPER DELUXE", "MINNAL", "SWIFT", "GARUDA", "ORDINARY", "LOW FLOOR"]:
        if stype in upper:
            service_type = stype.title()
            break

    # Calculate Confidence
    score = 0.5
    if bus_number:
        score += 0.2
    if route_from and route_to:
        score += 0.2
    elif route_from or route_to:
        score += 0.1
    if incident_time:
        score += 0.1

    confidence = round(min(score, 0.95), 2)

    return {
        "bus_number": bus_number,
        "route_from": route_from,
        "route_to": route_to,
        "incident_time": incident_time,
        "travel_date": travel_date,
        "ticket_number": ticket_number,
        "fare": fare,
        "service_type": service_type,
        "confidence": confidence,
        "raw_matched_text": text_clean[:180] + ("..." if len(text_clean) > 180 else ""),
        "provider": "RULE_FALLBACK",
    }

