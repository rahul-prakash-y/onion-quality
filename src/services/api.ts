/**
 * OnionVision AI - Frontend API Client & DTO Adapter
 * Interfaces React frontend with FastAPI backend (http://localhost:8000)
 * Provides comprehensive bidirectional DTO adapters mapping between
 * backend snake_case and frontend camelCase.
 */

import { 
  DigitalCertificate, 
  DefectType, 
  GradeClassification, 
  OnionDetection, 
  QualitySummary, 
  DefectCounts,
  PriceBreakdown,
  GeographicRegion 
} from '../types';

const rawApiUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://'))
  ? rawApiUrl
  : `https://${rawApiUrl}`;

// ============================================================================
// BACKEND DTO CONTRACTS (Raw snake_case from FastAPI / Pydantic)
// ============================================================================

export interface BackendDefectCounts {
  healthy: number;
  damaged: number;
  rotten: number;
  sprouted: number;
  undersized: number;
}

export interface BackendPriceBreakdown {
  base_msp_per_qtl: number;
  quality_bonus_or_penalty: number;
  recommended_price_per_qtl: number;
  total_estimated_lot_value: number;
}

export interface DetectionItemResponse {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  diameter_mm: number;
  grade: GradeClassification;
  defect: DefectType;
  confidence: number;
  skin_quality_percent: number;
  firmness: 'Hard' | 'Firm' | 'Soft' | 'Spongy';
  notes: string;
}

export interface AnalysisApiResponse {
  inspection_id: string;
  total_onions_detected: number;
  counts: BackendDefectCounts;
  grade_a_percent: number;
  urs_percent: number;
  grade_b_percent: number;
  avg_diameter_mm: number;
  overall_score: number;
  verdict: 'APPROVED_GRADE_A' | 'CONDITIONAL_GRADE_B' | 'REJECTED_URS';
  detections: DetectionItemResponse[];
  price_recommendation: BackendPriceBreakdown;
  analyzed_at: string;
}

export interface UploadApiResponse {
  inspectionId: string;
  filename: string;
  fileSizeBytes: number;
  imageUrl: string;
  uploadTimestamp: string;
  status: string;
  message: string;
  // Aliases for backward compatibility
  inspection_id: string;
  file_size_bytes: number;
  image_url: string;
  upload_timestamp: string;
}

export interface VerificationPayload {
  status: 'approved' | 'flagged';
  feedback_notes?: string;
  inspector_id?: string;
  inspector_name?: string;
  corrected_counts?: Partial<BackendDefectCounts> | Partial<DefectCounts>;
  corrected_grade_a_percent?: number;
  corrected_urs_percent?: number;
}

export interface VerificationApiResponse {
  inspectionId: string;
  inspection_id: string;
  certificateId: string;
  certificate_id: string;
  status: string;
  verifiedAt: string;
  verified_at: string;
  feedbackNotes?: string;
  feedback_notes?: string;
  summary: QualitySummary;
  learningDelta: Record<string, any>;
  learning_delta: Record<string, any>;
  report: DigitalCertificate;
}

export interface AdaptedAnalysisResult {
  inspectionId: string;
  inspection_id: string;
  totalCount: number;
  total_onions_detected: number;
  summary: QualitySummary;
  detections: OnionDetection[];
  analyzedAt: string;
  rawResponse: AnalysisApiResponse;
}

// ============================================================================
// DTO ADAPTERS (Snake_case <-> CamelCase Serialization / Deserialization)
// ============================================================================

/**
 * Maps an individual detection item from backend to frontend OnionDetection.
 */
