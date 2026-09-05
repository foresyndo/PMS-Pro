import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, FileSpreadsheet, Printer } from "lucide-react";

interface CashFlowTabProps {
  operatingInflows: { name: string; amount: number }[];
  operatingOutflows: { name: string; amount: number }[];
  investingInflows: { name: string; amount: number }[];
  investingOutflows: { name: string; amount: number }[];
  financingInflows: { name: string; amount: number }[];
  financingOutflows: { name: string; amount: number }[];
  initialCashBalance: number;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export default function CashFlowTab({
  operatingInflows,
  operatingOutflows,
  investingInflows,
  investingOutflows,
  financingInflows,
  financingOutflows,
  initialCashBalance,
  onExportExcel,
  onExportPDF
}: CashFlowTabProps) {
  // Operating Cash Flow
  const totalOpIn = operatingInflows.reduce((sum, i) => sum + i.amount, 0);
  const totalOpOut = operatingOutflows.reduce((sum, i) => sum + i.amount, 0);
  const netOperatingCash = totalOpIn - totalOpOut;

  // Investing Cash Flow
  const totalInvIn = investingInflows.reduce((sum, i) => sum + i.amount, 0);
  const totalInvOut = investingOutflows.reduce((sum, i) => sum + i.amount, 0);
  const netInvestingCash = totalInvIn - totalInvOut;

  // Financing Cash Flow
  const totalFinIn = financingInflows.reduce((sum, i) => sum + i.amount, 0);
  const totalFinOut = financingOutflows.reduce((sum, i) => sum + i.amount, 0);
  const netFinancingCash = totalFinIn - totalFinOut;

  // Total Net Cash Change
  const netCashChange = netOperatingCash + netInvestingCash + netFinancingCash;
  const finalCashBalance = initialCashBalance + netCashChange;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-extrabold text-slate-800">
            Laporan Arus Kas (Cash Flow Statement)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Metode Langsung (Direct Method) Berdasarkan Realisasi Mutasi Kas Nyata
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Ekspor Arus Kas ke Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Cetak atau Unduh Dokumen PDF Resmi Arus Kas"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Cetak / PDF</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Saldo Akhir: Rp {finalCashBalance.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-6">Arus Kas Masuk & Keluar</th>
              <th className="py-3 px-6 text-right">Nominal (IDR)</th>
              <th className="py-3 px-6 text-right">Net Subtotal (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* 1. AKTIVITAS OPERASIONAL */}
            <tr className="bg-emerald-50/50 font-extrabold text-emerald-950 text-xs uppercase tracking-wider">
              <td colSpan={3} className="py-2.5 px-6">
                1. Arus Kas dari Aktivitas Operasional (Operating Activities)
              </td>
            </tr>
            {operatingInflows.map((item, idx) => (
              <tr key={`op-in-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Penerimaan: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-emerald-700">
                  + Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            {operatingOutflows.map((item, idx) => (
              <tr key={`op-out-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Pengeluaran: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-rose-700">
                  - Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t border-b border-slate-200 text-xs">
              <td className="py-3 px-6 uppercase text-slate-800">Kas Bersih dari Aktivitas Operasional</td>
              <td className="py-3 px-6 text-right text-slate-400 font-mono">-</td>
              <td className={`py-3 px-6 text-right font-mono font-black ${netOperatingCash >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rp {netOperatingCash.toLocaleString("id-ID")}
              </td>
            </tr>

            {/* 2. AKTIVITAS INVESTASI */}
            <tr className="bg-blue-50/50 font-extrabold text-blue-950 text-xs uppercase tracking-wider">
              <td colSpan={3} className="py-2.5 px-6">
                2. Arus Kas dari Aktivitas Investasi (Investing Activities)
              </td>
            </tr>
            {investingInflows.map((item, idx) => (
              <tr key={`inv-in-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Penerimaan: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-emerald-700">
                  + Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            {investingOutflows.map((item, idx) => (
              <tr key={`inv-out-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Pengeluaran: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-rose-700">
                  - Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t border-b border-slate-200 text-xs">
              <td className="py-3 px-6 uppercase text-slate-800">Kas Bersih dari Aktivitas Investasi</td>
              <td className="py-3 px-6 text-right text-slate-400 font-mono">-</td>
              <td className={`py-3 px-6 text-right font-mono font-black ${netInvestingCash >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rp {netInvestingCash.toLocaleString("id-ID")}
              </td>
            </tr>

            {/* 3. AKTIVITAS PENDANAAN */}
            <tr className="bg-purple-50/50 font-extrabold text-purple-950 text-xs uppercase tracking-wider">
              <td colSpan={3} className="py-2.5 px-6">
                3. Arus Kas dari Aktivitas Pendanaan (Financing Activities)
              </td>
            </tr>
            {financingInflows.map((item, idx) => (
              <tr key={`fin-in-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Penerimaan: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-emerald-700">
                  + Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            {financingOutflows.map((item, idx) => (
              <tr key={`fin-out-${idx}`} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-6 pl-10 text-xs text-slate-700">Pengeluaran: {item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold text-rose-700">
                  - Rp {item.amount.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 px-6 text-right text-xs font-mono text-slate-400">-</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t border-b border-slate-200 text-xs">
              <td className="py-3 px-6 uppercase text-slate-800">Kas Bersih dari Aktivitas Pendanaan</td>
              <td className="py-3 px-6 text-right text-slate-400 font-mono">-</td>
              <td className={`py-3 px-6 text-right font-mono font-black ${netFinancingCash >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rp {netFinancingCash.toLocaleString("id-ID")}
              </td>
            </tr>

            {/* REKONSILIASI SALDO AWAL & AKHIR */}
            <tr className="bg-slate-100 font-bold text-slate-800 text-xs">
              <td className="py-3 px-6 uppercase">Kenaikan / (Penurunan) Kas Bersih</td>
              <td className="py-3 px-6 text-right font-mono">-</td>
              <td className={`py-3 px-6 text-right font-mono font-black ${netCashChange >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rp {netCashChange.toLocaleString("id-ID")}
              </td>
            </tr>
            <tr className="bg-white font-medium text-slate-700 text-xs">
              <td className="py-3 px-6">Saldo Awal Kas & Bank (Awal Periode)</td>
              <td className="py-3 px-6 text-right font-mono text-slate-600">
                Rp {initialCashBalance.toLocaleString("id-ID")}
              </td>
              <td className="py-3 px-6 text-right font-mono text-slate-600">
                Rp {initialCashBalance.toLocaleString("id-ID")}
              </td>
            </tr>
            <tr className="bg-emerald-600 text-white font-black text-sm uppercase tracking-wide">
              <td className="py-4 px-6 font-display">SALDO AKHIR KAS & BANK (AKHIR PERIODE)</td>
              <td className="py-4 px-6 text-right font-mono text-emerald-100 text-xs">
                (Awal + Perubahan Bersih)
              </td>
              <td className="py-4 px-6 text-right font-mono text-base font-black">
                Rp {finalCashBalance.toLocaleString("id-ID")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
