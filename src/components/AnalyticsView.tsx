import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  PieChart, 
  CheckCircle2, 
  Sparkles,
  Building2
} from 'lucide-react';
import { Language } from '../types';

interface AnalyticsViewProps {
  language: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = () => {
  return (
    <div className="space-y-3.5 animate-in fade-in-50 duration-300">
      {/* 1. Core Mandi Impact Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-glow-green">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Systemic Transparency Impact</span>
        </div>
        
        <h3 className="text-base font-extrabold text-white leading-snug">
          Eliminating Bias & Discrepancies in Mandi Onion Procurement
        </h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Standardized optical grading has eliminated human visual variance across procurement yards, protecting farmers from arbitrary quality price slashing.
        </p>

        {/* Big impact numbers */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-900/60">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Dispute Rate Reduction
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-emerald-400 font-sans">
                -88.4%
              </span>
              <span className="text-[10px] text-slate-400">vs Manual</span>
            </div>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              Dropped from 24.2% down to 2.8%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Farmer Trust Index
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-sans">
                98.6%
              </span>
              <span className="text-[10px] text-emerald-400">Consensus</span>
            </div>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">
              Cryptographic QR verification
            </span>
          </div>
        </div>
      </div>

      {/* 2. APMC Mandi Weekly Quality Grade Mix */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-400" />
            Season Quality Distribution
          </span>
          <span className="text-[10.5px] text-slate-400 font-mono">
            Lasalgaon APMC Yard
          </span>
        </div>

        {/* Visual Bar Distribution */}
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-emerald-400 font-medium">Grade A (Super Export Quality)</span>
              <span className="font-mono text-white font-bold">58.4%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '58.4%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-amber-400 font-medium">Grade B (Medium Fair Quality)</span>
              <span className="font-mono text-white font-bold">28.2%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '28.2%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-rose-400 font-medium">URS (Under-grade / Rejection Spec)</span>
              <span className="font-mono text-white font-bold">13.4%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '13.4%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Leading Defect Breakdown */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
            Top Detected Causes of URS Rejection
          </span>
          <span className="text-[10px] text-slate-400">Total 1,840 Lots</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Undersized Caliber (&lt;35mm)</span>
            <span className="text-base font-bold text-amber-400 font-mono">38.2%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Rain deficit stunted bulb growth</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Dormancy Broken (Sprouted)</span>
            <span className="text-base font-bold text-violet-400 font-mono">27.5%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">High humidity in farm storage</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Neck Rot & Mould (Aspergillus)</span>
            <span className="text-base font-bold text-rose-400 font-mono">21.8%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Late kharif wet harvest issues</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block">Mechanical Cut / Split</span>
            <span className="text-base font-bold text-blue-400 font-mono">12.5%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Improper tractor harvesting blades</span>
          </div>
        </div>
      </div>

      {/* 4. Mandi Benchmarks */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5 text-xs">
        <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          APMC Inter-Mandi Quality Benchmarks
        </span>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <span className="font-semibold text-white block">Lasalgaon APMC (Nashik)</span>
              <span className="text-[10px] text-slate-400">340 lots/day</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">84.5% Grade A Pass</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <span className="font-semibold text-white block">Pimpalgaon Baswant (Nashik)</span>
              <span className="text-[10px] text-slate-400">220 lots/day</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">81.2% Grade A Pass</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div>
              <span className="font-semibold text-white block">Hubballi Market (Karnataka)</span>
              <span className="text-[10px] text-slate-400">165 lots/day</span>
            </div>
            <span className="font-mono font-bold text-amber-400">77.8% Grade A Pass</span>
          </div>
        </div>
      </div>
    </div>
  );
};
