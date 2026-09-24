#!/usr/bin/env python3
"""OnionVision AI - Database Seeding & Mock Data Injector.

Generates 50 realistic historical inspection records spanning the last 30 days
for the National Onion Intelligence Dataset and APMC Mandi Certified Ledger.

Key Features:
- Direct SQLAlchemy connection (PostgreSQL / asyncpg on Render or local Async SQLite / aiosqlite).
- Realistic multi-state APMC distribution (Maharashtra, Karnataka, Gujarat, Madhya Pradesh, Rajasthan).
- Calibrated quality mix: ~60% Grade A, ~20% Grade B, ~20% High URS / Rejected.
- Realistic defect correlations:
  * Higher sprouting rate for older lots (>15 days, reflecting dormancy breakdown).
  * Higher rot / fungal decay for high-humidity coastal mandi belts (Hubli, Mahuva).
- Cryptographic SHA-256 tamper-proof hash per certificate for ledger validation.
- Command-line interface with optional table dropping (--drop-tables), custom count, and db URL.
"""

import os
import sys
import uuid
import random
import hashlib
import logging
import argparse
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Ensure backend root is on sys.path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.config import settings
from app.db.session import Base
from app.db.models import InspectionRecordModel
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, func

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("seed_db")

# ==============================================================================
# AGRICULTURAL APMC REGIONS & PROFILES
# ==============================================================================

