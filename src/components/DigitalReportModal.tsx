import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  FileCheck, 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { DigitalCertificate, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface DigitalReportModalProps {
  certificate: DigitalCertificate | null;
  onClose: () => void;
  language: Language;
  onOpenDispute: () => void;
}

export const DigitalReportModal: React.FC<DigitalReportModalProps> = ({
  certificate,
  onClose,
  language,
  onOpenDispute,
}) => {
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[language];

  if (!certificate) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(`ONIONVISION-CERT:${certificate.certificateId}|HASH:${certificate.tamperProofHash}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isGradeA = certificate.summary.verdict === 'APPROVED_GRADE_A';
  const isURS = certificate.summary.verdict === 'REJECTED_URS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-emerald-800/60 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Digital Quality Certificate
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyHash}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Share / Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Sheet */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 certificate-content bg-slate-900 text-slate-200 text-xs">
          {/* Official Mandi Header */}
          <div className="text-center pb-3 border-b border-slate-700/70 relative">
            {/* Stamp Badge */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <FileCheck className="w-3 h-3" />
              <span>National Mandi Digital Quality Standard</span>
            </div>

            <h2 className="text-base font-extrabold text-white tracking-tight uppercase">
              Digital Onion Quality Certificate
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Agricultural Produce Market Committee (APMC) Grading Authority
            </p>

            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-400" />
                {certificate.procurementCenter}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                {certificate.timestamp}
              </span>
            </div>
          </div>

          {/* Certificate Identification Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                Certificate Number
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {certificate.certificateId}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                Status
              </span>
              <span className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                certificate.status === 'VALID' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {certificate.status}
              </span>
            </div>
          </div>

          {/* Farmer & Lot Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-slate-400 text-[10px] block">Farmer Name</span>
              <span className="font-semibold text-white">{certificate.farmerName}</span>
              <span className="text-slate-400 text-[9.5px] block font-mono">{certificate.farmerPhone}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block">Lot Identification</span>
              <span className="font-semibold text-white font-mono">{certificate.lotId}</span>
              <span className="text-slate-400 text-[9.5px] block">42 Quintals (Total Lot)</span>
            </div>

            <div className="pt-1.5 border-t border-slate-700/40">
              <span className="text-slate-400 text-[10px] block">Variety / Origin</span>
              <span className="font-semibold text-white">{certificate.variety}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-700/40">
              <span className="text-slate-400 text-[10px] block">Sample Assessed</span>
              <span className="font-semibold text-white">{certificate.sampleWeightKg} kg ({certificate.summary.totalCount} specimen)</span>
            </div>
          </div>

          {/* Assessed Quality Telemetry Summary */}
          <div className="p-3.5 rounded-xl border space-y-2.5 bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Assessed Quality Grade
                </span>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {certificate.summary.verdict.replace('_', ' ')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Overall Index
                </span>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  {certificate.summary.overallScore} / 100
                </div>
              </div>
            </div>

            {/* Grade Proportions table */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
                <span className="text-[9.5px] text-emerald-400 block font-sans">GRADE A</span>
                <span className="text-sm font-bold text-white">{certificate.summary.gradeAPercent}%</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/50">
                <span className="text-[9.5px] text-amber-400 block font-sans">GRADE B</span>
                <span className="text-sm font-bold text-white">{certificate.summary.gradeBPercent}%</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/50">
                <span className="text-[9.5px] text-rose-400 block font-sans">URS SPEC</span>
                <span className="text-sm font-bold text-white">{certificate.summary.ursPercent}%</span>
              </div>
            </div>

            {/* Average Dimensions */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/50 text-slate-300">
              <span>Mean Caliber Diameter:</span>
              <span className="font-bold text-white font-mono">⌀ {certificate.summary.avgDiameterMm} mm</span>
            </div>
          </div>

          {/* Commercial Fair Payout Settlement */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
              APMC Fair Commercial Settlement
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10.5px] text-slate-400 block">Recommended Rate</span>
                <span className="text-lg font-bold text-white">
                  ₹{certificate.summary.priceRecommendation.recommendedPricePerQtl}
                  <span className="text-xs text-slate-400 font-normal"> / Qtl</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10.5px] text-slate-400 block">Total Est. Lot Settlement</span>
                <span className="text-sm font-bold text-emerald-300 font-mono">
                  ₹{certificate.summary.priceRecommendation.totalEstimatedLotValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Verification & QR Section */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center gap-3">
            {/* Simulated Verified QR Code */}
            <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center shadow-md">
              <QrCode className="w-full h-full text-slate-950" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tamper-Proof Mandi Hash</span>
              </div>
              <p className="text-[9px] font-mono text-slate-400 break-all mt-0.5 bg-black/40 p-1 rounded border border-white/5">
                {certificate.tamperProofHash}
              </p>
              <span className="text-[8.5px] text-slate-400 block mt-1">
                Scan to verify on APMC National Quality Ledger
              </span>
            </div>
          </div>

          {/* Inspector Digital Signoff */}
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/50">
            <div>
              <span className="block font-semibold text-slate-300">{certificate.inspectorName}</span>
              <span>Officer ID: {certificate.inspectorId}</span>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold rounded">
                DIGITALLY SEALED
              </span>
            </div>
          </div>

          {/* Dispute Warning if applicable */}
          {certificate.status === 'DISPUTED' && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-[10.5px] text-amber-200">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Dispute Active on Certificate</span>
              </div>
              <p className="italic text-slate-300">
                "{certificate.disputeDetails?.reason}"
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="no-print p-3 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onOpenDispute}
            className="px-3 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-600/80 flex items-center gap-1.5 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Dispute Re-test</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