export function adaptDetectionItem(item: any): OnionDetection {
  if (!item) {
    return {
      id: `det_${Math.random().toString(36).substring(2, 8)}`,
      x: 0,
      y: 0,
      width: 15,
      height: 15,
      diameterMm: 50,
      grade: 'Grade B',
      defect: 'none',
      confidence: 0.9,
      skinQualityPercent: 85,
      firmness: 'Firm',
      notes: ''
    };
  }

  return {
    id: String(item.id || `det_${Math.random().toString(36).substring(2, 8)}`),
    x: Number(item.x ?? 0),
    y: Number(item.y ?? 0),
    width: Number(item.width ?? 15),
    height: Number(item.height ?? 15),
    diameterMm: Number(item.diameter_mm ?? item.diameterMm ?? 50),
    grade: (item.grade as GradeClassification) || 'Grade B',
    defect: (item.defect as DefectType) || 'none',
    confidence: Number(item.confidence ?? 0.95),
    skinQualityPercent: Number(item.skin_quality_percent ?? item.skinQualityPercent ?? 88),
    firmness: (item.firmness as 'Hard' | 'Firm' | 'Soft' | 'Spongy') || 'Firm',
    notes: String(item.notes || '')
  };
}

/**
 * Maps defect counts from backend or raw sources into frontend DefectCounts.
 */
export function adaptDefectCounts(counts: any): DefectCounts {
  const c = counts || {};
  return {
    sprouted: Number(c.sprouted ?? 0),
    rottenOrMould: Number(c.rotten ?? c.rottenOrMould ?? c.mould ?? 0),
    undersized: Number(c.undersized ?? 0),
    mechanicalCut: Number(c.damaged ?? c.mechanicalCut ?? c.mechanical_cut ?? 0),
    doubleOrDeformed: Number(c.doubleOrDeformed ?? c.double ?? 0),
    healthy: Number(c.healthy ?? 0)
  } as DefectCounts;
}

/**
 * Maps price recommendation metrics from backend to frontend PriceBreakdown.
 */
export function adaptPriceBreakdown(price: any): PriceBreakdown {
  const p = price || {};
  return {
    baseMspPerQtl: Number(p.base_msp_per_qtl ?? p.baseMspPerQtl ?? 2400),
    qualityBonusOrPenalty: Number(p.quality_bonus_or_penalty ?? p.qualityBonusOrPenalty ?? 0),
    recommendedPricePerQtl: Number(p.recommended_price_per_qtl ?? p.recommendedPricePerQtl ?? 2400),
    totalEstimatedLotValue: Number(p.total_estimated_lot_value ?? p.totalEstimatedLotValue ?? 0)
  };
}

/**
 * Maps backend QualitySummary / Analysis payload into frontend QualitySummary.
 */
export function adaptQualitySummary(raw: any, totalFallback?: number): QualitySummary {
  const counts = raw?.counts || raw?.defects || {};
  const adaptedCounts = adaptDefectCounts(counts);
  const adaptedPrice = adaptPriceBreakdown(raw?.price_recommendation || raw?.priceRecommendation);

  const totalCount = Number(
    raw?.total_count ??
    raw?.totalCount ??
    raw?.total_onions_detected ??
    totalFallback ??
    (adaptedCounts.sprouted + adaptedCounts.rottenOrMould + adaptedCounts.undersized + adaptedCounts.mechanicalCut + (adaptedCounts.doubleOrDeformed || 0) + (adaptedCounts.healthy || 0))
  );

  return {
    gradeAPercent: Number(raw?.grade_a_percent ?? raw?.gradeAPercent ?? 0),
    gradeBPercent: Number(raw?.grade_b_percent ?? raw?.gradeBPercent ?? 0),
    ursPercent: Number(raw?.urs_percent ?? raw?.ursPercent ?? 0),
    totalCount: Math.max(1, totalCount),
    avgDiameterMm: Number(raw?.avg_diameter_mm ?? raw?.avgDiameterMm ?? 52.0),
    overallScore: Number(raw?.overall_score ?? raw?.overallScore ?? 75),
    verdict: (raw?.verdict as 'APPROVED_GRADE_A' | 'CONDITIONAL_GRADE_B' | 'REJECTED_URS') || 'CONDITIONAL_GRADE_B',
    defects: adaptedCounts,
    priceRecommendation: adaptedPrice
  };
}

/**
 * Maps full backend DigitalCertificateReport into frontend DigitalCertificate.
 */