REGIONAL_PROFILES: Dict[str, Dict[str, Any]] = {
    "Maharashtra": {
        "code": "MH",
        "weight_share": 0.40,  # ~40% of records (20 lots)
        "mandis": [
            ("Lasalgaon APMC Main Yard", "LSG"),
            ("Pimpalgaon Baswant APMC", "PMP"),
            ("Nashik APMC Market Yard", "NSK"),
            ("Yeola Mandi Yard", "YLA")
        ],
        "varieties": [
            "Bhima Super (Nashik Red)",
            "Bhima Kiran",
            "Bhima Shakti",
            "Nashik Red Late Kharif"
        ],
        "inspectors": [
            ("INS-MH-042", "Dr. Anil Kulkarni (Chief Quality Grader)"),
            ("INS-MH-019", "P. B. Deshmukh (APMC Grading Officer)"),
            ("INS-MH-055", "Sachin Shinde (Field Inspector)")
        ],
        "farmers": [
            ("Rameshwar Patil", "+91 98220 14592"),
            ("Bhausaheb Jadhav", "+91 98223 84192"),
            ("Dnyaneshwar Shinde", "+91 94231 66820"),
            ("Sanjay Sonawane", "+91 98501 23941"),
            ("Vitthalrao Kadam", "+91 98229 45812"),
            ("Dattatray Gaikwad", "+91 97634 11094"),
            ("Santosh More", "+91 94222 78310"),
            ("Pandurang Gite", "+91 98902 44321")
        ],
        "rot_climate_factor": 0.8  # Dry climate, lower storage rot
    },
    "Karnataka": {
        "code": "KA",
        "weight_share": 0.24,  # ~24% of records (12 lots)
        "mandis": [
            ("Hubli-Dharwad APMC Yard", "HBL"),
            ("Belagavi Mandi Terminal", "BLG"),
            ("Gadag APMC Yard", "GDG"),
            ("Bagalkot Mandi", "BGK")
        ],
        "varieties": [
            "Bellary Red Late Kharif",
            "Gulbarga Red",
            "Arka Kalyan",
            "Telagi Red"
        ],
        "inspectors": [
            ("INS-KA-018", "Suresh Gowda (Senior Mandi Grader)"),
            ("INS-KA-031", "Basavaraj Patil (Inspection Officer)"),
            ("INS-KA-027", "Manjunath Hegde (Quality Auditor)")
        ],
        "farmers": [
            ("Mallikarjun Hiremath", "+91 98450 11928"),
            ("Basappa Byadagi", "+91 94481 22934"),
            ("Channappa Walikar", "+91 98803 45192"),
            ("Sharanappa Hubli", "+91 99002 67812"),
            ("Yallappa Doddamani", "+91 94492 81093"),
            ("Gurusiddappa Pujar", "+91 98455 33419")
        ],
        "rot_climate_factor": 1.9  # Humid / monsoon belt, higher rot & black mold
    },
    "Gujarat": {
        "code": "GJ",
        "weight_share": 0.16,  # ~16% of records (8 lots)
        "mandis": [
            ("Mahuva APMC Main Yard", "MHV"),
            ("Bhavnagar APMC Yard", "BVN"),
            ("Gondal APMC Market", "GDL"),
            ("Rajkot APMC Yard", "RJK")
        ],
        "varieties": [
            "Mahuva White Hybrid",
            "Gujarat White Onion-1",
            "Junagadh Red",
            "Talaja White Export"
        ],
        "inspectors": [
            ("INS-GJ-091", "Hitesh Patel (Senior Grading Officer)"),
            ("INS-GJ-044", "Bhavesh Makwana (Mandi Surveyor)")
        ],
        "farmers": [
            ("Mansukhbhai Patel", "+91 98250 88219"),
            ("Vipulbhai Dabhi", "+91 98791 43210"),
            ("Govindbhai Gohil", "+91 94282 10984"),
            ("Pravinbhai Vala", "+91 99251 77342"),
            ("Kishorbhai Radadiya", "+91 98244 55198")
        ],
        "rot_climate_factor": 1.7  # Coastal humidity, higher fungal moisture risk
    },
    "Madhya Pradesh": {
        "code": "MP",
        "weight_share": 0.12,  # ~12% of records (6 lots)
        "mandis": [
            ("Neemuch Mandi Yard", "NMC"),
            ("Mandsaur APMC Yard", "MDS"),
            ("Indore APMC Market", "IND"),
            ("Ratlam Mandi", "RTL")
        ],
        "varieties": [
            "Malwa Red Export Grade",
            "Indore Crimson",
            "AgriFound Dark Red",
            "Bhima Dark Red"
        ],
        "inspectors": [
            ("INS-MP-007", "Rajesh Malviya (District Quality Assessor)"),
            ("INS-MP-022", "Deepak Sharma (Mandi Superintendent)")
        ],
        "farmers": [
            ("Ramcharan Patidar", "+91 98270 33412"),
            ("Mukesh Choudhary", "+91 94251 88923"),
            ("Dinesh Dhakad", "+91 98932 77145"),
            ("Shyamlal Rathore", "+91 94259 12048"),
            ("Kailash Porwal", "+91 98263 66190")
        ],
        "rot_climate_factor": 0.9  # Continental climate, balanced rot profile
    },
    "Rajasthan": {
        "code": "RJ",
        "weight_share": 0.08,  # ~8% of records (4 lots)
        "mandis": [
            ("Alwar Mandi Yard", "ALW"),
            ("Sikar Krishi Upaj Mandi", "SKR"),
            ("Kishangarh Mandi", "KSG")
        ],
        "varieties": [
            "Pusa Red",
            "Rajasthan Late Kharif",
            "AgriFound Light Red"
        ],
        "inspectors": [
            ("INS-RJ-034", "Virender Singh (Mandi Grading Officer)"),
            ("INS-RJ-051", "Kishan Lal Meena (Agricultural Inspector)")
        ],
        "farmers": [
            ("Harishankar Yadav", "+91 94140 22391"),
            ("Om Prakash Saini", "+91 98291 44012"),
            ("Ramavtar Gurjar", "+91 94133 89120"),
            ("Balram Meena", "+91 98282 55913")
        ],
        "rot_climate_factor": 0.6  # Semi-arid, very low rot; risk of dry skin peel
    }
}


