"""Models package — import all models so SQLAlchemy discovers them."""

from app.models.user import User
from app.models.depot import Depot
from app.models.bus import Bus
from app.models.route import Route, RouteStop
from app.models.conductor import Conductor
from app.models.assignment import DutyAssignment
from app.models.complaint import Complaint, ComplaintImage, COMPLAINT_CATEGORIES, COMPLAINT_STATUSES
from app.models.complaint_history import ComplaintHistory
from app.models.action_token import ActionToken
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.ai_analysis import AIAnalysis

__all__ = [
    "User",
    "Depot",
    "Bus",
    "Route",
    "RouteStop",
    "Conductor",
    "DutyAssignment",
    "Complaint",
    "ComplaintImage",
    "ComplaintHistory",
    "ActionToken",
    "Notification",
    "ActivityLog",
    "AIAnalysis",
    "COMPLAINT_CATEGORIES",
    "COMPLAINT_STATUSES",
]