export function adaptDigitalCertificate(raw: any): DigitalCertificate {
  const rawSummary = raw?.summary || raw;
  const rawVerification = raw?.human_verification || raw?.humanVerification;
  const rawDispute = raw?.dispute_details || raw?.disputeDetails;

  return {
    certificateId: String(raw.certificate_id || raw.certificateId || `OV-2026-CERT-${Math.floor(10000 + Math.random() * 90000)}`),
    timestamp: String(raw.timestamp || new Date().toLocaleString()),
    lotId: String(raw.lot_id || raw.lotId || 'LOT-APMC-DEFAULT'),
    farmerName: String(raw.farmer_name || raw.farmerName || 'Rameshwar Patil (Mandi Lot)'),
    farmerPhone: String(raw.farmer_phone || raw.farmerPhone || '+91 98220 14592'),
    procurementCenter: String(raw.procurement_center || raw.procurementCenter || 'Lasalgaon APMC Main Yard'),
    geographicSource: (raw.geographic_source || raw.geographicSource || 'Maharashtra') as GeographicRegion,
    inspectorId: String(raw.inspector_id || raw.inspectorId || 'INS-MH-042'),
    inspectorName: String(raw.inspector_name || raw.inspectorName || 'Anil Kulkarni (APMC Certified Grader)'),
    variety: String(raw.variety || 'Bhima Super (Nashik Red)'),
    lotWeightQuintals: Number(raw.lot_weight_quintals ?? raw.lotWeightQuintals ?? 45.0),
    sampleWeightKg: Number(raw.sample_weight_kg ?? raw.sampleWeightKg ?? 5.0),
    summary: adaptQualitySummary(rawSummary),
    detections: Array.isArray(raw.detections) ? raw.detections.map(adaptDetectionItem) : undefined,
    tamperProofHash: String(raw.tamper_proof_hash || raw.tamperProofHash || ''),
    status: (raw.status as 'VALID' | 'DISPUTED' | 'RE_EVALUATED') || 'VALID',
    syncedToCloud: Boolean(raw.synced_to_cloud ?? raw.syncedToCloud ?? true),
    humanVerification: rawVerification ? {
      status: rawVerification.status || 'approved',
      verifiedAt: rawVerification.verified_at || rawVerification.verifiedAt,
      feedbackNotes: rawVerification.feedback_notes || rawVerification.feedbackNotes,
      adjustedCount: rawVerification.adjusted_count ?? rawVerification.adjustedCount,
    } : undefined,
    disputeDetails: rawDispute ? {
      raisedAt: rawDispute.raised_at || rawDispute.raisedAt,
      reason: rawDispute.reason || '',
      status: rawDispute.status || 'PENDING',
      resolutionNotes: rawDispute.resolution_notes || rawDispute.resolutionNotes
    } : undefined
  };
}

/**
 * Converts a Base64 data URL to a standard Blob for multipart image uploads.
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Generates an in-memory synthetic JPEG Blob for testing or fallback optical uploads.
 */
export function createSampleImageBlob(caption: string = 'Onion Tray Sample'): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, 640, 640);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(320, 320, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('OnionVision AI Inspection', 50, 70);
    ctx.font = '18px sans-serif';
    ctx.fillText(caption, 50, 110);
  }
  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg')
  );
}

// ============================================================================
// LIVE BACKEND API CLIENT FUNCTIONS
// ============================================================================

/**
 * Uploads an inspection photo as multipart/form-data to POST /api/v1/inspect/upload
 */
export async function uploadInspectionImage(
  imageFile: File | Blob,
  metadata?: {
    batchId?: string;
    region?: string;
    variety?: string;
    farmerName?: string;
    presetHint?: string;
  }
): Promise<UploadApiResponse> {
  const formData = new FormData();
  formData.append('file', imageFile, imageFile instanceof File ? imageFile.name : 'onion_tray_capture.jpg');
  if (metadata?.batchId) formData.append('batch_id', metadata.batchId);
  if (metadata?.region) formData.append('region', metadata.region);
  if (metadata?.variety) formData.append('variety', metadata.variety);
  if (metadata?.farmerName) formData.append('farmer_name', metadata.farmerName);
  if (metadata?.presetHint) formData.append('preset_hint', metadata.presetHint);

  const response = await fetch(`${API_BASE_URL}/api/v1/inspect/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Upload failed with HTTP ${response.status}`);
  }

  const raw = await response.json();
  const inspectionId = raw.inspection_id || raw.inspectionId;
  const fileSizeBytes = raw.file_size_bytes ?? raw.fileSizeBytes ?? 0;
  const imageUrl = raw.image_url || raw.imageUrl || '';
  const uploadTimestamp = raw.upload_timestamp || raw.uploadTimestamp || '';

  return {
    inspectionId,
    filename: raw.filename,
    fileSizeBytes,
    imageUrl,
    uploadTimestamp,
    status: raw.status || 'UPLOADED',
    message: raw.message || '',
    // Aliases
    inspection_id: inspectionId,
    file_size_bytes: fileSizeBytes,
    image_url: imageUrl,
    upload_timestamp: uploadTimestamp,
  };
}

