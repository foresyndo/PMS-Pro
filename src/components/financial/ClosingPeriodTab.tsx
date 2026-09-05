import React, { useState } from "react";
import { Lock, Unlock, ShieldAlert, History, CheckCircle2, AlertOctagon } from "lucide-react";
import { FinancialClosingPeriod, FinancialAuditLog } from "../../types";

interface ClosingPeriodTabProps {
  closingPeriods: FinancialClosingPeriod[];
  auditLogs: FinancialAuditLog[];
  currentPeriod: string;
  netIncomeCurrent: number;
  onTogglePeriodLock: (periodKey: string, lock: boolean, notes: string) => void;
  userRole: string;
}

export default function ClosingPeriodTab({
  closingPeriods,
  auditLogs,
  currentPeriod,
  netIncomeCurrent,
  onTogglePeriodLock,
  userRole
}: ClosingPeriodTabProps) {
  const [notes, setNotes] = useState("");
  const activePeriodObj = closingPeriods.find((p) => p.periodKey === currentPeriod);
  const isCurrentlyLocked = activePeriodObj ? activePeriodObj.isLocked : false;

  const handleAction = (lock: boolean) => {
    onTogglePeriodLock(currentPeriod, lock, notes || (lock ? "Tutup buku bulanan tuntas" : "Pembukaan kunci periode"));
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* LOCK / UNLOCK HERO ACTION BOX */}
      <div
        className={`p-6 rounded-2xl border transition shadow-2xs ${
          isCurrentlyLocked
            ? "bg-rose-50 border-rose-200 text-rose-950"
            : "bg-emerald-50 border-emerald-200 text-emerald-950"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl ${
                isCurrentlyLocked ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {isCurrentlyLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-base">
                  Status Periode {currentPeriod}:{" "}
                  {isCurrentlyLocked ? "Terkunci (Closed & Locked)" : "Terbuka (Open / Editable)"}
                </h3>
              </div>
              <p className="text-xs opacity-80 mt-1 max-w-xl">
                {isCurrentlyLocked
                  ? "Periode ini telah ditutup buku. Semua input faktur, pembayaran, dan beban operasional pada bulan ini dibekukan untuk menjaga integritas laporan audit."
                  : "Periode ini sedang aktif. Transaksi faktur, mutasi kas, dan jurnal masih dapat dicatat atau diubah."}
              </p>
              {isCurrentlyLocked && activePeriodObj && (
                <div className="mt-2 text-[11px] font-semibold text-rose-800">
                  Ditutup pada: {activePeriodObj.closedAt?.slice(0, 10)} oleh {activePeriodObj.closedBy} • Laba
                  Terkunci: Rp {(activePeriodObj.netIncomeCalculated || 0).toLocaleString("id-ID")}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isCurrentlyLocked ? (
              <button
                onClick={() => handleAction(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-amber-400" />
                <span>Buka Kunci Periode (Re-open)</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Tutup Buku Periode Ini (Lock)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TWO SECTIONS: CLOSING HISTORY & AUDIT TRAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLOSING HISTORY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Historis Tutup Buku Periode (Closing Schedule)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Periode</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Laba Bersih</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {closingPeriods.map((cp) => (
                  <tr key={cp.periodKey} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-850">{cp.periodKey}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cp.isLocked
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {cp.isLocked ? "Terkunci" : "Terbuka"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800">
                      Rp {(cp.netIncomeCalculated || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{cp.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AUDIT TRAIL LOG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Jejak Audit Keuangan (Audit Trail Logs)
            </h3>
          </div>

          <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{log.user}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                      {log.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-emerald-800">{log.action}</div>
                <p className="text-slate-600 text-[11px]">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
