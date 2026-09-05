import React from "react";
import {
  Calendar,
  Building2,
  FileSpreadsheet,
  Printer,
  Download,
  Lock,
  Unlock,
  RefreshCw
} from "lucide-react";
import { Property } from "../../types";

interface FinancialHeaderProps {
  selectedPeriod: string;
  setSelectedPeriod: (val: string) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (val: string) => void;
  properties: Property[];
  isPeriodLocked: boolean;
  activeTabLabel?: string;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onRefresh: () => void;
}

export const PERIOD_OPTIONS = [
  { id: "2026-09", label: "Bulan Ini (September 2026)" },
  { id: "2026-08", label: "Bulan Lalu (Agustus 2026)" },
  { id: "2026-07", label: "Juli 2026" },
  { id: "2026-Q3", label: "Kuartal 3 (Jul - Sep 2026)" },
  { id: "2026-Q2", label: "Kuartal 2 (Apr - Jun 2026)" },
  { id: "2026-YTD", label: "Tahun Berjalan (YTD 2026)" },
  { id: "ALL", label: "Semua Periode" }
];

export default function FinancialHeader({
  selectedPeriod,
  setSelectedPeriod,
  selectedPropertyId,
  setSelectedPropertyId,
  properties,
  isPeriodLocked,
  activeTabLabel,
  onExportExcel,
  onExportCSV,
  onExportPDF,
  onPrint,
  onRefresh
}: FinancialHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-extrabold text-slate-800 tracking-tight">
                Laporan Keuangan & Akuntansi
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isPeriodLocked
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isPeriodLocked ? (
                  <>
                    <Lock className="w-3 h-3" /> Periode Terkunci (Locked)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" /> Buku Terbuka (Active)
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Standar Akuntansi Keuangan (PSAK) Properti • Realtime Cloud Data
              {activeTabLabel && (
                <span className="ml-2 font-bold text-emerald-700">
                  • Tab Aktif: {activeTabLabel}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Periode Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent font-bold focus:outline-hidden cursor-pointer"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cabang / Properti Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="bg-transparent font-bold focus:outline-hidden cursor-pointer max-w-[150px] truncate"
          >
            <option value="ALL">Semua Cabang / Properti</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
          <button
            onClick={onExportExcel}
            className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={`Unduh Tab ${activeTabLabel || "Laporan"} ke format Excel (.xls)`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={onExportCSV}
            className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Unduh format CSV"
          >
            <span className="text-[11px] font-bold">CSV</span>
          </button>
          <button
            onClick={onExportPDF}
            className="px-2.5 py-1.5 text-slate-700 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={`Cetak atau Unduh Dokumen PDF Resmi ${activeTabLabel || "Laporan"}`}
          >
            <Printer className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-bold text-rose-700">PDF</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Muat Ulang / Refresh Data Keuangan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
