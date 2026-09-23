import React, { createContext, useContext, useState } from 'react';
import { 
  ActiveScreen, 
  DigitalCertificate, 
  ProcurementCenter, 
  SamplePreset, 
  Language,
  GeographicRegion,
  InspectionStep,
  OnionDetection,
  QualitySummary,
  HumanVerificationRecord
} from '../types';
import { 
  PROCUREMENT_CENTERS, 
  SAMPLE_PRESETS, 
  INITIAL_BATCH_HISTORY,
  calculateQualitySummary
} from '../data/mockData';

interface InspectionContextType {
  // Screen and basic settings
  currentScreen: ActiveScreen;
  setCurrentScreen: (screen: ActiveScreen) => void;
  language: Language;
  toggleLanguage: () => void;
  isMobileFrame: boolean;
  toggleMobileFrame: () => void;
  selectedCenter: ProcurementCenter;
  setSelectedCenter: (center: ProcurementCenter) => void;

  // Module 3 & 4 Inspection Flow State
  inspectionStep: InspectionStep;
  setInspectionStep: (step: InspectionStep) => void;
  selectedRegion: GeographicRegion;
  setSelectedRegion: (region: GeographicRegion) => void;
  currentBatchId: string;
  generateNewBatchId: () => void;
  activePreset: SamplePreset;
  setActivePreset: (preset: SamplePreset) => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  activeDetections: OnionDetection[];
  setActiveDetections: (detections: OnionDetection[]) => void;
  currentSummary: QualitySummary;
  humanVerification: HumanVerificationRecord;
  setHumanVerification: React.Dispatch<React.SetStateAction<HumanVerificationRecord>>;
  analyzingStepIndex: number;
  startAnalysisFlow: () => void;

  // Module 5 Reports & Cloud Sync
  reports: DigitalCertificate[];
  addReport: (report: DigitalCertificate) => void;
  updateReport: (certificateId: string, updated: Partial<DigitalCertificate>) => void;
  selectedReport: DigitalCertificate | null;
  setSelectedReport: (report: DigitalCertificate | null) => void;
  isSyncing: boolean;
  syncReportToCloud: (certificateId: string) => Promise<void>;

  // Dispute Modal
  isDisputeModalOpen: boolean;
  setIsDisputeModalOpen: (isOpen: boolean) => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<ProcurementCenter>(PROCUREMENT_CENTERS[0]);

  // Inspection flow
  const [inspectionStep, setInspectionStep] = useState<InspectionStep>('capture');
  const [selectedRegion, setSelectedRegion] = useState<GeographicRegion>('Maharashtra');
  const [currentBatchId, setCurrentBatchId] = useState<string>('BATCH-MH-2026-4401');
  const [activePreset, setActivePreset] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeDetections, setActiveDetections] = useState<OnionDetection[]>(SAMPLE_PRESETS[0].detections);
  const [analyzingStepIndex, setAnalyzingStepIndex] = useState(0);
  const [humanVerification, setHumanVerification] = useState<HumanVerificationRecord>({
    status: 'pending'
  });

  // Reports ledger
  const [reports, setReports] = useState<DigitalCertificate[]>(INITIAL_BATCH_HISTORY);
  const [selectedReport, setSelectedReport] = useState<DigitalCertificate | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const currentSummary = calculateQualitySummary(activeDetections);

  const generateNewBatchId = () => {
    const stateCodes: Record<GeographicRegion, string> = {
      'Maharashtra': 'MH',
      'Madhya Pradesh': 'MP',
      'Karnataka': 'KA',
      'Gujarat': 'GJ',
      'Rajasthan': 'RJ'
    };
    const code = stateCodes[selectedRegion] || 'MH';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setCurrentBatchId(`BATCH-${code}-2026-${randomNum}`);
  };

  const startAnalysisFlow = () => {
    setInspectionStep('analyzing');
    setAnalyzingStepIndex(0);

    // Step 1: Detecting individual onions (0.5s)
    setTimeout(() => {
      setAnalyzingStepIndex(1);
    }, 600);

    // Step 2: Identifying damage and rot (1.2s)
    setTimeout(() => {
      setAnalyzingStepIndex(2);
    }, 1300);

    // Step 3: Estimating Grade A and URS percentages (1.9s) -> Transition to Results
    setTimeout(() => {
      setAnalyzingStepIndex(3);
      setTimeout(() => {
        setInspectionStep('results');
        setHumanVerification({ status: 'pending' });
      }, 700);
    }, 2000);
  };

  const addReport = (report: DigitalCertificate) => {
    setReports(prev => [report, ...prev.filter(r => r.certificateId !== report.certificateId)]);
  };

  const updateReport = (certificateId: string, updated: Partial<DigitalCertificate>) => {
    setReports(prev => 
      prev.map(r => r.certificateId === certificateId ? { ...r, ...updated } : r)
    );
    if (selectedReport && selectedReport.certificateId === certificateId) {
      setSelectedReport(prev => prev ? { ...prev, ...updated } : null);
    }
  };

  const syncReportToCloud = async (certificateId: string) => {
    setIsSyncing(true);
    // Simulate real network latency to central PostgreSQL / Firebase cluster
    await new Promise(resolve => setTimeout(resolve, 1200));
    updateReport(certificateId, { syncedToCloud: true });
    setIsSyncing(false);
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const toggleMobileFrame = () => {
    setIsMobileFrame(prev => !prev);
  };

  return (
    <InspectionContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        language,
        toggleLanguage,
        isMobileFrame,
        toggleMobileFrame,
        selectedCenter,
        setSelectedCenter,

        inspectionStep,
        setInspectionStep,
        selectedRegion,
        setSelectedRegion,
        currentBatchId,
        generateNewBatchId,
        activePreset,
        setActivePreset,
        capturedImage,
        setCapturedImage,
        activeDetections,
        setActiveDetections,
        currentSummary,
        humanVerification,
        setHumanVerification,
        analyzingStepIndex,
        startAnalysisFlow,

        reports,
        addReport,
        updateReport,
        selectedReport,
        setSelectedReport,
        isSyncing,
        syncReportToCloud,

        isDisputeModalOpen,
        setIsDisputeModalOpen,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspection = () => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
};
