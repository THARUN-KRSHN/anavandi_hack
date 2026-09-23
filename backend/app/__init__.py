"""Application factory for the KSRTC Passenger Grievance Backend."""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from app.extensions import db, jwt, scheduler
from app.routes import (
    auth_bp,
    user_bp,
    complaint_bp,
    depot_bp,
    conductor_bp,
    admin_bp,
    notification_bp,
    export_bp,
    bus_bp,
)
from app.services.escalation_service import check_escalations


def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure instance and upload directories exist
    os.makedirs(app.instance_path, exist_ok=True)
    upload_dir = app.config.get("UPLOAD_FOLDER", os.path.join(app.root_path, "..", "uploads"))
    os.makedirs(upload_dir, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(depot_bp)
    app.register_blueprint(conductor_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(bus_bp)

    # Serve uploaded complaint attachments
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "ksrtc-grievance-backend",
            "version": "1.0.0",
        }), 200

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            "success": False,
            "error": {"code": "AUTH_REQUIRED", "message": "Missing or invalid authorization token."}
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_TOKEN", "message": "Signature verification failed or token is malformed."}
        }), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "error": {"code": "TOKEN_EXPIRED", "message": "The token has expired. Please log in again."}
        }), 401

    # Global HTTP error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "The requested resource was not found."}
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": {"code": "METHOD_NOT_ALLOWED", "message": "The HTTP method is not allowed for this URL."}
        }), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "error": {"code": "PAYLOAD_TOO_LARGE", "message": "Uploaded file exceeds maximum allowed size (5MB)."}
        }), 413

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected server error occurred."}
        }), 500

    # Start background scheduler for SLA escalations
    # Avoid duplicate execution when Flask reloader is active
    if not app.testing and (os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug):
        if not scheduler.running:
            interval = app.config.get("SLA_CHECK_INTERVAL", 60)
            scheduler.add_job(
                func=check_escalations,
                args=[app],
                trigger="interval",
                seconds=interval,
                id="escalation_checker",
                replace_existing=True,
            )
            scheduler.start()
            print(f"[SCHEDULER] SLA escalation checker active (every {interval}s).")

    return app
