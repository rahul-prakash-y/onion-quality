import hashlib
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
    Depends,
    status
)
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..db import get_async_db, InspectionRepository
from ..models.schemas import (
    UploadResponse,
    AnalysisResponse,
    VerificationRequest,
    VerificationResponse,
    HumanVerificationRecord,
    DefectCounts,
    QualitySummary
)
from ..services.ai_engine import AIGradingEngine
from ..services.storage import inspection_storage

router = APIRouter(
    prefix="/api/v1/inspect",
    tags=["Inspection & AI Grading"]
)

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload inspection image",
    description="Accepts a multipart form data image upload. Saves the image temporarily to a local /uploads directory and returns a unique inspection_id."
)
async def upload_inspection_image(
    file: UploadFile = File(..., description="Multipart image file (JPEG, PNG, WebP)"),
    batch_id: Optional[str] = Form(None, description="Optional batch / lot tracking identifier"),
    region: Optional[str] = Form("Maharashtra", description="Geographic origin state"),
    variety: Optional[str] = Form("Bhima Super (Nashik Red)", description="Cultivar variety"),
    farmer_name: Optional[str] = Form(None, description="Farmer name associated with lot"),
    preset_hint: Optional[str] = Form(None, description="Optional defect preset hint for demo/testing"),
    db: AsyncSession = Depends(get_async_db)
):
    # Validate content type
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_IMAGE_TYPES and not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {settings.ALLOWED_IMAGE_TYPES}"
        )

    # Generate a unique, safe local filename
    orig_ext = Path(file.filename).suffix if file.filename else ".jpg"
    if not orig_ext:
        orig_ext = ".jpg"
    unique_filename = f"onion_{uuid.uuid4().hex[:10]}_{int(datetime.now().timestamp())}{orig_ext}"
    target_path = settings.UPLOAD_PATH / unique_filename

    # Save image to local uploads directory
    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {str(exc)}"
        )
    finally:
        await file.close()

    file_size = target_path.stat().st_size
    if file_size == 0:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # Initialize inspection transaction in storage
    metadata = {
        "batch_id": batch_id,
        "region": region,
        "variety": variety,
        "farmer_name": farmer_name,
        "preset_hint": preset_hint,
        "original_filename": file.filename
    }

    record = inspection_storage.create_inspection(
        filename=unique_filename,
        file_path=target_path,
        file_size=file_size,
        metadata=metadata
    )

    # Persist in National Onion Intelligence Dataset database
    await InspectionRepository.create_inspection(
        db=db,
        inspection_id=record.inspection_id,
        original_image_path=str(target_path),
        geographic_source=region or "Maharashtra",
        metadata=metadata
    )

    return UploadResponse(
        inspection_id=record.inspection_id,
        filename=record.filename,
        file_size_bytes=record.file_size_bytes,
        image_url=record.image_url,
        upload_timestamp=record.upload_timestamp,
        status=record.status,
        message="Image successfully uploaded and queued for AI analysis"
    )

@router.get(
    "/{inspection_id}/analyze",
    response_model=AnalysisResponse,
    summary="Trigger mock AI quality analysis",
    description="Trigger the mock AI analysis for a given ID. Return a JSON payload containing: total onions detected, counts for (healthy, damaged, rotten, sprouted, undersized), and calculated percentages for Grade A and URS (Under Rejection Standard)."
)
async def analyze_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    record = inspection_storage.get_inspection(inspection_id)
    if not record:
        # Check database as fallback
        db_record = await InspectionRepository.get_by_inspection_id(db, inspection_id)
        if not db_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspection with ID '{inspection_id}' not found. Please upload an image first."
            )

    # Check if analysis has already been performed
    if record and record.analysis:
        return record.analysis

    preset_hint = record.metadata.get("preset_hint") if record else None
    image_path = str(record.file_path) if record else db_record.original_image_path
    analysis = AIGradingEngine.analyze(
        inspection_id=inspection_id,
        image_path=image_path,
        preset_hint=preset_hint
    )

    # Store analysis in in-memory storage
    if record:
        inspection_storage.set_inspection_analysis(inspection_id, analysis)

    # Persist AI predictions in database
    await InspectionRepository.update_ai_predictions(
        db=db,
        inspection_id=inspection_id,
        ai_predictions=analysis.model_dump(),
        verdict=analysis.verdict
    )

    return analysis

