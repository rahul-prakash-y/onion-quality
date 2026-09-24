import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Scale, 
  IndianRupee, 
  Layers, 
  Flame,
  AlertOctagon
} from 'lucide-react';
import { QualitySummary, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ScorecardProps {
  summary: QualitySummary;
  lotId: string;
  farmerName: string;
  variety: string;
  language: Language;
  onOpenCertificate: () => void;
  onOpenDispute: () => void;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  summary,
  lotId,
  farmerName,
  variety,
  language,
  onOpenCertificate,
  onOpenDispute,
}) => {
  const t = TRANSLATIONS[language];

  const isApproved = summary.verdict === 'APPROVED_GRADE_A';
  const isConditional = summary.verdict === 'CONDITIONAL_GRADE_B';
  const isRejected = summary.verdict === 'REJECTED_URS';

  return (
    <div className="space-y-3.5 animate-in fade-in-50 duration-300">
      {/* 1. Main Quality Score & Verdict Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isApproved 
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/40 border-emerald-500/40 shadow-glow-green' 
          : isConditional 
            ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/40 border-amber-500/40' 
            : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-950/40 border-rose-500/40 shadow-glow-onion'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{t.overallScore}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
                {summary.overallScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase border ml-1 ${
                isApproved 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : isConditional 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {summary.verdict.replace('_', ' ')}
              </span>
            </div>

            <p className="text-[11.5px] mt-1.5 font-medium flex items-center gap-1.5">
              {isApproved && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold">{t.verdictApproved}</span>
                </>
              )}
              {isConditional && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-semibold">{t.verdictConditional}</span>
                </>
              )}
              {isRejected && (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-rose-300 font-semibold">{t.verdictRejected}</span>
                </>
              )}
            </p>
          </div>

          {/* Radial score mini visual */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isApproved ? "text-emerald-500" : isConditional ? "text-amber-500" : "text-rose-500"}
                strokeDasharray={`${summary.overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">
              {summary.overallScore}%
            </span>
          </div>
        </div>

        {/* Quick Lot Metadata row */}
        <div className="mt-3 pt-2.5 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-[10.5px]">
          <div>
            <span className="text-slate-400 block">{t.lotNo}</span>
            <span className="font-mono text-slate-200 font-semibold truncate block">{lotId}</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.farmer}</span>
            <span className="text-slate-200 font-semibold truncate block">{farmerName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.variety}</span>
            <span className="text-slate-200 font-semibold truncate block">{variety}</span>
          </div>
        </div>
      </div>

      {/* 2. Grade Distribution (Grade A vs Grade B vs URS) */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Grade Composition
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {summary.totalCount} bulbs assessed • ⌀ {summary.avgDiameterMm}mm
          </span>
        </div>

        {/* Stacked Multi-Color Progress Bar */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${summary.gradeAPercent}%` }} 
            className="bg-emerald-500 h-full transition-all duration-500" 
            title={`Grade A: ${summary.gradeAPercent}%`}
          />
          <div 
            style={{ width: `${summary.gradeBPercent}%` }} 
            className="bg-amber-500 h-full transition-all duration-500" 
            title={`Grade B: ${summary.gradeBPercent}%`}
          />
          <div 
            style={{ width: `${summary.ursPercent}%` }} 
            className="bg-rose-600 h-full transition-all duration-500" 
            title={`URS: ${summary.ursPercent}%`}
          />
        </div>

        {/* Three Grade Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          {/* Grade A */}
          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
              {t.gradeA || 'Grade A'}
            </span>
            <span className="text-lg font-bold text-white font-sans">
              {summary.gradeAPercent}%
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Premium (&ge;45mm)
            </span>
          </div>

          {/* Grade B */}
          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/50">
            <span className="text-[10px] uppercase font-semibold text-amber-400 block">
              {t.gradeB || 'Grade B'}
            </span>
            <span className="text-lg font-bold text-white font-sans">
              {summary.gradeBPercent}%
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Fair (35-45mm)
            </span>
          </div>

          {/* URS */}
          <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50">
            <span className="text-[10px] uppercase font-semibold text-rose-400 block">
              {t.ursRejects || t.urs || 'URS Rejects'}
            </span>
            <span className="text-lg font-bold text-white font-sans">
              {summary.ursPercent}%
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Rot / Shoot / &lt;35mm
            </span>
          </div>
        </div>
      </div>

      {/* 3. Defects Detected Breakdown */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            {t.defectBreakdown}
          </span>
          <span className="text-[10.5px] text-slate-400">
            Automated Tag Count
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Sprouted */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-slate-300 font-medium">{t.sprouted}</span>
            </div>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-xs ${
              summary.defects.sprouted > 0 ? 'bg-violet-900/60 text-violet-300' : 'text-slate-500'
            }`}>
              {summary.defects.sprouted}
            </span>
          </div>

          {/* Rotten / Mould */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-300 font-medium">{t.rottenMould}</span>
            </div>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-xs ${
              summary.defects.rottenOrMould > 0 ? 'bg-rose-900/60 text-rose-300' : 'text-slate-500'
            }`}>
              {summary.defects.rottenOrMould}
            </span>
          </div>

          {/* Undersized */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">{t.undersized}</span>
            </div>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-xs ${
              summary.defects.undersized > 0 ? 'bg-amber-900/60 text-amber-300' : 'text-slate-500'
            }`}>
              {summary.defects.undersized}
            </span>
          </div>

          {/* Cuts & Doubles */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-300 font-medium">{t.cutOrDouble || 'Cut / Double'}</span>
            </div>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-xs ${
              (summary.defects.mechanicalCut + summary.defects.doubleOrDeformed) > 0 ? 'bg-blue-900/60 text-blue-300' : 'text-slate-500'
            }`}>
              {summary.defects.mechanicalCut + summary.defects.doubleOrDeformed}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Fair Mandi Price Estimator */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-900/50 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            {t.fairPriceEstimate}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            APMC Standard Formula
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Base MSP */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block">{t.baseMsp}</span>
            <div className="flex items-center text-sm font-semibold text-slate-200 mt-0.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{summary.priceRecommendation.baseMspPerQtl.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 ml-1 font-normal">/ Qtl</span>
            </div>
          </div>

          {/* Quality Adjustment */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="text-[10px] text-slate-400 block">{t.qualityBonus}</span>
            <div className={`flex items-center text-sm font-bold mt-0.5 ${
              summary.priceRecommendation.qualityBonusOrPenalty >= 0 
                ? 'text-emerald-400' 
                : 'text-rose-400'
            }`}>
              {summary.priceRecommendation.qualityBonusOrPenalty >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              )}
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{Math.abs(summary.priceRecommendation.qualityBonusOrPenalty).toLocaleString()}</span>
              <span className="text-[10px] ml-1 font-normal">/ Qtl</span>
            </div>
          </div>
        </div>

        {/* Final Recommended Payout Bar */}
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">
              {t.recommendedPrice}
            </span>
            <div className="flex items-center text-xl font-extrabold text-white mt-0.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>{summary.priceRecommendation.recommendedPricePerQtl.toLocaleString()}</span>
              <span className="text-xs text-slate-400 ml-1.5 font-normal">per Quintal</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block">
              {t.totalLotValue} (42 Qtl)
            </span>
            <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
              ₹{summary.priceRecommendation.totalEstimatedLotValue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Action Buttons (Certificate & Dispute) */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onOpenCertificate}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-98 transition"
          id="generate-cert-btn"
        >
          <FileText className="w-4 h-4" />
          <span>{t.generateCertificate}</span>
        </button>

        <button
          onClick={onOpenDispute}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-2 transition"
          id="raise-dispute-btn"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.raiseDispute}</span>
        </button>
      </div>
    </div>
  );
};
