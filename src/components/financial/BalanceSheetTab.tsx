import React from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Scale, FileSpreadsheet, Printer } from "lucide-react";

interface BalanceSheetTabProps {
  currentAssets: { name: string; amount: number }[];
  fixedAssets: { name: string; amount: number; isContra?: boolean }[];
  currentLiabilities: { name: string; amount: number }[];
  longTermLiabilities: { name: string; amount: number }[];
  equityItems: { name: string; amount: number }[];
  netIncomeCurrentYear: number;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export default function BalanceSheetTab({
  currentAssets,
  fixedAssets,
  currentLiabilities,
  longTermLiabilities,
  equityItems,
  netIncomeCurrentYear,
  onExportExcel,
  onExportPDF
}: BalanceSheetTabProps) {
  // Calculations
  const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedAssets = fixedAssets.reduce((sum, item) => {
    return item.isContra ? sum - item.amount : sum + item.amount;
  }, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalBaseEquity = equityItems.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = totalBaseEquity + netIncomeCurrentYear;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = variance < 1000; // tolerance for rounding

  return (
    <div className="space-y-6">
      {/* EQUATION STATUS BAR */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          isBalanced
            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
            : "bg-amber-50 text-amber-900 border-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isBalanced ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-extrabold text-sm">
              {isBalanced ? "Persamaan Akuntansi Seimbang (Balance Validated)" : "Terdapat Selisih Neraca"}
            </h4>
            <p className="text-xs opacity-80">
              Prinsip Dasar: <strong>Total Aset ({`Rp ${totalAssets.toLocaleString("id-ID")}`}) = Kewajiban + Ekuitas ({`Rp ${totalLiabilitiesAndEquity.toLocaleString("id-ID")}`})</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Ekspor Laporan Neraca ke Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Cetak atau Unduh Dokumen PDF Resmi Neraca"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          )}

          {isBalanced ? (
            <span className="flex items-center gap-1 text-xs font-black uppercase px-3 py-1 bg-emerald-600 text-white rounded-full">
              <CheckCircle2 className="w-4 h-4" /> SEIMBANG (0 Selisih)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-black uppercase px-3 py-1 bg-amber-600 text-white rounded-full">
              <AlertTriangle className="w-4 h-4" /> Selisih: Rp {variance.toLocaleString("id-ID")}
            </span>
          )}
        </div>
      </div>

      {/* TWO-COLUMN BALANCE SHEET LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: ASET */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-800 text-white p-4 font-display font-bold text-sm uppercase tracking-wide flex items-center justify-between">
            <span>SISI AKTIVA / ASET</span>
            <span className="font-mono text-emerald-400">Rp {totalAssets.toLocaleString("id-ID")}</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Aset Lancar */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>1. Aset Lancar (Current Assets)</span>
                <span className="font-mono text-slate-700">Rp {totalCurrentAssets.toLocaleString("id-ID")}</span>
              </h4>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {currentAssets.map((a, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-slate-650">
                    <span>{a.name}</span>
                    <span className="font-mono font-semibold text-slate-850">Rp {a.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aset Tetap */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>2. Aset Tetap (Fixed Assets)</span>
                <span className="font-mono text-slate-700">Rp {totalFixedAssets.toLocaleString("id-ID")}</span>
              </h4>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {fixedAssets.map((a, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-slate-650">
                    <span>{a.name}</span>
                    <span className={`font-mono font-semibold ${a.isContra ? "text-rose-600" : "text-slate-850"}`}>
                      {a.isContra ? `(Rp ${a.amount.toLocaleString("id-ID")})` : `Rp ${a.amount.toLocaleString("id-ID")}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Aset Box */}
            <div className="p-4 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 flex items-center justify-between font-bold text-sm">
              <span>TOTAL ASET (AKTIVA)</span>
              <span className="font-mono text-base font-black">Rp {totalAssets.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIABILITAS & EKUITAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-800 text-white p-4 font-display font-bold text-sm uppercase tracking-wide flex items-center justify-between">
            <span>SISI PASIVA / KEWAJIBAN & MODAL</span>
            <span className="font-mono text-emerald-400">Rp {totalLiabilitiesAndEquity.toLocaleString("id-ID")}</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Liabilitas Jangka Pendek */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>1. Liabilitas Jangka Pendek (Current Liabilities)</span>
                <span className="font-mono text-slate-700">Rp {totalCurrentLiabilities.toLocaleString("id-ID")}</span>
              </h4>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {currentLiabilities.map((l, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-slate-650">
                    <span>{l.name}</span>
                    <span className="font-mono font-semibold text-slate-850">Rp {l.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilitas Jangka Panjang */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>2. Liabilitas Jangka Panjang (Long-Term Debt)</span>
                <span className="font-mono text-slate-700">Rp {totalLongTermLiabilities.toLocaleString("id-ID")}</span>
              </h4>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {longTermLiabilities.map((l, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-slate-650">
                    <span>{l.name}</span>
                    <span className="font-mono font-semibold text-slate-850">Rp {l.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ekuitas & Modal */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>3. Ekuitas (Owner's Equity)</span>
                <span className="font-mono text-slate-700">Rp {totalEquity.toLocaleString("id-ID")}</span>
              </h4>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {equityItems.map((e, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-slate-650">
                    <span>{e.name}</span>
                    <span className="font-mono font-semibold text-slate-850">Rp {e.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
                <div className="py-2 flex items-center justify-between text-slate-650 font-bold bg-emerald-50/50 px-2 rounded-md">
                  <span>Laba / Rugi Berjalan (Net Income)</span>
                  <span className={`font-mono ${netIncomeCurrentYear >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    Rp {netIncomeCurrentYear.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Pasiva Box */}
            <div className="p-4 bg-teal-50 text-teal-950 rounded-xl border border-teal-200 flex items-center justify-between font-bold text-sm">
              <span>TOTAL KEWAJIBAN & EKUITAS</span>
              <span className="font-mono text-base font-black">Rp {totalLiabilitiesAndEquity.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
