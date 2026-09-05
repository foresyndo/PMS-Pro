import React, { useState } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Printer
} from "lucide-react";

interface IncomeStatementTabProps {
  revenueItems: { name: string; current: number; previous: number }[];
  cogsItems: { name: string; current: number; previous: number }[];
  opexItems: { name: string; current: number; previous: number }[];
  otherExpenseItems: { name: string; current: number; previous: number }[];
  periodLabel: string;
  previousPeriodLabel: string;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export default function IncomeStatementTab({
  revenueItems,
  cogsItems,
  opexItems,
  otherExpenseItems,
  periodLabel,
  previousPeriodLabel,
  onExportExcel,
  onExportPDF
}: IncomeStatementTabProps) {
  const [viewComparison, setViewComparison] = useState(true);

  // Calculations
  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.current, 0);
  const prevRevenue = revenueItems.reduce((sum, item) => sum + item.previous, 0);

  const totalCogs = cogsItems.reduce((sum, item) => sum + item.current, 0);
  const prevCogs = cogsItems.reduce((sum, item) => sum + item.previous, 0);

  const grossProfit = totalRevenue - totalCogs;
  const prevGrossProfit = prevRevenue - prevCogs;

  const totalOpex = opexItems.reduce((sum, item) => sum + item.current, 0);
  const prevOpex = opexItems.reduce((sum, item) => sum + item.previous, 0);

  const operatingProfit = grossProfit - totalOpex;
  const prevOperatingProfit = prevGrossProfit - prevOpex;

  const totalOtherExpense = otherExpenseItems.reduce((sum, item) => sum + item.current, 0);
  const prevOtherExpense = otherExpenseItems.reduce((sum, item) => sum + item.previous, 0);

  const netProfit = operatingProfit - totalOtherExpense;
  const prevNetProfit = prevOperatingProfit - prevOtherExpense;

