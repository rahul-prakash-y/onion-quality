import React from 'react';
import { OnionDetection, DefectType, GradeClassification } from '../types';

interface OnionVisualViewProps {
  detections: OnionDetection[];
  customImageUrl?: string | null;
  selectedOnionId: string | null;
  onSelectOnion: (detection: OnionDetection) => void;
  viewMode: 'boxes' | 'heatmap' | 'clean';
  isScanning: boolean;
}

export const OnionVisualView: React.FC<OnionVisualViewProps> = ({
  detections,
  customImageUrl,
  selectedOnionId,
  onSelectOnion,
  viewMode,
  isScanning,
}) => {
  const getBoxColor = (grade: GradeClassification, defect: DefectType) => {
    if (defect === 'sprouted') return { border: 'border-violet-500', bg: 'bg-violet-500/20', text: 'text-violet-300', tag: 'bg-violet-700' };
    if (defect === 'rotten' || defect === 'mould') return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-300', tag: 'bg-red-700' };
    if (defect === 'undersized') return { border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-300', tag: 'bg-amber-700' };
    if (defect === 'mechanical_cut') return { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'text-blue-300', tag: 'bg-blue-700' };
    if (defect === 'double') return { border: 'border-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-300', tag: 'bg-orange-700' };
    if (grade === 'Grade A') return { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300', tag: 'bg-emerald-700' };
    return { border: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-300', tag: 'bg-yellow-700' };
  };

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none group">
      {/* Background: Either custom uploaded image or simulated grading conveyor canvas */}
      {customImageUrl ? (
        <img 
          src={customImageUrl} 
          alt="Uploaded Onion Batch" 
          className="w-full h-full object-cover"
        />
      ) : (
        /* Realistic Optical Inspection Tray Background */
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-stone-900 via-slate-900 to-stone-950">
          {/* Mandi Inspection Tray Texture Grid */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 10px 10px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '24px 24px' 
            }} 
          />

          {/* Calibrated Measurement Reference Scale at Bottom */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[9px] text-slate-500 font-mono pointer-events-none border-t border-slate-700/50 pt-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 bg-emerald-500"></span>
              Optical Target Scale 1:1
            </span>
            <span>Mandi Tray Caliber [20mm - 80mm]</span>
            <span>ISO 9001 Agri-Vision</span>
          </div>

          {/* Render Individual Realistic SVG Onions */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Natural Onion Gradient - Prime Red Globe */}
              <radialGradient id="onionGradeA" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="35%" stopColor="#9f1239" />
                <stop offset="70%" stopColor="#701a75" />
                <stop offset="100%" stopColor="#4c0519" />
              </radialGradient>

              {/* Grade B - Medium with yellowish dry husk */}
              <radialGradient id="onionGradeB" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="40%" stopColor="#be123c" />
                <stop offset="75%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#451a03" />
              </radialGradient>

              {/* Rotten onion gradient */}
              <radialGradient id="onionRotten" cx="45%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#713f12" />
                <stop offset="30%" stopColor="#451a03" />
                <stop offset="65%" stopColor="#292524" />
                <stop offset="100%" stopColor="#18181b" />
              </radialGradient>

              {/* Sprout Green Gradient */}
              <linearGradient id="sproutGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>

              {/* Shadow filter for 3D depth */}
              <filter id="onionShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* Render Each Onion Graphic */}
            {detections.map((d) => {
              const cx = d.x + d.width / 2;
              const cy = d.y + d.height / 2;
              const rx = d.width * 0.44;
              const ry = d.height * 0.44;
              const isRot = d.defect === 'rotten' || d.defect === 'mould';
              const isSprout = d.defect === 'sprouted';
              const isUndersized = d.defect === 'undersized';
              const isDouble = d.defect === 'double';

              return (
                <g key={d.id} className="transition-all duration-300">
                  {/* Drop Shadow Base */}
                  <ellipse 
                    cx={cx + 1} 
                    cy={cy + ry * 0.8} 
                    rx={rx * 0.9} 
                    ry={ry * 0.35} 
                    fill="rgba(0, 0, 0, 0.45)" 
                  />

                  {/* Onion Outer Body */}
                  {isDouble ? (
                    /* Conjoined Double Bulb */
                    <g filter="url(#onionShadow)">
                      <ellipse cx={cx - rx * 0.35} cy={cy} rx={rx * 0.65} ry={ry * 0.9} fill="url(#onionGradeB)" />
                      <ellipse cx={cx + rx * 0.35} cy={cy} rx={rx * 0.65} ry={ry * 0.9} fill="url(#onionGradeB)" />
                    </g>
                  ) : (
                    /* Standard Bulb */
                    <ellipse 
                      cx={cx} 
                      cy={cy} 
                      rx={rx} 
                      ry={ry} 
                      fill={isRot ? "url(#onionRotten)" : (d.grade === 'Grade A' ? "url(#onionGradeA)" : "url(#onionGradeB)")}
                      filter="url(#onionShadow)"
                    />
                  )}

                  {/* Papery Scale Veins & Texture */}
                  <path 
                    d={`M ${cx - rx * 0.6} ${cy - ry * 0.6} Q ${cx - rx * 0.2} ${cy + ry * 0.6} ${cx} ${cy + ry * 0.85}`} 
                    stroke="rgba(255,255,255,0.18)" 
                    strokeWidth="0.6" 
                    fill="none" 
                  />
                  <path 
                    d={`M ${cx + rx * 0.6} ${cy - ry * 0.6} Q ${cx + rx * 0.2} ${cy + ry * 0.6} ${cx} ${cy + ry * 0.85}`} 
                    stroke="rgba(255,255,255,0.18)" 
                    strokeWidth="0.6" 
                    fill="none" 
                  />

                  {/* Root hairs at bottom */}
                  <path 
                    d={`M ${cx - 1.5} ${cy + ry * 0.88} L ${cx - 2} ${cy + ry * 1.05} M ${cx} ${cy + ry * 0.9} L ${cx + 0.5} ${cy + ry * 1.1} M ${cx + 1.5} ${cy + ry * 0.88} L ${cx + 2} ${cy + ry * 1.05}`} 
                    stroke="#a16207" 
                    strokeWidth="0.5" 
                    strokeLinecap="round" 
                  />

                  {/* Dried Neck at top */}
                  <path 
                    d={`M ${cx - 1.2} ${cy - ry * 0.88} L ${cx - 0.8} ${cy - ry * 1.15} L ${cx + 0.8} ${cy - ry * 1.15} L ${cx + 1.2} ${cy - ry * 0.88} Z`} 
                    fill="#78350f" 
                  />

                  {/* DEFECT SPECIFIC RENDERS */}
                  {/* 1. Sprouted Green Shoots */}
                  {isSprout && (
                    <g>
                      <path 
                        d={`M ${cx - 1} ${cy - ry * 0.95} Q ${cx - 3} ${cy - ry * 1.6} ${cx - 1.5} ${cy - ry * 1.85} Q ${cx + 1} ${cy - ry * 1.5} ${cx + 1} ${cy - ry * 0.95}`} 
                        fill="url(#sproutGrad)" 
                      />
                      <path 
                        d={`M ${cx + 0.5} ${cy - ry * 0.95} Q ${cx + 3.5} ${cy - ry * 1.5} ${cx + 3} ${cy - ry * 1.75} Q ${cx + 1.5} ${cy - ry * 1.4} ${cx + 0.5} ${cy - ry * 0.95}`} 
                        fill="#22c55e" 
                      />
                    </g>
                  )}

                  {/* 2. Mould - Aspergillus niger Black Powder Clusters */}
                  {d.defect === 'mould' && (
                    <g>
                      <circle cx={cx - rx * 0.25} cy={cy - ry * 0.2} r="2.8" fill="#09090b" opacity="0.9" />
                      <circle cx={cx - rx * 0.15} cy={cy - ry * 0.35} r="2.2" fill="#18181b" opacity="0.85" />
                      <circle cx={cx - rx * 0.35} cy={cy - ry * 0.1} r="1.8" fill="#27272a" opacity="0.8" />
                      <circle cx={cx + rx * 0.2} cy={cy + ry * 0.1} r="2.4" fill="#09090b" opacity="0.88" />
                    </g>
                  )}

                  {/* 3. Soft Rot / Bacterial Liquefaction */}
                  {d.defect === 'rotten' && (
                    <g>
                      <ellipse cx={cx} cy={cy - ry * 0.3} rx={rx * 0.55} ry={ry * 0.38} fill="#291604" opacity="0.9" />
                      <ellipse cx={cx + 1} cy={cy - ry * 0.25} rx={rx * 0.35} ry={ry * 0.22} fill="#0c0a09" opacity="0.95" />
                    </g>
                  )}

                  {/* 4. Mechanical Blade Cut */}
                  {d.defect === 'mechanical_cut' && (
                    <g>
                      <path 
                        d={`M ${cx - rx * 0.4} ${cy - ry * 0.3} Q ${cx} ${cy - ry * 0.1} ${cx + rx * 0.45} ${cy + ry * 0.2}`} 
                        stroke="#fef2f2" 
                        strokeWidth="1.8" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d={`M ${cx - rx * 0.35} ${cy - ry * 0.28} Q ${cx} ${cy - ry * 0.1} ${cx + rx * 0.4} ${cy + ry * 0.18}`} 
                        stroke="#b91c1c" 
                        strokeWidth="0.8" 
                        strokeLinecap="round" 
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* HEATMAP OVERLAY MODE */}
      {viewMode === 'heatmap' && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="heatDefect" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatGood" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>
            {detections.map(d => {
              const isBad = d.grade === 'URS';
              const cx = d.x + d.width / 2;
              const cy = d.y + d.height / 2;
              return (
                <circle 
                  key={`heat-${d.id}`}
                  cx={cx} 
                  cy={cy} 
                  r={Math.max(d.width, d.height) * 0.7} 
                  fill={isBad ? "url(#heatDefect)" : "url(#heatGood)"} 
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* BOUNDING BOXES OVERLAY MODE */}
      {viewMode === 'boxes' && (
        <div className="absolute inset-0">
          {detections.map(d => {
            const isSelected = selectedOnionId === d.id;
            const style = getBoxColor(d.grade, d.defect);

            return (
              <div
                key={d.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOnion(d);
                }}
                className={`absolute cursor-pointer rounded-lg transition-all duration-200 border-2 ${style.border} ${
                  isSelected 
                    ? 'ring-4 ring-white/90 scale-105 z-20 shadow-2xl bg-white/10' 
                    : `${style.bg} hover:scale-102 hover:z-10`
                }`}
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.width}%`,
                  height: `${d.height}%`,
                }}
              >
                {/* Target Corners HUD styling */}
                <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none" />
                <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white pointer-events-none" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white pointer-events-none" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none" />

                {/* Optical Caliber Tag */}
                <div 
                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-tight text-white whitespace-nowrap shadow-md flex items-center gap-1 ${style.tag}`}
                >
                  <span>{d.diameterMm}mm</span>
                  {d.defect !== 'none' ? (
                    <span className="capitalize opacity-95">[{d.defect.replace('_', ' ')}]</span>
                  ) : (
                    <span>[{d.grade}]</span>
                  )}
                </div>

                {/* Confidence indicator badge at bottom right */}
                <div className="absolute -bottom-4 right-0 px-1 py-0.2 bg-black/80 backdrop-blur-sm text-[8px] font-mono text-slate-300 rounded border border-white/20">
                  {Math.round(d.confidence * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACTIVE SCAN LASER SWEEP ANIMATION */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Laser Line */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-laser" />
          
          {/* Scanning Grid Pulse */}
          <div className="absolute inset-0 bg-emerald-500/10 backdrop-brightness-110 flex items-center justify-center">
            <div className="glass-panel px-4 py-2 rounded-xl text-center shadow-glow-green border border-emerald-400/40">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                AI Optical Segmentation Active...
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Detecting calibers • Classifying defects
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
