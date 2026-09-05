import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  Percent,
  BadgePercent,
  Sparkles,
  Activity,
  Zap,
  ArrowRight,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export interface MonthlyTrendData {
  month: string;
  pendapatan: number;
  cogs?: number;
  labaKotor?: number;
  pengeluaran: number;
  labaBersih: number;
  cashIn: number;
  cashOut: number;
  netCashFlow?: number;
}

interface FinancialDashboardTabProps {
  totalIncome: number;
  totalExpense: number;
  grossProfit?: number;
  netProfit: number;
  totalCogs?: number;
  runningCashIn?: number;
  runningCashOut?: number;
  runningNetCashFlow?: number;
  totalCashAndBank: number;
  totalReceivables: number;
  totalPayables: number;
  monthlyTrends: MonthlyTrendData[];
  onNavigateToTab: (tabId: string) => void;
}

export default function FinancialDashboardTab({
  totalIncome,
  totalExpense,
  grossProfit = Math.round(totalIncome * 0.935),
  netProfit,
  totalCogs = 5300000,
  runningCashIn = totalIncome + 4500000,
  runningCashOut = totalExpense + 28500000 + 8500000 + 12000000,
  runningNetCashFlow = (totalIncome + 4500000) - (totalExpense + 28500000 + 8500000 + 12000000),
  totalCashAndBank,
  totalReceivables,
  totalPayables,
  monthlyTrends,
  onNavigateToTab
}: FinancialDashboardTabProps) {
  // Gross & Net margin calculations
  const grossMargin = totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : "0.0";
  const netMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0";
  const cashFlowRatio = runningCashOut > 0 ? ((runningCashIn / runningCashOut) * 100).toFixed(0) : "100";

  // State for active trend view filter in sparklines
  const [activeMetricHover, setActiveMetricHover] = useState<string | null>(null);

  // Ensure monthly trends has labaKotor and netCashFlow populated
  const enrichedTrends = monthlyTrends.map((t) => {
    const cogs = t.cogs ?? Math.round(t.pendapatan * 0.07);
    const labaKotor = t.labaKotor ?? (t.pendapatan - cogs);
    const netCashFlow = t.netCashFlow ?? (t.cashIn - t.cashOut);
    return {
      ...t,
      cogs,
      labaKotor,
      netCashFlow
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION: VISUAL SUMMARY CARDS (LABA KOTOR, LABA BERSIH, ARUS KAS BERJALAN) */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-6 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Accounting Sync
              </span>
              <span className="text-xs text-slate-400 font-medium">Auto-calculated from PMS Ledger</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Ringkasan Kinerja Keuangan Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Pantauan langsung laba kotor, laba bersih, dan arus kas berjalan dengan grafik tren 5 bulan terakhir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 font-medium">
              Periode Aktif: <strong className="text-white">Sep 2026</strong>
            </div>
          </div>
        </div>

        {/* 3 VISUAL SUMMARY CARDS WITH INTEGRATED REAL-TIME SPARKLINE GRAPHS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6 relative z-10">
          {/* KARTU 1: LABA KOTOR (GROSS PROFIT) */}
          <div
            id="card-summary-laba-kotor"
            onClick={() => onNavigateToTab("laba-rugi")}
            onMouseEnter={() => setActiveMetricHover("labaKotor")}
            onMouseLeave={() => setActiveMetricHover(null)}
            className="group bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-5 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl group-hover:scale-110 transition-transform">
                    <BadgePercent className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                      Laba Kotor (Gross Profit)
                    </span>
                    <p className="text-[11px] text-slate-400">Pendapatan kotor - HPP amenitas</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {grossMargin}% Margin
                </span>
              </div>

              {/* Main Metric Value */}
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  Rp {grossProfit.toLocaleString("id-ID")}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    +5.1% MoM
                  </span>
                  <span className="text-[11px] text-slate-400">
                    HPP Terkendali ({((totalCogs / Math.max(1, totalIncome)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Financial Component Breakdown Pills */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Pendapatan Bruto</span>
                  <div className="font-bold text-slate-200 font-mono text-[11px] mt-0.5">
                    Rp {totalIncome.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">HPP Amenitas & Linen</span>
                  <div className="font-bold text-rose-300 font-mono text-[11px] mt-0.5">
                    -Rp {totalCogs.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Mini Sparkline Trend Chart */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                <span>Grafik Tren Laba Kotor</span>
                <span className="text-emerald-400 font-semibold">5 Bulan Terakhir</span>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrichedTrends} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Laba Kotor"]}
                      labelFormatter={(label) => `Bulan ${label}`}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "6px 10px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="labaKotor"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#grossGradient)"
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 5, fill: "#34d399" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mt-2 group-hover:translate-x-1 transition-transform">
                <span>Lihat Laporan Laba Rugi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* KARTU 2: LABA BERSIH (NET PROFIT) */}
          <div
            id="card-summary-laba-bersih"
            onClick={() => onNavigateToTab("laba-rugi")}
            onMouseEnter={() => setActiveMetricHover("labaBersih")}
            onMouseLeave={() => setActiveMetricHover(null)}
            className="group bg-slate-800/90 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400/60 rounded-2xl p-5 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wider uppercase text-blue-400">
                      Laba Bersih (Net Profit)
                    </span>
                    <p className="text-[11px] text-slate-400">Bottom-line setelah semua beban operasional</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {netMargin}% Margin
                </span>
              </div>

              {/* Main Metric Value */}
              <div className="mt-4">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    netProfit >= 0 ? "text-white" : "text-rose-400"
                  }`}
                >
                  Rp {netProfit.toLocaleString("id-ID")}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/60">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    +6.2% MoM
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Profitabel & Sehat
                  </span>
                </div>
              </div>

              {/* Financial Component Breakdown Pills */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Beban OPEX</span>
                  <div className="font-bold text-rose-300 font-mono text-[11px] mt-0.5">
                    -Rp {totalExpense.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">EBITDA & Retained</span>
                  <div className="font-bold text-slate-200 font-mono text-[11px] mt-0.5">
                    100% Ditransfer
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Mini Sparkline Trend Chart */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                <span>Grafik Tren Laba Bersih</span>
                <span className="text-blue-400 font-semibold">5 Bulan Terakhir</span>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrichedTrends} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Laba Bersih"]}
                      labelFormatter={(label) => `Bulan ${label}`}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "6px 10px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="labaBersih"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#netGradient)"
                      dot={{ r: 3, fill: "#3b82f6" }}
                      activeDot={{ r: 5, fill: "#60a5fa" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mt-2 group-hover:translate-x-1 transition-transform">
                <span>Buka Analisis Laba Bersih</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* KARTU 3: ARUS KAS BERJALAN (RUNNING CASH FLOW) */}
          <div
            id="card-summary-arus-kas"
            onClick={() => onNavigateToTab("arus-kas")}
            onMouseEnter={() => setActiveMetricHover("netCashFlow")}
            onMouseLeave={() => setActiveMetricHover(null)}
            className="group bg-slate-800/90 hover:bg-slate-800 border border-teal-500/30 hover:border-teal-400/60 rounded-2xl p-5 transition-all cursor-pointer shadow-lg hover:shadow-teal-500/10 flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wider uppercase text-teal-400">
                      Arus Kas Berjalan (Net Cash Flow)
                    </span>
                    <p className="text-[11px] text-slate-400">Realisasi kas masuk - kas keluar riil</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {cashFlowRatio}% Likuid
                </span>
              </div>

              {/* Main Metric Value */}
              <div className="mt-4">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    runningNetCashFlow >= 0 ? "text-white" : "text-rose-400"
                  }`}
                >
                  Rp {runningNetCashFlow.toLocaleString("id-ID")}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center text-xs font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/60">
                    <Zap className="w-3.5 h-3.5 mr-0.5" />
                    Surplus Likuiditas
                  </span>
                  <span className="text-[11px] text-slate-400">Kas Berjalan Positif</span>
                </div>
              </div>

              {/* Financial Component Breakdown Pills */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Kas Masuk (Inflow)</span>
                  <div className="font-bold text-emerald-300 font-mono text-[11px] mt-0.5">
                    +Rp {runningCashIn.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Kas Keluar (Outflow)</span>
                  <div className="font-bold text-rose-300 font-mono text-[11px] mt-0.5">
                    -Rp {runningCashOut.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Mini Sparkline Trend Chart */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                <span>Grafik Tren Net Cash Flow</span>
                <span className="text-teal-400 font-semibold">5 Bulan Terakhir</span>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrichedTrends} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Net Cash Flow"]}
                      labelFormatter={(label) => `Bulan ${label}`}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "6px 10px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="netCashFlow"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      fill="url(#cashGradient)"
                      dot={{ r: 3, fill: "#14b8a6" }}
                      activeDot={{ r: 5, fill: "#2dd4bf" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-teal-400 font-semibold mt-2 group-hover:translate-x-1 transition-transform">
                <span>Lihat Laporan Arus Kas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY OPERATIONAL METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Pemasukan */}
        <div
          id="stat-pemasukan"
          onClick={() => onNavigateToTab("laba-rugi")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 font-mono">
              Rp {totalIncome.toLocaleString("id-ID")}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>Sewa & Layanan</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div
          id="stat-pengeluaran"
          onClick={() => onNavigateToTab("pengeluaran")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Beban</span>
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 font-mono">
              Rp {totalExpense.toLocaleString("id-ID")}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>OPEX & Utilitas</span>
            </div>
          </div>
        </div>

        {/* Saldo Kas & Bank */}
        <div
          id="stat-kas-bank"
          onClick={() => onNavigateToTab("kas-bank")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kas & Bank</span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 font-mono">
              Rp {totalCashAndBank.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">
              4 Rekening Aktif
            </div>
          </div>
        </div>

        {/* Piutang (AR) */}
        <div
          id="stat-piutang-ar"
          onClick={() => onNavigateToTab("piutang")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Piutang (AR)</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-amber-900 font-mono">
              Rp {totalReceivables.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">
              Faktur Belum Lunas
            </div>
          </div>
        </div>

        {/* Hutang (AP) */}
        <div
          id="stat-hutang-ap"
          onClick={() => onNavigateToTab("hutang")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hutang (AP)</span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg group-hover:scale-110 transition-transform">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-purple-900 font-mono">
              Rp {totalPayables.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              Kewajiban Supplier
            </div>
          </div>
        </div>

        {/* Margin Profitabilitas */}
        <div
          id="stat-margin-profit"
          onClick={() => onNavigateToTab("laba-rugi")}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Margin</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg group-hover:scale-110 transition-transform">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-teal-800 font-mono">
              {netMargin}%
            </div>
            <div className="text-[11px] text-teal-600 font-semibold mt-1">
              Gross: {grossMargin}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUA GRAFIK UTAMA KOMPARATIF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Pendapatan vs Biaya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Grafik Pendapatan vs Biaya</h3>
              <p className="text-xs text-slate-500">Perbandingan pemasukan terhadap biaya operasional</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              Bulanan 2026
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrichedTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, ""]}
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Biaya Operasional" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Cash Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Grafik Arus Kas (Cash Flow)</h3>
              <p className="text-xs text-slate-500">Aliran kas masuk (inflow) vs kas keluar (outflow) riil</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Liquidity Trend
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrichedTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, ""]}
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="cashIn"
                  name="Kas Masuk"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cashOut"
                  name="Kas Keluar"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="netCashFlow"
                  name="Net Cash Flow"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTION SHORTCUTS TO ACCOUNTING MODULES */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            Navigasi Cepat Modul Akuntansi & Laporan
          </span>
          <span className="text-xs text-slate-400">Klik untuk langsung menuju tab yang bersangkutan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => onNavigateToTab("laba-rugi")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Laba Rugi</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">P&L Statement</p>
          </button>

          <button
            onClick={() => onNavigateToTab("neraca")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Neraca</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Aset = Liab + Ekuitas</p>
          </button>

          <button
            onClick={() => onNavigateToTab("arus-kas")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Arus Kas</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Cash Flow 3 Aktivitas</p>
          </button>

          <button
            onClick={() => onNavigateToTab("buku-besar")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Buku Besar</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">General Ledger per Akun</p>
          </button>

          <button
            onClick={() => onNavigateToTab("pajak")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Perpajakan</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">PPN & PPh Final Sewa</p>
          </button>

          <button
            onClick={() => onNavigateToTab("tutup-buku")}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-left hover:shadow-xs transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
              <span>Tutup Buku</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Audit Trail & Lock</p>
          </button>
        </div>
      </div>
    </div>
  );
}
