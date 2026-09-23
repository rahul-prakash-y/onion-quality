import React from 'react';
import { InspectionProvider, useInspection } from './context/InspectionContext';
import { AppShell } from './components/AppShell';
import { HomeScreen } from './components/HomeScreen';
import { CameraScanner } from './components/CameraScanner';
import { BatchHistory } from './components/BatchHistory';
import { DigitalReportModal } from './components/DigitalReportModal';
import { DisputeModal } from './components/DisputeModal';
import { calculateQualitySummary } from './data/mockData';
import { DigitalCertificate } from './types';

function AppContent() {
  const { 
    currentScreen, 
    reports, 
    addReport, 
    updateReport, 
    selectedReport, 
    setSelectedReport, 
    activePreset, 
    setActivePreset, 
    language,
    isDisputeModalOpen,
    setIsDisputeModalOpen
  } = useInspection();

  // Handle generating new certificate from an inspection
  const handleGenerateCertificate = (cert: DigitalCertificate) => {
    addReport(cert);
    setSelectedReport(cert);
  };

  // Handle formal dispute submission
  const handleSubmitDispute = (reason: string) => {
    if (!selectedReport) return;
    updateReport(selectedReport.certificateId, {
      status: 'DISPUTED',
      disputeDetails: {
        raisedAt: new Date().toLocaleString(),
        reason,
        status: 'PENDING'
      }
    });
  };

  // Secondary re-scan simulation after dispute
  const handleTriggerReScan = () => {
    if (!selectedReport) return;

    // Recalibrate borderline specimen
    const recalibratedDetections = activePreset.detections.map(d => {
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

    updateReport(selectedReport.certificateId, {
      status: 'RE_EVALUATED',
      summary: recalibratedSummary,
      disputeDetails: {
        raisedAt: selectedReport.disputeDetails?.raisedAt || new Date().toLocaleString(),
        reason: selectedReport.disputeDetails?.reason || 'Dispute re-scan',
        status: 'RESOLVED',
        resolutionNotes: 'Secondary optical scan performed. Borderline calibers re-classified under APMC Dispute Tribunal.'
      }
    });
  };

  return (
    <AppShell>
      {/* Dynamic Screen Routing */}
      {currentScreen === 'home' && <HomeScreen />}

      {currentScreen === 'inspection' && (
        <CameraScanner
          currentPreset={activePreset}
          onSelectPreset={setActivePreset}
          language={language}
          onGenerateCertificate={handleGenerateCertificate}
          onOpenDispute={() => setIsDisputeModalOpen(true)}
        />
      )}

      {currentScreen === 'reports' && (
        <div className="p-3.5 sm:p-4">
          <BatchHistory
            batches={reports}
            onSelectBatch={(report) => setSelectedReport(report)}
            language={language}
          />
        </div>
      )}

      {/* Official Digital Certificate Modal */}
      {selectedReport && (
        <DigitalReportModal
          certificate={selectedReport}
          onClose={() => setSelectedReport(null)}
          language={language}
          onOpenDispute={() => setIsDisputeModalOpen(true)}
        />
      )}

      {/* Mandi Dispute Escalation Modal */}
      {isDisputeModalOpen && (
        <DisputeModal
          certificate={
            selectedReport || {
              certificateId: `OV-2026-MH-${Math.floor(10000 + Math.random() * 90000)}`,
              timestamp: new Date().toLocaleString(),
              lotId: activePreset.lotNumber,
              farmerName: activePreset.farmerName,
              farmerPhone: '+91 98220 44921',
              procurementCenter: activePreset.originMandi,
              inspectorId: 'INS-MH-042',
              inspectorName: 'Anil Kulkarni',
              variety: activePreset.variety,
              lotWeightQuintals: 42,
              sampleWeightKg: activePreset.sampleWeightKg,
              summary: calculateQualitySummary(activePreset.detections),
              tamperProofHash: 'e391b10ca849204cdbf98a101239aa812',
              status: 'VALID'
            }
          }
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          onSubmitDispute={handleSubmitDispute}
          onTriggerReScan={handleTriggerReScan}
          language={language}
        />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <InspectionProvider>
      <AppContent />
    </InspectionProvider>
  );
}

export default App;
