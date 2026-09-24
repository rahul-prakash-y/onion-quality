from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from ..models.schemas import (
    ReportHistoryResponse,
    DigitalCertificateReport,
    VerdictType
)
from ..services.storage import inspection_storage

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Procurement Reports & History"]
)

@router.get(
    "/history",
    response_model=ReportHistoryResponse,
    summary="Fetch all verified inspection reports",
    description="Fetch a list of all verified inspection reports with optional filtering by verdict, region, and keyword search."
)
async def get_reports_history(
    verdict: Optional[VerdictType] = Query(None, description="Filter by classification verdict"),
    region: Optional[str] = Query(None, description="Filter by state / geographic source"),
    search: Optional[str] = Query(None, description="Search query across Certificate ID, Lot ID, or Farmer Name"),
    limit: int = Query(50, ge=1, le=100, description="Maximum reports to return"),
    offset: int = Query(0, ge=0, description="Offset index for pagination")
):
    reports = inspection_storage.list_reports(
        verdict=verdict,
        region=region,
        search=search,
        limit=limit,
        offset=offset
    )
    total_count = inspection_storage.count_reports(
        verdict=verdict,
        region=region,
        search=search
    )

    return ReportHistoryResponse(
        total_count=total_count,
        reports=reports
    )

@router.get(
    "/analytics/summary",
    summary="Get aggregated quality statistics across verified lots",
    description="Computes high-level quality passing rates, average Grade A percentages, and defect distributions."
)
async def get_reports_analytics():
    all_reports = inspection_storage.list_reports(limit=500)
    total = len(all_reports)
    if total == 0:
        return {
            "total_verified_lots": 0,
            "grade_a_rate_percent": 0.0,
            "conditional_rate_percent": 0.0,
            "rejection_urs_rate_percent": 0.0,
            "average_overall_score": 0.0,
            "total_weight_quintals": 0.0
        }

    grade_a_count = sum(1 for r in all_reports if r.summary.verdict == "APPROVED_GRADE_A")
    conditional_count = sum(1 for r in all_reports if r.summary.verdict == "CONDITIONAL_GRADE_B")
    urs_count = sum(1 for r in all_reports if r.summary.verdict == "REJECTED_URS")
    avg_score = round(sum(r.summary.overall_score for r in all_reports) / total, 1)
    total_weight = sum(r.lot_weight_quintals for r in all_reports)

    return {
        "total_verified_lots": total,
        "grade_a_rate_percent": round((grade_a_count / total) * 100, 1),
        "conditional_rate_percent": round((conditional_count / total) * 100, 1),
        "rejection_urs_rate_percent": round((urs_count / total) * 100, 1),
        "average_overall_score": avg_score,
        "total_weight_quintals": total_weight
    }

@router.get(
    "/learning/logs",
    summary="Inspect continuous learning feedback delta records",
    description="Returns the human-in-the-loop correction deltas for model retraining pipelines."
)
async def get_continuous_learning_logs():
    return {
        "total_events": len(inspection_storage.get_learning_logs()),
        "events": inspection_storage.get_learning_logs()
    }

@router.get(
    "/{report_id}",
    response_model=DigitalCertificateReport,
    summary="Get verified report by Certificate ID or Inspection ID",
    description="Fetch a single verified inspection certificate by its unique Certificate ID or Inspection ID."
)
async def get_report_by_id(report_id: str):
    report = inspection_storage.get_report_by_id(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )
    return report
