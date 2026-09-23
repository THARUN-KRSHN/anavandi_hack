"""Entry point for the KSRTC Passenger Grievance Backend.

Usage:
    python run.py          # Run the Flask dev server
    python run.py seed     # Reset database and seed complete demo data
    python run.py routes   # List all registered API routes
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app import create_app
from app.seed.seed_all import seed_all

app = create_app()


def list_routes():
    """Print all registered routes and HTTP methods."""
    print("\nRegistered API Routes:")
    print("-" * 75)
    rules = sorted(app.url_map.iter_rules(), key=lambda r: r.rule)
    for rule in rules:
        methods = ",".join(sorted(rule.methods - {"HEAD", "OPTIONS"}))
        if methods:
            print(f"{rule.rule:<45} [{methods}]")
    print("-" * 75 + "\n")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "seed":
            seed_all()
            sys.exit(0)
        elif command == "routes":
            list_routes()
            sys.exit(0)
        else:
            print(f"Unknown command: {command}")
            print("Available commands: seed, routes")
            sys.exit(1)

    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")

    print(f"\n=======================================================")
    print(f"  KSRTC Passenger Grievance Backend Server")
    print(f"  Running on: http://{host}:{port}")
    print(f"  Debug mode: {debug}")
    print(f"=======================================================\n")

    app.run(host=host, port=port, debug=debug)
