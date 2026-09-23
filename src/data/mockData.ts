import { 
  SamplePreset, 
  ProcurementCenter, 
  DigitalCertificate, 
  OnionDetection, 
  QualitySummary 
} from '../types';

export const PROCUREMENT_CENTERS: ProcurementCenter[] = [
  {
    id: 'pc-lasalgaon',
    name: 'Lasalgaon APMC Main Yard',
    district: 'Nashik',
    state: 'Maharashtra',
    avgDailyLots: 340,
    qualityPassingRate: 84.5
  },
  {
    id: 'pc-pimpalgaon',
    name: 'Pimpalgaon Baswant Sub-Market',
    district: 'Nashik',
    state: 'Maharashtra',
    avgDailyLots: 220,
    qualityPassingRate: 81.2
  },
  {
    id: 'pc-hubballi',
    name: 'Hubballi Cotton & Agri Market',
    district: 'Dharwad',
    state: 'Karnataka',
    avgDailyLots: 165,
    qualityPassingRate: 77.8
  },
  {
    id: 'pc-solapur',
    name: 'Solapur APMC Onion Yard',
    district: 'Solapur',
    state: 'Maharashtra',
    avgDailyLots: 190,
    qualityPassingRate: 79.4
  },
  {
    id: 'pc-alwar',
    name: 'Alwar Mandi Complex',
    district: 'Alwar',
    state: 'Rajasthan',
    avgDailyLots: 140,
    qualityPassingRate: 82.0
  }
];

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'preset-export-grade-a',
    name: 'Export Grade A Premium',
    tagline: 'Uniform 55mm+, intact papery skin, zero rot, dry tight necks',
    variety: 'Bhima Super (Nashik Red)',
    lotNumber: 'MH-LSG-2026-4401',
    farmerName: 'Rameshwar Patil',
    originMandi: 'Lasalgaon APMC',
    sampleWeightKg: 5.0,
    detections: [
      { id: 'on-1', x: 14, y: 18, width: 22, height: 22, diameterMm: 62, grade: 'Grade A', defect: 'none', confidence: 0.98, skinQualityPercent: 96, firmness: 'Hard', notes: 'Optimal globular shape, dry tight neck' },
      { id: 'on-2', x: 40, y: 14, width: 20, height: 20, diameterMm: 58, grade: 'Grade A', defect: 'none', confidence: 0.97, skinQualityPercent: 94, firmness: 'Hard', notes: 'Firm bulb, vibrant ruby-red husk' },
      { id: 'on-3', x: 65, y: 16, width: 21, height: 21, diameterMm: 60, grade: 'Grade A', defect: 'none', confidence: 0.96, skinQualityPercent: 92, firmness: 'Hard', notes: 'Well-cured outer tunic' },
      { id: 'on-4', x: 12, y: 44, width: 21, height: 21, diameterMm: 59, grade: 'Grade A', defect: 'none', confidence: 0.97, skinQualityPercent: 95, firmness: 'Hard', notes: 'Excellent firm density' },
      { id: 'on-5', x: 38, y: 42, width: 23, height: 23, diameterMm: 64, grade: 'Grade A', defect: 'none', confidence: 0.99, skinQualityPercent: 98, firmness: 'Hard', notes: 'Export benchmark caliber' },
      { id: 'on-6', x: 66, y: 43, width: 19, height: 19, diameterMm: 55, grade: 'Grade A', defect: 'none', confidence: 0.95, skinQualityPercent: 91, firmness: 'Firm', notes: 'Complies with 50mm+ export tier' },
      { id: 'on-7', x: 16, y: 70, width: 20, height: 20, diameterMm: 57, grade: 'Grade A', defect: 'none', confidence: 0.96, skinQualityPercent: 93, firmness: 'Hard', notes: 'Clean basal plate, zero root protrusion' },
      { id: 'on-8', x: 42, y: 68, width: 18, height: 18, diameterMm: 53, grade: 'Grade B', defect: 'none', confidence: 0.92, skinQualityPercent: 82, firmness: 'Firm', notes: 'Slight scale flaking, firm pulp' },
      { id: 'on-9', x: 68, y: 69, width: 20, height: 20, diameterMm: 56, grade: 'Grade A', defect: 'none', confidence: 0.94, skinQualityPercent: 90, firmness: 'Hard', notes: 'Solid compact core' }
    ]
  },
  {
    id: 'preset-sprouted-batch',
    name: 'Storage Dormancy Broken (Sprouted)',
    tagline: 'Internal sprout emergence, spongy hollow bulb centers, market rejection risk',
    variety: 'Gavran Late Kharif',
    lotNumber: 'MH-PMP-2026-1189',
    farmerName: 'Tukaram Jadhav',
    originMandi: 'Pimpalgaon Baswant',
    sampleWeightKg: 5.0,
    detections: [
      { id: 'on-s1', x: 15, y: 15, width: 22, height: 24, diameterMm: 54, grade: 'URS', defect: 'sprouted', confidence: 0.96, skinQualityPercent: 68, firmness: 'Spongy', notes: 'Green apical sprout (18mm length)' },
      { id: 'on-s2', x: 42, y: 16, width: 20, height: 20, diameterMm: 52, grade: 'Grade B', defect: 'none', confidence: 0.91, skinQualityPercent: 78, firmness: 'Firm', notes: 'Slight bottleneck neck, dormancy intact' },
      { id: 'on-s3', x: 67, y: 15, width: 23, height: 25, diameterMm: 56, grade: 'URS', defect: 'sprouted', confidence: 0.97, skinQualityPercent: 62, firmness: 'Soft', notes: 'Dual sprout breaking neck sheath' },
      { id: 'on-s4', x: 14, y: 44, width: 21, height: 21, diameterMm: 50, grade: 'Grade B', defect: 'none', confidence: 0.90, skinQualityPercent: 80, firmness: 'Firm', notes: 'Fair average quality' },
      { id: 'on-s5', x: 40, y: 42, width: 22, height: 24, diameterMm: 55, grade: 'URS', defect: 'sprouted', confidence: 0.95, skinQualityPercent: 65, firmness: 'Spongy', notes: 'Advanced shoot growth (>25mm)' },
      { id: 'on-s6', x: 66, y: 43, width: 20, height: 22, diameterMm: 51, grade: 'URS', defect: 'sprouted', confidence: 0.93, skinQualityPercent: 70, firmness: 'Spongy', notes: 'Emerging chlorophyll shoot' },
      { id: 'on-s7', x: 16, y: 71, width: 20, height: 20, diameterMm: 48, grade: 'Grade B', defect: 'none', confidence: 0.88, skinQualityPercent: 79, firmness: 'Firm', notes: 'Dry skin, acceptable local mandi' },
      { id: 'on-s8', x: 43, y: 70, width: 19, height: 19, diameterMm: 46, grade: 'Grade B', defect: 'mechanical_cut', confidence: 0.91, skinQualityPercent: 71, firmness: 'Firm', notes: 'Surface harvester bruise' },
      { id: 'on-s9', x: 69, y: 68, width: 22, height: 23, diameterMm: 53, grade: 'URS', defect: 'sprouted', confidence: 0.94, skinQualityPercent: 64, firmness: 'Soft', notes: 'Sprouted neck with root swell' }
    ]
  },
  {
    id: 'preset-neck-rot-mould',
    name: 'Post-Monsoon Neck Rot & Mould',
    tagline: 'Aspergillus niger black spores, bacterial soft rot, high weeping moisture',
    variety: 'Panchganga Red Globe',
    lotNumber: 'MH-SLP-2026-8821',
    farmerName: 'Baburao Shinde',
    originMandi: 'Solapur APMC',
    sampleWeightKg: 5.0,
    detections: [
      { id: 'on-r1', x: 15, y: 16, width: 22, height: 22, diameterMm: 56, grade: 'URS', defect: 'rotten', confidence: 0.98, skinQualityPercent: 42, firmness: 'Soft', notes: 'Bacterial soft rot liquefaction at neck' },
      { id: 'on-r2', x: 41, y: 15, width: 21, height: 21, diameterMm: 54, grade: 'URS', defect: 'mould', confidence: 0.95, skinQualityPercent: 50, firmness: 'Soft', notes: 'Heavy Aspergillus niger black fungal cluster' },
      { id: 'on-r3', x: 67, y: 17, width: 20, height: 20, diameterMm: 51, grade: 'Grade B', defect: 'none', confidence: 0.89, skinQualityPercent: 76, firmness: 'Firm', notes: 'Dry outer shell, no fungal spores' },
      { id: 'on-r4', x: 13, y: 44, width: 20, height: 20, diameterMm: 52, grade: 'Grade B', defect: 'mechanical_cut', confidence: 0.92, skinQualityPercent: 70, firmness: 'Firm', notes: 'Deep mechanical blade gash' },
      { id: 'on-r5', x: 39, y: 43, width: 23, height: 23, diameterMm: 58, grade: 'URS', defect: 'rotten', confidence: 0.97, skinQualityPercent: 38, firmness: 'Soft', notes: 'Complete collar rot with watery exudate' },
      { id: 'on-r6', x: 66, y: 42, width: 21, height: 21, diameterMm: 53, grade: 'URS', defect: 'mould', confidence: 0.94, skinQualityPercent: 48, firmness: 'Soft', notes: 'Basal mould penetration' },
      { id: 'on-r7', x: 16, y: 70, width: 19, height: 19, diameterMm: 47, grade: 'Grade B', defect: 'none', confidence: 0.87, skinQualityPercent: 74, firmness: 'Firm', notes: 'Minor skin discoloration' },
      { id: 'on-r8', x: 42, y: 69, width: 22, height: 22, diameterMm: 55, grade: 'URS', defect: 'rotten', confidence: 0.96, skinQualityPercent: 44, firmness: 'Soft', notes: 'Foul odor & softening scale layers' },
      { id: 'on-r9', x: 68, y: 71, width: 20, height: 20, diameterMm: 49, grade: 'Grade B', defect: 'none', confidence: 0.91, skinQualityPercent: 77, firmness: 'Firm', notes: 'Surface dust only, firm pulp' }
    ]
  },
  {
    id: 'preset-undersized-mandi',
    name: 'Unsorted Chhota / Undersized Lot',
    tagline: 'High volume <35mm caliber, doubles/twins, low market realization',
    variety: 'Kurnool Desi Pink',
    lotNumber: 'KA-HBL-2026-3094',
    farmerName: 'Mallikarjun Reddy',
    originMandi: 'Hubballi APMC',
    sampleWeightKg: 5.0,
    detections: [
      { id: 'on-u1', x: 16, y: 16, width: 16, height: 16, diameterMm: 29, grade: 'URS', defect: 'undersized', confidence: 0.96, skinQualityPercent: 88, firmness: 'Hard', notes: 'Caliber 29mm (<35mm AGMARK threshold)' },
      { id: 'on-u2', x: 38, y: 15, width: 15, height: 15, diameterMm: 27, grade: 'URS', defect: 'undersized', confidence: 0.97, skinQualityPercent: 85, firmness: 'Hard', notes: 'Substandard micro-bulb (27mm)' },
      { id: 'on-u3', x: 60, y: 14, width: 17, height: 17, diameterMm: 31, grade: 'URS', defect: 'undersized', confidence: 0.94, skinQualityPercent: 87, firmness: 'Hard', notes: 'Undersized chhota kanda' },
      { id: 'on-u4', x: 80, y: 18, width: 18, height: 18, diameterMm: 38, grade: 'Grade B', defect: 'none', confidence: 0.90, skinQualityPercent: 83, firmness: 'Firm', notes: 'Grade B small-medium' },
      { id: 'on-u5', x: 18, y: 44, width: 22, height: 18, diameterMm: 44, grade: 'URS', defect: 'double', confidence: 0.95, skinQualityPercent: 79, firmness: 'Firm', notes: 'Split twin bulb / abnormal double neck' },
      { id: 'on-u6', x: 45, y: 42, width: 16, height: 16, diameterMm: 28, grade: 'URS', defect: 'undersized', confidence: 0.96, skinQualityPercent: 84, firmness: 'Hard', notes: 'Very small bulb (28mm)' },
      { id: 'on-u7', x: 68, y: 45, width: 19, height: 19, diameterMm: 41, grade: 'Grade B', defect: 'none', confidence: 0.92, skinQualityPercent: 86, firmness: 'Firm', notes: 'Acceptable Grade B standard' },
      { id: 'on-u8', x: 22, y: 70, width: 16, height: 16, diameterMm: 30, grade: 'URS', defect: 'undersized', confidence: 0.95, skinQualityPercent: 86, firmness: 'Hard', notes: 'Undersized rejection tier' },
      { id: 'on-u9', x: 48, y: 68, width: 19, height: 19, diameterMm: 40, grade: 'Grade B', defect: 'none', confidence: 0.91, skinQualityPercent: 82, firmness: 'Firm', notes: 'Borderline medium' },
      { id: 'on-u10', x: 74, y: 70, width: 15, height: 15, diameterMm: 26, grade: 'URS', defect: 'undersized', confidence: 0.98, skinQualityPercent: 89, firmness: 'Hard', notes: 'Micro-caliber (26mm)' }
    ]
  },
  {
    id: 'preset-disputed-borderline',
    name: 'Disputed Mandi Borderline Lot',
    tagline: 'Borderline Grade A threshold (67%), contentious quality dispute between farmer & buyer',
    variety: 'Nashik Dark Red',
    lotNumber: 'MH-LSG-2026-9923',
    farmerName: 'Dattatray Gaikwad',
    originMandi: 'Lasalgaon APMC',
    sampleWeightKg: 5.0,
    detections: [
      { id: 'on-b1', x: 15, y: 17, width: 21, height: 21, diameterMm: 57, grade: 'Grade A', defect: 'none', confidence: 0.94, skinQualityPercent: 91, firmness: 'Hard', notes: 'Firm bulb, good color' },
      { id: 'on-b2', x: 41, y: 15, width: 22, height: 22, diameterMm: 59, grade: 'Grade A', defect: 'none', confidence: 0.95, skinQualityPercent: 92, firmness: 'Hard', notes: 'Grade A standard export quality' },
      { id: 'on-b3', x: 67, y: 16, width: 19, height: 19, diameterMm: 46, grade: 'Grade B', defect: 'none', confidence: 0.89, skinQualityPercent: 81, firmness: 'Firm', notes: 'Medium size, slightly dry neck' },
      { id: 'on-b4', x: 14, y: 44, width: 22, height: 22, diameterMm: 58, grade: 'Grade A', defect: 'none', confidence: 0.93, skinQualityPercent: 90, firmness: 'Hard', notes: 'Firm bulb' },
      { id: 'on-b5', x: 40, y: 43, width: 21, height: 21, diameterMm: 56, grade: 'Grade A', defect: 'none', confidence: 0.92, skinQualityPercent: 88, firmness: 'Hard', notes: 'Intact outer scales' },
      { id: 'on-b6', x: 66, y: 44, width: 20, height: 20, diameterMm: 48, grade: 'Grade B', defect: 'mechanical_cut', confidence: 0.88, skinQualityPercent: 78, firmness: 'Firm', notes: 'Superficial skin graze' },
      { id: 'on-b7', x: 16, y: 70, width: 21, height: 21, diameterMm: 57, grade: 'Grade A', defect: 'none', confidence: 0.94, skinQualityPercent: 89, firmness: 'Hard', notes: 'Good solid bulb' },
      { id: 'on-b8', x: 42, y: 69, width: 22, height: 22, diameterMm: 60, grade: 'Grade A', defect: 'none', confidence: 0.96, skinQualityPercent: 93, firmness: 'Hard', notes: 'Grade A caliber' },
      { id: 'on-b9', x: 68, y: 71, width: 17, height: 17, diameterMm: 33, grade: 'URS', defect: 'undersized', confidence: 0.93, skinQualityPercent: 82, firmness: 'Firm', notes: 'Borderline 33mm undersize' }
    ]
  }
];

