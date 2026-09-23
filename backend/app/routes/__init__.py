"""Blueprints registration module."""

from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.complaint_routes import complaint_bp
from app.routes.depot_routes import depot_bp
from app.routes.conductor_routes import conductor_bp
from app.routes.admin_routes import admin_bp
from app.routes.notification_routes import notification_bp
from app.routes.export_routes import export_bp
from app.routes.bus_routes import bus_bp

__all__ = [
    "auth_bp",
    "user_bp",
    "complaint_bp",
    "depot_bp",
    "conductor_bp",
    "admin_bp",
    "notification_bp",
    "export_bp",
    "bus_bp",
]
