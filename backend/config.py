"""Flask application configuration."""

import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration."""

    # Flask
    SECRET_KEY = os.getenv("JWT_SECRET", "hackathon-grievance-secret-2026-ksrtc-secure")
    DEBUG = True

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'app.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "hackathon-grievance-secret-2026-ksrtc-secure")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours for hackathon convenience

    # File uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv("UPLOAD_FOLDER", "uploads"))
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
    MAX_IMAGES_PER_COMPLAINT = 3

    # SMS
    SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock")
    SMS_API_KEY = os.getenv("SMS_API_KEY", "")
    SMS_SENDER_ID = os.getenv("SMS_SENDER_ID", "")

    # Base URL for action links
    BASE_URL = os.getenv("BASE_URL", "http://localhost:5000")

    # Escalation SLA (hours per category) — prototype values, not official KSRTC
    SLA_HOURS = {
        "UNSAFE_DRIVING": 1,
        "OVERCROWDING": 2,
        "CLEANLINESS": 4,
        "MISSED_STOP": 4,
        "CONCESSION_DENIAL": 4,
        "OTHER": 6,
    }

    # Scheduler
    SLA_CHECK_INTERVAL = int(os.getenv("SLA_CHECK_INTERVAL", "60"))

    # Depot status thresholds (pending ratio)
    DEPOT_STATUS_THRESHOLDS = {
        "GREEN": 0.20,   # 0–20% pending
        "YELLOW": 0.40,  # 20–40% pending
        # > 40% → RED
    }

    # Conductor action token
    ACTION_TOKEN_EXPIRY_HOURS = 24

    # Data paths
    _csv_in_backend = os.path.join(BASE_DIR, "data", "ksrtc_depots.csv")
    _csv_in_root = os.path.join(BASE_DIR, "..", "data", "ksrtc_depots.csv")
    DEPOT_CSV_PATH = _csv_in_backend if os.path.exists(_csv_in_backend) else _csv_in_root
