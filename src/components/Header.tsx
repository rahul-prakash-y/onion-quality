import React from 'react';
import { 
  Building2, 
  Wifi, 
  Globe2, 
  Smartphone, 
  Monitor, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { ProcurementCenter, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  centers: ProcurementCenter[];
  selectedCenter: ProcurementCenter;
  onSelectCenter: (center: ProcurementCenter) => void;
  language: Language;
  onToggleLanguage: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  centers,
  selectedCenter,
  onSelectCenter,
  language,
  onToggleLanguage,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-rose-700 p-0.5 shadow-glow-green shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg">
              🧅
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                {t.appTitle}
              </h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                v2.4
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 hover:border-emerald-500/40 transition active:scale-95"
            title="Toggle Language"
            id="language-toggle-btn"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Device Mockup Toggle (visible on screens >= md) */}
          <button
            onClick={onToggleMobileFrame}
            className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 transition"
            title={isMobileFrame ? "Switch to Full Layout" : "Switch to Mobile Device Preview"}
            id="mobile-frame-toggle-btn"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px]">Full</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Procurement Center Selector bar */}
      <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="relative group min-w-0">
            <select
              value={selectedCenter.id}
              onChange={(e) => {
                const found = centers.find(c => c.id === e.target.value);
                if (found) onSelectCenter(found);
              }}
              className="bg-slate-800/90 text-emerald-300 font-medium text-[11.5px] rounded px-2 py-0.5 border border-slate-700/80 pr-5 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer truncate max-w-[210px] sm:max-w-none"
              id="mandi-selector"
            >
              {centers.map(center => (
                <option key={center.id} value={center.id} className="bg-slate-900 text-slate-200">
                  {center.name} ({center.district})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50 shrink-0">
          <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="font-medium hidden xs:inline">{t.edgeReady}</span>
          <span className="font-mono text-[10px] text-slate-400 ml-1">4ms</span>
        </div>
      </div>
    </header>
  );
};
