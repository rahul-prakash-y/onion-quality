import React, { createContext, useContext, useState } from 'react';
import { 
  ActiveScreen, 
  DigitalCertificate, 
  ProcurementCenter, 
  SamplePreset, 
  Language 
} from '../types';
import { 
  PROCUREMENT_CENTERS, 
  SAMPLE_PRESETS, 
  INITIAL_BATCH_HISTORY 
} from '../data/mockData';

interface InspectionContextType {
  currentScreen: ActiveScreen;
  setCurrentScreen: (screen: ActiveScreen) => void;
  reports: DigitalCertificate[];
  addReport: (report: DigitalCertificate) => void;
  updateReport: (certificateId: string, updated: Partial<DigitalCertificate>) => void;
  selectedReport: DigitalCertificate | null;
  setSelectedReport: (report: DigitalCertificate | null) => void;
  selectedCenter: ProcurementCenter;
  setSelectedCenter: (center: ProcurementCenter) => void;
  activePreset: SamplePreset;
  setActivePreset: (preset: SamplePreset) => void;
  language: Language;
  toggleLanguage: () => void;
  isMobileFrame: boolean;
  toggleMobileFrame: () => void;
  isDisputeModalOpen: boolean;
  setIsDisputeModalOpen: (isOpen: boolean) => void;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('home');
  const [reports, setReports] = useState<DigitalCertificate[]>(INITIAL_BATCH_HISTORY);
  const [selectedReport, setSelectedReport] = useState<DigitalCertificate | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<ProcurementCenter>(PROCUREMENT_CENTERS[0]);
  const [activePreset, setActivePreset] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

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
        reports,
        addReport,
        updateReport,
        selectedReport,
        setSelectedReport,
        selectedCenter,
        setSelectedCenter,
        activePreset,
        setActivePreset,
        language,
        toggleLanguage,
        isMobileFrame,
        toggleMobileFrame,
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