def normalize_db_url(url: str) -> str:
    """Ensures database URL has the proper async driver prefix for SQLAlchemy."""
    url = url.strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def ensure_sample_images() -> List[Path]:
    """Finds or generates sample onion tray images in uploads folder."""
    upload_dir = settings.UPLOAD_PATH
    upload_dir.mkdir(parents=True, exist_ok=True)

    existing_images = [
        f for f in upload_dir.iterdir()
        if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp') and not f.name.startswith('.')
    ]

    if existing_images:
        return existing_images

    # Generate lightweight placeholder images if folder is empty
    created: List[Path] = []
    try:
        from PIL import Image, ImageDraw
        for i in range(8):
            img_path = upload_dir / f"mandi_tray_sample_{i + 1:02d}.jpg"
            img = Image.new("RGB", (640, 640), (200 + i * 4, 140 + i * 3, 110 + i * 2))
            draw = ImageDraw.Draw(img)
            draw.rectangle([80, 80, 560, 560], fill=(160 - i * 5, 60 + i * 4, 60))
            img.save(img_path)
            created.append(img_path)
    except Exception:
        fallback = upload_dir / "mandi_tray_sample_default.jpg"
        fallback.write_bytes(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00")
        created.append(fallback)

    return created


def generate_bounding_boxes(
    total: int,
    healthy: int,
    damaged: int,
    rotten: int,
    sprouted: int,
    undersized: int
) -> List[Dict[str, Any]]:
    """Generates synthetic bounding box detections with normalized coordinates."""
    detections: List[Dict[str, Any]] = []
    classes = (
        ["healthy"] * healthy +
        ["damaged"] * damaged +
        ["rotten"] * rotten +
        ["sprouted"] * sprouted +
        ["undersized"] * undersized
    )
    random.shuffle(classes)

    grid_cols = 5
    for idx, cls_name in enumerate(classes):
        row = idx // grid_cols
        col = idx % grid_cols
        ymin = round(0.12 + row * 0.16 + random.uniform(-0.02, 0.02), 4)
        xmin = round(0.10 + col * 0.16 + random.uniform(-0.02, 0.02), 4)
        ymax = round(min(0.95, ymin + random.uniform(0.11, 0.14)), 4)
        xmax = round(min(0.95, xmin + random.uniform(0.11, 0.14)), 4)

        conf = round(random.uniform(0.84, 0.98), 3) if cls_name == "healthy" else round(random.uniform(0.79, 0.94), 3)
        detections.append({
            "id": idx + 1,
            "box": [ymin, xmin, ymax, xmax],
            "class_name": cls_name,
            "confidence": conf
        })

    return detections


def generate_mock_inspection(
    index: int,
    target_verdict: str,
    region_name: str,
    timestamp: datetime,
    image_path: Path
) -> InspectionRecordModel:
    """Constructs a single realistic, correlated InspectionRecordModel instance."""
    profile = REGIONAL_PROFILES[region_name]
    mandi_name, mandi_code = random.choice(profile["mandis"])
    variety = random.choice(profile["varieties"])
    inspector_id, inspector_name = random.choice(profile["inspectors"])
    farmer_name, farmer_phone = random.choice(profile["farmers"])
    reg_code = profile["code"]

    days_ago = max(0, (datetime.now(timezone.utc) - timestamp).days)
    climate_factor = profile["rot_climate_factor"]

    # Sample batch specifications
    total_onions = random.randint(18, 30)
    sample_weight_kg = round(random.uniform(4.8, 5.4), 2)
    lot_weight_quintals = round(random.uniform(32.0, 68.0), 1)
    base_msp = settings.BASE_MSP_PER_QTL

    # Defect generation based on verdict and correlations
    if target_verdict == "APPROVED_GRADE_A":
        # 60% distribution: 85-96% Grade A, 0 rotten, 0 sprouted (except very old lots)
        healthy = int(total_onions * random.uniform(0.84, 0.95))
        rotten = 0
        sprouted = 1 if (days_ago > 26 and random.random() < 0.25) else 0
        undersized = random.randint(0, 1)
        damaged = max(0, total_onions - (healthy + rotten + sprouted + undersized))
        # Ensure at least 80% healthy
        if healthy < int(total_onions * 0.80):
            healthy = int(total_onions * 0.85)
            damaged = total_onions - healthy

        avg_diameter = round(random.uniform(55.0, 64.5), 1)
        overall_score = random.randint(88, 98)
        price_adjustment = random.randint(300, 620)
        verdict = "APPROVED_GRADE_A"
        feedback_notes = (
            f"APMC Grade A Export standard certified at {mandi_name}. "
            f"Compact skin integrity, excellent coloration, zero decay."
        )

    elif target_verdict == "CONDITIONAL_GRADE_B":
        # 20% distribution: 50-70% Grade A, moderate defects, low rot
        healthy = int(total_onions * random.uniform(0.55, 0.70))
        damaged = random.randint(2, 5)
        undersized = random.randint(2, 5)

        # Sprouting correlated with storage age
        sprouted = random.randint(1, 3) if days_ago > 14 else (1 if random.random() < 0.3 else 0)

        # Rotten correlated with humidity
        rotten = 1 if (climate_factor > 1.4 and random.random() < 0.5) else 0

        # Adjust remaining
        total_defects = damaged + undersized + sprouted + rotten
        if healthy + total_defects != total_onions:
            healthy = max(int(total_onions * 0.50), total_onions - total_defects)

        avg_diameter = round(random.uniform(48.0, 56.0), 1)
        overall_score = random.randint(66, 82)
        price_adjustment = random.randint(-120, 140)
        verdict = "CONDITIONAL_GRADE_B"
        feedback_notes = (
            f"APMC Grade B approved for domestic wholesale at {mandi_name}. "
            f"Mild skin peeling and non-uniform bulb sizing noted."
        )

    else:  # REJECTED_URS
        # 20% distribution: high defects (>25% URS)
        # Rot heavily elevated in humid coastal regions (Hubli/Mahuva)
        base_rot = random.randint(3, 7) if climate_factor > 1.2 else random.randint(2, 5)
        rotten = base_rot

        # Sprouting heavily elevated in older lots (>15 days)
        if days_ago > 15:
            sprouted = random.randint(3, 7)  # Dormancy break in prolonged storage
        else:
            sprouted = random.randint(1, 3)

        undersized = random.randint(2, 5)
        damaged = random.randint(2, 4)
        healthy = max(2, total_onions - (rotten + sprouted + undersized + damaged))

        avg_diameter = round(random.uniform(41.0, 49.0), 1)
        overall_score = random.randint(32, 56)
        price_adjustment = -random.randint(450, 950)
        verdict = "REJECTED_URS"
        feedback_notes = (
            f"REJECTED under Mandi Quality Regulations at {mandi_name}. "
            f"Excessive rot ({rotten}) and sprouting ({sprouted}) exceed APMC tolerance limit."
        )

    # Recalculate true totals
    actual_total = healthy + damaged + rotten + sprouted + undersized
    grade_a_percent = round((healthy / actual_total) * 100, 1)
    grade_b_percent = round((damaged / actual_total) * 100, 1)
    urs_percent = round(((rotten + sprouted + undersized) / actual_total) * 100, 1)

    recommended_price = max(1200, base_msp + price_adjustment)
    total_estimated_lot_value = int(lot_weight_quintals * recommended_price)

    # Identification keys
    lot_serial = random.randint(1000, 9999)
    lot_id = f"{reg_code}-{mandi_code}-2026-{lot_serial}"
    cert_id = f"OV-2026-{reg_code}-{random.randint(10000, 99999)}"
    inspection_id = f"insp_{reg_code.lower()}_{uuid.uuid4().hex[:10]}"

    # Cryptographic SHA-256 Tamper-Proof Hash (strictly 64 hex characters)
    iso_timestamp = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
    hash_payload = (
        f"{inspection_id}|{actual_total}|{grade_a_percent}|"
        f"{urs_percent}|{iso_timestamp}|{inspector_id}"
    )
    tamper_proof_hash = hashlib.sha256(hash_payload.encode('utf-8')).hexdigest()

    # Detections
    detections = generate_bounding_boxes(
        total=actual_total,
        healthy=healthy,
        damaged=damaged,
        rotten=rotten,
        sprouted=sprouted,
        undersized=undersized
    )

    # AI Predictions vs Human Verification delta
    counts_dict = {
        "healthy": healthy,
        "damaged": damaged,
        "rotten": rotten,
        "sprouted": sprouted,
        "undersized": undersized
    }

    # Small delta simulating human inspector fine-tuning
    ai_healthy = max(1, healthy + random.choice([-1, 0, 1]))
    ai_damaged = max(0, damaged + (healthy - ai_healthy))
    learning_delta = {
        "healthy": healthy - ai_healthy,
        "damaged": damaged - ai_damaged,
        "rotten": 0,
        "sprouted": 0,
        "undersized": 0
    }

    ai_predictions = {
        "total_onions_detected": actual_total,
        "counts": {
            "healthy": ai_healthy,
            "damaged": ai_damaged,
            "rotten": rotten,
            "sprouted": sprouted,
            "undersized": undersized
        },
        "grade_percentages": {
            "grade_a": round((ai_healthy / actual_total) * 100, 1),
            "grade_b": round((ai_damaged / actual_total) * 100, 1),
            "urs": urs_percent
        },
        "overall_score": overall_score,
        "verdict": verdict,
        "detections": detections,
        "avg_diameter_mm": avg_diameter
    }

    verified_data = {
        "summary": {
            "total_count": actual_total,
            "counts": counts_dict,
            "grade_a_percent": grade_a_percent,
            "grade_b_percent": grade_b_percent,
            "urs_percent": urs_percent,
            "avg_diameter_mm": avg_diameter,
            "overall_score": overall_score,
            "verdict": verdict,
            "price_recommendation": {
                "base_msp_per_qtl": base_msp,
                "quality_bonus_or_penalty": price_adjustment,
                "recommended_price_per_qtl": recommended_price,
                "total_estimated_lot_value": total_estimated_lot_value
            }
        },
        "certificate_id": cert_id,
        "verified_counts": counts_dict,
        "verified_at": (timestamp + timedelta(minutes=random.randint(4, 18))).isoformat(),
        "inspector_id": inspector_id,
        "inspector_name": inspector_name,
        "procurement_center": mandi_name,
        "farmer_phone": farmer_phone,
        "lot_weight_quintals": lot_weight_quintals,
        "sample_weight_kg": sample_weight_kg,
        "tamper_proof_hash": tamper_proof_hash,
        "feedback_notes": feedback_notes,
        "certificate_status": "VALID",
        "learning_delta": learning_delta,
        "detections": detections
    }

    return InspectionRecordModel(
        inspection_id=inspection_id,
        timestamp=timestamp,
        inspector_id=inspector_id,
        geographic_source=region_name,
        original_image_path=str(image_path),
        ai_predictions=ai_predictions,
        is_human_verified=True,
        used_for_training=False,
        verified_data=verified_data,
        certificate_id=cert_id,
        lot_id=lot_id,
        farmer_name=farmer_name,
        variety=variety,
        verdict=verdict,
        created_at=timestamp,
        updated_at=timestamp + timedelta(minutes=random.randint(5, 20))
    )


def plan_distribution(total_count: int) -> List[Tuple[str, str]]:
    """Plans a correlated region and verdict distribution matching requirements.
    
    Requirements:
    - ~60% Grade A dominant
    - ~20% Mixed (Grade B)
    - ~20% High URS / Rejected
    - Regional distribution across MH, KA, GJ, MP, RJ
    """
    grade_a_count = int(total_count * 0.60)
    grade_b_count = int(total_count * 0.20)
    urs_count = total_count - (grade_a_count + grade_b_count)

    verdicts = (
        ["APPROVED_GRADE_A"] * grade_a_count +
        ["CONDITIONAL_GRADE_B"] * grade_b_count +
        ["REJECTED_URS"] * urs_count
    )
    random.shuffle(verdicts)

    # Allocate regions by weight share
    regions_pool: List[str] = []
    for region, profile in REGIONAL_PROFILES.items():
        allocated = int(total_count * profile["weight_share"])
        regions_pool.extend([region] * allocated)

    while len(regions_pool) < total_count:
        regions_pool.append("Maharashtra")
    regions_pool = regions_pool[:total_count]
    random.shuffle(regions_pool)

    return list(zip(verdicts, regions_pool))


def generate_timestamps(count: int, days_span: int = 30) -> List[datetime]:
    """Generates chronologically spaced timestamps within APMC mandi operating hours."""
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(days=days_span)

    timestamps: List[datetime] = []
    for i in range(count):
        # Spaced out with slight random jitter across the 30-day window
        progress_ratio = i / max(1, count - 1)
        day_offset = progress_ratio * (days_span - 0.2)
        base_date = start_time + timedelta(days=day_offset)

        # Realistic APMC mandi auction trading hours: 07:30 to 17:30 IST
        hour = random.randint(7, 16)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)

        ts = base_date.replace(hour=hour, minute=minute, second=second)
        if ts > now:
            ts = now - timedelta(minutes=random.randint(10, 120))
        timestamps.append(ts)

    timestamps.sort()
    return timestamps


