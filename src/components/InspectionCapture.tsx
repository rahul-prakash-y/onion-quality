import React, { useRef } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  Scan,
  AlertCircle
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { useTranslation } from 'react-i18next';
import { GeographicRegion, SamplePreset } from '../types';
import { SAMPLE_PRESETS } from '../data/mockData';
import { OnionVisualView } from './OnionVisualView';

export const InspectionCapture: React.FC = () => {
  const { t } = useTranslation();
  const { 
    selectedRegion, 
    setSelectedRegion, 
    currentBatchId, 
    activePreset, 
    setActivePreset, 
    capturedImage, 
    setCapturedImage, 
    setActiveDetections, 
    inspectionStep, 
    analyzingStepIndex, 
    startAnalysisFlow 
  } = useInspection();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const geographicProfiles: Record<GeographicRegion, { variety: string; mandi: string; desc: string }> = {
    'Maharashtra': { 
      variety: 'Bhima Super (Nashik Red)', 
      mandi: 'Lasalgaon / Pimpalgaon APMC', 
      desc: 'High firmness, intense ruby color, premium 55mm+ export caliber' 
    },
    'Madhya Pradesh': { 
      variety: 'Malwa Red Globe', 
      mandi: 'Indore / Mandsaur Mandi', 
      desc: 'Medium pungency, spherical, favorable storage longevity' 
    },
    'Karnataka': { 
      variety: 'Kurnool / Bellary Pink', 
      mandi: 'Hubballi / Yeshwantpur APMC', 
      desc: 'Mild sweetness, pink scales, early kharif arrival' 
    },
    'Gujarat': { 
      variety: 'Mahuva White / Saurashtra Red', 
      mandi: 'Mahuva / Gondal Mandi', 
      desc: 'High solids, dehydrated flakes benchmark, export standard' 
    },
    'Rajasthan': { 
      variety: 'Alwar Dark Red', 
      mandi: 'Alwar / Kota Mandi', 
      desc: 'Deep crimson scales, late winter harvest, firm core' 
    }
  };

  const handleRegionChange = (region: GeographicRegion) => {
    setSelectedRegion(region);
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setActivePreset(preset);
    setActiveDetections(preset.detections);
    setCapturedImage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      // Trigger live asynchronous flow with real uploaded File
      startAnalysisFlow(file);
    }
  };

  const handleCapture = () => {
    // Trigger live asynchronous flow with captured image (or synthetic sample if empty)
    startAnalysisFlow(capturedImage);
  };

  // If in 'analyzing' state, show the required Module 3 Analyzing loading screen
  if (inspectionStep === 'analyzing') {
    const steps = [
      'Detecting individual onions...',
      'Identifying damage and rot...',
      'Estimating Grade A and URS percentages...'
    ];

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 animate-in fade-in duration-300">
        {/* Orbital AI Scanning Spinner */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-50" />
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <div className="w-16 h-16 rounded-full border-2 border-teal-400 border-b-transparent animate-spin [animation-duration:1.5s]" />
          <span className="text-3xl absolute animate-pulse">🧅</span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Neural Inference Engine</span>
          </div>

          <h3 className="text-base font-extrabold text-white">
            Analyzing Representative Sample
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {currentBatchId} • {selectedRegion}
          </p>
        </div>

        {/* Step-by-step progressive status list */}
        <div className="w-full max-w-xs space-y-2.5 text-left text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
          {steps.map((text, idx) => {
            const isCompleted = analyzingStepIndex > idx;
            const isCurrent = analyzingStepIndex === idx;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold scale-102 shadow-md' 
                    : isCompleted 
                      ? 'text-slate-400 line-through opacity-80' 
                      : 'text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0 flex items-center justify-center text-[9px] font-mono">
                    {idx + 1}
                  </span>
                )}
                <span className="text-xs">{text}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Calibrating bounding boxes against AGMARK standards...
        </p>
      </div>
    );
  }

  // Capture screen
  return (
    <div className="p-4 space-y-4 animate-in fade-in-50 duration-300">
      {/* Session Title & Batch ID */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-400" />
            Sample Image Capture
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono">
            Lot ID: <strong className="text-emerald-400">{currentBatchId}</strong>
          </span>
        </div>

        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          Module 3 Viewport
        </span>
      </div>

      {/* 4. Geographic Selection Dropdown */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Geographic Source & Variety Profile:</span>
        </label>

        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value as GeographicRegion)}
            className="w-full bg-slate-800 text-white font-semibold text-xs rounded-xl px-3 py-2.5 border border-slate-700 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
            id="geo-region-selector"
          >
            <option value="Maharashtra">Maharashtra (Nashik, Lasalgaon, Solapur)</option>
            <option value="Madhya Pradesh">Madhya Pradesh (Malwa, Indore, Mandsaur)</option>
            <option value="Karnataka">Karnataka (Hubballi, Dharwad, Kurnool border)</option>
            <option value="Gujarat">Gujarat (Mahuva, Gondal, Bhavnagar)</option>
            <option value="Rajasthan">Rajasthan (Alwar, Kota, Jaipur)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Variety profiling insight */}
        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300">
          <div className="flex justify-between font-semibold text-emerald-400 text-[10.5px]">
            <span>Variety: {geographicProfiles[selectedRegion].variety}</span>
            <span>Mandi: {geographicProfiles[selectedRegion].mandi}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 italic">
            "{geographicProfiles[selectedRegion].desc}"
          </p>
        </div>
      </div>

      {/* Quick Preset Selector Ribbon (Allows testing different defects) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Select Representative Test Sample:
          </span>
          <span className="text-[10px] text-slate-500">5 APMC Scenarios</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id && !capturedImage;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40'
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

      {/* 1. Simulated Camera Viewfinder Area (placeholder gray box with camera icon) */}
      <div className="space-y-2">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800/90 border-2 border-dashed border-slate-600 shadow-2xl flex flex-col items-center justify-center p-4 group">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Uploaded Onion Sample" 
              className="w-full h-full object-cover" 
            />
          ) : (
            /* Simulated Optical Viewfinder Area */
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-800 to-slate-850">
              {/* Optical Reticle Frame */}
              <div className="absolute inset-4 border border-slate-500/40 rounded-xl pointer-events-none flex items-center justify-center">
                {/* Crosshairs */}
                <div className="w-12 h-0.5 bg-emerald-500/40" />
                <div className="h-12 w-0.5 bg-emerald-500/40 absolute" />
                
                {/* Corner reticles */}
                <span className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
              </div>

              {/* Viewfinder Center Icon & Guide */}
              <div className="text-center z-10 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/80 border border-slate-600 text-slate-300 flex items-center justify-center mx-auto shadow-inner group-hover:scale-105 transition">
                  <Camera className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Optical Viewfinder Active
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    Target: Representative 5kg Sample Tray
                  </span>
                </div>
              </div>

              {/* Status footer inside viewfinder */}
              <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[9px] font-mono text-slate-500 border-t border-slate-700/50 pt-1">
                <span>ISO 100 • 50mm Lens</span>
                <span>Caliber [20 - 80mm]</span>
                <span className="text-emerald-400">READY</span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Gallery Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
          id="gallery-file-input"
        />
      </div>

      {/* 2 & 3: "Capture Image" and "Upload from Gallery" buttons */}
      <div className="space-y-2 pt-1">
        {/* Primary "Capture Image" Button */}
        <button
          onClick={handleCapture}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition"
          id="capture-image-btn"
        >
          <Camera className="w-4 h-4" />
          <span>{t('captureImage')}</span>
        </button>

        {/* Alternative "Upload from Gallery" Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition"
          id="upload-gallery-btn"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('uploadImage')}</span>
        </button>
      </div>
    </div>
  );
};
