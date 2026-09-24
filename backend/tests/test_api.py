import io
import asyncio
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.config import settings
from app.db import init_db

# Initialize database schema for test client
asyncio.run(init_db())

client = TestClient(app)

def create_mock_image_bytes(format="JPEG", size=(300, 300), color=(180, 50, 60)) -> io.BytesIO:
    """Helper to generate in-memory synthetic image bytes."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf

def test_root_and_health():
    """Verify root information and health check endpoints."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "operational"
    assert "upload_image" in data_root["endpoints"]

    res_health = client.get("/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "healthy"

def test_upload_valid_image():
    """Test POST /api/v1/inspect/upload with multipart form data."""
    img_buf = create_mock_image_bytes()
    files = {"file": ("test_onion_tray.jpg", img_buf, "image/jpeg")}
    data = {
        "batch_id": "BATCH-MH-2026-TEST",
        "region": "Maharashtra",
        "variety": "Bhima Super",
        "farmer_name": "Rameshwar Patil"
    }

    response = client.post("/api/v1/inspect/upload", files=files, data=data)
    assert response.status_code == 201
    json_data = response.json()

    assert "inspection_id" in json_data
    assert json_data["inspection_id"].startswith("insp_")
    assert json_data["status"] == "UPLOADED"
    assert json_data["file_size_bytes"] > 0
    assert "filename" in json_data
    assert "image_url" in json_data

    # Check that file actually exists in uploads directory
    saved_file = settings.UPLOAD_PATH / json_data["filename"]
    assert saved_file.exists()

def test_upload_invalid_mime_type():
    """Test POST /api/v1/inspect/upload with unsupported file type."""
    fake_txt = io.BytesIO(b"Hello world, not an image")
    files = {"file": ("document.txt", fake_txt, "text/plain")}

    response = client.post("/api/v1/inspect/upload", files=files)
    assert response.status_code == 415
    assert "Unsupported file type" in response.json()["detail"]

def test_analyze_inspection_flow():
    """Test GET /api/v1/inspect/{inspection_id}/analyze and verify required metrics:
    - total onions detected
    - counts for (healthy, damaged, rotten, sprouted, undersized)
    - calculated percentages for Grade A and URS (Under Rejection Standard)
    """
    # 1. First upload an image
    img_buf = create_mock_image_bytes()
    upload_res = client.post(
        "/api/v1/inspect/upload",
        files={"file": ("tray.png", img_buf, "image/png")},
        data={"region": "Maharashtra", "preset_hint": "sprouted_heavy"}
    )
    assert upload_res.status_code == 201
    inspection_id = upload_res.json()["inspection_id"]

    # 2. Trigger mock AI analysis
    analyze_res = client.get(f"/api/v1/inspect/{inspection_id}/analyze")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    # Check required fields
    assert analysis["inspection_id"] == inspection_id
    assert "total_onions_detected" in analysis
    assert analysis["total_onions_detected"] >= 9

    # Check counts dictionary
    assert "counts" in analysis
    counts = analysis["counts"]
    for defect_key in ["healthy", "damaged", "rotten", "sprouted", "undersized"]:
        assert defect_key in counts
        assert isinstance(counts[defect_key], int)
        assert counts[defect_key] >= 0

    # Verify counts sum matches or aligns with detected items
    sum_counts = counts["healthy"] + counts["damaged"] + counts["rotten"] + counts["sprouted"] + counts["undersized"]
    assert sum_counts == analysis["total_onions_detected"]

    # Check calculated percentages for Grade A and URS
    assert "grade_a_percent" in analysis
    assert "urs_percent" in analysis
    assert 0.0 <= analysis["grade_a_percent"] <= 100.0
    assert 0.0 <= analysis["urs_percent"] <= 100.0

    # Check additional APMC grading outputs
    assert "verdict" in analysis
    assert analysis["verdict"] in ["APPROVED_GRADE_A", "CONDITIONAL_GRADE_B", "REJECTED_URS"]
    assert "overall_score" in analysis
    assert "price_recommendation" in analysis
    assert len(analysis["detections"]) > 0

def test_analyze_nonexistent_inspection():
    """Verify 404 is returned for an invalid inspection ID."""
    response = client.get("/api/v1/inspect/insp_nonexistent_999/analyze")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_verify_human_in_the_loop_corrections():
    """Test POST /api/v1/inspect/{inspection_id}/verify:
    Accept human-verified corrections to the AI's prediction (simulating continuous learning).
    """
    # 1. Upload and analyze
    img_buf = create_mock_image_bytes()
    upload_res = client.post(
        "/api/v1/inspect/upload",
        files={"file": ("tray_verify.jpg", img_buf, "image/jpeg")},
        data={"region": "Maharashtra"}
    )
    inspection_id = upload_res.json()["inspection_id"]
    analyze_res = client.get(f"/api/v1/inspect/{inspection_id}/analyze")
    original_analysis = analyze_res.json()

    # 2. Submit human verification with adjusted counts
    verify_payload = {
        "status": "approved",
        "inspector_id": "INS-MH-042",
        "inspector_name": "Anil Kulkarni (Grading Officer)",
        "feedback_notes": "1 false-positive rot adjusted to dry outer tunic peel",
        "corrected_counts": {
            "healthy": original_analysis["counts"]["healthy"] + 1,
            "damaged": original_analysis["counts"]["damaged"],
            "rotten": max(0, original_analysis["counts"]["rotten"] - 1),
            "sprouted": original_analysis["counts"]["sprouted"],
            "undersized": original_analysis["counts"]["undersized"]
        }
    }

    verify_res = client.post(f"/api/v1/inspect/{inspection_id}/verify", json=verify_payload)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()

    assert verify_data["inspection_id"] == inspection_id
    assert "certificate_id" in verify_data
    assert verify_data["status"] == "approved"
    assert verify_data["feedback_notes"] == verify_payload["feedback_notes"]

    # Verify learning delta is recorded
    assert "learning_delta" in verify_data
    delta = verify_data["learning_delta"]
    assert delta["healthy_delta"] == 1
    assert delta["has_corrections"] is True

    # Verify report is accessible
    assert "report" in verify_data
    assert verify_data["report"]["certificate_id"] == verify_data["certificate_id"]

def test_reports_history_endpoint():
    """Test GET /api/v1/reports/history:
    Fetch a list of all verified inspection reports.
    """
    response = client.get("/api/v1/reports/history")
    assert response.status_code == 200
    data = response.json()

    assert "total_count" in data
    assert "reports" in data
    assert isinstance(data["reports"], list)
    assert data["total_count"] >= 3  # Pre-seeded lots + any verified in previous tests

    first_report = data["reports"][0]
    assert "certificate_id" in first_report
    assert "farmer_name" in first_report
    assert "summary" in first_report
    assert "tamper_proof_hash" in first_report
    assert "human_verification" in first_report

def test_reports_history_filtering():
    """Test filtering reports history by verdict and keyword."""
    # Filter by APPROVED_GRADE_A
    res_grade_a = client.get("/api/v1/reports/history?verdict=APPROVED_GRADE_A")
    assert res_grade_a.status_code == 200
    for r in res_grade_a.json()["reports"]:
        assert r["summary"]["verdict"] == "APPROVED_GRADE_A"

    # Search keyword
    res_search = client.get("/api/v1/reports/history?search=Rameshwar")
    assert res_search.status_code == 200
    for r in res_search.json()["reports"]:
        assert "rameshwar" in r["farmer_name"].lower()

def test_get_report_by_id():
    """Test GET /api/v1/reports/{report_id}."""
    res_history = client.get("/api/v1/reports/history")
    first_cert_id = res_history.json()["reports"][0]["certificate_id"]

    res_single = client.get(f"/api/v1/reports/{first_cert_id}")
    assert res_single.status_code == 200
    assert res_single.json()["certificate_id"] == first_cert_id

def test_get_report_by_invalid_id():
    """Verify 404 for unknown report ID."""
    res = client.get("/api/v1/reports/INVALID_ID_9999")
    assert res.status_code == 404

def test_upload_empty_file():
    """Verify 400 for empty 0-byte file."""
    empty_buf = io.BytesIO(b"")
    files = {"file": ("empty.jpg", empty_buf, "image/jpeg")}
    res = client.post("/api/v1/inspect/upload", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_analytics_and_learning_endpoints():
    """Verify GET /api/v1/reports/analytics/summary and /api/v1/reports/learning/logs."""
    res_analytics = client.get("/api/v1/reports/analytics/summary")
    assert res_analytics.status_code == 200
    data_analytics = res_analytics.json()
    assert "total_verified_lots" in data_analytics
    assert "grade_a_rate_percent" in data_analytics

    res_logs = client.get("/api/v1/reports/learning/logs")
    assert res_logs.status_code == 200
    data_logs = res_logs.json()
    assert "total_events" in data_logs
    assert "events" in data_logs

def test_image_serving_endpoint():
    """Verify GET /api/v1/inspect/images/{filename}."""
    img_buf = create_mock_image_bytes()
    upload_res = client.post(
        "/api/v1/inspect/upload",
        files={"file": ("view_me.jpg", img_buf, "image/jpeg")}
    )
    filename = upload_res.json()["filename"]

    img_res = client.get(f"/api/v1/inspect/images/{filename}")
    assert img_res.status_code == 200
    assert len(img_res.content) > 0

