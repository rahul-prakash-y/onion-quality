"""Tests for the Database Seeding and Mock Data Injector (seed_db.py).
Verifies:
- Seeding execution with and without drop-tables
- Exactly 50 records generated across the last 30 days
- 60% Grade A, 20% Grade B, 20% URS Rejection mix
- Predefined geographic distribution across MH, KA, GJ, MP, RJ
- Correlation: older lots have elevated sprouted counts
- Correlation: humid regions (KA, GJ) have elevated rotten counts
- Cryptographic SHA-256 tamper-proof hash integrity (64 hex characters)
- API integration: GET /api/v1/reports/history and /analytics/summary
"""

import hashlib
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, func

from app.main import app
from app.db.session import AsyncSessionLocal
from app.db.models import InspectionRecordModel
from seed_db import seed_database, normalize_db_url

client = TestClient(app)


def test_normalize_db_url():
    """Verify that PostgreSQL connection URLs are correctly converted for asyncpg."""
    assert normalize_db_url("postgres://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    assert normalize_db_url("postgresql://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    assert normalize_db_url("sqlite+aiosqlite:///./test.db") == "sqlite+aiosqlite:///./test.db"


@pytest.mark.anyio
async def test_seed_database_execution():
    """Verifies that seed_database populates exactly 50 records with the required distribution."""
    # Seed fresh database
    result = await seed_database(drop_tables=True, record_count=50, days_span=30)
    assert result["success"] is True
    assert result["records_injected"] == 50
    assert result["total_in_db"] == 50

    # Verify quality mix
    assert result["grade_a_percentage"] == 60.0
    assert result["b_percentage"] == 20.0
    assert result["urs_percentage"] == 20.0

    # Verify regions present
    regions = result["regions"]
    assert "Maharashtra" in regions
    assert "Karnataka" in regions
    assert "Gujarat" in regions
    assert "Madhya Pradesh" in regions
    assert "Rajasthan" in regions


@pytest.mark.anyio
async def test_historical_span_and_hash_integrity():
    """Verifies timestamp span, SHA-256 hash validity, and defect correlations."""
    async with AsyncSessionLocal() as session:
        query = select(InspectionRecordModel).order_by(InspectionRecordModel.timestamp.asc())
        records = list((await session.execute(query)).scalars().all())

    assert len(records) == 50

    now = datetime.now(timezone.utc)
    oldest = records[0].timestamp
    newest = records[-1].timestamp

    # Verify timestamps span approximately 30 days
    span_days = (newest - oldest).total_seconds() / 86400.0
    assert span_days >= 20.0, f"Expected span over 20 days, got {span_days}"

    older_sprouted_counts = []
    recent_sprouted_counts = []
    humid_rotten_counts = []
    dry_rotten_counts = []

    for r in records:
        assert r.is_human_verified is True
        assert r.certificate_id is not None
        assert r.certificate_id.startswith("OV-2026-")

        v_data = r.verified_data
        assert v_data is not None
        tamper_hash = v_data.get("tamper_proof_hash")

        # 1. SHA-256 Tamper-Proof Hash integrity check: exactly 64 hex characters
        assert isinstance(tamper_hash, str)
        assert len(tamper_hash) == 64
        int(tamper_hash, 16)  # Verifies valid hex

        # Check recalculation matches hash payload
        counts = v_data["verified_counts"]
        summary = v_data["summary"]
        expected_payload = (
            f"{r.inspection_id}|{summary['total_count']}|{summary['grade_a_percent']}|"
            f"{summary['urs_percent']}|{r.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')}|{r.inspector_id}"
        )
        expected_hash = hashlib.sha256(expected_payload.encode("utf-8")).hexdigest()
        assert tamper_hash == expected_hash

        # 2. Defect correlation tracking
        r_ts = r.timestamp if r.timestamp.tzinfo is not None else r.timestamp.replace(tzinfo=timezone.utc)
        days_ago = (now - r_ts).days
        sprouted = counts["sprouted"]
        rotten = counts["rotten"]

        if days_ago > 15:
            older_sprouted_counts.append(sprouted)
        elif days_ago <= 7:
            recent_sprouted_counts.append(sprouted)

        if r.verdict in ("CONDITIONAL_GRADE_B", "REJECTED_URS"):
            if r.geographic_source in ("Karnataka", "Gujarat"):
                humid_rotten_counts.append(rotten)
            elif r.geographic_source in ("Maharashtra", "Rajasthan", "Madhya Pradesh"):
                dry_rotten_counts.append(rotten)

    # Correlation 1: Older lots have higher average sprouting count than recent lots
    if older_sprouted_counts and recent_sprouted_counts:
        avg_old_sprouted = sum(older_sprouted_counts) / len(older_sprouted_counts)
        avg_recent_sprouted = sum(recent_sprouted_counts) / len(recent_sprouted_counts)
        assert avg_old_sprouted >= avg_recent_sprouted

    # Correlation 2: Humid regions have higher average rot count than dry regions
    if humid_rotten_counts and dry_rotten_counts:
        avg_humid_rotten = sum(humid_rotten_counts) / len(humid_rotten_counts)
        avg_dry_rotten = sum(dry_rotten_counts) / len(dry_rotten_counts)
        assert avg_humid_rotten >= avg_dry_rotten


def test_api_reports_history_and_analytics():
    """Verifies that FastAPI /api/v1/reports/history serves all seeded reports."""
    # 1. Test reports history
    res_history = client.get("/api/v1/reports/history?limit=100")
    assert res_history.status_code == 200
    data = res_history.json()
    assert data["total_count"] >= 50
    assert len(data["reports"]) >= 50

    first_report = data["reports"][0]
    assert "certificate_id" in first_report
    assert "tamper_proof_hash" in first_report
    assert len(first_report["tamper_proof_hash"]) == 64
    assert "farmer_name" in first_report
    assert "procurement_center" in first_report

    # 2. Test analytics endpoint reflects seeded data
    res_analytics = client.get("/api/v1/reports/analytics/summary")
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    assert analytics["total_verified_lots"] >= 50
    assert 55.0 <= analytics["grade_a_rate_percent"] <= 65.0
    assert 15.0 <= analytics["rejection_urs_rate_percent"] <= 25.0

    # 3. Test national intelligence endpoint
    res_intel = client.get("/api/v1/reports/dataset/intelligence")
    assert res_intel.status_code == 200
    intel = res_intel.json()
    assert intel["total_inspections"] >= 50
    assert "Maharashtra" in intel["regions_breakdown"]
    assert "Karnataka" in intel["regions_breakdown"]
