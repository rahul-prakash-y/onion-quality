import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  ChevronRight,
  Calendar,
  Layers,
  IndianRupee
} from 'lucide-react';
import { DigitalCertificate, Language } from '../types';

interface BatchHistoryProps {
  batches: DigitalCertificate[];
  onSelectBatch: (batch: DigitalCertificate) => void;
  language: Language;
}

export const BatchHistory: React.FC<BatchHistoryProps> = ({
  batches,
  onSelectBatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GRADE_A' | 'CONDITIONAL' | 'URS' | 'DISPUTED'>('ALL');

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.lotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.certificateId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'GRADE_A') return batch.summary.verdict === 'APPROVED_GRADE_A';
    if (statusFilter === 'CONDITIONAL') return batch.summary.verdict === 'CONDITIONAL_GRADE_B';
    if (statusFilter === 'URS') return batch.summary.verdict === 'REJECTED_URS';
    if (statusFilter === 'DISPUTED') return batch.status === 'DISPUTED';

    return true;
  });

  return (
    <div className="space-y-3 animate-in fade-in-50 duration-300">
      {/* Header & Stats Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Procurement Batch Ledger
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
            {batches.length} Certified Lots
          </span>
        </div>

        {/* Search input */}
        <div className="relative mt-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Farmer Name, Lot ID, or Cert #..."
            className="w-full bg-slate-800/90 text-xs text-white placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'ALL' 
                ? 'bg-emerald-600 text-white font-semibold' 
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            All Lots
          </button>
          <button
            onClick={() => setStatusFilter('GRADE_A')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'GRADE_A' 
                ? 'bg-emerald-600 text-white font-semibold' 
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            Grade A
          </button>
          <button
            onClick={() => setStatusFilter('CONDITIONAL')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'CONDITIONAL' 
                ? 'bg-amber-600 text-white font-semibold' 
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            Grade B
          </button>
          <button
            onClick={() => setStatusFilter('URS')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'URS' 
                ? 'bg-rose-600 text-white font-semibold' 
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            URS Rejects
          </button>
          <button
            onClick={() => setStatusFilter('DISPUTED')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'DISPUTED' 
                ? 'bg-amber-500 text-black font-bold' 
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            Disputed Lots
          </button>
        </div>
      </div>

      {/* Batch List */}
      <div className="space-y-2">
        {filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Filter className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No batches match the selected criteria</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const isGradeA = batch.summary.verdict === 'APPROVED_GRADE_A';
            const isURS = batch.summary.verdict === 'REJECTED_URS';
            const isDisputed = batch.status === 'DISPUTED';

            return (
              <div
                key={batch.certificateId}
                onClick={() => onSelectBatch(batch)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 bg-slate-900 hover:bg-slate-800/80 ${
                  isDisputed 
                    ? 'border-amber-500/50 hover:border-amber-400' 
                    : isGradeA 
                      ? 'border-emerald-900/50 hover:border-emerald-600/50' 
                      : isURS 
                        ? 'border-rose-900/50 hover:border-rose-600/50' 
                        : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-white">
                        {batch.lotId}
                      </span>
                      {isDisputed && (
                        <span className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          DISPUTE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                      {batch.farmerName} • <span className="text-slate-400">{batch.variety}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      isGradeA 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : isURS 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {batch.summary.verdict.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      Score: {batch.summary.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {batch.timestamp}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-400 font-semibold flex items-center">
                      <IndianRupee className="w-2.5 h-2.5" />
                      {batch.summary.priceRecommendation.recommendedPricePerQtl}/qtl
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
