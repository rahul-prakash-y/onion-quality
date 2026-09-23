import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Layers, 
  Flame, 
  ChevronRight, 
  Info,
  CheckCircle2,
  VideoOff
} from 'lucide-react';
import { OnionVisualView } from './OnionVisualView';
import { Scorecard } from './Scorecard';
import { OnionInspectorModal } from './OnionInspectorModal';
import { 
  SamplePreset, 
  OnionDetection, 
  QualitySummary, 
  Language, 
  DigitalCertificate 
} from '../types';
import { SAMPLE_PRESETS, calculateQualitySummary } from '../data/mockData';
import { TRANSLATIONS } from '../data/translations';
import confetti from 'canvas-confetti';

interface CameraScannerProps {
  currentPreset: SamplePreset;
  onSelectPreset: (preset: SamplePreset) => void;
  language: Language;
  onGenerateCertificate: (cert: DigitalCertificate) => void;
  onOpenDispute: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  currentPreset,
  onSelectPreset,
  language,
  onGenerateCertificate,
  onOpenDispute,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'boxes' | 'heatmap' | 'clean'>('boxes');
  const [selectedOnion, setSelectedOnion] = useState<OnionDetection | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customDetections, setCustomDetections] = useState<OnionDetection[] | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const t = TRANSLATIONS[language];

  // Active detections & summary
  const activeDetections = customDetections || currentPreset.detections;
  const currentSummary: QualitySummary = calculateQualitySummary(activeDetections);

  // Trigger simulated AI Analysis
  const handleTriggerScan = () => {
    setIsScanning(true);
    setSelectedOnion(null);

    // 1.4s realistic neural inference delay
    setTimeout(() => {
      setIsScanning(false);
      // Celebrate if high Grade A
      if (currentSummary.verdict === 'APPROVED_GRADE_A') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#f59e0b']
        });
      }
    }, 1400);
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImageUrl(event.target?.result as string);
        // Generate simulated dynamic detections for uploaded image
        const simulated = [
          { id: 'up-1', x: 18, y: 22, width: 22, height: 22, diameterMm: 61, grade: 'Grade A' as const, defect: 'none' as const, confidence: 0.97, skinQualityPercent: 95, firmness: 'Hard' as const, notes: 'Dense outer tunic, export grade' },
          { id: 'up-2', x: 48, y: 20, width: 20, height: 20, diameterMm: 56, grade: 'Grade A' as const, defect: 'none' as const, confidence: 0.94, skinQualityPercent: 91, firmness: 'Hard' as const, notes: 'Uniform globular form' },
          { id: 'up-3', x: 22, y: 55, width: 21, height: 21, diameterMm: 54, grade: 'Grade B' as const, defect: 'none' as const, confidence: 0.90, skinQualityPercent: 82, firmness: 'Firm' as const, notes: 'Fair average quality' },
          { id: 'up-4', x: 52, y: 54, width: 23, height: 23, diameterMm: 58, grade: 'URS' as const, defect: 'rotten' as const, confidence: 0.96, skinQualityPercent: 42, firmness: 'Soft' as const, notes: 'Focal neck rot detected' },
        ];
        setCustomDetections(simulated);
        handleTriggerScan();
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Live Camera Stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setCustomImageUrl(null);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Camera access not supported or permission denied. Please use sample presets or photo upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCustomImageUrl(canvas.toDataURL('image/jpeg'));
        stopCamera();
        // Generate simulated detections for the camera shot
        const simulated = [
          { id: 'cam-1', x: 20, y: 24, width: 24, height: 24, diameterMm: 63, grade: 'Grade A' as const, defect: 'none' as const, confidence: 0.98, skinQualityPercent: 96, firmness: 'Hard' as const, notes: 'Export quality specimen' },
          { id: 'cam-2', x: 55, y: 25, width: 21, height: 21, diameterMm: 57, grade: 'Grade A' as const, defect: 'none' as const, confidence: 0.95, skinQualityPercent: 92, firmness: 'Hard' as const, notes: 'Solid compact core' },
          { id: 'cam-3', x: 25, y: 58, width: 22, height: 22, diameterMm: 55, grade: 'Grade A' as const, defect: 'none' as const, confidence: 0.93, skinQualityPercent: 90, firmness: 'Firm' as const, notes: 'Clean basal plate' },
          { id: 'cam-4', x: 58, y: 60, width: 20, height: 20, diameterMm: 48, grade: 'Grade B' as const, defect: 'mechanical_cut' as const, confidence: 0.89, skinQualityPercent: 78, firmness: 'Firm' as const, notes: 'Superficial skin scuff' },
        ];
        setCustomDetections(simulated);
        handleTriggerScan();
      }
    }
  };

  const handlePresetChange = (preset: SamplePreset) => {
    stopCamera();
    setCustomImageUrl(null);
    setCustomDetections(null);
    onSelectPreset(preset);
    handleTriggerScan();
  };

  const handleOpenCertificate = () => {
    const cert: DigitalCertificate = {
      certificateId: `OV-2026-MH-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      lotId: currentPreset.lotNumber,
      farmerName: currentPreset.farmerName,
      farmerPhone: '+91 98220 ' + Math.floor(10000 + Math.random() * 90000),
      procurementCenter: currentPreset.originMandi,
      geographicSource: 'Maharashtra',
      inspectorId: 'INS-MH-042',
      inspectorName: 'Anil Kulkarni (Chief Mandi Grader)',
      variety: currentPreset.variety,
      lotWeightQuintals: 42,
      sampleWeightKg: currentPreset.sampleWeightKg,
      summary: currentSummary,
      tamperProofHash: Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      status: 'VALID'
    };
    onGenerateCertificate(cert);
  };

  return (
    <div className="p-3.5 sm:p-4 space-y-4">
      {/* 1. Quick Sample Preset Selector Ribbon */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t.quickPresets}
          </span>
          <span className="text-[10.5px] text-slate-400">
            Simulate Mandi Batches
          </span>
        </div>

        {/* Scrollable preset pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = currentPreset.id === preset.id && !customImageUrl && !isCameraActive;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40 scale-102'
                    : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <span>🧅</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Camera / Image Input Bar */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
          id="onion-photo-upload"
        />

        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.customUpload}</span>
          </button>

          {/* Camera Button */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.liveCamera}</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700 transition"
            >
              <VideoOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>

        {/* Vision Overlay Controls */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('boxes')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'boxes' 
                ? 'bg-emerald-600 text-white font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bounding Boxes View"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('heatmap')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'heatmap' 
                ? 'bg-emerald-600 text-white font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Quality Heatmap View"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('clean')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'clean' 
                ? 'bg-emerald-600 text-white font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Clean Image View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300">
          {cameraError}
        </div>
      )}

      {/* 3. Interactive Visual Inspection Tray / Camera Viewport */}
      <div className="space-y-1.5">
        {isCameraActive ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover" 
            />
            {/* Camera crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
                <span className="text-[10px] text-emerald-300 bg-black/60 px-2 py-0.5 rounded font-mono">
                  Align Onion Sample Tray
                </span>
              </div>
            </div>
            {/* Capture button */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <button
                onClick={handleCaptureCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture & Analyze</span>
              </button>
            </div>
          </div>
        ) : (
          <OnionVisualView
            detections={activeDetections}
            customImageUrl={customImageUrl}
            selectedOnionId={selectedOnion?.id || null}
            onSelectOnion={(onion) => setSelectedOnion(onion)}
            viewMode={viewMode}
            isScanning={isScanning}
          />
        )}

        {/* Tip row */}
        <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-emerald-400" />
            {t.viewDetails}
          </span>
          <span className="font-mono text-slate-500">
            Active: {currentPreset.variety}
          </span>
        </div>
      </div>

      {/* 4. Main Scan Action Button */}
      <button
        onClick={handleTriggerScan}
        disabled={isScanning}
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
        id="trigger-ai-scan-btn"
      >
        <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
        <span>{isScanning ? t.scanning : t.analyzeBatch}</span>
      </button>

      {/* 5. Comprehensive Quality Scorecard */}
      <Scorecard
        summary={currentSummary}
        lotId={currentPreset.lotNumber}
        farmerName={currentPreset.farmerName}
        variety={currentPreset.variety}
        language={language}
        onOpenCertificate={handleOpenCertificate}
        onOpenDispute={onOpenDispute}
      />

      {/* 6. Single Onion Inspector Telemetry Modal */}
      <OnionInspectorModal
        detection={selectedOnion}
        onClose={() => setSelectedOnion(null)}
        language={language}
      />
    </div>
  );
};
