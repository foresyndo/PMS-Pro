import React, { useEffect } from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { FinancialSubTab } from "../FinancialReportsModule";
import { DEFAULT_COMPANY_INFO } from "../../utils/financialExport";
import { ChartOfAccount, JournalEntry, VendorPayable, BankAccount, BankMutation, BudgetCategory, ClosingPeriod, FinancialAuditLog, Invoice, ExpenseItem } from "../../types";

interface FinancialReportDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: FinancialSubTab;
  periodLabel: string;
  propertyName: string;
  printedBy: string;
  isPeriodLocked: boolean;
  onExportExcel: () => void;
  onExportCSV: () => void;

  // Data for reports
  revenueItems: { name: string; current: number; previous: number }[];
  cogsItems: { name: string; current: number; previous: number }[];
  opexItems: { name: string; current: number; previous: number }[];
  otherExpenseItems: { name: string; current: number; previous: number }[];

  currentAssets: { name: string; amount: number }[];
  fixedAssets: { name: string; amount: number; isContra?: boolean }[];
  currentLiabilities: { name: string; amount: number }[];
  longTermLiabilities: { name: string; amount: number }[];
  equityItems: { name: string; amount: number }[];
  netIncomeCurrentYear: number;

  operatingInflows: { name: string; amount: number }[];
  operatingOutflows: { name: string; amount: number }[];
  investingInflows: { name: string; amount: number }[];
  investingOutflows: { name: string; amount: number }[];
  financingInflows: { name: string; amount: number }[];
  financingOutflows: { name: string; amount: number }[];
  initialCashBalance: number;

  coaList: ChartOfAccount[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  expenses: ExpenseItem[];
  vendorPayables: VendorPayable[];
  bankAccounts: BankAccount[];
  bankMutations: BankMutation[];
  budgets: BudgetCategory[];
  closingPeriods: ClosingPeriod[];
  auditLogs: FinancialAuditLog[];

  // Executive Dashboard Totals
  totalIncome: number;
  totalExpense: number;
  grossProfit: number;
  netProfit: number;
  totalCashAndBank: number;
  totalReceivables: number;
  totalPayables: number;
}

