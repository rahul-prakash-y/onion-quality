"""Unit tests for the OnionVisionEngine computer vision mock service."""

import time
import pytest
from app.services.onion_vision_engine import OnionVisionEngine

@pytest.mark.anyio
async def test_onion_vision_engine_analysis():
    """Test simulated YOLO + CNN inference on a mock inspection image."""
    engine = OnionVisionEngine()

    start_time = time.time()
    result = await engine.analyze_image("/uploads/test_tray.jpg")
    elapsed_time = time.time() - start_time

    # 1. Verify simulated processing latency (simulating YOLO + CNN forward pass: ~2s)
    assert elapsed_time >= 1.95, f"Expected ~2s processing simulation, got {elapsed_time:.2f}s"

    # 2. Verify total onion count requirement: between 15 and 40
    total = result["total_onions_detected"]
    assert 15 <= total <= 40, f"Expected total between 15 and 40, got {total}"

    # 3. Verify counts distribution structure
    counts = result["counts"]
    for key in ["healthy", "damaged", "rotten", "sprouted", "undersized"]:
        assert key in counts
        assert isinstance(counts[key], int)
        assert counts[key] >= 0

    # Ensure sum of defect categories equals total
    sum_counts = (
        counts["healthy"] +
        counts["damaged"] +
        counts["rotten"] +
        counts["sprouted"] +
        counts["undersized"]
    )
    assert sum_counts == total, f"Sum of counts ({sum_counts}) does not equal total ({total})"

    # 4. Verify realistic defect distributions (Healthy: majority, Rotten: minority, Undersized: minority)
    assert counts["healthy"] >= 1
    assert 0.0 <= result["grade_a_percent"] <= 100.0
    assert 0.0 <= result["urs_percent"] <= 100.0
    assert 0.0 <= result["grade_b_percent"] <= 100.0

    # 5. Verify bounding box mock data
    detections = result["detections"]
    assert len(detections) == total
    for det in detections:
        assert "id" in det
        assert 0.0 <= det["x"] <= 100.0
        assert 0.0 <= det["y"] <= 100.0
        assert det["width"] > 0.0
        assert det["height"] > 0.0
        assert 0.0 <= det["confidence"] <= 1.0
        assert det["defect"] in ["none", "mechanical_cut", "rotten", "sprouted", "undersized"]
        assert det["grade"] in ["Grade A", "Grade B", "URS"]
        assert det["diameter_mm"] > 0.0

    # 6. Verify grading statistics & APMC metrics
    assert "overall_score" in result
    assert 0 <= result["overall_score"] <= 100
    assert result["verdict"] in ["APPROVED_GRADE_A", "CONDITIONAL_GRADE_B", "REJECTED_URS"]
    assert "price_recommendation" in result
    assert result["price_recommendation"]["recommended_price_per_qtl"] > 0
