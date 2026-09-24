"""OnionVision AI Inspection Backend - Main Application Entrypoint.
Provides direct ASGI `app` export for Uvicorn and Cloud Deployments (e.g. Render.com).
Supports:
    uvicorn main:app --host 0.0.0.0 --port 10000
    uvicorn app.main:app --host 0.0.0.0 --port 10000
"""

import os
import uvicorn
from app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port)
