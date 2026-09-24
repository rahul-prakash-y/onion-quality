from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Grading Enums & Types
GradeClassification = Literal["Grade A", "Grade B", "URS"]
DefectType = Literal["none", "sprouted", "rotten", "mould", "undersized", "mechanical_cut", "double"]
FirmnessType = Literal["Hard", "Firm", "Soft", "Spongy"]
VerdictType = Literal["APPROVED_GRADE_A", "CONDITIONAL_GRADE_B", "REJECTED_URS"]
VerificationStatus = Literal["pending", "approved", "flagged"]
GeographicRegion = Literal["Maharashtra", "Madhya Pradesh", "Karnataka", "Gujarat", "Rajasthan"]

class DefectCounts(BaseModel):
    """Granular counts of onions by defect category."""
    model_config = ConfigDict(populate_by_name=True)

    healthy: int = Field(default=0, description="Count of sound, defect-free onions")
    damaged: int = Field(default=0, description="Count of onions with mechanical cuts or physical bruises")
    rotten: int = Field(default=0, description="Count of onions with neck rot, soft rot, or Aspergillus mould")
    sprouted: int = Field(default=0, description="Count of onions with broken dormancy / emerging green shoots")
    undersized: int = Field(default=0, description="Count of onions under market standard diameter (<45mm)")

    @property
    def total(self) -> int:
        return self.healthy + self.damaged + self.rotten + self.sprouted + self.undersized

class GradePercentages(BaseModel):
    """Calculated distribution percentages for quality tiers."""
    grade_a_percent: float = Field(..., description="Percentage of Grade A export/premium quality onions")
    urs_percent: float = Field(..., description="Percentage of Under Rejection Standard (URS) onions")
    grade_b_percent: float = Field(default=0.0, description="Percentage of Grade B fair average quality onions")

class OnionDetectionItem(BaseModel):
    """Individual detected onion item with bounding box, caliber, and classification."""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique detection identifier")
    x: float = Field(..., description="Bounding box horizontal coordinate (0-100 percentage)")
    y: float = Field(..., description="Bounding box vertical coordinate (0-100 percentage)")
    width: float = Field(..., description="Bounding box width (0-100 percentage)")
    height: float = Field(..., description="Bounding box height (0-100 percentage)")
    diameter_mm: float = Field(..., description="Estimated equatorial diameter in millimeters")
    grade: GradeClassification = Field(..., description="Assigned grade tier")
    defect: DefectType = Field(..., description="Assigned defect class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI detection confidence (0.0 to 1.0)")
    skin_quality_percent: float = Field(default=90.0, description="Husk integrity rating (0-100)")
    firmness: FirmnessType = Field(default="Hard", description="Estimated firmness texture")
    notes: str = Field(default="", description="Diagnostic notes from visual inference engine")

class PriceBreakdown(BaseModel):
    """APMC Mandi MSP and recommended pricing breakdown."""
    base_msp_per_qtl: int = Field(default=2400, description="Base Minimum Support Price in INR/quintal")
    quality_bonus_or_penalty: int = Field(default=0, description="Price premium or penalty in INR/quintal")
    recommended_price_per_qtl: int = Field(default=2400, description="Final recommended mandi price in INR/quintal")
    total_estimated_lot_value: int = Field(default=0, description="Total lot value estimate in INR")

class QualitySummary(BaseModel):
    """Comprehensive quality evaluation summary."""
    model_config = ConfigDict(populate_by_name=True)

    total_count: int = Field(..., description="Total onions detected in the sample")
    counts: DefectCounts = Field(..., description="Categorized defect counts (healthy, damaged, rotten, sprouted, undersized)")
    grade_a_percent: float = Field(..., description="Calculated Grade A percentage")
    urs_percent: float = Field(..., description="Calculated Under Rejection Standard percentage")
    grade_b_percent: float = Field(default=0.0, description="Calculated Grade B percentage")
    avg_diameter_mm: float = Field(..., description="Average equatorial diameter in millimeters")
    overall_score: int = Field(..., ge=0, le=100, description="Overall quality score out of 100")
    verdict: VerdictType = Field(..., description="Procurement batch verdict")
    price_recommendation: PriceBreakdown = Field(..., description="Recommended pricing valuation")

class UploadResponse(BaseModel):
    """Response payload for image upload."""
    inspection_id: str = Field(..., description="Unique inspection transaction identifier")
    filename: str = Field(..., description="Stored image filename")
    file_size_bytes: int = Field(..., description="Size of uploaded image in bytes")
    image_url: str = Field(..., description="Relative or absolute URL to view the uploaded image")
    upload_timestamp: str = Field(..., description="ISO 8601 upload timestamp")
    status: str = Field(default="UPLOADED", description="Current inspection status")
    message: str = Field(default="Image successfully uploaded and queued for AI analysis")

