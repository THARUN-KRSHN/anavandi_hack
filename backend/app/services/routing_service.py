"""Routing service — determines depot and estimates location."""

from app.models import Bus, Route, DutyAssignment


def determine_depot(bus_id=None, route_id=None):
    """Determine the responsible depot for a complaint.

    Priority:
    1. Bus → bus.depot_id
    2. Route → route.depot_id
    3. Assignment → assignment.depot_id

    The backend is authoritative — never let the frontend decide the depot.
    """
    # Level 1: Direct from bus
    if bus_id:
        bus = Bus.query.get(int(bus_id))
        if bus and bus.depot_id:
            return bus.depot_id

    # Level 2: Direct from route
    if route_id:
        route = Route.query.get(int(route_id))
        if route and route.depot_id:
            return route.depot_id

    # Level 3: From assignment
    if bus_id and route_id:
        assignment = (
            DutyAssignment.query
            .filter_by(bus_id=int(bus_id), route_id=int(route_id))
            .first()
        )
        if assignment:
            return assignment.depot_id

    return None


def estimate_location(data):
    """Estimate complaint location.

    Level 1: GPS coordinates provided
    Level 2: Route-based estimation
    Level 3: None
    """
    location = {}

    # Level 1: GPS from frontend
    if data.get("location") and isinstance(data["location"], dict):
        lat = data["location"].get("latitude")
        lng = data["location"].get("longitude")
        if lat is not None and lng is not None:
            location["latitude"] = float(lat)
            location["longitude"] = float(lng)
            location["location_source"] = "GPS"
            return location

    # Also accept flat lat/lng
    if data.get("latitude") and data.get("longitude"):
        location["latitude"] = float(data["latitude"])
        location["longitude"] = float(data["longitude"])
        location["location_source"] = "GPS"
        return location

    # Level 2: Route-based (placeholder)
    if data.get("route_id"):
        route = Route.query.get(int(data["route_id"]))
        if route:
            location["location_name"] = f"{route.source} → {route.destination}"
            location["location_source"] = "ROUTE_ESTIMATE"
            return location

    location["location_source"] = "MANUAL"
    return location