export default function FinancialReportDocModal({
  isOpen,
  onClose,
  activeTab,
  periodLabel,
  propertyName,
  printedBy,
  isPeriodLocked,
  onExportExcel,
  onExportCSV,
  revenueItems,
  cogsItems,
  opexItems,
  otherExpenseItems,
  currentAssets,
  fixedAssets,
  currentLiabilities,
  longTermLiabilities,
  equityItems,
  netIncomeCurrentYear,
  operatingInflows,
  operatingOutflows,
  investingInflows,
  investingOutflows,
  financingInflows,
  financingOutflows,
  initialCashBalance,
  coaList,
  journalEntries,
  invoices,
  expenses,
  vendorPayables,
  bankAccounts,
  bankMutations,
  budgets,
  closingPeriods,
  auditLogs,
  totalIncome,
  totalExpense,
  grossProfit,
  netProfit,
  totalCashAndBank,
  totalReceivables,
  totalPayables
}: FinancialReportDocModalProps) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const company = DEFAULT_COMPANY_INFO;
  const printTimestamp = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  const handlePrint = () => {
    document.body.classList.add("printing-financial-doc");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-financial-doc");
    }, 800);
  };

  // Get Tab Specific Document Title
  const getDocTitle = () => {
    switch (activeTab) {
      case "laba-rugi":
        return "LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)";
      case "neraca":
        return "LAPORAN POSISI KEUANGAN (NERACA / BALANCE SHEET)";
      case "arus-kas":
        return "LAPORAN ARUS KAS METODE TIGA AKTIVITAS (CASH FLOW)";
      case "buku-besar":
        return "BUKU BESAR UMUM AKUNTANSI (GENERAL LEDGER)";
      case "jurnal-umum":
        return "BUKU JURNAL UMUM DOUBLE-ENTRY (GENERAL JOURNAL)";
      case "piutang":
        return "LAPORAN AGING & BUKU PEMBANTU PIUTANG (ACCOUNTS RECEIVABLE)";
      case "hutang":
        return "LAPORAN JATUH TEMPO & BUKU PEMBANTU HUTANG (ACCOUNTS PAYABLE)";
      case "kas-bank":
        return "LAPORAN REKONSILIASI KAS & MUTASI BANK";
      case "pajak":
        return "LAPORAN PERHITUNGAN REKAP PERPAJAKAN (PPN & PPH FINAL)";
      case "pendapatan":
        return "LAPORAN ANALISIS PENDAPATAN & SEWA UNIT";
      case "pengeluaran":
        return "LAPORAN ANALISIS BEBAN OPERASIONAL & BIAYA PENGELUARAN";
      case "budget":
        return "LAPORAN REALISASI ANGGARAN & ANALISIS VARIANS (BUDGETING)";
      case "closing":
        return "LAPORAN STATUS TUTUP BUKU & AUDIT TRAIL LOG";
      default:
        return "RINGKASAN EKSEKUTIF KINERJA KEUANGAN (EXECUTIVE FINANCIAL REPORT)";
    }
  };

  // Calculations for Laba Rugi
  const sumRevenue = revenueItems.reduce((s, i) => s + i.current, 0);
  const sumCogs = cogsItems.reduce((s, i) => s + i.current, 0);
  const calcGrossProfit = sumRevenue - sumCogs;
  const sumOpex = opexItems.reduce((s, i) => s + i.current, 0);
  const calcOperatingProfit = calcGrossProfit - sumOpex;
  const sumOther = otherExpenseItems.reduce((s, i) => s + i.current, 0);
  const calcNetProfit = calcOperatingProfit - sumOther;

  // Calculations for Neraca
  const sumCurrentAssets = currentAssets.reduce((s, i) => s + i.amount, 0);
  const sumFixedAssets = fixedAssets.reduce((s, i) => (i.isContra ? s - i.amount : s + i.amount), 0);
  const totalAssets = sumCurrentAssets + sumFixedAssets;

  const sumCurrentLiab = currentLiabilities.reduce((s, i) => s + i.amount, 0);
  const sumLongTermLiab = longTermLiabilities.reduce((s, i) => s + i.amount, 0);
  const totalLiab = sumCurrentLiab + sumLongTermLiab;

  const sumBaseEquity = equityItems.reduce((s, i) => s + i.amount, 0);
  const totalEquity = sumBaseEquity + netIncomeCurrentYear;
  const totalLiabAndEquity = totalLiab + totalEquity;
  const isBalanceValidated = Math.abs(totalAssets - totalLiabAndEquity) < 1000;

  // Calculations for Arus Kas
  const sumOpIn = operatingInflows.reduce((s, i) => s + i.amount, 0);
  const sumOpOut = operatingOutflows.reduce((s, i) => s + i.amount, 0);
  const netOp = sumOpIn - sumOpOut;
  const sumInvIn = investingInflows.reduce((s, i) => s + i.amount, 0);
  const sumInvOut = investingOutflows.reduce((s, i) => s + i.amount, 0);
  const netInv = sumInvIn - sumInvOut;
  const sumFinIn = financingInflows.reduce((s, i) => s + i.amount, 0);
  const sumFinOut = financingOutflows.reduce((s, i) => s + i.amount, 0);
  const netFin = sumFinIn - sumFinOut;
  const netCashChange = netOp + netInv + netFin;
  const finalCashBalance = initialCashBalance + netCashChange;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="relative bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* MODAL CONTROL HEADER (NO-PRINT) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-extrabold text-white">
                  Pratinjau Dokumen Cetak & Ekspor Resmi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Format Standar PSAK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Laporan siap cetak / simpan sebagai PDF beresolusi tinggi atau unduh file Excel (.xls)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Unduh Excel .xls"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Cetak atau Simpan PDF"
            >
              <Download className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DOCUMENT PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/70">
          {/* THE OFFICIAL PRINTABLE A4 DOCUMENT */}
          <div
            id="printable-financial-document"
            className="bg-white rounded-xl shadow-lg border border-slate-300 max-w-[840px] w-full p-8 sm:p-10 text-slate-800 text-xs font-sans leading-relaxed"
          >
            {/* 1. OFFICIAL COMPANY LETTERHEAD (KOP SURAT) */}
            <div className="border-b-2 border-slate-800 pb-4 mb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-display font-black text-xl tracking-wider shadow-sm">
                    MPN
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 font-display">
                      {company.name}
                    </h1>
                    <p className="text-[11px] font-semibold text-emerald-800 tracking-wide">
                      {company.subTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {company.address}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-500 border-l border-slate-200 pl-4 space-y-0.5">
                  <p>
                    <strong className="text-slate-700">Telepon:</strong> {company.phone}
                  </p>
                  <p>
                    <strong className="text-slate-700">Email:</strong> {company.email}
                  </p>
                  <p>
                    <strong className="text-slate-700">NPWP:</strong> {company.npwp}
                  </p>
                </div>
              </div>
              <div className="h-0.5 bg-slate-800 mt-3"></div>
              <div className="h-[1px] bg-slate-800 mt-0.5"></div>
            </div>

            {/* 2. DOCUMENT TITLE & PERIOD */}
            <div className="text-center my-4 space-y-1">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide font-display underline decoration-emerald-600 underline-offset-4">
                {getDocTitle()}
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Periode: <span className="text-emerald-700">{periodLabel}</span> • Cabang/Entitas:{" "}
                <span className="text-slate-900">{propertyName}</span>
              </p>
            </div>

            {/* 3. METADATA SUMMARY BAR */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Mata Uang</span>
                <span className="font-extrabold text-slate-800">IDR (Rupiah Indonesia)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Standar Akuntansi</span>
                <span className="font-extrabold text-slate-800">PSAK Properti / SAK ETAP</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Status Buku</span>
                <span className={`font-extrabold ${isPeriodLocked ? "text-rose-600" : "text-emerald-600"}`}>
                  {isPeriodLocked ? "TERKUNCI (CLOSED)" : "AKTIF (RUNNING)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Tanggal Cetak</span>
                <span className="font-extrabold text-slate-800">{printTimestamp}</span>
              </div>
            </div>

            {/* 4. DYNAMIC REPORT CONTENT */}
            <div className="my-6">
              {/* === TAB 1: LABA RUGI (INCOME STATEMENT) === */}
              {activeTab === "laba-rugi" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-800 text-white font-bold text-[11px]">
                        <th className="py-2.5 px-4">Pos Akun / Uraian Keuangan</th>
                        <th className="py-2.5 px-4 text-right">Periode Berjalan ({periodLabel})</th>
                        <th className="py-2.5 px-4 text-right">Periode Lalu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {/* I. PENDAPATAN USAHA */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={3} className="py-2 px-4">
                          I. PENDAPATAN USAHA (OPERATING REVENUE)
                        </td>
                      </tr>
                      {revenueItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono font-medium">
                            {formatRp(item.current)}
                          </td>
                          <td className="py-1.5 px-4 text-right font-mono text-slate-400">
                            {formatRp(item.previous)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50/50 font-bold text-slate-900 border-t border-slate-300">
                        <td className="py-2 px-4">TOTAL PENDAPATAN USAHA</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-800">
                          {formatRp(sumRevenue)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          {formatRp(revenueItems.reduce((s, i) => s + i.previous, 0))}
                        </td>
                      </tr>

                      {/* II. BEBAN POKOK PENDAPATAN (HPP) */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={3} className="py-2 px-4">
                          II. BEBAN POKOK PENDAPATAN (COGS / HPP)
                        </td>
                      </tr>
                      {cogsItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono font-medium text-rose-600">
                            ({formatRp(item.current)})
                          </td>
                          <td className="py-1.5 px-4 text-right font-mono text-slate-400">
                            ({formatRp(item.previous)})
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                        <td className="py-2 px-4">TOTAL BEBAN POKOK PENDAPATAN (HPP)</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">
                          ({formatRp(sumCogs)})
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          ({formatRp(cogsItems.reduce((s, i) => s + i.previous, 0))})
                        </td>
                      </tr>

                      {/* LABA KOTOR */}
                      <tr className="bg-emerald-100 text-emerald-950 font-black text-xs border-y-2 border-emerald-600">
                        <td className="py-2.5 px-4">LABA KOTOR (GROSS PROFIT)</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-900 font-black">
                          {formatRp(calcGrossProfit)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-800">
                          {formatRp(
                            revenueItems.reduce((s, i) => s + i.previous, 0) -
                              cogsItems.reduce((s, i) => s + i.previous, 0)
                          )}
                        </td>
                      </tr>

                      {/* III. BEBAN OPERASIONAL */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={3} className="py-2 px-4">
                          III. BEBAN OPERASIONAL & KELOLA (OPEX)
                        </td>
                      </tr>
                      {opexItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono font-medium text-rose-600">
                            ({formatRp(item.current)})
                          </td>
                          <td className="py-1.5 px-4 text-right font-mono text-slate-400">
                            ({formatRp(item.previous)})
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                        <td className="py-2 px-4">TOTAL BEBAN OPERASIONAL</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700">
                          ({formatRp(sumOpex)})
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          ({formatRp(opexItems.reduce((s, i) => s + i.previous, 0))})
                        </td>
                      </tr>

                      {/* LABA OPERASIONAL */}
                      <tr className="bg-blue-50 text-blue-950 font-bold border-y border-blue-200">
                        <td className="py-2 px-4">LABA OPERASIONAL (OPERATING INCOME / EBIT)</td>
                        <td className="py-2 px-4 text-right font-mono text-blue-900">
                          {formatRp(calcOperatingProfit)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          {formatRp(
                            revenueItems.reduce((s, i) => s + i.previous, 0) -
                              cogsItems.reduce((s, i) => s + i.previous, 0) -
                              opexItems.reduce((s, i) => s + i.previous, 0)
                          )}
                        </td>
                      </tr>

                      {/* IV. BEBAN LAIN-LAIN */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={3} className="py-2 px-4">
                          IV. PENDAPATAN & (BEBAN) LAIN-LAIN
                        </td>
                      </tr>
                      {otherExpenseItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono font-medium text-rose-600">
                            ({formatRp(item.current)})
                          </td>
                          <td className="py-1.5 px-4 text-right font-mono text-slate-400">
                            ({formatRp(item.previous)})
                          </td>
                        </tr>
                      ))}

                      {/* LABA BERSIH */}
                      <tr className="bg-emerald-700 text-white font-black text-sm border-t-2 border-emerald-900">
                        <td className="py-3 px-4">LABA BERSIH TAHUN BERJALAN (NET PROFIT)</td>
                        <td className="py-3 px-4 text-right font-mono text-white text-base">
                          {formatRp(calcNetProfit)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-200">
                          {formatRp(
                            revenueItems.reduce((s, i) => s + i.previous, 0) -
                              cogsItems.reduce((s, i) => s + i.previous, 0) -
                              opexItems.reduce((s, i) => s + i.previous, 0) -
                              otherExpenseItems.reduce((s, i) => s + i.previous, 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 2: NERACA KEUANGAN (BALANCE SHEET) === */}
              {activeTab === "neraca" && (
                <div className="space-y-4">
                  {/* Balance Sheet Equation Banner */}
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-between ${
                      isBalanceValidated
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}
                  >
                    <span>
                      Validasi Neraca: Total Aset ({formatRp(totalAssets)}) = Total Kewajiban & Ekuitas (
                      {formatRp(totalLiabAndEquity)})
                    </span>
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white">
                      {isBalanceValidated ? "✓ BALANCE / SEIMBANG" : "PERIKSA SELISIH"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AKTIVA / ASET */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-800 text-white px-3 py-2 font-bold text-xs flex justify-between">
                        <span>SISI AKTIVA / ASET</span>
                        <span className="font-mono text-emerald-300">{formatRp(totalAssets)}</span>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">
                            1. Aset Lancar (Current Assets)
                          </p>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {currentAssets.map((a, i) => (
                              <div key={i} className="py-1 flex justify-between text-slate-600">
                                <span>{a.name}</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {formatRp(a.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="py-1.5 flex justify-between font-bold text-slate-900 bg-slate-50 px-1">
                              <span>Subtotal Aset Lancar</span>
                              <span className="font-mono text-emerald-700">{formatRp(sumCurrentAssets)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">
                            2. Aset Tetap & Non-Lancar
                          </p>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {fixedAssets.map((a, i) => (
                              <div key={i} className="py-1 flex justify-between text-slate-600">
                                <span>{a.name}</span>
                                <span
                                  className={`font-mono font-semibold ${
                                    a.isContra ? "text-rose-600" : "text-slate-800"
                                  }`}
                                >
                                  {a.isContra ? `(${formatRp(a.amount)})` : formatRp(a.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="py-1.5 flex justify-between font-bold text-slate-900 bg-slate-50 px-1">
                              <span>Subtotal Nilai Buku Aset Tetap</span>
                              <span className="font-mono text-emerald-700">{formatRp(sumFixedAssets)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-100 rounded text-emerald-950 font-black flex justify-between border-t-2 border-emerald-600">
                          <span>TOTAL ASET (AKTIVA)</span>
                          <span className="font-mono">{formatRp(totalAssets)}</span>
                        </div>
                      </div>
                    </div>

                    {/* PASIVA / KEWAJIBAN & EKUITAS */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-800 text-white px-3 py-2 font-bold text-xs flex justify-between">
                        <span>SISI PASIVA / KEWAJIBAN & EKUITAS</span>
                        <span className="font-mono text-emerald-300">{formatRp(totalLiabAndEquity)}</span>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">
                            3. Kewajiban Lancar (Current Liabilities)
                          </p>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {currentLiabilities.map((l, i) => (
                              <div key={i} className="py-1 flex justify-between text-slate-600">
                                <span>{l.name}</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {formatRp(l.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="py-1 flex justify-between text-slate-600 font-bold bg-slate-50 px-1">
                              <span>Subtotal Kewajiban Lancar</span>
                              <span className="font-mono text-rose-700">{formatRp(sumCurrentLiab)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">
                            4. Kewajiban Jangka Panjang
                          </p>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {longTermLiabilities.map((l, i) => (
                              <div key={i} className="py-1 flex justify-between text-slate-600">
                                <span>{l.name}</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {formatRp(l.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="py-1 flex justify-between text-slate-600 font-bold bg-slate-50 px-1">
                              <span>Subtotal Kewajiban Jk. Panjang</span>
                              <span className="font-mono text-rose-700">{formatRp(sumLongTermLiab)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">
                            5. Ekuitas Pemilik (Equity)
                          </p>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {equityItems.map((e, i) => (
                              <div key={i} className="py-1 flex justify-between text-slate-600">
                                <span>{e.name}</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {formatRp(e.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="py-1 flex justify-between text-emerald-800 font-bold">
                              <span>Laba Bersih Tahun Berjalan</span>
                              <span className="font-mono">{formatRp(netIncomeCurrentYear)}</span>
                            </div>
                            <div className="py-1.5 flex justify-between font-bold text-slate-900 bg-slate-50 px-1">
                              <span>Total Ekuitas</span>
                              <span className="font-mono text-emerald-700">{formatRp(totalEquity)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-100 rounded text-emerald-950 font-black flex justify-between border-t-2 border-emerald-600">
                          <span>TOTAL KEWAJIBAN & EKUITAS</span>
                          <span className="font-mono">{formatRp(totalLiabAndEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 3: ARUS KAS (CASH FLOW STATEMENT) === */}
              {activeTab === "arus-kas" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-teal-800 text-white font-bold text-[11px]">
                        <th className="py-2.5 px-4">Aktivitas Aliran Kas</th>
                        <th className="py-2.5 px-4 text-right">Nominal Arus Kas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={2} className="py-2 px-4">
                          I. ARUS KAS DARI AKTIVITAS OPERASIONAL
                        </td>
                      </tr>
                      {operatingInflows.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-emerald-700 font-medium">
                            {formatRp(item.amount)}
                          </td>
                        </tr>
                      ))}
                      {operatingOutflows.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-rose-600 font-medium">
                            ({formatRp(item.amount)})
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 font-bold border-t border-slate-300">
                        <td className="py-2 px-4">Arus Kas Bersih dari Aktivitas Operasional</td>
                        <td className="py-2 px-4 text-right font-mono text-teal-900 font-bold">
                          {formatRp(netOp)}
                        </td>
                      </tr>

                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={2} className="py-2 px-4">
                          II. ARUS KAS DARI AKTIVITAS INVESTASI
                        </td>
                      </tr>
                      {investingOutflows.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-rose-600 font-medium">
                            ({formatRp(item.amount)})
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 font-bold border-t border-slate-300">
                        <td className="py-2 px-4">Arus Kas Bersih dari Aktivitas Investasi</td>
                        <td className="py-2 px-4 text-right font-mono text-teal-900 font-bold">
                          {formatRp(netInv)}
                        </td>
                      </tr>

                      <tr className="bg-slate-100 font-extrabold text-slate-900">
                        <td colSpan={2} className="py-2 px-4">
                          III. ARUS KAS DARI AKTIVITAS PENDANAAN
                        </td>
                      </tr>
                      {financingOutflows.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-6">{item.name}</td>
                          <td className="py-1.5 px-4 text-right font-mono text-rose-600 font-medium">
                            ({formatRp(item.amount)})
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-teal-50 font-bold border-t border-slate-300">
                        <td className="py-2 px-4">Arus Kas Bersih dari Aktivitas Pendanaan</td>
                        <td className="py-2 px-4 text-right font-mono text-teal-900 font-bold">
                          {formatRp(netFin)}
                        </td>
                      </tr>

                      <tr className="bg-teal-100 text-teal-950 font-black border-y-2 border-teal-600">
                        <td className="py-2.5 px-4">KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS</td>
                        <td className="py-2.5 px-4 text-right font-mono text-teal-950 font-bold">
                          {formatRp(netCashChange)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-semibold">Saldo Kas & Setara Kas Awal Periode</td>
                        <td className="py-2 px-4 text-right font-mono font-bold">
                          {formatRp(initialCashBalance)}
                        </td>
                      </tr>
                      <tr className="bg-teal-700 text-white font-black text-sm">
                        <td className="py-3 px-4">SALDO KAS & SETARA KAS AKHIR PERIODE</td>
                        <td className="py-3 px-4 text-right font-mono text-white text-base">
                          {formatRp(finalCashBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 4: BUKU BESAR (GENERAL LEDGER) === */}
              {activeTab === "buku-besar" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2 px-3">Kode</th>
                        <th className="py-2 px-3">Nama Akun (Chart of Accounts)</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3">Saldo Normal</th>
                        <th className="py-2 px-3 text-right">Saldo Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {coaList.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{c.code}</td>
                          <td className="py-1.5 px-3 font-medium">{c.name}</td>
                          <td className="py-1.5 px-3 text-slate-500">{c.category}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-600">{c.normalBalance}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRp(c.currentBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 5: JURNAL UMUM === */}
              {activeTab === "jurnal-umum" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2 px-3">No. Jurnal</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Keterangan Transaksi & Akun</th>
                        <th className="py-2 px-3 text-right">Debet</th>
                        <th className="py-2 px-3 text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {journalEntries.slice(0, 15).map((j) => (
                        <React.Fragment key={j.id}>
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <td className="py-1.5 px-3 font-mono">{j.journalNumber}</td>
                            <td className="py-1.5 px-3 text-slate-600">{j.date}</td>
                            <td colSpan={3} className="py-1.5 px-3 text-emerald-800">
                              {j.description}
                            </td>
                          </tr>
                          {j.lines.map((l, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td></td>
                              <td></td>
                              <td className={`py-1 px-3 ${l.credit > 0 ? "pl-8 text-slate-600" : "font-medium"}`}>
                                {l.accountCode} - {l.accountName}
                              </td>
                              <td className="py-1 px-3 text-right font-mono">
                                {l.debit > 0 ? formatRp(l.debit) : "-"}
                              </td>
                              <td className="py-1 px-3 text-right font-mono">
                                {l.credit > 0 ? formatRp(l.credit) : "-"}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 6: PIUTANG (AR) === */}
              {activeTab === "piutang" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2 px-3">No Invoice</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Jatuh Tempo</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Total Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-1.5 px-3 text-slate-600">{inv.issueDate}</td>
                          <td className="py-1.5 px-3 text-slate-600">{inv.dueDate}</td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inv.status === "Pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">{formatRp(inv.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={4} className="py-2 px-3 text-right uppercase">
                          Total Piutang Belum Terbayar:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-black">
                          {formatRp(totalReceivables)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 7: HUTANG (AP) === */}
              {activeTab === "hutang" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2 px-3">No Faktur</th>
                        <th className="py-2 px-3">Nama Vendor / Supplier</th>
                        <th className="py-2 px-3">Jatuh Tempo</th>
                        <th className="py-2 px-3 text-right">Nilai Faktur</th>
                        <th className="py-2 px-3 text-right">Terbayar</th>
                        <th className="py-2 px-3 text-right">Sisa Hutang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {vendorPayables.map((vp) => (
                        <tr key={vp.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{vp.invoiceNumber}</td>
                          <td className="py-1.5 px-3 font-semibold">{vp.vendorName}</td>
                          <td className="py-1.5 px-3 text-slate-600">{vp.dueDate}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{formatRp(vp.amount)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-emerald-700">
                            {formatRp(vp.paidAmount)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                            {formatRp(vp.amount - vp.paidAmount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase">
                          Total Sisa Hutang Vendor:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-black">
                          {formatRp(totalPayables)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 8: KAS & BANK === */}
              {activeTab === "kas-bank" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold text-[11px]">
                          <th className="py-2 px-3">Nama Bank / Kas</th>
                          <th className="py-2 px-3">No. Rekening</th>
                          <th className="py-2 px-3">Atas Nama</th>
                          <th className="py-2 px-3 text-right">Saldo Terakhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {bankAccounts.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold">{b.bankName}</td>
                            <td className="py-1.5 px-3 font-mono">{b.accountNumber}</td>
                            <td className="py-1.5 px-3">{b.holderName}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">
                              {formatRp(b.currentBalance)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-600">
                          <td colSpan={3} className="py-2 px-3 text-right uppercase">
                            Total Saldo Kas & Bank Likuid:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-900 font-black text-sm">
                            {formatRp(totalCashAndBank)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB 9: PAJAK === */}
              {activeTab === "pajak" && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2.5 px-4">Pos Pajak & Kewajiban Fiskal</th>
                        <th className="py-2.5 px-4">Tarif</th>
                        <th className="py-2.5 px-4 text-right">Dasar Pengenaan Pajak (DPP)</th>
                        <th className="py-2.5 px-4 text-right">Estimasi Pajak Terutang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-2 px-4 font-bold">PPN Keluaran (Sewa Kamar & Layanan)</td>
                        <td className="py-2 px-4">11%</td>
                        <td className="py-2 px-4 text-right font-mono">{formatRp(totalIncome)}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-emerald-800">
                          {formatRp(Math.round(totalIncome * 0.11))}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-bold">PPN Masukan (Faktur Pajak Pembelian)</td>
                        <td className="py-2 px-4">11%</td>
                        <td className="py-2 px-4 text-right font-mono">{formatRp(totalExpense)}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-600">
                          ({formatRp(Math.round(totalExpense * 0.11))})
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={3} className="py-2 px-4 text-right">
                          PPN Kurang / (Lebih) Bayar:
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-rose-700 font-black">
                          {formatRp(Math.max(0, Math.round((totalIncome - totalExpense) * 0.11)))}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 font-bold">PPh Final Persewaan Properti (Pasal 4 Ayat 2)</td>
                        <td className="py-2 px-4">10% Final</td>
                        <td className="py-2 px-4 text-right font-mono">{formatRp(totalIncome)}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">
                          {formatRp(Math.round(totalIncome * 0.1))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* === DEFAULT / DASHBOARD / OTHER TABS === */}
              {(activeTab === "dashboard" ||
                activeTab === "pendapatan" ||
                activeTab === "pengeluaran" ||
                activeTab === "budget" ||
                activeTab === "closing") && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold text-[11px]">
                          <th className="py-2.5 px-4">Indikator Kunci Keuangan</th>
                          <th className="py-2.5 px-4 text-right">Nilai Nominal (IDR)</th>
                          <th className="py-2.5 px-4">Keterangan / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        <tr>
                          <td className="py-2 px-4 font-bold text-slate-900">Total Pendapatan (Revenue)</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatRp(totalIncome)}
                          </td>
                          <td className="py-2 px-4 text-slate-500">Pendapatan sewa kamar, amenitas, & utilitas</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-bold text-slate-900">Total Beban Usaha & OPEX</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-rose-700">
                            {formatRp(totalExpense)}
                          </td>
                          <td className="py-2 px-4 text-slate-500">Gaji, utilitas gedung, vendor, pemeliharaan</td>
                        </tr>
                        <tr className="bg-emerald-50 font-bold">
                          <td className="py-2 px-4 font-black text-emerald-950">Laba Kotor (Gross Profit)</td>
                          <td className="py-2 px-4 text-right font-mono font-black text-emerald-900">
                            {formatRp(grossProfit)}
                          </td>
                          <td className="py-2 px-4 text-emerald-700 font-bold">
                            Gross Margin: {totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                        <tr className="bg-emerald-100 font-bold border-y-2 border-emerald-600">
                          <td className="py-2.5 px-4 font-black text-emerald-950 text-sm">
                            Laba Bersih Tahun Berjalan (Net Profit)
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-950 text-base">
                            {formatRp(netProfit)}
                          </td>
                          <td className="py-2.5 px-4 text-emerald-900 font-bold">
                            Net Margin: {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-bold text-slate-900">Saldo Kas & Setara Kas Likuid</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-blue-700">
                            {formatRp(totalCashAndBank)}
                          </td>
                          <td className="py-2 px-4 text-slate-500">Total saldo pada 4 rekening operasional</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-bold text-slate-900">Piutang Usaha Tenant (AR)</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">
                            {formatRp(totalReceivables)}
                          </td>
                          <td className="py-2 px-4 text-slate-500">Tagihan invoice aktif yang belum lunas</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-bold text-slate-900">Hutang Usaha Vendor (AP)</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-purple-700">
                            {formatRp(totalPayables)}
                          </td>
                          <td className="py-2 px-4 text-slate-500">Kewajiban pembayaran supplier yang beredar</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 5. NOTES & COMPLIANCE DISCLAIMER */}
            <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 space-y-1">
              <p>
                <strong>Catatan Akuntansi:</strong> Laporan ini disajikan berdasarkan sistem pencatatan Akrual
                (Accrual Basis) sesuai Standar Akuntansi Keuangan Entitas Tanpa Akuntabilitas Publik (SAK ETAP) dan
                kebijakan internal properti. Dokumen ini sah dan mengikat untuk keperluan audit internal & perpajakan.
              </p>
            </div>

            {/* 6. OFFICIAL SIGNATURES SECTION */}
            <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-3 gap-4 text-center text-[11px]">
              <div>
                <p className="font-bold text-slate-800">Dibuat Oleh,</p>
                <p className="text-[10px] text-slate-400">Staff Akuntansi & Finance</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-slate-300 italic">[ Digital Sign: {printedBy} ]</span>
                </div>
                <p className="font-black text-slate-900 border-t border-slate-400 pt-1 mx-4">
                  ( {printedBy} )
                </p>
                <p className="text-[10px] text-slate-500">Finance Specialist</p>
              </div>

              <div>
                <p className="font-bold text-slate-800">Diperiksa Oleh,</p>
                <p className="text-[10px] text-slate-400">Accounting Supervisor</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-slate-300 italic">[ Digital Sign: Verified ]</span>
                </div>
                <p className="font-black text-slate-900 border-t border-slate-400 pt-1 mx-4">
                  ( Denny Prasetyo, S.E., Ak. )
                </p>
                <p className="text-[10px] text-slate-500">Head of Accounting</p>
              </div>

              <div>
                <p className="font-bold text-slate-800">Disetujui Oleh,</p>
                <p className="text-[10px] text-slate-400">Direktur Utama / Owner</p>
                <div className="h-16 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-slate-300 italic">[ Digital Sign: Approved ]</span>
                </div>
                <p className="font-black text-slate-900 border-t border-slate-400 pt-1 mx-4">
                  ( Sahrul Viona )
                </p>
                <p className="text-[10px] text-slate-500">Managing Director</p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS (NO-PRINT) */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format tabel, gridlines, dan penataan halaman telah dioptimalkan untuk kertas A4.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Unduh CSV
            </button>
            <button
              onClick={onExportExcel}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Format Excel (.xls)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
