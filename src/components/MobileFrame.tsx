import React from 'react';
import { ScanLine, History, BarChart3 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface MobileFrameProps {
  children: React.ReactNode;
  isMobileFrame: boolean;
  activeTab: 'scanner' | 'history' | 'analytics';
  onChangeTab: (tab: 'scanner' | 'history' | 'analytics') => void;
  language: Language;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isMobileFrame,
  activeTab,
  onChangeTab,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:py-6 sm:px-4">
      {/* Container: either mobile frame mockup on desktop or centered 480px mobile viewport */}
      <div 
        className={`w-full transition-all duration-300 flex flex-col ${
          isMobileFrame 
            ? 'max-w-[450px] bg-slate-900 border-[8px] border-slate-800 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden relative min-h-[860px]'
            : 'max-w-[480px] bg-slate-900 shadow-2xl min-h-screen sm:min-h-0 sm:rounded-3xl sm:border sm:border-slate-800 overflow-hidden'
        }`}
      >
        {/* Smartphone Dynamic Island / Speaker cutout (only visible in mobile frame mode on desktop) */}
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

        {/* Main App Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20">
          {children}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around">
          {/* Scanner Tab */}
          <button
            onClick={() => onChangeTab('scanner')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              activeTab === 'scanner' 
                ? 'text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="nav-scanner-btn"
          >
            <div className={`p-1 rounded-lg ${activeTab === 'scanner' ? 'bg-emerald-500/20' : ''}`}>
              <ScanLine className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t.scanTab}</span>
          </button>

          {/* Batch History Tab */}
          <button
            onClick={() => onChangeTab('history')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              activeTab === 'history' 
                ? 'text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="nav-history-btn"
          >
            <div className={`p-1 rounded-lg ${activeTab === 'history' ? 'bg-emerald-500/20' : ''}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t.historyTab}</span>
          </button>

          {/* Mandi Analytics Tab */}
          <button
            onClick={() => onChangeTab('analytics')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              activeTab === 'analytics' 
                ? 'text-emerald-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="nav-analytics-btn"
          >
            <div className={`p-1 rounded-lg ${activeTab === 'analytics' ? 'bg-emerald-500/20' : ''}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t.analyticsTab}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
