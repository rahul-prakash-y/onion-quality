# 🧅 OnionVision AI - FastAPI Backend Documentation

Agricultural computer vision inspection and automated grading system for onions. This backend provides RESTful APIs for mobile and web clients to upload tray inspection photos, trigger AI defect detection and APMC-standard grading, submit human-in-the-loop verification corrections, and maintain a tamper-proof digital quality certificate ledger.

---

## 🚀 Key Features

- **Multipart Image Ingestion**: Temporarily stores high-resolution inspection captures locally in `/uploads` and assigns unique transaction tracking IDs (`POST /api/v1/inspect/upload`).
- **Mock AI Inference Engine**: Simulates deep learning computer vision models detecting individual bulbs, predicting equatorial diameter ($mm$), husk integrity ($0-100\%$), firmness, and defect classification (`GET /api/v1/inspect/{id}/analyze`).
- **APMC Standards Grading**: Computes counts for **healthy, damaged, rotten, sprouted, and undersized** bulbs, plus calculated percentages for **Grade A**, **Grade B**, and **URS (Under Rejection Standard)** along with mandi MSP valuation recommendations.
- **Human-in-the-Loop Continuous Learning**: Accepts inspector adjustments (`POST /api/v1/inspect/{id}/verify`), logs the model-vs-human correction delta for active retraining, and certifies the batch with a cryptographic SHA-256 tamper-proof hash.
- **Auditable Quality Ledger**: Exposes history of certified batches (`GET /api/v1/reports/history`) with keyword search and verdict filtering.
- **CORS-Ready for ReactJS**: Configured with CORS middleware to seamlessly interface with the frontend on `http://localhost:5173`.

---

## 📁 Project Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory, CORS setup, exception handlers
│   ├── config.py                # Configurations, paths, mandi MSP constants
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic v2 data models for requests & responses
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── inspection.py        # /upload, /{id}/analyze, /{id}/verify, /{id}
│   │   └── reports.py           # /history, /{id}, /analytics/summary, /learning/logs
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_engine.py         # Mock AI grading engine & APMC mathematical formulas
│   │   └── storage.py           # In-memory + persistent repository & uploads manager
│   └── uploads/                 # Local directory for temporary inspection images
├── tests/
│   ├── __init__.py
│   └── test_api.py              # Pytest & TestClient automated integration tests
├── requirements.txt
├── run.py                       # CLI application launcher
└── README.md
```

---

## 🛠️ Quickstart & Setup

### 1. Requirements
- Python 3.10+ (tested on Python 3.12)
- pip

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Launch Development Server
```bash
python run.py --port 8000 --reload
```
or via Uvicorn directly:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (Redoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Probe**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running the Test Suite

Run the automated Pytest suite covering all required endpoints, model validations, and edge cases:
```bash
cd backend
python -m pytest tests -v
```

---

## 📡 API Reference & Endpoints

### 1. Image Upload
- **Route**: `POST /api/v1/inspect/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Image binary (`image/jpeg`, `image/png`, `image/webp`)
  - `batch_id` *(optional)*: Batch/Lot ID (e.g. `BATCH-MH-2026-4401`)
  - `region` *(optional)*: `Maharashtra` | `Madhya Pradesh` | `Karnataka` | `Gujarat` | `Rajasthan`
  - `variety` *(optional)*: e.g. `Bhima Super (Nashik Red)`
  - `farmer_name` *(optional)*: e.g. `Rameshwar Patil`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/inspect/upload" \
  -F "file=@tray_sample.jpg" \
  -F "region=Maharashtra" \
  -F "batch_id=BATCH-MH-2026-4401"
```

**Response (`201 Created`)**:
```json
{
  "inspection_id": "insp_9b32941fa4bc",
  "filename": "onion_9b32941fa4bc_1727154000.jpg",
  "file_size_bytes": 142850,
  "image_url": "/api/v1/inspect/images/onion_9b32941fa4bc_1727154000.jpg",
  "upload_timestamp": "2026-09-24T04:50:00.000000+00:00",
  "status": "UPLOADED",
  "message": "Image successfully uploaded and queued for AI analysis"
}
```

---

### 2. Trigger AI Analysis
- **Route**: `GET /api/v1/inspect/{inspection_id}/analyze`
- **Description**: Evaluates the uploaded image, detects bulb boundaries, categorizes defects, and computes Grade A / URS percentages.

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/inspect/insp_9b32941fa4bc/analyze"
```

**Response (`200 OK`)**:
```json
{
  "inspection_id": "insp_9b32941fa4bc",
  "total_onions_detected": 10,
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
  "avg_diameter_mm": 57.4,
  "overall_score": 85,
  "verdict": "APPROVED_GRADE_A",
  "detections": [
    {
      "id": "det-1",
      "x": 14.2,
      "y": 18.5,
      "width": 21.0,
      "height": 21.0,
      "diameter_mm": 62.0,
      "grade": "Grade A",
      "defect": "none",
      "confidence": 0.98,
      "skin_quality_percent": 95.0,
      "firmness": "Hard",
      "notes": "Optimal globular shape, dry tight neck"
    }
  ],
  "price_recommendation": {
    "base_msp_per_qtl": 2400,
    "quality_bonus_or_penalty": 264,
    "recommended_price_per_qtl": 2664,
    "total_estimated_lot_value": 119880
  },
  "analyzed_at": "2026-09-24T04:50:02.123456+00:00"
}
```

