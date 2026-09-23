import React, { useState } from 'react';
import { Header } from './components/Header';
import { MobileFrame } from './components/MobileFrame';
import { CameraScanner } from './components/CameraScanner';
import { BatchHistory } from './components/BatchHistory';
import { AnalyticsView } from './components/AnalyticsView';
import { DigitalReportModal } from './components/DigitalReportModal';
import { DisputeModal } from './components/DisputeModal';
import { 
  ProcurementCenter, 
  SamplePreset, 
  DigitalCertificate, 
  Language 
} from './types';
import { 
  PROCUREMENT_CENTERS, 
  SAMPLE_PRESETS, 
  INITIAL_BATCH_HISTORY,
  calculateQualitySummary 
} from './data/mockData';

export function App() {
  const [selectedCenter, setSelectedCenter] = useState<ProcurementCenter>(PROCUREMENT_CENTERS[0]);
  const [currentPreset, setCurrentPreset] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'analytics'>('scanner');
  
  const [batchHistory, setBatchHistory] = useState<DigitalCertificate[]>(INITIAL_BATCH_HISTORY);
  const [activeCertificate, setActiveCertificate] = useState<DigitalCertificate | null>(null);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  // Toggle Mobile Frame preview
  const handleToggleMobileFrame = () => {
    setIsMobileFrame(prev => !prev);
  };

  // Generate & Save new Digital Certificate
  const handleGenerateCertificate = (cert: DigitalCertificate) => {
    setActiveCertificate(cert);
    // Add to history if not present
    setBatchHistory(prev => [cert, ...prev.filter(b => b.certificateId !== cert.certificateId)]);
  };

  // Handle Formal Dispute submission
  const handleSubmitDispute = (reason: string) => {
    if (!activeCertificate) return;

    const updatedCert: DigitalCertificate = {
      ...activeCertificate,
      status: 'DISPUTED',
      disputeDetails: {
        raisedAt: new Date().toLocaleString(),
        reason,
        status: 'PENDING'
      }
    };

    setActiveCertificate(updatedCert);
    setBatchHistory(prev => 
      prev.map(b => b.certificateId === updatedCert.certificateId ? updatedCert : b)
    );
  };

  // Secondary Re-scan simulation after dispute
  const handleTriggerReScan = () => {
    // Recalibrate borderline preset to Grade A with fine-grain tolerance
    const recalibratedDetections = currentPreset.detections.map(d => {
      if (d.grade === 'URS' && d.defect === 'undersized') {
        return {
          ...d,
          diameterMm: 45,
          grade: 'Grade B' as const,
          defect: 'none' as const,
          notes: 'Secondary optical re-measurement confirms 45mm within tolerance'
        };
      }
      return d;
    });

    const recalibratedSummary = calculateQualitySummary(recalibratedDetections);
    
    if (activeCertificate) {
      const resolvedCert: DigitalCertificate = {
        ...activeCertificate,
        status: 'RE_EVALUATED',
        summary: recalibratedSummary,
        disputeDetails: {
          raisedAt: activeCertificate.disputeDetails?.raisedAt || new Date().toLocaleString(),
          reason: activeCertificate.disputeDetails?.reason || 'Dispute re-scan',
          status: 'RESOLVED',
          resolutionNotes: 'Secondary optical scan performed. Borderline calibers re-classified under APMC Dispute Tribunal.'
        }
      };
      setActiveCertificate(resolvedCert);
      setBatchHistory(prev => 
        prev.map(b => b.certificateId === resolvedCert.certificateId ? resolvedCert : b)
      );
    }
  };

  return (
    <MobileFrame
      isMobileFrame={isMobileFrame}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      language={language}
    >
      {/* Top Header */}
      <Header
        centers={PROCUREMENT_CENTERS}
        selectedCenter={selectedCenter}
        onSelectCenter={setSelectedCenter}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={handleToggleMobileFrame}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'scanner' && (
          <CameraScanner
            currentPreset={currentPreset}
            onSelectPreset={setCurrentPreset}
            language={language}
            onGenerateCertificate={handleGenerateCertificate}
            onOpenDispute={() => setIsDisputeOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <div className="p-3.5 sm:p-4">
            <BatchHistory
              batches={batchHistory}
              onSelectBatch={(batch) => setActiveCertificate(batch)}
              language={language}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-3.5 sm:p-4">
            <AnalyticsView language={language} />
          </div>
        )}
      </main>

      {/* Official Digital Quality Certificate Modal */}
      {activeCertificate && (
        <DigitalReportModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
          language={language}
          onOpenDispute={() => setIsDisputeOpen(true)}
        />
      )}

      {/* Dispute Escalation Protocol Modal */}
      {isDisputeOpen && (
        <DisputeModal
          certificate={
            activeCertificate || {
              certificateId: `OV-2026-MH-${Math.floor(10000 + Math.random() * 90000)}`,
              timestamp: new Date().toLocaleString(),
              lotId: currentPreset.lotNumber,
              farmerName: currentPreset.farmerName,
              farmerPhone: '+91 98220 44921',
              procurementCenter: currentPreset.originMandi,
              inspectorId: 'INS-MH-042',
              inspectorName: 'Anil Kulkarni',
              variety: currentPreset.variety,
              lotWeightQuintals: 42,
              sampleWeightKg: currentPreset.sampleWeightKg,
              summary: calculateQualitySummary(currentPreset.detections),
              tamperProofHash: 'e391b10ca849204cdbf98a101239aa812',
              status: 'VALID'
            }
          }
          isOpen={isDisputeOpen}
          onClose={() => setIsDisputeOpen(false)}
          onSubmitDispute={handleSubmitDispute}
          onTriggerReScan={handleTriggerReScan}
          language={language}
        />
      )}
    </MobileFrame>
  );
}
export default App;
