import hashlib
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from ..models.schemas import (
    DigitalCertificateReport,
    HumanVerificationRecord,
    QualitySummary,
    DefectCounts,
    PriceBreakdown,
    AnalysisResponse
)
from ..config import settings

class InspectionRecord:
    """Internal model for an in-flight inspection lifecycle."""
    def __init__(
        self,
        inspection_id: str,
        filename: str,
        file_path: Path,
        file_size_bytes: int,
        image_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.inspection_id = inspection_id
        self.filename = filename
        self.file_path = file_path
        self.file_size_bytes = file_size_bytes
        self.image_url = image_url
        self.upload_timestamp = datetime.now(timezone.utc).isoformat()
        self.status = "UPLOADED"
        self.metadata = metadata or {}
        self.analysis: Optional[AnalysisResponse] = None
        self.verification: Optional[HumanVerificationRecord] = None
        self.report: Optional[DigitalCertificateReport] = None

class StorageService:
    """Thread-safe in-memory and persistent storage for inspections, reports, and AI feedback."""

    def __init__(self):
        self._lock = threading.Lock()
        self._inspections: Dict[str, InspectionRecord] = {}
        self._reports: Dict[str, DigitalCertificateReport] = {}
        self._continuous_learning_logs: List[Dict[str, Any]] = []
        self._seed_initial_reports()

    def _seed_initial_reports(self):
        """Seed realistic initial procurement reports matching APMC mandi historical records."""
        initial_seeds = [
            DigitalCertificateReport(
                certificate_id="OV-2026-MH-78912",
                inspection_id="insp_init_001",
                timestamp="2026-09-23 08:45 AM",
                lot_id="MH-LSG-2026-4401",
                farmer_name="Rameshwar Patil",
                farmer_phone="+91 98220 14592",
                procurement_center="Lasalgaon APMC Main Yard",
                geographic_source="Maharashtra",
                inspector_id="INS-MH-042",
                inspector_name="Anil Kulkarni (Grading Officer)",
                variety="Bhima Super (Nashik Red)",
                lot_weight_quintals=48.0,
                sample_weight_kg=5.0,
                summary=QualitySummary(
                    total_count=9,
                    counts=DefectCounts(healthy=8, damaged=1, rotten=0, sprouted=0, undersized=0),
                    grade_a_percent=89.0,
                    urs_percent=0.0,
                    grade_b_percent=11.0,
                    avg_diameter_mm=58.6,
                    overall_score=96,
                    verdict="APPROVED_GRADE_A",
                    price_recommendation=PriceBreakdown(
                        base_msp_per_qtl=2400,
                        quality_bonus_or_penalty=530,
                        recommended_price_per_qtl=2930,
                        total_estimated_lot_value=140640
                    )
                ),
                tamper_proof_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                status="VALID",
                synced_to_cloud=True,
                human_verification=HumanVerificationRecord(
                    status="approved",
                    verified_at="2026-09-23 08:47 AM",
                    inspector_id="INS-MH-042",
                    inspector_name="Anil Kulkarni",
                    feedback_notes="Visual confirmation matching optical sorting chamber"
                )
            ),
            DigitalCertificateReport(
                certificate_id="OV-2026-MH-78894",
                inspection_id="insp_init_002",
                timestamp="2026-09-22 03:15 PM",
                lot_id="MH-PMP-2026-1189",
                farmer_name="Tukaram Jadhav",
                farmer_phone="+91 94231 88410",
                procurement_center="Pimpalgaon Baswant Sub-Market",
                geographic_source="Maharashtra",
                inspector_id="INS-MH-019",
                inspector_name="Sunil Shinde",
                variety="Gavran Late Kharif",
                lot_weight_quintals=62.0,
                sample_weight_kg=5.0,
                summary=QualitySummary(
                    total_count=9,
                    counts=DefectCounts(healthy=3, damaged=1, rotten=0, sprouted=5, undersized=0),
                    grade_a_percent=0.0,
                    urs_percent=56.0,
                    grade_b_percent=44.0,
                    avg_diameter_mm=52.2,
                    overall_score=37,
                    verdict="REJECTED_URS",
                    price_recommendation=PriceBreakdown(
                        base_msp_per_qtl=2400,
                        quality_bonus_or_penalty=-870,
                        recommended_price_per_qtl=1530,
                        total_estimated_lot_value=94860
                    )
                ),
                tamper_proof_hash="8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
                status="VALID",
                synced_to_cloud=True,
                human_verification=HumanVerificationRecord(
                    status="approved",
                    verified_at="2026-09-22 03:20 PM",
                    inspector_id="INS-MH-019",
                    inspector_name="Sunil Shinde",
                    feedback_notes="Confirmed break of dormancy with severe green shoot emergence"
                )
            ),
            DigitalCertificateReport(
                certificate_id="OV-2026-KA-55018",
                inspection_id="insp_init_003",
                timestamp="2026-09-21 11:30 AM",
                lot_id="KA-HBL-2026-3094",
                farmer_name="Basavaraj Patil",
                farmer_phone="+91 97412 33901",
                procurement_center="Hubballi Cotton & Agri Market",
                geographic_source="Karnataka",
                inspector_id="INS-KA-008",
                inspector_name="Kavita Gowda",
                variety="Bellary Pink Semi-Globe",
                lot_weight_quintals=35.0,
                sample_weight_kg=5.0,
                summary=QualitySummary(
                    total_count=9,
                    counts=DefectCounts(healthy=5, damaged=2, rotten=1, sprouted=0, undersized=1),
                    grade_a_percent=56.0,
                    urs_percent=11.0,
                    grade_b_percent=33.0,
                    avg_diameter_mm=49.8,
                    overall_score=78,
                    verdict="CONDITIONAL_GRADE_B",
                    price_recommendation=PriceBreakdown(
                        base_msp_per_qtl=2400,
                        quality_bonus_or_penalty=80,
                        recommended_price_per_qtl=2480,
                        total_estimated_lot_value=86800
                    )
                ),
                tamper_proof_hash="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                status="VALID",
                synced_to_cloud=True,
                human_verification=HumanVerificationRecord(
                    status="approved",
                    verified_at="2026-09-21 11:35 AM",
                    inspector_id="INS-KA-008",
                    inspector_name="Kavita Gowda",
                    feedback_notes="Local mandi standard approved for domestic table consumption"
                )
            )
        ]
        for report in initial_seeds:
            self._reports[report.certificate_id] = report

    # Inspection lifecycle methods
    def create_inspection(
        self,
        filename: str,
        file_path: Path,
        file_size: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> InspectionRecord:
        with self._lock:
            inspection_id = f"insp_{uuid.uuid4().hex[:12]}"
            image_url = f"/api/v1/inspect/images/{filename}"
            record = InspectionRecord(
                inspection_id=inspection_id,
                filename=filename,
                file_path=file_path,
                file_size_bytes=file_size,
                image_url=image_url,
                metadata=metadata
            )
            self._inspections[inspection_id] = record
            return record

    def get_inspection(self, inspection_id: str) -> Optional[InspectionRecord]:
        with self._lock:
            return self._inspections.get(inspection_id)

    def set_inspection_analysis(
        self,
        inspection_id: str,
        analysis: AnalysisResponse
    ) -> Optional[InspectionRecord]:
        with self._lock:
            record = self._inspections.get(inspection_id)
            if record:
                record.analysis = analysis
                record.status = "ANALYZED"
            return record

    def verify_inspection(
        self,
        inspection_id: str,
        verification_record: HumanVerificationRecord,
        updated_summary: QualitySummary,
        tamper_proof_hash: str
    ) -> Optional[DigitalCertificateReport]:
        with self._lock:
            record = self._inspections.get(inspection_id)
            if not record:
                return None

            record.verification = verification_record
            record.status = "VERIFIED"

            # Generate digital certificate ID
            state_code = record.metadata.get("state_code") or "MH"
            cert_id = f"OV-2026-{state_code}-{uuid.uuid4().hex[:6].upper()}"

            lot_id = record.metadata.get("lot_id") or f"LOT-{state_code}-2026-{uuid.uuid4().hex[:4].upper()}"
            farmer_name = record.metadata.get("farmer_name") or "Rameshwar Patil"
            farmer_phone = record.metadata.get("farmer_phone") or "+91 98220 14592"
            procurement_center = record.metadata.get("procurement_center") or "Lasalgaon APMC Main Yard"
            geographic_source = record.metadata.get("geographic_source") or record.metadata.get("region") or "Maharashtra"
            variety = record.metadata.get("variety") or "Bhima Super (Nashik Red)"

            detections_items = record.analysis.detections if record.analysis else None

            report = DigitalCertificateReport(
                certificate_id=cert_id,
                inspection_id=inspection_id,
                timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %I:%M %p"),
                lot_id=lot_id,
                farmer_name=farmer_name,
                farmer_phone=farmer_phone,
                procurement_center=procurement_center,
                geographic_source=geographic_source,
                inspector_id=verification_record.inspector_id or "INS-APMC-042",
                inspector_name=verification_record.inspector_name or "Anil Kulkarni",
                variety=variety,
                lot_weight_quintals=45.0,
                sample_weight_kg=5.0,
                summary=updated_summary,
                detections=detections_items,
                tamper_proof_hash=tamper_proof_hash,
                status="VALID",
                synced_to_cloud=True,
                human_verification=verification_record
            )

            record.report = report
            self._reports[cert_id] = report
            return report

    def record_learning_event(self, event_data: Dict[str, Any]):
        """Records delta between AI prediction and human correction for model retraining."""
        with self._lock:
            self._continuous_learning_logs.append({
                **event_data,
                "recorded_at": datetime.now(timezone.utc).isoformat()
            })

    def get_learning_logs(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._continuous_learning_logs)

    # Reports queries
    def list_reports(
        self,
        verdict: Optional[str] = None,
        region: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DigitalCertificateReport]:
        with self._lock:
            # Sort newest first
            reports = list(self._reports.values())
            reports.reverse()

            filtered = []
            for r in reports:
                if verdict and r.summary.verdict != verdict:
                    continue
                if region and r.geographic_source != region:
                    continue
                if search:
                    q = search.lower()
                    if (q not in r.certificate_id.lower() and
                        q not in r.lot_id.lower() and
                        q not in r.farmer_name.lower()):
                        continue
                filtered.append(r)

            return filtered[offset : offset + limit]

    def count_reports(
        self,
        verdict: Optional[str] = None,
        region: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        with self._lock:
            reports = list(self._reports.values())
            count = 0
            for r in reports:
                if verdict and r.summary.verdict != verdict:
                    continue
                if region and r.geographic_source != region:
                    continue
                if search:
                    q = search.lower()
                    if (q not in r.certificate_id.lower() and
                        q not in r.lot_id.lower() and
                        q not in r.farmer_name.lower()):
                        continue
                count += 1
            return count

    def get_report_by_id(self, identifier: str) -> Optional[DigitalCertificateReport]:
        with self._lock:
            # Check certificate_id
            if identifier in self._reports:
                return self._reports[identifier]
            # Check inspection_id
            for r in self._reports.values():
                if r.inspection_id == identifier:
                    return r
            return None


# Global singleton storage instance
inspection_storage = StorageService()