---

### 3. Human-in-the-Loop Verification
- **Route**: `POST /api/v1/inspect/{inspection_id}/verify`
- **Content-Type**: `application/json`
- **Description**: Records human adjustments to the AI prediction, calculates continuous learning deltas, and generates an official tamper-proof digital certificate.

**Request Payload**:
```json
{
  "status": "approved",
  "inspector_id": "INS-MH-042",
  "inspector_name": "Anil Kulkarni (Grading Officer)",
  "feedback_notes": "1 false-positive rot adjusted to dry outer peel",
  "corrected_counts": {
    "healthy": 8,
    "damaged": 1,
    "rotten": 0,
    "sprouted": 1,
    "undersized": 0
  }
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/inspect/insp_9b32941fa4bc/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "inspector_id": "INS-MH-042",
    "feedback_notes": "1 false-positive rot adjusted to dry outer peel",
    "corrected_counts": {
      "healthy": 8,
      "damaged": 1,
      "rotten": 0,
      "sprouted": 1,
      "undersized": 0
    }
  }'
```

**Response (`200 OK`)**:
```json
{
  "inspection_id": "insp_9b32941fa4bc",
  "certificate_id": "OV-2026-MH-4B29A1",
  "status": "approved",
  "verified_at": "2026-09-24T04:50:05.654321+00:00",
  "summary": {
    "total_count": 10,
    "counts": {
      "healthy": 8,
      "damaged": 1,
      "rotten": 0,
      "sprouted": 1,
      "undersized": 0
    },
    "grade_a_percent": 72.0,
    "urs_percent": 10.0,
    "grade_b_percent": 18.0,
    "avg_diameter_mm": 57.4,
    "overall_score": 89,
    "verdict": "APPROVED_GRADE_A",
    "price_recommendation": {
      "base_msp_per_qtl": 2400,
      "quality_bonus_or_penalty": 276,
      "recommended_price_per_qtl": 2676,
      "total_estimated_lot_value": 120420
    }
  },
  "learning_delta": {
    "healthy_delta": 1,
    "damaged_delta": 0,
    "rotten_delta": 0,
    "sprouted_delta": 0,
    "undersized_delta": -1,
    "has_corrections": true
  },
  "report": {
    "certificate_id": "OV-2026-MH-4B29A1",
    "tamper_proof_hash": "a4f89d...sha256",
    "status": "VALID",
    "synced_to_cloud": true
  }
}
```

---

### 4. Verified Reports History
- **Route**: `GET /api/v1/reports/history`
- **Query Parameters**:
  - `verdict` *(optional)*: `APPROVED_GRADE_A` | `CONDITIONAL_GRADE_B` | `REJECTED_URS`
  - `region` *(optional)*: State filter
  - `search` *(optional)*: Keyword matching Lot ID, Farmer Name, or Certificate ID
  - `limit` *(optional, default 50)*: Pagination limit
  - `offset` *(optional, default 0)*: Pagination offset

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/reports/history?verdict=APPROVED_GRADE_A"
```

**Response (`200 OK`)**:
```json
{
  "total_count": 2,
  "reports": [
    {
      "certificate_id": "OV-2026-MH-78912",
      "timestamp": "2026-09-23 08:45 AM",
      "lot_id": "MH-LSG-2026-4401",
      "farmer_name": "Rameshwar Patil",
      "farmer_phone": "+91 98220 14592",
      "procurement_center": "Lasalgaon APMC Main Yard",
      "geographic_source": "Maharashtra",
      "summary": {
        "grade_a_percent": 89.0,
        "urs_percent": 0.0,
        "grade_b_percent": 11.0,
        "overall_score": 96,
        "verdict": "APPROVED_GRADE_A"
      },
      "tamper_proof_hash": "e3b0c442...",
      "status": "VALID"
    }
  ]
}
```

---

## 🏛️ APMC Grading Criteria & Formulas

| Metric | APMC Standard / Formula | Description |
|---|---|---|
| **Grade A** | Equatorial Diameter $\ge 50\text{ mm}$, sound skin, 0 rot | Premium export tier bulbs |
| **Grade B** | Moderate superficial mechanical cut, diameter $45-50\text{ mm}$ | Fair Average Quality (FAQ) domestic mandi tier |
| **URS** | Broken dormancy / Sprouting, bacterial soft rot, mould | Under Rejection Standard (unfit for storage) |
| **Overall Score** | $(\% A \times 1.0) + (\% B \times 0.65) + (\% URS \times 0.15)$ | Normalized quality index (0–100) |
| **Price Mult.** | $(\% A \times 1.25 + \% B \times 1.0 + \% URS \times 0.35) / 100$ | Base MSP adjustment multiplier |