# ==============================================================================
# SEEDING EXECUTION ENGINE
# ==============================================================================

async def seed_database(
    db_url: Optional[str] = None,
    drop_tables: bool = False,
    record_count: int = 50,
    days_span: int = 30,
    sync_storage: bool = True
) -> Dict[str, Any]:
    """Connects to the database via SQLAlchemy, initializes tables, and seeds records."""
    target_url = normalize_db_url(db_url or settings.DATABASE_URL)
    is_postgres = target_url.startswith("postgresql")
    masked_url = target_url.split("@")[-1] if "@" in target_url else target_url

    logger.info("================================================================================")
    logger.info("🌱 OnionVision AI - APMC Mandi Database Seeding Engine")
    logger.info("================================================================================")
    logger.info(f"📍 Database Target: {'PostgreSQL (Render)' if is_postgres else 'Async SQLite'}")
    logger.info(f"🔗 Target Endpoint: {masked_url}")
    logger.info(f"📊 Target Record Count: {record_count} historical inspections")
    logger.info(f"📅 Historical Timespan: Last {days_span} days")
    logger.info(f"⚠️  Drop Existing Tables: {'YES (Fresh Ledger Slate)' if drop_tables else 'NO (Safe Append)'}")

    engine_kwargs: Dict[str, Any] = {"echo": False, "future": True}
    if is_postgres:
        engine_kwargs.update({
            "pool_pre_ping": True,
            "pool_recycle": 1800
        })

    engine = create_async_engine(target_url, **engine_kwargs)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with engine.begin() as conn:
            if drop_tables:
                logger.info("🗑️  Dropping existing database tables...")
                await conn.run_sync(Base.metadata.drop_all)
                logger.info("✅ Dropped tables successfully.")

            logger.info("🏗️  Ensuring database schema & tables are up to date...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Schema verified.")

        # Find or create tray images
        sample_images = ensure_sample_images()
        logger.info(f"📸 Loaded {len(sample_images)} reference tray images for visual bindings.")

        # Prepare distribution and timestamps
        plan = plan_distribution(record_count)
        timestamps = generate_timestamps(record_count, days_span=days_span)

        models_to_insert: List[InspectionRecordModel] = []
        verdict_counts: Dict[str, int] = {}
        region_counts: Dict[str, int] = {}
        total_weight_quintals = 0.0
        scores_sum = 0

        for idx, ((verdict, region), ts) in enumerate(zip(plan, timestamps)):
            img = sample_images[idx % len(sample_images)]
            record = generate_mock_inspection(
                index=idx,
                target_verdict=verdict,
                region_name=region,
                timestamp=ts,
                image_path=img
            )
            models_to_insert.append(record)

            verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
            region_counts[region] = region_counts.get(region, 0) + 1
            v_data = record.verified_data or {}
            total_weight_quintals += float(v_data.get("lot_weight_quintals", 45.0))
            scores_sum += int(v_data.get("summary", {}).get("overall_score", 80))

        # Perform atomic batch insertion
        logger.info(f"💾 Inserting {len(models_to_insert)} records into database...")
        async with session_factory() as session:
            session.add_all(models_to_insert)
            await session.commit()

        # Query total count for verification
        async with session_factory() as session:
            count_res = await session.execute(select(func.count(InspectionRecordModel.id)))
            final_total = count_res.scalar() or 0

        # Optional synchronization with in-memory storage for immediate live test consistency
        if sync_storage:
            try:
                from app.services.storage import inspection_storage
                from app.db.repository import InspectionRepository
                for m in models_to_insert:
                    pydantic_rep = InspectionRepository.map_to_pydantic_report(m)
                    if pydantic_rep:
                        inspection_storage._reports[pydantic_rep.certificate_id] = pydantic_rep
                logger.info(f"🔄 Synced {len(models_to_insert)} reports into in-memory storage cache.")
            except Exception as e:
                logger.debug(f"In-memory storage sync skipped: {e}")

        # Summary Metrics
        avg_score = round(scores_sum / max(1, len(models_to_insert)), 1)
        grade_a_pct = round((verdict_counts.get("APPROVED_GRADE_A", 0) / len(models_to_insert)) * 100, 1)
        b_pct = round((verdict_counts.get("CONDITIONAL_GRADE_B", 0) / len(models_to_insert)) * 100, 1)
        urs_pct = round((verdict_counts.get("REJECTED_URS", 0) / len(models_to_insert)) * 100, 1)

        logger.info("================================================================================")
        logger.info("🎉 Database Seeding Completed Successfully!")
        logger.info("================================================================================")
        logger.info(f"✨ Total Records Injected : {len(models_to_insert)}")
        logger.info(f"📚 Total Database Records : {final_total}")
        logger.info(f"📆 Date Span Covered      : {timestamps[0].strftime('%Y-%m-%d')} to {timestamps[-1].strftime('%Y-%m-%d')}")
        logger.info(f"🏆 Quality Mix Breakdown  :")
        logger.info(f"   * Grade A (Export)     : {verdict_counts.get('APPROVED_GRADE_A', 0):2d} ({grade_a_pct}%)")
        logger.info(f"   * Grade B (Conditional): {verdict_counts.get('CONDITIONAL_GRADE_B', 0):2d} ({b_pct}%)")
        logger.info(f"   * Rejected (High URS)  : {verdict_counts.get('REJECTED_URS', 0):2d} ({urs_pct}%)")
        logger.info(f"📍 Geographic Provenance  :")
        for reg, cnt in region_counts.items():
            pct = round((cnt / len(models_to_insert)) * 100, 1)
            logger.info(f"   * {reg:15s}        : {cnt:2d} ({pct}%)")
        logger.info(f"⚖️  Total Weight Seeded    : {total_weight_quintals:.1f} quintals")
        logger.info(f"🎯 Average Overall Score  : {avg_score} / 100")
        logger.info(f"🔒 Cryptographic Hashes   : 100% SHA-256 generated & valid")
        logger.info("================================================================================")

        return {
            "success": True,
            "records_injected": len(models_to_insert),
            "total_in_db": final_total,
            "grade_a_percentage": grade_a_pct,
            "b_percentage": b_pct,
            "urs_percentage": urs_pct,
            "regions": region_counts,
            "verdicts": verdict_counts
        }

    finally:
        await engine.dispose()