/**
 * Triggers/fetches AI grading inference results from GET /api/v1/inspect/{inspection_id}/analyze
 * Automatically deserializes backend snake_case into frontend camelCase structures.
 */
export async function getGradingResults(inspectionId: string): Promise<AdaptedAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/inspect/${inspectionId}/analyze`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Analysis failed with HTTP ${response.status}`);
  }

  const raw: AnalysisApiResponse = await response.json();
  const summary = adaptQualitySummary(raw, raw.total_onions_detected);
  const detections = (raw.detections || []).map(adaptDetectionItem);
  const respId = raw.inspection_id || inspectionId;

  return {
    inspectionId: respId,
    inspection_id: respId,
    totalCount: summary.totalCount,
    total_onions_detected: summary.totalCount,
    summary,
    detections,
    analyzedAt: raw.analyzed_at || new Date().toISOString(),
    rawResponse: raw
  };
}

/**
 * Submits inspector adjustments and human-in-the-loop corrections to POST /api/v1/inspect/{inspection_id}/verify
 * Serializes frontend camelCase payloads into backend expected snake_case,
 * and deserializes the returned certified report into frontend DigitalCertificate.
 */
export async function submitHumanVerification(
  inspectionId: string,
  correctedData: VerificationPayload
): Promise<VerificationApiResponse> {
  // Normalize corrected_counts to backend schema { healthy, damaged, rotten, sprouted, undersized }
  let backendCounts: Partial<BackendDefectCounts> | undefined = undefined;
  if (correctedData.corrected_counts) {
    const c: any = correctedData.corrected_counts;
    backendCounts = {
      healthy: c.healthy ?? undefined,
      damaged: c.damaged ?? c.mechanicalCut ?? undefined,
      rotten: c.rotten ?? c.rottenOrMould ?? undefined,
      sprouted: c.sprouted ?? undefined,
      undersized: c.undersized ?? undefined
    };
  }

  const payload = {
    status: correctedData.status || 'approved',
    feedback_notes: correctedData.feedback_notes || 'Human verification registered',
    inspector_id: correctedData.inspector_id || 'INS-MH-042',
    inspector_name: correctedData.inspector_name || 'Anil Kulkarni (Grading Officer)',
    corrected_counts: backendCounts,
    corrected_grade_a_percent: correctedData.corrected_grade_a_percent,
    corrected_urs_percent: correctedData.corrected_urs_percent
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/inspect/${inspectionId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Verification failed with HTTP ${response.status}`);
  }

  const raw = await response.json();
  const respInspId = raw.inspection_id || inspectionId;
  const certId = raw.certificate_id || '';
  const verifiedAt = raw.verified_at || new Date().toISOString();
  const adaptedSummary = adaptQualitySummary(raw.summary);
  const adaptedReport = adaptDigitalCertificate(raw.report || { ...raw, certificate_id: certId, summary: adaptedSummary });

  return {
    inspectionId: respInspId,
    inspection_id: respInspId,
    certificateId: certId,
    certificate_id: certId,
    status: raw.status || 'approved',
    verifiedAt,
    verified_at: verifiedAt,
    feedbackNotes: raw.feedback_notes,
    feedback_notes: raw.feedback_notes,
    summary: adaptedSummary,
    learningDelta: raw.learning_delta || {},
    learning_delta: raw.learning_delta || {},
    report: adaptedReport
  };
}

/**
 * Fetches verified reports history from GET /api/v1/reports/history
 * Automatically adapts all reports to camelCase DigitalCertificate models.
 */
export async function fetchReportsHistory(filters?: {
  verdict?: string;
  region?: string;
  search?: string;
}): Promise<{ totalCount: number; total_count: number; reports: DigitalCertificate[] }> {
  const params = new URLSearchParams();
  if (filters?.verdict) params.append('verdict', filters.verdict);
  if (filters?.region) params.append('region', filters.region);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}/api/v1/reports/history${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to fetch reports history');
  }

  const raw = await response.json();
  const totalCount = Number(raw.total_count ?? (Array.isArray(raw.reports) ? raw.reports.length : 0));
  const rawReports = Array.isArray(raw.reports) ? raw.reports : [];
  const reports = rawReports.map(adaptDigitalCertificate);

  return {
    totalCount,
    total_count: totalCount,
    reports
  };
}

// ============================================================================
// CONTINUOUS LEARNING DATASET EXPORT PIPELINE
// ============================================================================

export interface DatasetStatsResponse {
  total_inspections?: number;
  total_verified?: number;
  ready_for_export?: number;
  already_exported_for_training?: number;
  regions_breakdown?: Record<string, number>;
  database_engine?: string;
  status?: string;
}

export interface DatasetExportResult {
  filename: string;
  blob: Blob;
  recordCount: number;
  totalAnnotations: number;
  databaseEngine: string;
}

/**
 * Fetches dataset export readiness statistics from GET /api/v1/dataset/stats.
 * Passes X-Admin-Token header for admin authentication.
 */
export async function fetchDatasetStats(
  adminToken = 'onionvision-admin-secret-2026'
): Promise<DatasetStatsResponse> {
  const url = `${API_BASE_URL}/api/v1/dataset/stats`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Admin-Token': adminToken,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to fetch dataset statistics');
  }

  return response.json();
}

/**
 * Calls GET /api/v1/dataset/export with mock X-Admin-Token header.
 * Packages human-verified samples into YOLO or COCO format.
 * Automatically triggers browser download of the resulting .zip archive.
 */
export async function exportDatasetZip(options?: {
  format?: 'yolo' | 'coco';
  region?: string;
  dryRun?: boolean;
  includePreviouslyExported?: boolean;
  limit?: number;
  adminToken?: string;
}): Promise<DatasetExportResult> {
  const format = options?.format || 'yolo';
  const adminToken = options?.adminToken || 'onionvision-admin-secret-2026';

  const params = new URLSearchParams();
  params.append('format', format);
  if (options?.region) params.append('region', options.region);
  if (options?.dryRun !== undefined) params.append('dry_run', String(options.dryRun));
  if (options?.includePreviouslyExported !== undefined) {
    params.append('include_previously_exported', String(options.includePreviouslyExported));
  }
  if (options?.limit) params.append('limit', String(options.limit));

  const url = `${API_BASE_URL}/api/v1/dataset/export?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Admin-Token': adminToken
    }
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorJson.detail || `Dataset export failed with status ${response.status}`);
  }

  // Extract filename from Content-Disposition header
  let filename = `OnionVision_Retraining_${format.toUpperCase()}_Dataset.zip`;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const recordCount = Number(response.headers.get('X-Export-Record-Count') || 0);
  const totalAnnotations = Number(response.headers.get('X-Export-Total-Annotations') || 0);
  const databaseEngine = response.headers.get('X-Export-Database-Engine') || 'Database';

  // Read response stream as binary Blob
  const blob = await response.blob();

  // Automatically trigger client-side download
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);

  return {
    filename,
    blob,
    recordCount,
    totalAnnotations,
    databaseEngine
  };
}

/**
 * Checks server health probe
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

// Grouped namespace export
export const OnionVisionApi = {
  uploadInspectionImage,
  getGradingResults,
  submitHumanVerification,
  fetchReportsHistory,
  fetchDatasetStats,
  exportDatasetZip,
  checkBackendHealth,
  adaptDetectionItem,
  adaptQualitySummary,
  adaptDigitalCertificate,
  dataURLtoBlob,
  createSampleImageBlob
};