  const getPercentageChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const change = ((curr - prev) / prev) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* HEADER & TOGGLE */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-display font-extrabold text-slate-800">
            Laporan Laba Rugi Komprehensif (Income Statement)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Periode Berjalan: <span className="font-bold text-slate-700">{periodLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <input
              type="checkbox"
              checked={viewComparison}
              onChange={(e) => setViewComparison(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Tampilkan Perbandingan ({previousPeriodLabel})</span>
          </label>

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Ekspor Laporan Laba Rugi ke Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Cetak atau Unduh Dokumen PDF Resmi"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Cetak / PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-6">Uraian Akun / Pos Keuangan</th>
              <th className="py-3 px-6 text-right">{periodLabel}</th>
              {viewComparison && (
                <>
                  <th className="py-3 px-6 text-right text-slate-500">{previousPeriodLabel}</th>
                  <th className="py-3 px-6 text-right">Perubahan (%)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* 1. PENDAPATAN */}
            <tr className="bg-emerald-50/40 font-extrabold text-emerald-900 text-xs uppercase tracking-wider">
              <td colSpan={viewComparison ? 4 : 2} className="py-2.5 px-6">
                1. Pendapatan Operasional Properti (Revenues)
              </td>
            </tr>
            {revenueItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-6 pl-10 text-xs font-medium text-slate-750">{item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs font-bold text-slate-900">
                  Rp {item.current.toLocaleString("id-ID")}
                </td>
                {viewComparison && (
                  <>
                    <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-500">
                      Rp {item.previous.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-xs font-semibold">
                      <span className={item.current >= item.previous ? "text-emerald-600" : "text-rose-600"}>
                        {getPercentageChange(item.current, item.previous)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
            <tr className="bg-emerald-50/20 font-bold text-slate-850 border-t border-b border-emerald-200/60">
              <td className="py-3 px-6 text-xs uppercase">Total Pendapatan</td>
              <td className="py-3 px-6 text-right font-mono text-xs font-black text-emerald-800">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </td>
              {viewComparison && (
                <>
                  <td className="py-3 px-6 text-right font-mono text-xs font-bold text-slate-600">
                    Rp {prevRevenue.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-xs font-bold text-emerald-700">
                    {getPercentageChange(totalRevenue, prevRevenue)}
                  </td>
                </>
              )}
            </tr>

            {/* 2. HARGA POKOK PENJUALAN (HPP) */}
            <tr className="bg-slate-50 font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              <td colSpan={viewComparison ? 4 : 2} className="py-2.5 px-6">
                2. Harga Pokok Penjualan (HPP / Direct Costs)
              </td>
            </tr>
            {cogsItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-6 pl-10 text-xs font-medium text-slate-750">{item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-900">
                  Rp {item.current.toLocaleString("id-ID")}
                </td>
                {viewComparison && (
                  <>
                    <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-500">
                      Rp {item.previous.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-xs">
                      {getPercentageChange(item.current, item.previous)}
                    </td>
                  </>
                )}
              </tr>
            ))}
            <tr className="bg-slate-100/60 font-bold border-t border-b border-slate-200">
              <td className="py-3 px-6 text-xs uppercase text-slate-800">Total Harga Pokok (HPP)</td>
              <td className="py-3 px-6 text-right font-mono text-xs font-bold text-rose-700">
                (Rp {totalCogs.toLocaleString("id-ID")})
              </td>
              {viewComparison && (
                <>
                  <td className="py-3 px-6 text-right font-mono text-xs text-slate-600">
                    (Rp {prevCogs.toLocaleString("id-ID")})
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-xs">
                    {getPercentageChange(totalCogs, prevCogs)}
                  </td>
                </>
              )}
            </tr>

            {/* 3. LABA KOTOR */}
            <tr className="bg-teal-50 font-black text-teal-900 text-xs uppercase border-y-2 border-teal-200">
              <td className="py-3 px-6">LABA KOTOR (GROSS PROFIT)</td>
              <td className="py-3 px-6 text-right font-mono text-sm font-black text-teal-950">
                Rp {grossProfit.toLocaleString("id-ID")}
              </td>
              {viewComparison && (
                <>
                  <td className="py-3 px-6 text-right font-mono text-xs font-bold text-teal-800">
                    Rp {prevGrossProfit.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-xs font-black text-teal-800">
                    {getPercentageChange(grossProfit, prevGrossProfit)}
                  </td>
                </>
              )}
            </tr>

            {/* 4. BEBAN OPERASIONAL */}
            <tr className="bg-slate-50 font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              <td colSpan={viewComparison ? 4 : 2} className="py-2.5 px-6">
                4. Beban Operasional (Operating Expenses - OPEX)
              </td>
            </tr>
            {opexItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-6 pl-10 text-xs font-medium text-slate-750">{item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-900">
                  Rp {item.current.toLocaleString("id-ID")}
                </td>
                {viewComparison && (
                  <>
                    <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-500">
                      Rp {item.previous.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-xs font-medium text-slate-600">
                      {getPercentageChange(item.current, item.previous)}
                    </td>
                  </>
                )}
              </tr>
            ))}
            <tr className="bg-slate-100/60 font-bold border-t border-b border-slate-200">
              <td className="py-3 px-6 text-xs uppercase text-slate-800">Total Beban Operasional</td>
              <td className="py-3 px-6 text-right font-mono text-xs font-bold text-rose-700">
                (Rp {totalOpex.toLocaleString("id-ID")})
              </td>
              {viewComparison && (
                <>
                  <td className="py-3 px-6 text-right font-mono text-xs text-slate-600">
                    (Rp {prevOpex.toLocaleString("id-ID")})
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-xs">
                    {getPercentageChange(totalOpex, prevOpex)}
                  </td>
                </>
              )}
            </tr>

            {/* 5. BEBAN LAIN-LAIN */}
            <tr className="bg-slate-50 font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              <td colSpan={viewComparison ? 4 : 2} className="py-2.5 px-6">
                5. Beban / Pendapatan Lain-lain (Non-Operating)
              </td>
            </tr>
            {otherExpenseItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="py-2.5 px-6 pl-10 text-xs font-medium text-slate-750">{item.name}</td>
                <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-900">
                  Rp {item.current.toLocaleString("id-ID")}
                </td>
                {viewComparison && (
                  <>
                    <td className="py-2.5 px-6 text-right font-mono text-xs text-slate-500">
                      Rp {item.previous.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-xs">
                      {getPercentageChange(item.current, item.previous)}
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* 6. LABA BERSIH */}
            <tr className="bg-emerald-600 text-white font-black text-sm uppercase tracking-wide">
              <td className="py-4 px-6 font-display">LABA BERSIH TAHUN BERJALAN (NET PROFIT)</td>
              <td className="py-4 px-6 text-right font-mono text-base font-black">
                Rp {netProfit.toLocaleString("id-ID")}
              </td>
              {viewComparison && (
                <>
                  <td className="py-4 px-6 text-right font-mono text-sm text-emerald-100">
                    Rp {prevNetProfit.toLocaleString("id-ID")}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-bold text-white">
                    {getPercentageChange(netProfit, prevNetProfit)}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
