"""Route and RouteStop models — synthetic prototype data."""

from datetime import datetime, timezone
from app.extensions import db


class Route(db.Model):
    __tablename__ = "routes"

    id = db.Column(db.Integer, primary_key=True)
    route_code = db.Column(db.String(30), unique=True, nullable=False)  # R-ADOOR-001
    source = db.Column(db.String(100), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    depot_id = db.Column(db.Integer, db.ForeignKey("depots.id"), nullable=False)
    estimated_duration = db.Column(db.Integer, nullable=True)  # minutes
    status = db.Column(db.String(15), nullable=False, default="ACTIVE")

    # Relationships
    depot = db.relationship("Depot", back_populates="routes")
    stops = db.relationship("RouteStop", back_populates="route", order_by="RouteStop.sequence_number", lazy="select")
    assignments = db.relationship("DutyAssignment", back_populates="route", lazy="dynamic")
    complaints = db.relationship("Complaint", back_populates="route", lazy="dynamic")

    def to_dict(self, include_stops=False):
        data = {
            "id": self.id,
            "route_code": self.route_code,
            "source": self.source,
            "destination": self.destination,
            "depot_id": self.depot_id,
            "estimated_duration": self.estimated_duration,
            "status": self.status,
        }
        if include_stops:
            data["stops"] = [s.to_dict() for s in self.stops]
        return data

    def __repr__(self):
        return f"<Route {self.route_code}: {self.source} → {self.destination}>"


class RouteStop(db.Model):
    __tablename__ = "route_stops"

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=False)
    stop_name = db.Column(db.String(100), nullable=False)
    sequence_number = db.Column(db.Integer, nullable=False)
    estimated_minutes_from_start = db.Column(db.Integer, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # Relationships
    route = db.relationship("Route", back_populates="stops")

    def to_dict(self):
        return {
            "id": self.id,
            "route_id": self.route_id,
            "stop_name": self.stop_name,
            "sequence_number": self.sequence_number,
            "estimated_minutes_from_start": self.estimated_minutes_from_start,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }

    def __repr__(self):
        return f"<RouteStop {self.stop_name} (#{self.sequence_number})>"
