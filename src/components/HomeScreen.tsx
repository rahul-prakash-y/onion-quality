import React from 'react';
import { 
  ScanLine, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  Calendar,
  Layers,
  IndianRupee,
  Building2,
  Award
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { TRANSLATIONS } from '../data/translations';

export const HomeScreen: React.FC = () => {
  const { 
    setCurrentScreen, 
    reports, 
    setSelectedReport, 
    selectedCenter, 
    language 
  } = useInspection();

  const t = TRANSLATIONS[language];

  // Quick stats calculation
  const totalLots = reports.length;
  const gradeAPassCount = reports.filter(r => r.summary.verdict === 'APPROVED_GRADE_A').length;
  const passRate = totalLots > 0 ? Math.round((gradeAPassCount / totalLots) * 100) : 85;
  const totalSettlement = reports.reduce((acc, r) => acc + r.summary.priceRecommendation.totalEstimatedLotValue, 0);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-50 duration-300">
      {/* 1. Mandi Inspector Welcome Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-glow-green relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            {selectedCenter.name}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px]">
            Yard Terminal 01
          </span>
        </div>

        <h2 className="text-lg font-extrabold text-white tracking-tight leading-snug">
          Objective Optical Onion Grading System
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Eliminate manual subjectivity, dispute risks, and unfair price deductions with real-time computer vision analysis.
        </p>

        {/* Quick Launch Inspection Button */}
        <div className="mt-4 pt-3 border-t border-emerald-900/60">
          <button
            onClick={() => setCurrentScreen('inspection')}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-98 transition"
            id="home-start-inspection-btn"
          >
            <ScanLine className="w-4 h-4 text-slate-950" />
            <span>Start New Optical Inspection</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Inspected */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Inspected
          </span>
          <div className="text-xl font-black text-white font-sans mt-0.5">
            {totalLots} <span className="text-xs font-normal text-slate-400">Lots</span>
          </div>
          <span className="text-[9.5px] text-emerald-400 block mt-0.5 font-medium">
            Active today
          </span>
        </div>

        {/* Grade A Pass Rate */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Grade A Pass
          </span>
          <div className="text-xl font-black text-emerald-400 font-sans mt-0.5">
            {passRate}%
          </div>
          <span className="text-[9.5px] text-slate-400 block mt-0.5">
            Export standard
          </span>
        </div>

        {/* Fair Settlement Value */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Settlement
          </span>
          <div className="text-base font-black text-white font-mono mt-1">
            ₹{(totalSettlement / 100000).toFixed(1)}L
          </div>
          <span className="text-[9.5px] text-slate-400 block mt-0.5 font-sans">
            Total APMC Value
          </span>
        </div>
      </div>

      {/* 3. Recent Inspection Reports Preview */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Recent Quality Reports
          </span>
          <button
            onClick={() => setCurrentScreen('reports')}
            className="text-[11px] text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
            id="view-all-reports-link"
          >
            <span>View All ({reports.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preview List */}
        <div className="space-y-2">
          {reports.slice(0, 3).map((report) => {
            const isGradeA = report.summary.verdict === 'APPROVED_GRADE_A';
            const isURS = report.summary.verdict === 'REJECTED_URS';

            return (
              <div
                key={report.certificateId}
                onClick={() => {
                  setSelectedReport(report);
                  setCurrentScreen('reports');
                }}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-white">
                      {report.lotId}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      isGradeA 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : isURS 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {report.summary.verdict.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 block truncate">
                    {report.farmerName} • {report.variety}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-300 font-mono block">
                    ₹{report.summary.priceRecommendation.recommendedPricePerQtl}/qtl
                  </span>
                  <span className="text-[9.5px] text-slate-400 block">
                    Score: {report.summary.overallScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Mandi Grading Standard Reference */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5 text-xs">
        <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          APMC AGMARK Grading Specification
        </span>

        <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
            <span className="text-emerald-400 font-bold block">Grade A</span>
            <span className="text-white font-mono text-xs font-semibold block mt-0.5">&ge; 45 mm</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Firm, dry neck, 0 rot</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/50">
            <span className="text-amber-400 font-bold block">Grade B</span>
            <span className="text-white font-mono text-xs font-semibold block mt-0.5">35 - 45 mm</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Minor scale flaking</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50">
            <span className="text-rose-400 font-bold block">URS Rejects</span>
            <span className="text-white font-mono text-xs font-semibold block mt-0.5">&lt; 35 mm</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Sprouts / Neck rot</span>
          </div>
        </div>
      </div>
    </div>
  );
};
