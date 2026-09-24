"""Helper utility to seed realistic human-verified inspection records
into MongoDB for testing the National Onion Intelligence Dataset export pipeline.
"""

import os
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

from ..config import settings
from ..db.mongodb import MongoInspectionRepository, mongo_manager
from ..db.session import AsyncSessionLocal
from ..db.models import InspectionRecordModel
from ..services.onion_vision_engine import onion_vision_engine


REGIONS_CONFIG = [
    {
        "region": "Maharashtra",
        "mandi": "Lasalgaon APMC",
        "inspector": "INS-MH-042",
        "name": "Dr. Anil Kulkarni",
        "variety": "Bhima Super (Nashik Red)"
    },
    {
        "region": "Karnataka",
        "mandi": "Hubli-Dharwad APMC",
        "inspector": "INS-KA-018",
        "name": "Suresh Gowda",
        "variety": "Bellary Red Late Kharif"
    },
    {
        "region": "Gujarat",
        "mandi": "Mahuva APMC",
        "inspector": "INS-GJ-091",
        "name": "Hitesh Patel",
        "variety": "Mahuva White Hybrid"
    },
    {
        "region": "Madhya Pradesh",
        "mandi": "Neemuch Mandi",
        "inspector": "INS-MP-007",
        "name": "Rajesh Malviya",
        "variety": "Malwa Red Export Grade"
    }
]


async def seed_mongo_verified_dataset(count_per_region: int = 3) -> int:
    """Populates MongoDB with human-verified records linked to real uploads."""
    if not await mongo_manager.ping():
        mongo_manager.connect()

    upload_files = [
        f for f in settings.UPLOAD_PATH.iterdir()
        if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')
    ]

    if not upload_files:
        # Create a few dummy images if uploads folder is empty
        for i in range(5):
            dummy = settings.UPLOAD_PATH / f"seed_onion_tray_{i + 1}.jpg"
            if not dummy.exists():
                from PIL import Image, ImageDraw
                im = Image.new("RGB", (640, 640), (190, 130, 100))
                draw = ImageDraw.Draw(im)
                draw.rectangle([100, 100, 540, 540], fill=(160, 60, 60))
                im.save(dummy)
                upload_files.append(dummy)

    total_seeded = 0
    img_idx = 0

    for reg_info in REGIONS_CONFIG:
        for i in range(count_per_region):
            img_file = upload_files[img_idx % len(upload_files)]
            img_idx += 1

            insp_id = f"insp_{reg_info['region'][:2].lower()}_{uuid.uuid4().hex[:8]}"

            # Generate realistic detection boxes
            total_onions = random.randint(16, 32)
            healthy = int(total_onions * random.uniform(0.65, 0.85))
            rotten = max(0, int(total_onions * random.uniform(0.05, 0.12)))
            sprouted = max(0, int(total_onions * random.uniform(0.03, 0.08)))
            undersized = max(0, int(total_onions * random.uniform(0.05, 0.15)))
            damaged = max(0, total_onions - (healthy + rotten + sprouted + undersized))

            boxes = onion_vision_engine._generate_bounding_boxes(
                total_count=total_onions,
                healthy_count=healthy,
                damaged_count=damaged,
                rotten_count=rotten,
                sprouted_count=sprouted,
                undersized_count=undersized
            )

            now = datetime.now(timezone.utc)
            doc = {
                "inspection_id": insp_id,
                "timestamp": now,
                "inspector_id": reg_info["inspector"],
                "geographic_source": reg_info["region"],
                "original_image_path": str(img_file),
                "ai_predictions": {
                    "total_onions_detected": total_onions,
                    "counts": {"healthy": healthy, "damaged": damaged, "rotten": rotten, "sprouted": sprouted, "undersized": undersized},
                    "detections": boxes
                },
                "is_human_verified": True,
                "used_for_training": False,
                "verified_data": {
                    "inspector_id": reg_info["inspector"],
                    "inspector_name": reg_info["name"],
                    "procurement_center": reg_info["mandi"],
                    "variety": reg_info["variety"],
                    "feedback_notes": f"Accredited batch audit completed at {reg_info['mandi']}",
                    "verified_counts": {"healthy": healthy, "damaged": damaged, "rotten": rotten, "sprouted": sprouted, "undersized": undersized},
                    "detections": boxes,
                    "summary": {
                        "total_count": total_onions,
                        "grade_a_percent": round((healthy / total_onions) * 100, 1),
                        "urs_percent": round(((rotten + sprouted) / total_onions) * 100, 1),
                        "overall_score": 85
                    }
                },
                "lot_id": f"LOT-{reg_info['region'][:2].upper()}-{now.year}-{random.randint(1000, 9999)}",
                "farmer_name": f"Farmer from {reg_info['mandi']}",
                "variety": reg_info["variety"],
                "verdict": "APPROVED_GRADE_A" if rotten == 0 and sprouted == 0 else "CONDITIONAL_GRADE_B"
            }

            # Upsert into MongoDB
            await MongoInspectionRepository.upsert_record(doc)

            # Also persist in SQLite
            try:
                async with AsyncSessionLocal() as session:
                    record = InspectionRecordModel(
                        inspection_id=insp_id,
                        timestamp=now,
                        inspector_id=reg_info["inspector"],
                        geographic_source=reg_info["region"],
                        original_image_path=str(img_file),
                        ai_predictions=doc["ai_predictions"],
                        is_human_verified=True,
                        used_for_training=False,
                        verified_data=doc["verified_data"],
                        lot_id=doc["lot_id"],
                        farmer_name=doc["farmer_name"],
                        variety=doc["variety"],
                        verdict=doc["verdict"]
                    )
                    session.add(record)
                    await session.commit()
            except Exception:
                pass

            total_seeded += 1

    return total_seeded
