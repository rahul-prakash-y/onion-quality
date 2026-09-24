import React from 'react';
import { 
  Home, 
  ScanLine, 
  FileText, 
  Building2, 
  Wifi, 
  Globe2, 
  Smartphone, 
  Monitor, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { PROCUREMENT_CENTERS } from '../data/mockData';
import { TRANSLATIONS } from '../data/translations';

import { LanguageToggle } from './LanguageToggle';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    reports, 
    selectedCenter, 
    setSelectedCenter, 
    language, 
    toggleLanguage, 
    isMobileFrame, 
    toggleMobileFrame 
  } = useInspection();

  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:py-6 sm:px-4">
      {/* Mobile Screen Simulator Container */}
      <div 
        className={`w-full transition-all duration-300 flex flex-col ${
          isMobileFrame 
            ? 'max-w-[450px] bg-slate-900 border-[8px] border-slate-800 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden relative min-h-[860px]'
            : 'max-w-[480px] bg-slate-900 shadow-2xl min-h-screen sm:min-h-0 sm:rounded-3xl sm:border sm:border-slate-800 overflow-hidden relative'
        }`}
      >
        {/* Smartphone Status Bar (simulates native mobile screen on desktop) */}
        {isMobileFrame && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 bg-slate-900 z-40 select-none">
            <span className="text-[11px] font-semibold text-slate-300 font-mono">09:41</span>
            {/* Dynamic Island Notch */}
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-[10px]">
              <span>5G</span>
              <span className="inline-block w-4 h-2 rounded-sm border border-slate-400 bg-emerald-500"></span>
            </div>
          </div>
        )}

        {/* Top App Header */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/40 px-4 py-2.5 transition-all">
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Brand */}
            <div 
              onClick={() => setCurrentScreen('home')} 
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-rose-700 p-0.5 shadow-glow-green shrink-0 group-hover:scale-105 transition">
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
              {/* Language Switcher */}
              <LanguageToggle id="shell-language-toggle" />

              {/* Desktop Frame Toggle */}
              <button
                onClick={toggleMobileFrame}
                className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 transition"
                title={isMobileFrame ? "Switch to Full Layout" : "Switch to Mobile Device Preview"}
                id="shell-frame-toggle"
              >
                {isMobileFrame ? (
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          {/* Mandi Selection Ribbon */}
          <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="relative group min-w-0">
                <select
                  value={selectedCenter.id}
                  onChange={(e) => {
                    const found = PROCUREMENT_CENTERS.find(c => c.id === e.target.value);
                    if (found) setSelectedCenter(found);
                  }}
                  className="bg-slate-800/90 text-emerald-300 font-medium text-[11.5px] rounded px-2 py-0.5 border border-slate-700/80 pr-5 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer truncate max-w-[210px] sm:max-w-none"
                  id="shell-mandi-selector"
                >
                  {PROCUREMENT_CENTERS.map(center => (
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

        {/* Dynamic Screen Content (Scrollable, with bottom padding for navigation bar) */}
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>

        {/* Bottom Navigation Bar - Exactly "Home", "New Inspection", and "Reports" */}
        <nav 
          className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl"
          aria-label="Bottom Navigation"
        >
          {/* 1. Home Tab */}
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              currentScreen === 'home' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
            id="nav-tab-home"
          >
            <div className={`p-1 rounded-lg ${currentScreen === 'home' ? 'bg-emerald-500/20' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{t.home || 'Home'}</span>
          </button>

          {/* 2. New Inspection Tab (Prominent Styled Center CTA) */}
          <button
            onClick={() => setCurrentScreen('inspection')}
            className="flex flex-col items-center gap-1 -mt-4 transition active:scale-95 group"
            id="nav-tab-inspection"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              currentScreen === 'inspection'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-900/60 ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80 group-hover:scale-105'
            }`}>
              <ScanLine className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${
              currentScreen === 'inspection' ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {t.inspection || 'New Inspection'}
            </span>
          </button>

          {/* 3. Reports Tab */}
          <button
            onClick={() => setCurrentScreen('reports')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition relative ${
              currentScreen === 'reports' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
            id="nav-tab-reports"
          >
            <div className={`p-1 rounded-lg relative ${currentScreen === 'reports' ? 'bg-emerald-500/20' : ''}`}>
              <FileText className="w-5 h-5" />
              {/* Reports Badge Counter */}
              {reports.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold flex items-center justify-center font-mono">
                  {reports.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{t.reports || 'Reports'}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
