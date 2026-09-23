export type DefectType = 
  | 'none' 
  | 'sprouted' 
  | 'rotten' 
  | 'mould' 
  | 'undersized' 
  | 'mechanical_cut' 
  | 'double';

export type GradeClassification = 'Grade A' | 'Grade B' | 'URS';

export interface OnionDetection {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  diameterMm: number;
  grade: GradeClassification;
  defect: DefectType;
  confidence: number; // 0.0 - 1.0
  skinQualityPercent: number;
  firmness: 'Hard' | 'Firm' | 'Soft' | 'Spongy';
  notes: string;
}

export interface SamplePreset {
  id: string;
  name: string;
  tagline: string;
  variety: string;
  lotNumber: string;
  farmerName: string;
  originMandi: string;
  sampleWeightKg: number;
  detections: OnionDetection[];
}

export interface DefectCounts {
  sprouted: number;
  rottenOrMould: number;
  undersized: number;
  mechanicalCut: number;
  doubleOrDeformed: number;
}

export interface PriceBreakdown {
  baseMspPerQtl: number;
  qualityBonusOrPenalty: number;
  recommendedPricePerQtl: number;
  totalEstimatedLotValue: number;
}

export interface QualitySummary {
  gradeAPercent: number;
  gradeBPercent: number;
  ursPercent: number;
  totalCount: number;
  avgDiameterMm: number;
  overallScore: number;
  verdict: 'APPROVED_GRADE_A' | 'CONDITIONAL_GRADE_B' | 'REJECTED_URS';
  defects: DefectCounts;
  priceRecommendation: PriceBreakdown;
}

export interface DigitalCertificate {
  certificateId: string;
  timestamp: string;
  lotId: string;
  farmerName: string;
  farmerPhone: string;
  procurementCenter: string;
  inspectorId: string;
  inspectorName: string;
  variety: string;
  lotWeightQuintals: number;
  sampleWeightKg: number;
  summary: QualitySummary;
  tamperProofHash: string;
  status: 'VALID' | 'DISPUTED' | 'RE_EVALUATED';
  disputeDetails?: {
    raisedAt: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED';
    resolutionNotes?: string;
  };
}

export interface ProcurementCenter {
  id: string;
  name: string;
  district: string;
  state: string;
  avgDailyLots: number;
  qualityPassingRate: number;
}

export type ActiveScreen = 'home' | 'inspection' | 'reports';

export type Language = 'en' | 'hi';
