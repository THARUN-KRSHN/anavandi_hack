"""App Entry Point Wrapper for Render & WSGI Servers.

Enables zero-configuration execution for Render's default 'python app.py' command
and WSGI gunicorn entrypoint (app:app or run:app).
"""

import os
import sys
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")

    print(f"\n=======================================================")
    print(f"  KSRTC Passenger Grievance Backend (Render / Production)")
    print(f"  Running on: http://{host}:{port}")
    print(f"=======================================================\n")

    app.run(host=host, port=port, debug=debug)
