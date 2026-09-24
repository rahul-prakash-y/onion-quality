"""Tests for the National Onion Intelligence Dataset Export Pipeline.
Tests the FastAPI endpoint GET /api/v1/dataset/export, admin authentication,
YOLO/COCO format conversion, geographic partitioning, and database state updates.
"""

import io
import json
import zipfile
import asyncio
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.db.mongodb import MongoInspectionRepository, mongo_manager
from app.routes.seed_helper import seed_mongo_verified_dataset

client = TestClient(app)


def reset_test_dataset():
    """Seeds verified samples and resets used_for_training flag for testing."""
    async def _async_setup():
        mongo_manager.connect()
        if await mongo_manager.ping():
            coll = MongoInspectionRepository.get_collection()
            await coll.update_many(
                {"is_human_verified": True},
                {"$set": {"used_for_training": False}}
            )
            count = await coll.count_documents({"is_human_verified": True, "used_for_training": False})
            if count < 4:
                await seed_mongo_verified_dataset(count_per_region=2)
    asyncio.run(_async_setup())


def test_export_security_authentication():
    """Validates mock admin token security check."""
    reset_test_dataset()

    # 1. Missing token -> 401
    res = client.get("/api/v1/dataset/export")
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]

    # 2. Invalid token -> 401
    res = client.get("/api/v1/dataset/export", headers={"X-Admin-Token": "invalid-token-123"})
    assert res.status_code == 401

    # 3. Valid via X-Admin-Token header
    res_header = client.get(
        "/api/v1/dataset/export?dry_run=true",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res_header.status_code == 200

    # 4. Valid via Bearer Authorization header
    res_bearer = client.get(
        "/api/v1/dataset/export?dry_run=true",
        headers={"Authorization": f"Bearer {settings.ADMIN_TOKEN}"}
    )
    assert res_bearer.status_code == 200

    # 5. Valid via query parameter ?admin_token=
    res_query = client.get(
        f"/api/v1/dataset/export?dry_run=true&admin_token={settings.ADMIN_TOKEN}"
    )
    assert res_query.status_code == 200


def test_export_dataset_zip_contents_and_yolo_format():
    """Verifies that the downloadable ZIP contains proper geographic folders and YOLO annotations."""
    reset_test_dataset()

    response = client.get(
        "/api/v1/dataset/export?dry_run=true",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/zip"
    assert "attachment; filename=" in response.headers["Content-Disposition"]

    # Parse ZIP from bytes
    zip_bytes = response.content
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
        namelist = z.namelist()
        assert "data.yaml" in namelist
        assert "classes.txt" in namelist
        assert "dataset_metadata.json" in namelist
        assert "README.md" in namelist

        # Check classes.txt contents
        classes_content = z.read("classes.txt").decode("utf-8").strip().splitlines()
        assert classes_content == ["healthy", "damaged", "rotten", "sprouted", "undersized"]

        # Check data.yaml
        data_yaml = z.read("data.yaml").decode("utf-8")
        assert "names:" in data_yaml
        assert "0: healthy" in data_yaml
        assert "nc: 5" in data_yaml

        # Check metadata
        metadata = json.loads(z.read("dataset_metadata.json").decode("utf-8"))
        assert metadata["dataset_name"] == "National Onion Intelligence Dataset"
        assert metadata["total_inspections"] > 0
        assert metadata["total_bounding_boxes"] > 0

        # Verify geographic folders exist
        has_regional_folder = any("/images/" in name for name in namelist)
        has_label_file = any("/labels/" in name and name.endswith(".txt") for name in namelist)
        assert has_regional_folder
        assert has_label_file

        # Verify YOLO label format for a sample txt
        for name in namelist:
            if "/labels/" in name and name.endswith(".txt"):
                label_text = z.read(name).decode("utf-8").strip()
                if label_text:
                    first_line = label_text.splitlines()[0]
                    parts = first_line.split()
                    assert len(parts) == 5, f"Expected 5 tokens in YOLO line: {first_line}"
                    class_id = int(parts[0])
                    assert 0 <= class_id <= 4
                    coords = [float(p) for p in parts[1:]]
                    for c in coords:
                        assert 0.0 <= c <= 1.0, f"Normalized coordinate {c} not in [0, 1]"
                    break


def test_dataset_state_update_used_for_training():
    """Verifies that exporting updates used_for_training = True to prevent duplicate exports."""
    reset_test_dataset()

    # First export without dry_run
    res1 = client.get(
        "/api/v1/dataset/export?dry_run=false",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res1.status_code == 200

    # Second export immediately after should find 0 unexported records -> 404
    res2 = client.get(
        "/api/v1/dataset/export",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res2.status_code == 404
    assert "No human-verified inspection records found" in res2.json()["detail"]

    # But with include_previously_exported=true, it can still export
    res3 = client.get(
        "/api/v1/dataset/export?include_previously_exported=true&dry_run=true",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res3.status_code == 200


def test_export_geographic_region_filter():
    """Verifies filtering by geographic source (e.g. Maharashtra)."""
    reset_test_dataset()

    res = client.get(
        "/api/v1/dataset/export?region=Maharashtra&dry_run=true",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res.status_code == 200
    with zipfile.ZipFile(io.BytesIO(res.content), "r") as z:
        namelist = z.namelist()
        # Every image and label in this archive must belong to Maharashtra
        for name in namelist:
            if "/images/" in name or "/labels/" in name:
                assert name.startswith("Maharashtra/"), f"Unexpected regional file: {name}"


def test_dataset_stats_endpoint():
    """Verifies GET /api/v1/dataset/stats provides metadata statistics."""
    reset_test_dataset()

    res = client.get(
        "/api/v1/dataset/stats",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN}
    )
    assert res.status_code == 200
    stats = res.json()
    assert "database_engine" in stats
