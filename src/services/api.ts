/**
 * OnionVision AI - Frontend API Client
 * Interfaces React frontend with FastAPI backend (http://localhost:8000)
 */

import { DigitalCertificate, OnionDetection, QualitySummary, DefectType, GradeClassification } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

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
  detections: Array<{
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
  }>;
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

export const OnionVisionApi = {
  /**
   * Health check for FastAPI backend
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * POST /api/v1/inspect/upload
   * Upload image as multipart/form-data
   */
  async uploadImage(
    file: File | Blob,
    metadata?: {
      batchId?: string;
      region?: string;
      variety?: string;
      farmerName?: string;
      presetHint?: string;
    }
  ): Promise<UploadApiResponse> {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'captured_onion.jpg');
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
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Failed to upload inspection image');
    }

    return response.json();
  },

  /**
   * GET /api/v1/inspect/{inspection_id}/analyze
   * Trigger mock AI analysis
   */
  async analyzeInspection(inspectionId: string): Promise<AnalysisApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/inspect/${inspectionId}/analyze`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Failed to analyze inspection');
    }
    return response.json();
  },

  /**
   * POST /api/v1/inspect/{inspection_id}/verify
   * Submit human-in-the-loop verification
   */
  async verifyInspection(
    inspectionId: string,
    payload: VerificationPayload
  ): Promise<VerificationApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/inspect/${inspectionId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Failed to verify inspection');
    }

    return response.json();
  },

  /**
   * GET /api/v1/reports/history
   * Fetch verified reports history
   */
  async getReportsHistory(filters?: {
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
  },
};
