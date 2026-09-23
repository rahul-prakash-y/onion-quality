import React, { useState } from 'react';
import { X, AlertOctagon, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { DigitalCertificate, Language } from '../types';

interface DisputeModalProps {
  certificate: DigitalCertificate;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDispute: (reason: string) => void;
  onTriggerReScan: () => void;
  language: Language;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onSubmitDispute,
  onTriggerReScan,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(
    'Borderline Grade A threshold - Secondary optical verification requested'
  );
  const [customNote, setCustomNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const disputeReasons = [
    'Borderline Grade A threshold - Secondary optical verification requested',
    'Sampling bias claimed (sample drawn from vehicle corner/surface)',
    'Contested defect classification (dry skin peel vs bacterial soft rot)',
    'Request 3-member Mandi Dispute Arbitrator panel evaluation',
    'Caliber diameter measurement tolerance within ±2mm'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote ? `${selectedReason} - Additional Note: ${customNote}` : selectedReason;
    onSubmitDispute(finalReason);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-950/40 border-b border-amber-900/60">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              Mandi Dispute Resolution Protocol
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block uppercase">
                  Contested Lot ID
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {certificate.lotId}
                </span>
                <span className="text-[10.5px] text-slate-300 block mt-0.5">
                  Farmer: {certificate.farmerName} • Currently: <strong className="text-amber-300">{certificate.summary.verdict.replace('_', ' ')}</strong>
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Select Ground for Mandi Dispute / Re-Inspection:
                </label>
                <div className="space-y-1.5">
                  {disputeReasons.map((r, i) => (
                    <label 
                      key={i} 
                      className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition text-[11px] ${
                        selectedReason === r 
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disputeReason"
                        checked={selectedReason === r}
                        onChange={() => setSelectedReason(r)}
                        className="mt-0.5 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Additional Agronomic / Inspector Remarks (Optional):
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Specify particular crate numbers or caliper observations..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Submit Formal Mandi Dispute</span>
              </button>
            </form>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Dispute Registered Successfully
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dispute Case Ref: <strong className="text-amber-400 font-mono">DSP-{certificate.lotId.slice(-6)}</strong>
                </p>
                <p className="text-[10px] text-slate-400 mt-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  An immutable dispute flag has been appended to the certificate hash. You can now execute a secondary automated optical re-scan.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onTriggerReScan();
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Execute Secondary AI Re-Scan</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
