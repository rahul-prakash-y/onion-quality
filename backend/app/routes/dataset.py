"""API Router for Dataset Pipeline & Extraction.
Provides endpoints for exporting human-verified inspection data from MongoDB
into standard YOLO and COCO datasets for retraining vision models.
Secured with admin security token.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Header,
    Query,
    Response,
    status
)
from fastapi.responses import JSONResponse

from ..config import settings
from ..db.mongodb import MongoInspectionRepository, mongo_manager
from ..services.dataset_export import DatasetExportService

logger = logging.getLogger("onionvision.dataset_routes")

router = APIRouter(
    prefix="/api/v1/dataset",
    tags=["Dataset Pipeline & Training Export"]
)


def verify_admin_token(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(None),
    admin_token: Optional[str] = Query(None, alias="admin_token")
) -> str:
    """Verifies administrator security token.

    Accepts token via:
      1. Header 'X-Admin-Token: <token>'
      2. Header 'Authorization: Bearer <token>'
      3. Query parameter '?admin_token=<token>' (facilitates direct browser downloads)
    """
    provided_token: Optional[str] = None

    if x_admin_token:
        provided_token = x_admin_token.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided_token = authorization[7:].strip()
    elif admin_token:
        provided_token = admin_token.strip()

    expected_token = settings.ADMIN_TOKEN.strip()

    if not provided_token or provided_token != expected_token:
        logger.warning("Unauthorized attempt to access dataset export endpoint.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Unauthorized: Invalid or missing administrator security token. "
                "Please provide token via 'X-Admin-Token' header, 'Authorization: Bearer <token>', "
                "or '?admin_token=' query parameter."
            ),
            headers={"WWW-Authenticate": "Bearer"}
        )

    return provided_token


@router.get(
    "/export",
    summary="Export Human-Verified National Onion Intelligence Dataset",
    description=(
        "Extracts human-verified inspection records where is_human_verified == True "
        "and used_for_training == False from MongoDB. Converts bounding boxes and defect labels "
        "(healthy, damaged, rotten, sprouted, undersized) into standard YOLO format (.txt files + data.yaml) "
        "or COCO JSON. Returns a downloadable .zip archive organized into folders by geographic source "
        "(Maharashtra, Karnataka, etc.). Marks records as used_for_training = True to prevent duplicate training."
    ),
    response_class=Response,
    responses={
        200: {
            "description": "Downloadable ZIP archive containing dataset categorized by geographic source",
            "content": {"application/zip": {}}
        },
        401: {"description": "Invalid or missing admin security token"},
        404: {"description": "No unexported human-verified records found matching criteria"}
    }
)
async def export_dataset(
    format: str = Query(
        "yolo",
        pattern="^(yolo|coco)$",
        description="Dataset annotation format ('yolo' for YOLOv8/v11 txt + data.yaml, 'coco' for COCO JSON)"
    ),
    region: Optional[str] = Query(
        None,
        description="Optional filter by harvest territory (e.g., 'Maharashtra', 'Karnataka')"
    ),
    dry_run: bool = Query(
        False,
        description="If True, generates and downloads the dataset without updating database state (records remain used_for_training=False)"
    ),
    include_previously_exported: bool = Query(
        False,
        description="If True, includes historical verified records that have already been marked as used_for_training"
    ),
    limit: Optional[int] = Query(
        None,
        ge=1,
        le=50000,
        description="Optional maximum count of inspection images to export"
    ),
    token: str = Depends(verify_admin_token)
):
    try:
        zip_bytes, filename, summary = await DatasetExportService.export_dataset(
            format_type=format,
            region=region,
            dry_run=dry_run,
            include_previously_exported=include_previously_exported,
            limit=limit
        )

        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/zip",
            "X-Export-Batch-ID": summary["batch_id"],
            "X-Export-Record-Count": str(summary["record_count"]),
            "X-Export-Total-Annotations": str(summary["total_annotations"]),
            "X-Export-Database-Engine": summary["database_engine"],
            "X-Export-Dry-Run": str(summary["dry_run"])
        }

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers=headers
        )

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.error(f"Unexpected failure during dataset extraction: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset extraction pipeline failed: {str(exc)}"
        )


@router.get(
    "/stats",
    summary="Get Dataset Export Readiness & Provenance Statistics",
    description="Returns aggregate counts of verified inspection records ready for retraining vs already exported."
)
async def get_dataset_stats(
    token: str = Depends(verify_admin_token)
):
    try:
        if await mongo_manager.ping():
            stats = await MongoInspectionRepository.get_dataset_stats()
            stats["database_engine"] = "MongoDB"
            return stats
        else:
            return {
                "database_engine": "SQLite (Fallback)",
                "status": "MongoDB disconnected; fallback SQLite active"
            }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dataset stats: {str(exc)}"
        )


@router.post(
    "/seed",
    summary="Seed Verified Training Samples into MongoDB",
    description="Seeds rich, human-verified inspection records across Indian Mandis (Maharashtra, Karnataka, Gujarat) for testing."
)
async def seed_verified_samples(
    count_per_region: int = Query(3, ge=1, le=20, description="Number of verified samples per region"),
    token: str = Depends(verify_admin_token)
):
    from .seed_helper import seed_mongo_verified_dataset
    try:
        seeded_count = await seed_mongo_verified_dataset(count_per_region=count_per_region)
        return {
            "status": "success",
            "message": f"Successfully seeded {seeded_count} verified records across APMC mandi regions.",
            "count": seeded_count
        }
    except Exception as exc:
        logger.error(f"Seeding failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Seeding failed: {str(exc)}"
        )
