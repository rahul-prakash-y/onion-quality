import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Sparkles, Ruler, Shield, Layers } from 'lucide-react';
import { OnionDetection, Language } from '../types';

interface OnionInspectorModalProps {
  detection: OnionDetection | null;
  onClose: () => void;
  language: Language;
}

export const OnionInspectorModal: React.FC<OnionInspectorModalProps> = ({
  detection,
  onClose,
}) => {
  if (!detection) return null;

  const isURS = detection.grade === 'URS';
  const isGradeA = detection.grade === 'Grade A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧅</span>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                AI Specimen Telemetry
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Bulb ID: #{detection.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/70 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Main Status & Classification */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isGradeA 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
              : isURS 
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isGradeA ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : isURS ? (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Assessed Grade
                </span>
                <span className="text-sm font-bold text-white">
                  {detection.grade}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Condition
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                {detection.defect === 'none' ? 'Clean / Intact' : detection.defect.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Diameter Caliber */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Ruler className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-medium uppercase">Diameter Caliber</span>
              </div>
              <div className="text-lg font-bold text-white">
                {detection.diameterMm} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                {detection.diameterMm >= 45 ? '✓ Export benchmark' : detection.diameterMm >= 35 ? 'Medium market tier' : '⚠ Undersized (<35mm)'}
              </span>
            </div>

            {/* Neural Confidence */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-medium uppercase">AI Confidence</span>
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round(detection.confidence * 100)}%
              </div>
              <span className="text-[9.5px] text-emerald-400 block mt-0.5 font-mono">
                p &gt; 0.95 high certainty
              </span>
            </div>

            {/* Skin Integrity */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-medium uppercase">Skin Integrity</span>
              </div>
              <div className="text-lg font-bold text-white">
                {detection.skinQualityPercent}%
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full" 
                  style={{ width: `${detection.skinQualityPercent}%` }} 
                />
              </div>
            </div>

            {/* Core Firmness */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-medium uppercase">Bulb Firmness</span>
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {detection.firmness}
              </div>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                {detection.firmness === 'Hard' ? 'Resistant to rot' : detection.firmness === 'Spongy' ? 'Internal breakdown' : 'Adequate pulp'}
              </span>
            </div>
          </div>

          {/* Agronomic Inspection Note */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Agronomic Optical Evaluation
            </span>
            <p className="text-slate-300 text-xs italic leading-relaxed">
              "{detection.notes}"
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md active:scale-95 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