export function calculateQualitySummary(
  detections: OnionDetection[],
  baseMspPerQtl: number = 2400,
  lotWeightQtl: number = 42
): QualitySummary {
  const total = detections.length || 1;
  let gradeACount = 0;
  let gradeBCount = 0;
  let ursCount = 0;
  let sumDiameter = 0;

  const defectCounts = {
    sprouted: 0,
    rottenOrMould: 0,
    undersized: 0,
    mechanicalCut: 0,
    doubleOrDeformed: 0
  };

  detections.forEach(d => {
    sumDiameter += d.diameterMm;
    if (d.grade === 'Grade A') gradeACount++;
    else if (d.grade === 'Grade B') gradeBCount++;
    else ursCount++;

    if (d.defect === 'sprouted') defectCounts.sprouted++;
    if (d.defect === 'rotten' || d.defect === 'mould') defectCounts.rottenOrMould++;
    if (d.defect === 'undersized') defectCounts.undersized++;
    if (d.defect === 'mechanical_cut') defectCounts.mechanicalCut++;
    if (d.defect === 'double') defectCounts.doubleOrDeformed++;
  });

  const gradeAPercent = Math.round((gradeACount / total) * 100);
  const gradeBPercent = Math.round((gradeBCount / total) * 100);
  const ursPercent = Math.max(0, 100 - gradeAPercent - gradeBPercent);
  const avgDiameterMm = Math.round((sumDiameter / total) * 10) / 10;

  // Overall Score out of 100
  // Formula: Grade A is 100 pts, Grade B is 70 pts, URS is 15 pts.
  const weightedScore = Math.round(
    (gradeAPercent * 1.0) + (gradeBPercent * 0.65) + (ursPercent * 0.15)
  );

  let verdict: 'APPROVED_GRADE_A' | 'CONDITIONAL_GRADE_B' | 'REJECTED_URS' = 'CONDITIONAL_GRADE_B';
  if (gradeAPercent >= 70 && ursPercent <= 12) {
    verdict = 'APPROVED_GRADE_A';
  } else if (ursPercent > 30) {
    verdict = 'REJECTED_URS';
  }

  // Price calculations
  // Premium Grade A earns +15% to +25% bonus
  // Grade B earns base MSP
  // URS suffers -40% to -65% penalty
  const qualityMultiplier = (gradeAPercent * 1.25 + gradeBPercent * 1.0 + ursPercent * 0.35) / 100;
  const recommendedPricePerQtl = Math.round(baseMspPerQtl * qualityMultiplier);
  const qualityBonusOrPenalty = recommendedPricePerQtl - baseMspPerQtl;
  const totalEstimatedLotValue = Math.round(recommendedPricePerQtl * lotWeightQtl);

  return {
    gradeAPercent,
    gradeBPercent,
    ursPercent,
    totalCount: total,
    avgDiameterMm,
    overallScore: Math.min(100, Math.max(0, weightedScore)),
    verdict,
    defects: defectCounts,
    priceRecommendation: {
      baseMspPerQtl,
      qualityBonusOrPenalty,
      recommendedPricePerQtl,
      totalEstimatedLotValue
    }
  };
}