@router.post(
    "/{inspection_id}/verify",
    response_model=VerificationResponse,
    summary="Submit human-in-the-loop verification corrections",
    description="Accept a JSON payload containing human-verified corrections to the AI's prediction (simulating the human-in-the-loop continuous learning)."
)
async def verify_inspection(
    inspection_id: str,
    payload: VerificationRequest,
    db: AsyncSession = Depends(get_async_db)
):
    record = inspection_storage.get_inspection(inspection_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection with ID '{inspection_id}' not found."
        )

    # Ensure AI analysis is run before verification
    if not record.analysis:
        analysis = AIGradingEngine.analyze(
            inspection_id=inspection_id,
            image_path=str(record.file_path),
            preset_hint=record.metadata.get("preset_hint")
        )
        inspection_storage.set_inspection_analysis(inspection_id, analysis)
        record = inspection_storage.get_inspection(inspection_id)

    ai_counts = record.analysis.counts
    now_iso = datetime.now(timezone.utc).isoformat()

    # Determine corrected or confirmed defect counts
    if payload.corrected_counts:
        verified_counts = DefectCounts(
            healthy=payload.corrected_counts.healthy if payload.corrected_counts.healthy is not None else ai_counts.healthy,
            damaged=payload.corrected_counts.damaged if payload.corrected_counts.damaged is not None else ai_counts.damaged,
            rotten=payload.corrected_counts.rotten if payload.corrected_counts.rotten is not None else ai_counts.rotten,
            sprouted=payload.corrected_counts.sprouted if payload.corrected_counts.sprouted is not None else ai_counts.sprouted,
            undersized=payload.corrected_counts.undersized if payload.corrected_counts.undersized is not None else ai_counts.undersized,
        )
    else:
        verified_counts = ai_counts

    # Calculate learning delta vector
    delta_vector = {
        "healthy_delta": verified_counts.healthy - ai_counts.healthy,
        "damaged_delta": verified_counts.damaged - ai_counts.damaged,
        "rotten_delta": verified_counts.rotten - ai_counts.rotten,
        "sprouted_delta": verified_counts.sprouted - ai_counts.sprouted,
        "undersized_delta": verified_counts.undersized - ai_counts.undersized,
        "has_corrections": (verified_counts != ai_counts)
    }

    # Recalculate summary metrics based on verified counts
    recalculated_summary = AIGradingEngine.recalculate_from_corrected_counts(
        original_summary=QualitySummary(
            total_count=record.analysis.total_onions_detected,
            counts=record.analysis.counts,
            grade_a_percent=record.analysis.grade_a_percent,
            urs_percent=record.analysis.urs_percent,
            grade_b_percent=record.analysis.grade_b_percent,
            avg_diameter_mm=record.analysis.avg_diameter_mm,
            overall_score=record.analysis.overall_score,
            verdict=record.analysis.verdict,
            price_recommendation=record.analysis.price_recommendation
        ),
        corrected_counts=verified_counts,
        override_grade_a_pct=payload.corrected_grade_a_percent,
        override_urs_pct=payload.corrected_urs_percent
    )

    # Human verification audit trail
    verification_record = HumanVerificationRecord(
        status=payload.status,
        verified_at=now_iso,
        inspector_id=payload.inspector_id,
        inspector_name=payload.inspector_name,
        feedback_notes=payload.feedback_notes or "Human inspection completed",
        original_ai_counts=ai_counts,
        verified_counts=verified_counts
    )

    # Cryptographic tamper-proof hash for APMC digital certificate
    hash_payload = (
        f"{inspection_id}|{verified_counts.total}|{recalculated_summary.grade_a_percent}|"
        f"{recalculated_summary.urs_percent}|{now_iso}|{payload.inspector_id}"
    )
    tamper_proof_hash = hashlib.sha256(hash_payload.encode('utf-8')).hexdigest()

    # Commit report into permanent certified ledger
    report = inspection_storage.verify_inspection(
        inspection_id=inspection_id,
        verification_record=verification_record,
        updated_summary=recalculated_summary,
        tamper_proof_hash=tamper_proof_hash
    )

    # Record continuous learning event for model training
    learning_event = {
        "inspection_id": inspection_id,
        "image_file": record.filename,
        "ai_predicted": ai_counts.model_dump(),
        "human_verified": verified_counts.model_dump(),
        "delta": delta_vector,
        "feedback_notes": payload.feedback_notes,
        "inspector_id": payload.inspector_id
    }
    inspection_storage.record_learning_event(learning_event)

    # Persist verification and learning delta in National Onion Intelligence Dataset database
    verified_data_payload = {
        "summary": recalculated_summary.model_dump(),
        "certificate_id": report.certificate_id,
        "verified_counts": verified_counts.model_dump(),
        "verified_at": now_iso,
        "feedback_notes": payload.feedback_notes,
        "inspector_name": payload.inspector_name,
        "tamper_proof_hash": tamper_proof_hash,
        "learning_delta": delta_vector
    }
    await InspectionRepository.verify_inspection(
        db=db,
        inspection_id=inspection_id,
        inspector_id=payload.inspector_id or "INS-APMC-042",
        verified_data=verified_data_payload,
        certificate_id=report.certificate_id,
        verdict=recalculated_summary.verdict
    )

    return VerificationResponse(
        inspection_id=inspection_id,
        certificate_id=report.certificate_id,
        status=payload.status,
        verified_at=now_iso,
        summary=recalculated_summary,
        feedback_notes=payload.feedback_notes,
        learning_delta=delta_vector,
        report=report
    )

@router.get(
    "/{inspection_id}",
    summary="Get full inspection lifecycle details",
    description="Returns the full inspection details including upload metadata, AI predictions, and verification status."
)
async def get_inspection_details(inspection_id: str):
    record = inspection_storage.get_inspection(inspection_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection with ID '{inspection_id}' not found."
        )

    return {
        "inspection_id": record.inspection_id,
        "filename": record.filename,
        "file_size_bytes": record.file_size_bytes,
        "image_url": record.image_url,
        "upload_timestamp": record.upload_timestamp,
        "status": record.status,
        "metadata": record.metadata,
        "analysis": record.analysis,
        "verification": record.verification,
        "report": record.report
    }

@router.get(
    "/images/{filename}",
    summary="Serve uploaded inspection image",
    description="Allows retrieval of the temporarily stored inspection image."
)
async def get_inspection_image(filename: str):
    file_path = settings.UPLOAD_PATH / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found in uploads directory."
        )
    return FileResponse(file_path)
