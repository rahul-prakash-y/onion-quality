import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Flame, 
  ArrowRight, 
  ThumbsUp, 
  Flag, 
  Check, 
  RefreshCw,
  Ruler,
  Wifi,
  WifiOff,
  CloudUpload,
  Database,
  Loader2
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { useSync } from '../context/SyncContext';
import { submitHumanVerification, BackendDefectCounts } from '../services/api';
import { OnionVisualView } from './OnionVisualView';
import { OnionInspectorModal } from './OnionInspectorModal';
import { OnionDetection, DefectType, GradeClassification } from '../types';
import confetti from 'canvas-confetti';

export const AIAnalysisResults: React.FC = () => {
  const { 
    activeDetections, 
    setActiveDetections, 
    capturedImage, 
    currentBatchId, 
    selectedRegion, 
    activePreset,
    currentSummary, 
    setInspectionStep, 
    humanVerification, 
    setHumanVerification, 
    addReport, 
    setSelectedReport, 
    language 
  } = useInspection();

  const {
    effectiveOnline,
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    saveInspectionOffline,
    syncPendingInspections,
    isSyncing,
    pendingCount,
  } = useSync();

  const [selectedOnion, setSelectedOnion] = useState<OnionDetection | null>(null);
  const [viewMode, setViewMode] = useState<'boxes' | 'heatmap' | 'clean'>('boxes');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('1 false-positive rot adjusted to dry scale peel');
  
  // API and offline state tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  const total = activeDetections.length || 1;

  // Calculate granular counts and percentages for the required defects
  const damagedCount = activeDetections.filter(d => d.defect === 'mechanical_cut').length;
  const damagedPercent = Math.round((damagedCount / total) * 100);

  const rottenCount = activeDetections.filter(d => d.defect === 'rotten' || d.defect === 'mould').length;
  const rottenPercent = Math.round((rottenCount / total) * 100);

  const sproutedCount = activeDetections.filter(d => d.defect === 'sprouted').length;
  const sproutedPercent = Math.round((sproutedCount / total) * 100);

  const undersizedCount = activeDetections.filter(d => d.defect === 'undersized').length;
  const undersizedPercent = Math.round((undersizedCount / total) * 100);

  // Handle Human-in-the-loop Approval with Offline-First fallback
  const handleApprove = async () => {
    setIsSubmitting(true);
    setApiError(null);

    const verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const verificationRecord = {
      status: 'approved' as const,
      verifiedAt,
      feedbackNotes: 'Mandi grading officer confirmed visual prediction'
    };

    if (effectiveOnline) {
      try {
        // Attempt live API verification submission to FastAPI backend
        const defectCounts: BackendDefectCounts = {
          healthy: activeDetections.filter(d => d.defect === 'none').length,
          damaged: damagedCount,
          rotten: rottenCount,
          sprouted: sproutedCount,
          undersized: undersizedCount
        };

        // If batch corresponds to a server inspection ID, submit to backend
        const inspectionId = currentBatchId.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await submitHumanVerification(inspectionId, {
          status: 'approved',
          inspector_id: 'INS-MH-042',
          inspector_name: 'Anil Kulkarni (Grading Officer)',
          feedback_notes: 'Mandi grading officer confirmed visual prediction',
          corrected_counts: defectCounts,
          corrected_grade_a_percent: currentSummary.gradeAPercent,
          corrected_urs_percent: currentSummary.ursPercent
        }).catch((err) => {
          // If server returns error or is not reachable, fallback gracefully to offline storage
          console.warn('[API Client] Live verification call failed, caching to offline queue:', err);
          throw err;
        });

        setIsSavedOffline(false);
      } catch (err: any) {
        // Fallback to IndexedDB offline queue on network error
        await saveInspectionOffline({
          imageDataUrl: capturedImage,
          batchId: currentBatchId,
          region: selectedRegion,
          variety: activePreset.variety || 'Bhima Super (Nashik Red)',
          farmerName: activePreset.farmerName || 'Rameshwar Patil',
          detections: activeDetections,
          summary: currentSummary,
          humanVerification: verificationRecord
        });
        setIsSavedOffline(true);
      }
    } else {
      // Offline mode: Store directly to IndexedDB
      await saveInspectionOffline({
        imageDataUrl: capturedImage,
        batchId: currentBatchId,
        region: selectedRegion,
        variety: activePreset.variety || 'Bhima Super (Nashik Red)',
        farmerName: activePreset.farmerName || 'Rameshwar Patil',
        detections: activeDetections,
        summary: currentSummary,
        humanVerification: verificationRecord
      });
      setIsSavedOffline(true);
    }

    setHumanVerification(verificationRecord);
    setIsSubmitting(false);

    if (currentSummary.gradeAPercent >= 70) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#f59e0b']
      });
    }

    // Advance to Module 5 (Digital Quality Report Generation)
    setInspectionStep('report');
  };

  // Handle Human-in-the-loop Edit/Flag with Offline-First fallback
  const handleConfirmFlag = async () => {
    setIsSubmitting(true);
    setApiError(null);

    // Apply correction: update 1 defect to healthy Grade A
    const updatedDetections = activeDetections.map((d, index) => {
      if (index === 0 && d.defect !== 'none') {
        return {
          ...d,
          grade: 'Grade A' as const,
          defect: 'none' as const,
          notes: 'Inspector calibration: dry skin peel corrected to Grade A'
        };
      }
      return d;
    });

    setActiveDetections(updatedDetections);
    const verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const verificationRecord = {
      status: 'flagged' as const,
      verifiedAt,
      feedbackNotes: flagReason,
      adjustedCount: 1
    };

    if (effectiveOnline) {
      try {
        const inspectionId = currentBatchId.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await submitHumanVerification(inspectionId, {
          status: 'flagged',
          inspector_id: 'INS-MH-042',
          inspector_name: 'Anil Kulkarni (Grading Officer)',
          feedback_notes: flagReason,
          corrected_grade_a_percent: Math.min(100, currentSummary.gradeAPercent + 10),
          corrected_urs_percent: Math.max(0, currentSummary.ursPercent - 10)
        }).catch((err) => {
          console.warn('[API Client] Live verification call failed, fallback to offline:', err);
          throw err;
        });

        setIsSavedOffline(false);
      } catch (err: any) {
        await saveInspectionOffline({
          imageDataUrl: capturedImage,
          batchId: currentBatchId,
          region: selectedRegion,
          variety: activePreset.variety || 'Bhima Super (Nashik Red)',
          farmerName: activePreset.farmerName || 'Rameshwar Patil',
          detections: updatedDetections,
          summary: currentSummary,
          humanVerification: verificationRecord
        });
        setIsSavedOffline(true);
      }
    } else {
      await saveInspectionOffline({
        imageDataUrl: capturedImage,
        batchId: currentBatchId,
        region: selectedRegion,
        variety: activePreset.variety || 'Bhima Super (Nashik Red)',
        farmerName: activePreset.farmerName || 'Rameshwar Patil',
        detections: updatedDetections,
        summary: currentSummary,
        humanVerification: verificationRecord
      });
      setIsSavedOffline(true);
    }

    setHumanVerification(verificationRecord);
    setIsSubmitting(false);
    setIsEditModalOpen(false);

    // Proceed to Module 5 report
    setInspectionStep('report');
  };

  // Get color for bounding boxes
  const getBoxStyle = (grade: GradeClassification, defect: DefectType) => {
    if (defect === 'none' && grade === 'Grade A') {
      return {
        border: 'border-emerald-500',
        bg: 'bg-emerald-500/20',
        tag: 'bg-emerald-600',
        text: 'text-emerald-300',
        label: 'Healthy'
      };
    }
    if (defect === 'rotten' || defect === 'mould' || defect === 'mechanical_cut') {
      return {
        border: 'border-rose-500',
        bg: 'bg-rose-500/20',
        tag: 'bg-rose-600',
        text: 'text-rose-300',
        label: defect === 'mechanical_cut' ? 'Damaged' : 'Rotten'
      };
    }
    if (defect === 'sprouted') {
      return {
        border: 'border-yellow-400',
        bg: 'bg-yellow-400/20',
        tag: 'bg-yellow-500 text-black',
        text: 'text-yellow-300',
        label: 'Sprouted'
      };
    }
    return {
      border: 'border-amber-500',
      bg: 'bg-amber-500/20',
      tag: 'bg-amber-600',
      text: 'text-amber-300',
      label: defect === 'undersized' ? 'Undersized' : 'Grade B'
    };
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-50 duration-300 relative">
      {/* 0. OFFLINE-FIRST SIH STATUS BANNER */}
      {(!effectiveOnline || isSavedOffline || pendingCount > 0) && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/80 border border-amber-500/60 shadow-lg text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-900/60 border border-amber-500/40 text-amber-400">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                  Saved Offline - Pending Sync
                </span>
                <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-amber-900/90 text-amber-200 border border-amber-600/50">
                  IndexedDB
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 mt-0.5">
                Mandi terminal offline. Photos and corrections cached locally.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {effectiveOnline && pendingCount > 0 && (
              <button
                onClick={() => syncPendingInspections()}
                disabled={isSyncing}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-md transition disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3 h-3" />
                    <span>Sync ({pendingCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {apiError && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-[10px] uppercase font-bold text-rose-300 hover:text-white px-2 py-1 rounded-lg bg-rose-900/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Session Title Bar & Network Simulation Control */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              {currentBatchId} • {selectedRegion}
            </span>
            {/* SIH Simulation Toggle: lets judges test offline/online with 1 click */}
            <button
              onClick={toggleSimulatedOffline}
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1 border transition ${
                effectiveOnline
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900'
                  : 'bg-amber-950/90 text-amber-300 border-amber-600/60 hover:bg-amber-900'
              }`}
              title="Click to toggle simulated Mandi network disconnection"
            >
              {effectiveOnline ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Online (Simulate Offline)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  <span>Offline Mode (Simulate Reconnect)</span>
                </>
              )}
            </button>
          </div>
          <h2 className="text-base font-extrabold text-white mt-1">
            AI Vision & Grading Engine Results
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('boxes')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'boxes' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Bounding Boxes View"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'heatmap' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Defect Heatmap View"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('clean')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'clean' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Clean Image View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. ANNOTATED IMAGE: Absolute positioned mock bounding boxes with color coding */}
      <div className="space-y-1.5">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none group">
          {/* Base Visual / Captured Tray Image */}
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Analyzed Onion Sample" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <OnionVisualView
              detections={activeDetections}
              selectedOnionId={selectedOnion?.id || null}
              onSelectOnion={(o) => setSelectedOnion(o)}
              viewMode={viewMode}
              isScanning={false}
            />
          )}

          {/* Absolute Positioned Bounding Boxes Overlay */}
          {viewMode === 'boxes' && (
            <div className="absolute inset-0 pointer-events-auto">
              {activeDetections.map((detection) => {
                const isSelected = selectedOnion?.id === detection.id;
                const style = getBoxStyle(detection.grade, detection.defect);

                return (
                  <div
                    key={detection.id}
                    onClick={() => setSelectedOnion(detection)}
                    className={`absolute cursor-pointer rounded-lg transition-all duration-200 border-2 ${style.border} ${
                      isSelected 
                        ? 'ring-4 ring-white/90 scale-105 z-20 shadow-2xl bg-white/10' 
                        : `${style.bg} hover:scale-102 hover:z-10`
                    }`}
                    style={{
                      left: `${detection.x}%`,
                      top: `${detection.y}%`,
                      width: `${detection.width}%`,
                      height: `${detection.height}%`,
                    }}
                  >
                    {/* Corner Reticle Tags */}
                    <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white pointer-events-none" />
                    <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white pointer-events-none" />
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none" />

                    {/* Color-Coded Tag Label */}
                    <div className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-tight text-white whitespace-nowrap shadow-md flex items-center gap-1 ${style.tag}`}>
                      <span>{detection.diameterMm}mm</span>
                      <span>[{style.label}]</span>
                    </div>

                    {/* Confidence percentage */}
                    <div className="absolute -bottom-4 right-0 px-1 py-0.2 bg-black/80 text-[8px] font-mono text-slate-300 rounded border border-white/20">
                      {Math.round(detection.confidence * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading Spinner Overlay during API calls */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-2.5 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Verifying & Securing Certificate...
              </span>
              <span className="text-[10px] text-slate-400">
                {effectiveOnline ? 'Syncing to Central PostgreSQL / e-NAM Cluster' : 'Writing to Local IndexedDB Cache'}
              </span>
            </div>
          )}
        </div>

        {/* Legend bar */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
          <span className="font-semibold text-slate-300">Color Legend:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Healthy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              Sprouted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Rotten/Damaged
            </span>
          </div>
        </div>
      </div>

      {/* 3. GRADING ESTIMATION: Prominent visual indicator */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            AI Grading Estimation
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            ⌀ {currentSummary.avgDiameterMm}mm Average
          </span>
        </div>

        {/* Semi-circle styled gauge visual */}
        <div className="flex items-center justify-center pt-2">
          <div className="relative w-44 h-24 flex items-end justify-center">
            <svg className="w-44 h-24 overflow-visible" viewBox="0 0 100 50">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gradeGradient)"
                strokeWidth="10"
                strokeDasharray={`${(currentSummary.gradeAPercent / 100) * 126} 126`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="70%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Bold Score Text */}
            <div className="absolute text-center -bottom-1">
              <span className="text-3xl font-black text-white font-sans tracking-tight block">
                {currentSummary.overallScore}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block -mt-1">
                Quality Index
              </span>
            </div>
          </div>
        </div>

        {/* Large Prominent Grade A % vs URS % Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Estimated Grade A % */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center">
            <span className="text-[10.5px] uppercase font-bold text-emerald-400 block tracking-wide">
              Estimated Grade A %
            </span>
            <div className="text-3xl font-black text-white font-sans mt-0.5">
              {currentSummary.gradeAPercent}%
            </div>
            <span className="text-[9.5px] text-emerald-300 block mt-0.5">
              Export Standard (&ge;50mm)
            </span>
          </div>

          {/* Estimated URS % */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
            <span className="text-[10.5px] uppercase font-bold text-rose-400 block tracking-wide">
              Estimated URS %
            </span>
            <div className="text-3xl font-black text-rose-300 font-sans mt-0.5">
              {currentSummary.ursPercent}%
            </div>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              Reject Specification
            </span>
          </div>
        </div>
      </div>

      {/* 2. DEFECT BREAKDOWN: Data card showing counts & percentages */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Identified Defect Breakdown
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {total} Specimen Sampled
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 1. Damaged */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Damaged (Cuts)
              </span>
              <span className="text-base font-bold text-blue-300">
                {damagedCount} <span className="text-[11px] font-normal text-slate-400">({damagedPercent}%)</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          </div>

          {/* 2. Rotten */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Rotten & Mould
              </span>
              <span className="text-base font-bold text-rose-400">
                {rottenCount} <span className="text-[11px] font-normal text-slate-400">({rottenPercent}%)</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>

          {/* 3. Sprouted */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Sprouted Shoots
              </span>
              <span className="text-base font-bold text-yellow-300">
                {sproutedCount} <span className="text-[11px] font-normal text-slate-400">({sproutedPercent}%)</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          </div>

          {/* 4. Undersized */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Undersized (&lt;45mm)
              </span>
              <span className="text-base font-bold text-amber-400">
                {undersizedCount} <span className="text-[11px] font-normal text-slate-400">({undersizedPercent}%)</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
        </div>
      </div>

      {/* 4. HUMAN VERIFICATION STEP (CONTINUAL LEARNING SYSTEM) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Human Verification Step (Continual Learning)
          </span>
          <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
            Active Learning Loop
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
          <p className="text-xs font-semibold text-slate-200">
            Do these results look accurate?
          </p>
          <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
            Your verification verifies quality standards and feeds edge model weights for continuous regional adaptation.
          </p>
        </div>

        {/* Approve and Edit/Flag Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Approve Button */}
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
            id="approve-results-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                <span>Approve Results</span>
              </>
            )}
          </button>

          {/* Edit / Flag Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            disabled={isSubmitting}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/40 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
            id="edit-flag-results-btn"
          >
            <Flag className="w-4 h-4" />
            <span>Edit / Flag</span>
          </button>
        </div>
      </div>

      {/* Continual Learning Edit/Flag Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl p-4 space-y-3.5 text-xs text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase">
                <Flag className="w-4 h-4" />
                <span>Continuous Learning Feedback</span>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Flag corrections to recalibrate optical threshold parameters for lot <strong className="text-white">{currentBatchId}</strong>:
            </p>

            <div className="space-y-2">
              {[
                '1 false-positive rot adjusted to dry scale peel',
                'Borderline 44mm caliber approved as Grade A (+1mm tolerance)',
                'Sprout shoot dormant, non-penetrating (<5mm)',
                'Harvester mechanical blade scuff superficial only'
              ].map((reason, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer text-[10.5px] transition ${
                    flagReason === reason 
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="flagAdjustment"
                    checked={flagReason === reason}
                    onChange={() => setFlagReason(reason)}
                    className="mt-0.5 text-amber-500 focus:ring-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFlag}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <span>Apply & Proceed</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specimen Telemetry Inspector Modal */}
      <OnionInspectorModal
        detection={selectedOnion}
        onClose={() => setSelectedOnion(null)}
        language={language}
      />
    </div>
  );
};
