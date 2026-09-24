"""SQLAlchemy ORM models for OnionVision AI.
Defines the National Onion Intelligence Dataset schema.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
    Index
)
from sqlalchemy.orm import Mapped, mapped_column
from .session import Base

class InspectionRecordModel(Base):
    """Database model storing inspection records for the National Onion Intelligence Dataset.
    
    Contains computer vision predictions, human verification feedback deltas,
    and APMC mandi provenance metadata.
    """
    __tablename__ = "inspection_records"

    # Primary database surrogate key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Core required fields
    inspection_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="Unique inspection transaction identifier"
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
        comment="Timestamp when inspection was initiated"
    )

    inspector_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        comment="Identifier of accredited grading officer who verified the lot"
    )

    geographic_source: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        default="Maharashtra",
        comment="State / Mandi territory of agricultural harvest (Maharashtra, Karnataka, etc.)"
    )

    original_image_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Local filesystem or object storage path to the original raw tray image"
    )

    ai_predictions: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="JSON object storing AI vision inference outputs: counts, grade percentages, overall score, verdict, detections"
    )

    is_human_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Flag indicating if a human grading officer reviewed and certified this record"
    )

    used_for_training: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Flag indicating if this record was extracted and used for YOLO/ViT model retraining"
    )

    verified_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="JSON object storing human corrections, verified counts, learning deltas, and audit notes"
    )

    # Extended agricultural intelligence fields
    certificate_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        nullable=True,
        index=True,
        comment="Cryptographic digital certificate number"
    )

    lot_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        comment="APMC Mandi procurement lot tracking ID"
    )

    farmer_name: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        comment="Farmer name associated with the agricultural lot"
    )

    variety: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        default="Bhima Super (Nashik Red)",
        comment="Onion cultivar variety"
    )

    verdict: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True,
        index=True,
        comment="Current classification verdict: APPROVED_GRADE_A, CONDITIONAL_GRADE_B, REJECTED_URS"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Composite indexes for high-performance National Intelligence queries
    __table_args__ = (
        Index("ix_inspections_source_verdict", "geographic_source", "verdict"),
        Index("ix_inspections_verified_timestamp", "is_human_verified", "timestamp"),
        Index("ix_inspections_training_export", "is_human_verified", "used_for_training"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serializes ORM model to dictionary."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "inspector_id": self.inspector_id,
            "geographic_source": self.geographic_source,
            "original_image_path": self.original_image_path,
            "ai_predictions": self.ai_predictions,
            "is_human_verified": self.is_human_verified,
            "used_for_training": self.used_for_training,
            "verified_data": self.verified_data,
            "certificate_id": self.certificate_id,
            "lot_id": self.lot_id,
            "farmer_name": self.farmer_name,
            "variety": self.variety,
            "verdict": self.verdict,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

