import argparse
import uvicorn

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the OnionVision AI Inspection Backend")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--reload", action="store_true", default=True, help="Enable live auto-reload")

    args = parser.parse_args()

    print(f"🚀 Starting OnionVision AI Inspection Backend on http://{args.host}:{args.port}")
    print(f"📖 Swagger OpenAPI Documentation: http://localhost:{args.port}/docs")
    print(f"📖 Redoc Documentation: http://localhost:{args.port}/redoc")

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
