import hashlib
import random
from datetime import datetime, timezone
from typing import List, Tuple, Optional
from ..models.schemas import (
    DefectCounts,
    OnionDetectionItem,
    PriceBreakdown,
    QualitySummary,
    AnalysisResponse,
    VerdictType,
    GradeClassification,
    DefectType,
    FirmnessType
)
from ..config import settings

class AIGradingEngine:
    """Mock AI Computer Vision Grading Engine for Agricultural Onion Quality Inspection.
    
    Simulates high-precision object detection, segmentation, defect classification,
    and APMC-compliant grading metrics.
    """

    @classmethod
    def analyze(
        cls,
        inspection_id: str,
        image_path: Optional[str] = None,
        preset_hint: Optional[str] = None
    ) -> AnalysisResponse:
        """Runs the mock computer vision inference pipeline on the uploaded inspection image."""
        # Derive a stable seed from the inspection_id for reproducible yet diverse analysis
        seed_value = int(hashlib.sha256(inspection_id.encode('utf-8')).hexdigest()[:8], 16)
        rng = random.Random(seed_value)

        # Determine defect profile based on preset hint or random distribution
        detections = cls._generate_detections(rng, preset_hint)
        summary = cls.calculate_quality_summary(detections)

        now_iso = datetime.now(timezone.utc).isoformat()

        return AnalysisResponse(
            inspection_id=inspection_id,
            total_onions_detected=summary.total_count,
            counts=summary.counts,
            grade_a_percent=summary.grade_a_percent,
            urs_percent=summary.urs_percent,
            grade_b_percent=summary.grade_b_percent,
            avg_diameter_mm=summary.avg_diameter_mm,
            overall_score=summary.overall_score,
            verdict=summary.verdict,
            detections=detections,
            price_recommendation=summary.price_recommendation,
            analyzed_at=now_iso
        )

    @classmethod
    def _generate_detections(
        cls,
        rng: random.Random,
        preset_hint: Optional[str] = None
    ) -> List[OnionDetectionItem]:
        """Generates realistic bounding boxes, calibers, and defect classifications."""
        # Grid positions for standard 3x3 to 3x4 inspection trays
        grid_positions = [
            (14, 18), (40, 14), (66, 16),
            (12, 44), (38, 42), (66, 43),
            (16, 70), (42, 68), (68, 69),
            (25, 28), (52, 54)
        ]

        # Preset profiles
        total_items = rng.randint(9, 11)
        positions = grid_positions[:total_items]

        # Determine target defect distribution
        scenario = preset_hint or rng.choice(["premium", "mixed", "sprouted_heavy", "neck_rot", "undersized"])

        detections: List[OnionDetectionItem] = []

        for idx, (base_x, base_y) in enumerate(positions):
            det_id = f"det-{idx + 1}"
            x = max(5.0, min(85.0, base_x + rng.uniform(-2.0, 2.0)))
            y = max(5.0, min(85.0, base_y + rng.uniform(-2.0, 2.0)))
            w = round(rng.uniform(18.0, 23.0), 1)
            h = round(rng.uniform(18.0, 23.0), 1)

            defect: DefectType = "none"
            grade: GradeClassification = "Grade A"
            firmness: FirmnessType = "Hard"
            skin_quality = round(rng.uniform(90.0, 98.0), 1)
            diameter = round(rng.uniform(55.0, 68.0), 1)
            confidence = round(rng.uniform(0.92, 0.99), 2)
            notes = "Optimal globular shape, dry tight neck"

            if scenario == "premium":
                # High Grade A, few Grade B
                if idx == len(positions) - 1 and rng.random() > 0.5:
                    grade = "Grade B"
                    firmness = "Firm"
                    skin_quality = round(rng.uniform(80.0, 85.0), 1)
                    diameter = round(rng.uniform(50.0, 54.0), 1)
                    notes = "Slight scale flaking, firm pulp"

            elif scenario == "sprouted_heavy":
                # Multiple sprouted bulbs
                if idx in (0, 2, 4, 7):
                    defect = "sprouted"
                    grade = "URS"
                    firmness = rng.choice(["Soft", "Spongy"])
                    skin_quality = round(rng.uniform(60.0, 72.0), 1)
                    notes = "Green apical sprout emerging through neck tunic"
                elif idx == 5:
                    defect = "mechanical_cut"
                    grade = "Grade B"
                    firmness = "Firm"
                    notes = "Harvester sickle abrasion on outer sheath"
                else:
                    grade = "Grade B"
                    firmness = "Firm"

            elif scenario == "neck_rot":
                # Rot and mould defects
                if idx in (1, 3, 6):
                    defect = rng.choice(["rotten", "mould"])
                    grade = "URS"
                    firmness = "Soft"
                    skin_quality = round(rng.uniform(50.0, 65.0), 1)
                    notes = "Bacterial soft rot and Aspergillus niger black spores"
                elif idx == 8:
                    defect = "mechanical_cut"
                    grade = "URS"
                    firmness = "Firm"
                    notes = "Deep cut extending into succulent scales"
                else:
                    grade = "Grade B"
                    firmness = "Firm"

            elif scenario == "undersized":
                # Multiple undersized bulbs
                if idx in (0, 3, 5):
                    defect = "undersized"
                    grade = "Grade B"
                    diameter = round(rng.uniform(36.0, 44.0), 1)
                    notes = "Caliber below 45mm export grade threshold"
                elif idx == 7:
                    defect = "mechanical_cut"
                    grade = "Grade B"
                    diameter = round(rng.uniform(46.0, 50.0), 1)
                    notes = "Surface grading abrasion"
                else:
                    diameter = round(rng.uniform(46.0, 52.0), 1)
                    grade = "Grade B"

            else:  # Mixed realistic sample
                pick = rng.random()
                if pick < 0.15:
                    defect = "sprouted"
                    grade = "URS"
                    firmness = "Spongy"
                    notes = "Shoot protrusion detected"
                elif pick < 0.28:
                    defect = "rotten"
                    grade = "URS"
                    firmness = "Soft"
                    notes = "Neck moisture weeping and decay"
                elif pick < 0.40:
                    defect = "mechanical_cut"
                    grade = "Grade B"
                    notes = "Harvester bruise"
                elif pick < 0.52:
                    defect = "undersized"
                    grade = "Grade B"
                    diameter = round(rng.uniform(38.0, 44.5), 1)
                    notes = "Undersized diameter"
                elif pick < 0.80:
                    grade = "Grade A"
                    diameter = round(rng.uniform(55.0, 65.0), 1)
                else:
                    grade = "Grade B"
                    diameter = round(rng.uniform(48.0, 53.0), 1)
                    firmness = "Firm"

            detections.append(
                OnionDetectionItem(
                    id=det_id,
                    x=round(x, 1),
                    y=round(y, 1),
                    width=w,
                    height=h,
                    diameter_mm=diameter,
                    grade=grade,
                    defect=defect,
                    confidence=confidence,
                    skin_quality_percent=skin_quality,
                    firmness=firmness,
                    notes=notes
                )
            )

        return detections

    @classmethod
    def calculate_quality_summary(
        cls,
        detections: List[OnionDetectionItem],
        base_msp_per_qtl: int = settings.BASE_MSP_PER_QTL,
        lot_weight_qtl: float = 45.0
    ) -> QualitySummary:
        """Calculates defect counts, Grade A / URS percentages, overall score, and pricing."""
        total = len(detections)
        if total == 0:
            return QualitySummary(
                total_count=0,
                counts=DefectCounts(),
                grade_a_percent=0.0,
                urs_percent=0.0,
                grade_b_percent=0.0,
                avg_diameter_mm=0.0,
                overall_score=0,
                verdict="REJECTED_URS",
                price_recommendation=PriceBreakdown()
            )

        grade_a_count = 0
        grade_b_count = 0
        urs_count = 0
        sum_diameter = 0.0

        healthy_cnt = 0
        damaged_cnt = 0
        rotten_cnt = 0
        sprouted_cnt = 0
        undersized_cnt = 0

        for d in detections:
            sum_diameter += d.diameter_mm
            if d.grade == "Grade A":
                grade_a_count += 1
            elif d.grade == "Grade B":
                grade_b_count += 1
            else:
                urs_count += 1

            if d.defect == "none":
                healthy_cnt += 1
            elif d.defect == "mechanical_cut":
                damaged_cnt += 1
            elif d.defect in ("rotten", "mould"):
                rotten_cnt += 1
            elif d.defect == "sprouted":
                sprouted_cnt += 1
            elif d.defect == "undersized":
                undersized_cnt += 1
            else:
                # Double or miscellaneous
                damaged_cnt += 1

        grade_a_pct = round((grade_a_count / total) * 100, 1)
        grade_b_pct = round((grade_b_count / total) * 100, 1)
        urs_pct = round(max(0.0, 100.0 - grade_a_pct - grade_b_pct), 1)
        avg_diameter = round(sum_diameter / total, 1)

        # Weighted quality score out of 100: Grade A (100%), Grade B (65%), URS (15%)
        weighted_score = int(round(
            (grade_a_pct * 1.0) + (grade_b_pct * 0.65) + (urs_pct * 0.15)
        ))
        overall_score = max(0, min(100, weighted_score))

        # APMC Mandi Verdict Thresholds
        if grade_a_pct >= 70.0 and urs_pct <= 12.0:
            verdict: VerdictType = "APPROVED_GRADE_A"
        elif urs_pct > 30.0:
            verdict = "REJECTED_URS"
        else:
            verdict = "CONDITIONAL_GRADE_B"

        # Pricing recommendations
        quality_mult = (grade_a_pct * 1.25 + grade_b_pct * 1.0 + urs_pct * 0.35) / 100.0
        rec_price = int(round(base_msp_per_qtl * quality_mult))
        bonus_or_penalty = rec_price - base_msp_per_qtl
        total_lot_val = int(round(rec_price * lot_weight_qtl))

        counts = DefectCounts(
            healthy=healthy_cnt,
            damaged=damaged_cnt,
            rotten=rotten_cnt,
            sprouted=sprouted_cnt,
            undersized=undersized_cnt
        )

        price = PriceBreakdown(
            base_msp_per_qtl=base_msp_per_qtl,
            quality_bonus_or_penalty=bonus_or_penalty,
            recommended_price_per_qtl=rec_price,
            total_estimated_lot_value=total_lot_val
        )

        return QualitySummary(
            total_count=total,
            counts=counts,
            grade_a_percent=grade_a_pct,
            urs_percent=urs_pct,
            grade_b_percent=grade_b_pct,
            avg_diameter_mm=avg_diameter,
            overall_score=overall_score,
            verdict=verdict,
            price_recommendation=price
        )

    @classmethod
    def recalculate_from_corrected_counts(
        cls,
        original_summary: QualitySummary,
        corrected_counts: DefectCounts,
        override_grade_a_pct: Optional[float] = None,
        override_urs_pct: Optional[float] = None,
        base_msp_per_qtl: int = settings.BASE_MSP_PER_QTL,
        lot_weight_qtl: float = 45.0
    ) -> QualitySummary:
        """Recalculates quality metrics when a human inspector updates defect counts."""
        total = corrected_counts.total
        if total == 0:
            total = original_summary.total_count or 1

        # Derive approximate grade distribution from corrected counts:
        # Healthy contributes primarily to Grade A (and upper Grade B)
        # Damaged and undersized contribute to Grade B or URS
        # Rotten and sprouted contribute to URS
        if override_grade_a_pct is not None and override_urs_pct is not None:
            grade_a_pct = round(override_grade_a_pct, 1)
            urs_pct = round(override_urs_pct, 1)
            grade_b_pct = round(max(0.0, 100.0 - grade_a_pct - urs_pct), 1)
        else:
            severe_defects = corrected_counts.rotten + corrected_counts.sprouted
            moderate_defects = corrected_counts.damaged + corrected_counts.undersized
            healthy = corrected_counts.healthy

            urs_pct = round((severe_defects / total) * 100, 1)
            # Healthy with minimum threshold for Grade A
            grade_a_pct = round(max(0.0, (healthy / total) * 100 * 0.9), 1)
            grade_b_pct = round(max(0.0, 100.0 - grade_a_pct - urs_pct), 1)

        weighted_score = int(round(
            (grade_a_pct * 1.0) + (grade_b_pct * 0.65) + (urs_pct * 0.15)
        ))
        overall_score = max(0, min(100, weighted_score))

        if grade_a_pct >= 70.0 and urs_pct <= 12.0:
            verdict: VerdictType = "APPROVED_GRADE_A"
        elif urs_pct > 30.0:
            verdict = "REJECTED_URS"
        else:
            verdict = "CONDITIONAL_GRADE_B"

        quality_mult = (grade_a_pct * 1.25 + grade_b_pct * 1.0 + urs_pct * 0.35) / 100.0
        rec_price = int(round(base_msp_per_qtl * quality_mult))
        bonus_or_penalty = rec_price - base_msp_per_qtl
        total_lot_val = int(round(rec_price * lot_weight_qtl))

        price = PriceBreakdown(
            base_msp_per_qtl=base_msp_per_qtl,
            quality_bonus_or_penalty=bonus_or_penalty,
            recommended_price_per_qtl=rec_price,
            total_estimated_lot_value=total_lot_val
        )

        return QualitySummary(
            total_count=total,
            counts=corrected_counts,
            grade_a_percent=grade_a_pct,
            urs_percent=urs_pct,
            grade_b_percent=grade_b_pct,
            avg_diameter_mm=original_summary.avg_diameter_mm,
            overall_score=overall_score,
            verdict=verdict,
            price_recommendation=price
        )
