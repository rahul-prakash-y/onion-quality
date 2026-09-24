/**
 * OnionVision AI - Frontend API Client
 * Interfaces React frontend with FastAPI backend (http://localhost:8000)
 */

import { DigitalCertificate, DefectType, GradeClassification } from '../types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface UploadApiResponse {
  inspection_id: string;
  filename: string;
  file_size_bytes: number;
  image_url: string;
  upload_timestamp: string;
  status: string;
  message: string;
}

export interface BackendDefectCounts {
  healthy: number;
  damaged: number;
  rotten: number;
  sprouted: number;
  undersized: number;
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
  price_recommendation: {
    base_msp_per_qtl: number;
    quality_bonus_or_penalty: number;
    recommended_price_per_qtl: number;
    total_estimated_lot_value: number;
  };
  analyzed_at: string;
}

export interface VerificationPayload {
  status: 'approved' | 'flagged';
  feedback_notes?: string;
  inspector_id?: string;
  inspector_name?: string;
  corrected_counts?: Partial<BackendDefectCounts>;
  corrected_grade_a_percent?: number;
  corrected_urs_percent?: number;
}

export interface VerificationApiResponse {
  inspection_id: string;
  certificate_id: string;
  status: string;
  verified_at: string;
  feedback_notes?: string;
  summary: any;
  learning_delta: Record<string, any>;
  report: DigitalCertificate;
}

/**
 * Requirement 1: uploadInspectionImage(imageFile)
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

  return response.json();
}

/**
 * Requirement 2: getGradingResults(inspectionId)
 * Triggers/fetches AI grading inference results from GET /api/v1/inspect/{inspection_id}/analyze
 */
export async function getGradingResults(inspectionId: string): Promise<AnalysisApiResponse> {
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

  return response.json();
}

/**
 * Requirement 3: submitHumanVerification(inspectionId, correctedData)
 * Submits inspector adjustments and human-in-the-loop corrections to POST /api/v1/inspect/{inspection_id}/verify
 */
export async function submitHumanVerification(
  inspectionId: string,
  correctedData: VerificationPayload
): Promise<VerificationApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/inspect/${inspectionId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(correctedData),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Verification failed with HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches verified reports history from GET /api/v1/reports/history
 */
export async function fetchReportsHistory(filters?: {
  verdict?: string;
  region?: string;
  search?: string;
}): Promise<{ total_count: number; reports: DigitalCertificate[] }> {
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

  return response.json();
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
  checkBackendHealth,
};
