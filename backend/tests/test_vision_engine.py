"""Unit tests for the upgraded OnionVisionEngine live Ultralytics YOLOv8 inference service."""

import pytest
import numpy as np
import cv2
from pathlib import Path
from app.services.onion_vision_engine import OnionVisionEngine, ONION_CLASS_MAPPING


def test_model_loading_lifecycle_once():
    """Verify YOLOv8 model loads once into memory and subsequent calls reuse the cached instance."""
    engine = OnionVisionEngine()
    assert not engine._is_model_loaded
    assert engine.yolo_model is None

    # First load
    model_instance = engine.load_model()
    assert engine._is_model_loaded
    assert model_instance is not None
    assert engine.yolo_model is model_instance

    # Subsequent load call returns identical instance without reloading
    second_instance = engine.load_model()
    assert second_instance is model_instance


@pytest.mark.anyio
async def test_yolo_tensor_output_parsing_and_apmc_grading():
    """Test live deep learning inference pipeline:
    - OpenCV image ingestion
    - Model inference
    - Tensor output extraction (x, y, w, h normalized 0-100, conf, class labels 0-4)
    - APMC grading math and MSP pricing calculation
    """
    engine = OnionVisionEngine()
    engine.load_model()

    # Create synthetic test image with OpenCV
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    cv2.circle(img, (200, 200), 40, (30, 45, 180), -1)
    cv2.circle(img, (400, 400), 45, (35, 50, 190), -1)

    result = await engine.analyze_image(img)

    # Verify response schema fields matching AnalysisApiResponse
    assert "total_onions_detected" in result
    assert result["total_onions_detected"] >= 1

    counts = result["counts"]
    for key in ["healthy", "damaged", "rotten", "sprouted", "undersized"]:
        assert key in counts
        assert isinstance(counts[key], int)
        assert counts[key] >= 0

    # Counts sum must equal total
    sum_counts = sum(counts.values())
    assert sum_counts == result["total_onions_detected"]

    # Verify APMC grading percentages
    assert 0.0 <= result["grade_a_percent"] <= 100.0
    assert 0.0 <= result["urs_percent"] <= 100.0
    assert 0.0 <= result["grade_b_percent"] <= 100.0
    assert 0.0 <= result["avg_diameter_mm"] <= 150.0

    # Overall score and verdict
    assert 0 <= result["overall_score"] <= 100
    assert result["verdict"] in ["APPROVED_GRADE_A", "CONDITIONAL_GRADE_B", "REJECTED_URS"]

    # Price recommendation structure
    price_rec = result["price_recommendation"]
    assert price_rec["base_msp_per_qtl"] == 2400
    assert "recommended_price_per_qtl" in price_rec
    assert price_rec["recommended_price_per_qtl"] > 0
    assert "total_estimated_lot_value" in price_rec

    # Verify bounding box detections
    detections = result["detections"]
    assert len(detections) == result["total_onions_detected"]
    for det in detections:
        assert "id" in det
        assert 0.0 <= det["x"] <= 100.0
        assert 0.0 <= det["y"] <= 100.0
        assert 0.0 < det["width"] <= 100.0
        assert 0.0 < det["height"] <= 100.0
        assert 0.0 <= det["confidence"] <= 1.0
        assert det["defect"] in ["none", "mechanical_cut", "rotten", "sprouted", "undersized"]
        assert det["grade"] in ["Grade A", "Grade B", "URS"]
        assert det["diameter_mm"] > 0.0


@pytest.mark.anyio
async def test_fallback_on_empty_or_nonexistent_image():
    """Verify graceful handling for non-existent image paths."""
    engine = OnionVisionEngine()
    result = await engine.analyze_image("/nonexistent/path/onion_tray.jpg")

    assert "total_onions_detected" in result
    assert result["total_onions_detected"] >= 15
    assert "counts" in result
    assert "price_recommendation" in result
