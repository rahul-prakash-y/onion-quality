"""Unit and integration tests for the National Onion Intelligence Dataset database layer."""

import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import (
    async_engine,
    AsyncSessionLocal,
    init_db,
    InspectionRecordModel,
    InspectionRepository
)
from app.models.schemas import (
    DefectCounts,
    DigitalCertificateReport,
    QualitySummary
)

@pytest.fixture(scope="module", autouse=True)
async def setup_database():
    """Ensure database schema is created prior to test execution."""
    await init_db()
    yield

@pytest.fixture
async def db_session():
    """Provides a transactional database session for tests."""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.mark.anyio
async def test_create_and_get_inspection(db_session: AsyncSession):
    """Test creating an InspectionRecord with all required fields."""
    test_id = f"insp_test_{int(datetime.now().timestamp())}"
    image_path = "/uploads/test_onion.jpg"
    source = "Maharashtra"

    record = await InspectionRepository.create_inspection(
        db=db_session,
        inspection_id=test_id,
        original_image_path=image_path,
        geographic_source=source,
        metadata={"batch_id": "BATCH-MH-TEST-1", "farmer_name": "Rameshwar Patil"}
    )
    await db_session.commit()

    assert record.id is not None
    assert record.inspection_id == test_id
    assert record.geographic_source == source
    assert record.original_image_path == image_path
    assert record.is_human_verified is False
    assert record.ai_predictions is None
    assert record.verified_data is None

    # Fetch by inspection_id
    fetched = await InspectionRepository.get_by_inspection_id(db_session, test_id)
    assert fetched is not None
    assert fetched.inspection_id == test_id
    assert fetched.farmer_name == "Rameshwar Patil"

@pytest.mark.anyio
async def test_update_ai_predictions(db_session: AsyncSession):
    """Test saving AI vision predictions (counts, percentages, verdict)."""
    test_id = f"insp_ai_{int(datetime.now().timestamp())}"
    await InspectionRepository.create_inspection(
        db=db_session,
        inspection_id=test_id,
        original_image_path="/uploads/ai_test.jpg",
        geographic_source="Karnataka"
    )

    ai_payload = {
        "counts": {
            "healthy": 7,
            "damaged": 1,
            "rotten": 0,
            "sprouted": 1,
            "undersized": 1
        },
        "grade_a_percent": 70.0,
        "urs_percent": 10.0,
        "grade_b_percent": 20.0,
        "overall_score": 85,
        "verdict": "APPROVED_GRADE_A"
    }

    updated = await InspectionRepository.update_ai_predictions(
        db=db_session,
        inspection_id=test_id,
        ai_predictions=ai_payload,
        verdict="APPROVED_GRADE_A"
    )
    await db_session.commit()

    assert updated is not None
    assert updated.ai_predictions["counts"]["healthy"] == 7
    assert updated.ai_predictions["grade_a_percent"] == 70.0
    assert updated.verdict == "APPROVED_GRADE_A"

@pytest.mark.anyio
async def test_verify_inspection(db_session: AsyncSession):
    """Test updating an inspection record with human verification data."""
    test_id = f"insp_verify_{int(datetime.now().timestamp())}"
    await InspectionRepository.create_inspection(
        db=db_session,
        inspection_id=test_id,
        original_image_path="/uploads/verify_test.jpg",
        geographic_source="Maharashtra"
    )

    inspector_id = "INS-MH-042"
    cert_id = f"OV-2026-MH-{test_id[-6:].upper()}"
    verified_payload = {
        "certificate_id": cert_id,
        "status": "approved",
        "verified_counts": {
            "healthy": 8,
            "damaged": 1,
            "rotten": 0,
            "sprouted": 1,
            "undersized": 0
        },
        "feedback_notes": "Rot false-positive corrected to dry scale",
        "inspector_name": "Anil Kulkarni",
        "summary": {
            "grade_a_percent": 80.0,
            "urs_percent": 10.0,
            "verdict": "APPROVED_GRADE_A",
            "overall_score": 92
        }
    }

    verified_record = await InspectionRepository.verify_inspection(
        db=db_session,
        inspection_id=test_id,
        inspector_id=inspector_id,
        verified_data=verified_payload,
        certificate_id=cert_id,
        verdict="APPROVED_GRADE_A"
    )
    await db_session.commit()

    assert verified_record is not None
    assert verified_record.is_human_verified is True
    assert verified_record.inspector_id == inspector_id
    assert verified_record.certificate_id == cert_id
    assert verified_record.verified_data["feedback_notes"] == "Rot false-positive corrected to dry scale"

    # Test Pydantic mapping
    pydantic_report = InspectionRepository.map_to_pydantic_report(verified_record)
    assert pydantic_report is not None
    assert isinstance(pydantic_report, DigitalCertificateReport)
    assert pydantic_report.certificate_id == cert_id
    assert pydantic_report.inspector_id == inspector_id

@pytest.mark.anyio
async def test_query_history_and_national_summary(db_session: AsyncSession):
    """Test querying the National Onion Intelligence Dataset with filters and summary stats."""
    # Query history
    records = await InspectionRepository.query_history(db=db_session, verified_only=True)
    assert isinstance(records, list)

    count = await InspectionRepository.count_records(db=db_session, verified_only=True)
    assert count >= 0

    # Query National Intelligence summary
    summary = await InspectionRepository.get_national_intelligence_summary(db=db_session)
    assert "total_inspections" in summary
    assert "total_verified" in summary
    assert "regions_breakdown" in summary
