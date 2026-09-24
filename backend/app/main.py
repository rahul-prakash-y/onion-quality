from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routes.inspection import router as inspection_router
from .routes.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload directory is ready
    settings.UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware setup to accept requests from ReactJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(inspection_router)
app.include_router(reports_router)

@app.get(
    "/",
    tags=["System"],
    summary="Root Service Information"
)
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "documentation_url": "/docs",
        "endpoints": {
            "upload_image": "POST /api/v1/inspect/upload",
            "analyze_inspection": "GET /api/v1/inspect/{inspection_id}/analyze",
            "verify_inspection": "POST /api/v1/inspect/{inspection_id}/verify",
            "reports_history": "GET /api/v1/reports/history"
        }
    }

@app.get(
    "/health",
    tags=["System"],
    summary="Health check probe"
)
async def health_check():
    return {
        "status": "healthy",
        "uploads_directory": str(settings.UPLOAD_PATH),
        "uploads_writable": settings.UPLOAD_PATH.is_dir()
    }

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions to return standard JSON structure."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": str(request.url)
        }
    )
