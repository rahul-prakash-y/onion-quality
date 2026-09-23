import React, { useState } from 'react';
import { 
  FileCheck, 
  Download, 
  CloudUpload, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  User, 
  MapPin, 
  Award, 
  Layers, 
  Printer, 
  Share2, 
  QrCode, 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw,
  Info
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { DigitalCertificate } from '../types';

export const DigitalQualityReportScreen: React.FC = () => {
  const { 
    currentBatchId, 
    selectedRegion, 
    currentSummary, 
    setCurrentScreen, 
    setInspectionStep, 
    generateNewBatchId, 
    addReport, 
    syncReportToCloud, 
    isSyncing, 
    humanVerification, 
    selectedCenter 
  } = useInspection();

  const [isSynced, setIsSynced] = useState(false);
  const [downloadAlertShown, setDownloadAlertShown] = useState(false);

  const certId = `CERT-${currentBatchId.replace('BATCH-', '')}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Save report to state on component mount if not already saved
  React.useEffect(() => {
    const reportData: DigitalCertificate = {
      certificateId: certId,
      timestamp: currentDate,
      lotId: currentBatchId,
      farmerName: 'Rameshwar Patil (Mandi Lot)',
      farmerPhone: '+91 98220 14592',
      procurementCenter: selectedCenter.name,
      geographicSource: selectedRegion,
      inspectorId: 'INS-MH-042',
      inspectorName: 'Anil Kulkarni (APMC Certified Grader)',
      variety: selectedRegion === 'Maharashtra' ? 'Bhima Super' : 'Regional Red Globe',
      lotWeightQuintals: 42,
      sampleWeightKg: 5.0,
      summary: currentSummary,
      tamperProofHash: Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      status: 'VALID',
      syncedToCloud: isSynced,
      humanVerification: humanVerification
    };
    addReport(reportData);
  }, []);

  const handleSyncToCloud = async () => {
    await syncReportToCloud(certId);
    setIsSynced(true);
  };

  const handleDownloadPdf = () => {
    setDownloadAlertShown(true);
    alert(`[OnionVision AI Export]\n\nGenerating and downloading Official Digital Quality Certificate PDF:\n\nBatch ID: ${currentBatchId}\nGeographic Source: ${selectedRegion}\nQuality Score: ${currentSummary.overallScore}/100\nGrade A Share: ${currentSummary.gradeAPercent}%\nVerified By: Anil Kulkarni\n\nFile: OnionVision_${currentBatchId}_Official.pdf`);
    setTimeout(() => setDownloadAlertShown(false), 3000);
  };

  const handleStartNext = () => {
    generateNewBatchId();
    setInspectionStep('capture');
    setCurrentScreen('inspection');
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-50 duration-300">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold transition"
          id="back-to-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
          Module 5: Digital Quality Report
        </span>
      </div>

      {/* FORMAL REPORT LAYOUT */}
      <div className="bg-slate-900 border border-emerald-800/60 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Subtle Watermark Stamp */}
        <div className="absolute right-4 top-16 pointer-events-none opacity-5">
          <span className="text-8xl">🧅</span>
        </div>

        {/* 1. Header with Government / Mandi Authority Seal */}
        <div className="text-center pb-3 border-b border-slate-700/80">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>APMC National Mandi Digital Quality Standard</span>
          </div>

          <h1 className="text-base font-extrabold text-white tracking-tight uppercase">
            Official Onion Quality Certificate
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Agricultural Produce Market Committee Quality Assurance Directorate
          </p>
        </div>

        {/* 1. Formal Report Layout Grid: Batch ID, Date, Inspector Name, Geographic Source, Quality Score */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
          {/* Batch ID */}
          <div>
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
              Batch Identification
            </span>
            <span className="font-mono font-bold text-emerald-400 text-xs mt-0.5 block truncate">
              {currentBatchId}
            </span>
            <span className="text-[9.5px] text-slate-400 font-mono block">
              Cert #{certId}
            </span>
          </div>

          {/* Date */}
          <div>
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
              Date & Timestamp
            </span>
            <span className="font-semibold text-white text-xs mt-0.5 block truncate">
              {currentDate}
            </span>
            <span className="text-[9.5px] text-emerald-400 block">
              ✓ Tamper-proof logged
            </span>
          </div>

          {/* Inspector Name */}
          <div className="pt-2 border-t border-slate-700/40">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
              Inspector Name
            </span>
            <span className="font-semibold text-white text-xs mt-0.5 block truncate">
              Anil Kulkarni
            </span>
            <span className="text-[9.5px] text-slate-400 block font-mono">
              Badge: #INS-MH-042
            </span>
          </div>

          {/* Geographic Source */}
          <div className="pt-2 border-t border-slate-700/40">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
              Geographic Source
            </span>
            <span className="font-semibold text-white text-xs mt-0.5 block truncate">
              {selectedRegion}
            </span>
            <span className="text-[9.5px] text-amber-400 block truncate">
              {selectedCenter.name}
            </span>
          </div>
        </div>

        {/* OVERALL QUALITY SCORE CARD */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 flex items-center justify-between shadow-glow-green">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wide">
              Overall Quality Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white font-sans">
                {currentSummary.overallScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentSummary.verdict.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-1">
              Estimated Fair Mandi Rate: <strong className="text-emerald-300 font-mono">₹{currentSummary.priceRecommendation.recommendedPricePerQtl} / Qtl</strong>
            </span>
          </div>

          {/* Grade Breakdown pills */}
          <div className="text-right space-y-1 font-mono text-[11px]">
            <div className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              Grade A: <strong>{currentSummary.gradeAPercent}%</strong>
            </div>
            <div className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
              Grade B: <strong>{currentSummary.gradeBPercent}%</strong>
            </div>
            <div className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
              URS: <strong>{currentSummary.ursPercent}%</strong>
            </div>
          </div>
        </div>

        {/* 2. SUMMARY OF THE GRADING RULES APPLIED */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10.5px]">
            <Info className="w-3.5 h-3.5" />
            <span>Summary of Grading Rules Applied (AGMARK Standard)</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-emerald-400 block font-semibold">
                • Grade A Rules (Export Standard):
              </strong>
              <span>
                Minimum diameter &ge;45mm, firm compact bulb, dry tight neck (&le;5mm), clean dry papery outer skin, free from sprouting, decay, mould, root protrusion, or sunscald.
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-amber-400 block font-semibold">
                • Grade B Rules (Fair Average Quality):
              </strong>
              <span>
                Equatorial diameter 35mm to 45mm, sound bulbs with minor superficial blemishes or slight skin flaking, zero internal rot.
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-rose-400 block font-semibold">
                • URS Rules (Under-grade / Reject Specification):
              </strong>
              <span>
                Bulbs &lt;35mm (undersized), active green shoot emergence (&gt;5mm), bacterial soft rot, Aspergillus niger black mould, mechanical fracture cuts, or double/split twins.
              </span>
            </div>
          </div>
        </div>

        {/* Human-in-the-Loop Confirmation Stamp */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[10.5px]">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Continual Learning Signoff</span>
              <span className="text-[10px] text-slate-400">
                Verified by Inspector at {humanVerification.verifiedAt || 'Field Terminal'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
            {humanVerification.status === 'flagged' ? 'FLAGGED & CALIBRATED' : 'HUMAN VERIFIED'}
          </span>
        </div>

        {/* ACTION BUTTONS: 3. Sync to Cloud and 4. Download PDF */}
        <div className="space-y-2 pt-2 border-t border-slate-700/60">
          {/* 3. "Sync to Cloud/National Dataset" button */}
          <button
            onClick={handleSyncToCloud}
            disabled={isSyncing || isSynced}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
              isSynced
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-emerald-950/60'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-98'
            }`}
            id="sync-cloud-btn"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Syncing to National Mandi PostgreSQL Cluster...</span>
              </>
            ) : isSynced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Synced to Central PostgreSQL Dataset</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Sync to Cloud / National Dataset</span>
              </>
            )}
          </button>

          {/* 4. "Download PDF" button */}
          <button
            onClick={handleDownloadPdf}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition active:scale-98"
            id="download-pdf-btn"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Download PDF Quality Certificate</span>
          </button>
        </div>

        {/* Start Next Inspection CTA */}
        <div className="pt-1">
          <button
            onClick={handleStartNext}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/80 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-900/50 flex items-center justify-center gap-1.5 transition"
            id="start-another-inspection-btn"
          >
            <span>Start Another Bulk Inspection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