class AnalysisResponse(BaseModel):
    """Response payload for mock AI analysis."""
    model_config = ConfigDict(populate_by_name=True)

    inspection_id: str = Field(..., description="Unique inspection transaction identifier")
    total_onions_detected: int = Field(..., description="Total onions identified by AI vision engine")
    counts: DefectCounts = Field(..., description="Defect breakdown counts (healthy, damaged, rotten, sprouted, undersized)")
    grade_a_percent: float = Field(..., description="Calculated Grade A percentage")
    urs_percent: float = Field(..., description="Calculated Under Rejection Standard (URS) percentage")
    grade_b_percent: float = Field(default=0.0, description="Calculated Grade B percentage")
    avg_diameter_mm: float = Field(..., description="Average diameter of detected bulbs")
    overall_score: int = Field(..., description="Quality score (0-100)")
    verdict: VerdictType = Field(..., description="Grading classification verdict")
    detections: List[OnionDetectionItem] = Field(default_factory=list, description="Detailed bounding boxes and classifications")
    price_recommendation: PriceBreakdown = Field(..., description="Mandi price recommendations")
    analyzed_at: str = Field(..., description="Timestamp when AI analysis completed")

class CorrectedCountsInput(BaseModel):
    """Optional human-corrected defect counts."""
    healthy: Optional[int] = None
    damaged: Optional[int] = None
    rotten: Optional[int] = None
    sprouted: Optional[int] = None
    undersized: Optional[int] = None

class VerificationRequest(BaseModel):
    """Payload containing human-verified corrections to the AI prediction."""
    status: VerificationStatus = Field(default="approved", description="Human verification status ('approved' or 'flagged')")
    feedback_notes: Optional[str] = Field(None, description="Inspector justification notes or reason for correction")
    inspector_id: Optional[str] = Field(default="INS-APMC-042", description="ID of verifying grading officer")
    inspector_name: Optional[str] = Field(default="Anil Kulkarni (Grading Officer)", description="Name of verifying officer")
    corrected_counts: Optional[CorrectedCountsInput] = Field(None, description="Human-adjusted defect counts")
    corrected_grade_a_percent: Optional[float] = Field(None, description="Manual override for Grade A percentage")
    corrected_urs_percent: Optional[float] = Field(None, description="Manual override for URS percentage")

class HumanVerificationRecord(BaseModel):
    """Audit record for human-in-the-loop verification."""
    status: VerificationStatus = "pending"
    verified_at: Optional[str] = None
    inspector_id: Optional[str] = None
    inspector_name: Optional[str] = None
    feedback_notes: Optional[str] = None
    original_ai_counts: Optional[DefectCounts] = None
    verified_counts: Optional[DefectCounts] = None

class DigitalCertificateReport(BaseModel):
    """Verified digital quality certificate report for APMC procurement."""
    model_config = ConfigDict(populate_by_name=True)

    certificate_id: str = Field(..., description="Cryptographic unique certificate identifier")
    inspection_id: str = Field(..., description="Associated inspection identifier")
    timestamp: str = Field(..., description="Certification timestamp")
    lot_id: str = Field(..., description="Procurement lot identifier")
    farmer_name: str = Field(..., description="Registered farmer name")
    farmer_phone: str = Field(default="+91 98220 14592", description="Farmer contact number")
    procurement_center: str = Field(default="Lasalgaon APMC Main Yard", description="Mandi procurement center")
    geographic_source: GeographicRegion = Field(default="Maharashtra", description="State of agricultural origin")
    inspector_id: str = Field(default="INS-APMC-042", description="Accredited inspector ID")
    inspector_name: str = Field(default="Anil Kulkarni", description="Inspector name")
    variety: str = Field(default="Bhima Super (Nashik Red)", description="Cultivar variety")
    lot_weight_quintals: float = Field(default=45.0, description="Total lot weight in quintals")
    sample_weight_kg: float = Field(default=5.0, description="Sample weight evaluated")
    summary: QualitySummary = Field(..., description="Verified quality summary")
    detections: Optional[List[OnionDetectionItem]] = Field(default=None, description="Bounding box detection details")
    tamper_proof_hash: str = Field(..., description="SHA-256 integrity hash")
    status: Literal["VALID", "DISPUTED", "RE_EVALUATED"] = Field(default="VALID", description="Report status")
    synced_to_cloud: bool = Field(default=True, description="Sync status to central cloud repository")
    human_verification: HumanVerificationRecord = Field(..., description="Inspector verification trail")

class VerificationResponse(BaseModel):
    """Response payload after human verification has been registered."""
    inspection_id: str = Field(..., description="Unique inspection transaction identifier")
    certificate_id: str = Field(..., description="Generated digital certificate ID")
    status: VerificationStatus = Field(..., description="Human verification status")
    verified_at: str = Field(..., description="ISO timestamp of verification")
    summary: QualitySummary = Field(..., description="Updated quality summary after human corrections")
    feedback_notes: Optional[str] = Field(None, description="Inspector feedback recorded for model retraining")
    learning_delta: Dict[str, Any] = Field(default_factory=dict, description="Continuous learning difference vector (AI prediction vs Human correction)")
    report: DigitalCertificateReport = Field(..., description="Full verified digital report generated")

class ReportHistoryResponse(BaseModel):
    """Response payload for verified inspection reports history."""
    total_count: int = Field(..., description="Total count of verified reports matching query")
    reports: List[DigitalCertificateReport] = Field(..., description="List of verified inspection certificate reports")
