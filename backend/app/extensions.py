"""Shared Flask extension instances.

Instantiated here to avoid circular imports.
All extensions are initialized in create_app().
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from apscheduler.schedulers.background import BackgroundScheduler

db = SQLAlchemy()
jwt = JWTManager()
scheduler = BackgroundScheduler()