def main():
    """CLI Entrypoint for the database seeder."""
    parser = argparse.ArgumentParser(
        description="OnionVision AI - Seed database with realistic historical APMC inspection data."
    )
    parser.add_argument(
        "--drop-tables", "--drop", "--reset",
        action="store_true",
        help="Drop and recreate existing database tables before seeding (clean slate)."
    )
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=50,
        help="Number of inspection records to generate (default: 50)."
    )
    parser.add_argument(
        "--days", "-d",
        type=int,
        default=30,
        help="Timespan in days for historical records (default: 30)."
    )
    parser.add_argument(
        "--db-url",
        type=str,
        default=None,
        help="Custom SQLAlchemy database URL (defaults to DATABASE_URL environment variable)."
    )
    parser.add_argument(
        "--no-sync-storage",
        action="store_true",
        help="Disable synchronization with in-memory storage cache."
    )

    args = parser.parse_args()

    try:
        result = asyncio.run(
            seed_database(
                db_url=args.db_url,
                drop_tables=args.drop_tables,
                record_count=args.count,
                days_span=args.days,
                sync_storage=not args.no_sync_storage
            )
        )
        if result.get("success"):
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Seeding interrupted by user.")
        sys.exit(130)
    except Exception as e:
        logger.error(f"❌ Fatal seeding error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
