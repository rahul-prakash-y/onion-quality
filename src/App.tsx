import React from 'react';
import { InspectionProvider, useInspection } from './context/InspectionContext';
import { SyncProvider } from './context/SyncContext';
import { AppShell } from './components/AppShell';
import { HomeScreen } from './components/HomeScreen';
import { InspectionCapture } from './components/InspectionCapture';
import { AIAnalysisResults } from './components/AIAnalysisResults';
import { DigitalQualityReportScreen } from './components/DigitalQualityReportScreen';
import { BatchHistory } from './components/BatchHistory';
import { DigitalReportModal } from './components/DigitalReportModal';
import { DisputeModal } from './components/DisputeModal';
import { calculateQualitySummary } from './data/mockData';

function AppContent() {
  const { 
    currentScreen, 
    inspectionStep, 
    reports, 
    updateReport, 
    selectedReport, 
    setSelectedReport, 
    activePreset, 
    language,
    isDisputeModalOpen,
    setIsDisputeModalOpen,
    currentBatchId,
    activeDetections,
    setActiveDetections
  } = useInspection();

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

    setActiveDetections(recalibratedDetections);
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
      {/* 1. MODULE 2: Dashboard (Home Screen) */}
      {currentScreen === 'home' && <HomeScreen />}

      {/* 2. INSPECTION WORKSPACE (MODULES 3, 4, 5) */}
      {currentScreen === 'inspection' && (
        <>
          {/* MODULE 3: Image Capture & Sample Upload (viewfinder, capture/upload, geographic profiling, analyzing state) */}
          {(inspectionStep === 'capture' || inspectionStep === 'analyzing') && (
            <InspectionCapture />
          )}

          {/* MODULE 4: AI Analysis Results & Grading Engine View (annotated image, defect breakdown, grading estimation, human verification) */}
          {inspectionStep === 'results' && (
            <AIAnalysisResults />
          )}

          {/* MODULE 5: Digital Quality Report Generation (formal layout, grading rules summary, sync to cloud, download PDF) */}
          {inspectionStep === 'report' && (
            <DigitalQualityReportScreen />
          )}
        </>
      )}

      {/* 3. REPORTS TAB (Past Inspection Reports Ledger) */}
      {currentScreen === 'reports' && (
        <div className="p-3.5 sm:p-4">
          <BatchHistory
            batches={reports}
            onSelectBatch={(report) => setSelectedReport(report)}
            language={language}
          />
        </div>
      )}

      {/* Official Certificate Modal for Archived Reports */}
      {selectedReport && currentScreen === 'reports' && (
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
              lotId: currentBatchId,
              farmerName: 'Rameshwar Patil',
              farmerPhone: '+91 98220 44921',
              procurementCenter: 'Lasalgaon APMC Main Yard',
              geographicSource: 'Maharashtra',
              inspectorId: 'INS-MH-042',
              inspectorName: 'Anil Kulkarni',
              variety: 'Bhima Super (Nashik Red)',
              lotWeightQuintals: 42,
              sampleWeightKg: 5.0,
              summary: calculateQualitySummary(activeDetections),
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
    <SyncProvider>
      <InspectionProvider>
        <AppContent />
      </InspectionProvider>
    </SyncProvider>
  );
}

export default App;