export const INITIAL_BATCH_HISTORY: DigitalCertificate[] = [
  {
    certificateId: 'OV-2026-MH-78912',
    timestamp: '2026-09-23 08:45 AM',
    lotId: 'MH-LSG-2026-4401',
    farmerName: 'Rameshwar Patil',
    farmerPhone: '+91 98220 14592',
    procurementCenter: 'Lasalgaon APMC Main Yard',
    inspectorId: 'INS-MH-042',
    inspectorName: 'Anil Kulkarni (Grading Officer)',
    variety: 'Bhima Super (Nashik Red)',
    lotWeightQuintals: 48,
    sampleWeightKg: 5.0,
    summary: {
      gradeAPercent: 89,
      gradeBPercent: 11,
      ursPercent: 0,
      totalCount: 9,
      avgDiameterMm: 58.4,
      overallScore: 96,
      verdict: 'APPROVED_GRADE_A',
      defects: { sprouted: 0, rottenOrMould: 0, undersized: 0, mechanicalCut: 0, doubleOrDeformed: 0 },
      priceRecommendation: {
        baseMspPerQtl: 2400,
        qualityBonusOrPenalty: 480,
        recommendedPricePerQtl: 2880,
        totalEstimatedLotValue: 138240
      }
    },
    tamperProofHash: 'a7f92b4c91823de7e88301fa394bc920f',
    status: 'VALID'
  },
  {
    certificateId: 'OV-2026-MH-78904',
    timestamp: '2026-09-22 03:15 PM',
    lotId: 'MH-LSG-2026-9923',
    farmerName: 'Dattatray Gaikwad',
    farmerPhone: '+91 94231 88410',
    procurementCenter: 'Lasalgaon APMC Main Yard',
    inspectorId: 'INS-MH-042',
    inspectorName: 'Anil Kulkarni (Grading Officer)',
    variety: 'Nashik Dark Red',
    lotWeightQuintals: 36,
    sampleWeightKg: 5.0,
    summary: {
      gradeAPercent: 67,
      gradeBPercent: 22,
      ursPercent: 11,
      totalCount: 9,
      avgDiameterMm: 54.2,
      overallScore: 78,
      verdict: 'CONDITIONAL_GRADE_B',
      defects: { sprouted: 0, rottenOrMould: 0, undersized: 1, mechanicalCut: 1, doubleOrDeformed: 0 },
      priceRecommendation: {
        baseMspPerQtl: 2400,
        qualityBonusOrPenalty: 120,
        recommendedPricePerQtl: 2520,
        totalEstimatedLotValue: 90720
      }
    },
    tamperProofHash: 'e391b10ca849204cdbf98a101239aa812',
    status: 'DISPUTED',
    disputeDetails: {
      raisedAt: '2026-09-22 04:30 PM',
      reason: 'Farmer disputed Grade B classification, claiming 2 sample bulbs were 54mm and within Grade A tolerance. Secondary optical re-scan requested.',
      status: 'PENDING'
    }
  },
  {
    certificateId: 'OV-2026-KA-44109',
    timestamp: '2026-09-22 11:20 AM',
    lotId: 'KA-HBL-2026-3094',
    farmerName: 'Mallikarjun Reddy',
    farmerPhone: '+91 97412 55903',
    procurementCenter: 'Hubballi Cotton & Agri Market',
    inspectorId: 'INS-KA-118',
    inspectorName: 'K. Somanna',
    variety: 'Kurnool Desi Pink',
    lotWeightQuintals: 28,
    sampleWeightKg: 5.0,
    summary: {
      gradeAPercent: 0,
      gradeBPercent: 30,
      ursPercent: 70,
      totalCount: 10,
      avgDiameterMm: 31.8,
      overallScore: 32,
      verdict: 'REJECTED_URS',
      defects: { sprouted: 0, rottenOrMould: 0, undersized: 6, mechanicalCut: 0, doubleOrDeformed: 1 },
      priceRecommendation: {
        baseMspPerQtl: 2400,
        qualityBonusOrPenalty: -1100,
        recommendedPricePerQtl: 1300,
        totalEstimatedLotValue: 36400
      }
    },
    tamperProofHash: 'c401fa9901428bd330a104be129994ca1',
    status: 'VALID'
  }
];
