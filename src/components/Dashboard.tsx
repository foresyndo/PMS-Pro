import React, { useState } from "react";
import {
  Building,
  Home,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  FileText
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Property, Unit, Invoice, Expense, MaintenanceTicket } from "../types";

interface DashboardProps {
  properties: Property[];
  units: Unit[];
  invoices: Invoice[];
  expenses: Expense[];
  maintenance: MaintenanceTicket[];
}

export default function Dashboard({
  properties,
  units,
  invoices,
  expenses,
  maintenance
}: DashboardProps) {
  const [aiReportType, setAiReportType] = useState<"occupancy" | "finance" | "maintenance" | "">("");
  const [aiResult, setAiResult] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Financial calculations
  const totalRevenue = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalReceivables = invoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  // Occupancy metrics
  const totalUnitsCount = units.length;
  const occupiedUnitsCount = units.filter((u) => u.status === "Occupied").length;
  const availableUnitsCount = units.filter((u) => u.status === "Available").length;
  const maintenanceUnitsCount = units.filter((u) => u.status === "Maintenance").length;
  const cleaningUnitsCount = units.filter((u) => u.status === "Cleaning").length;
  const reservedUnitsCount = units.filter((u) => u.status === "Reserved").length;

  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Recharts Data Mapping
  // Monthly Cashflow data template
  const cashflowData = [
    { name: "Jan", Pendapatan: totalRevenue * 0.7, Pengeluaran: totalExpense * 0.8 },
    { name: "Feb", Pendapatan: totalRevenue * 0.85, Pengeluaran: totalExpense * 0.9 },
    { name: "Mar", Pendapatan: totalRevenue * 0.82, Pengeluaran: totalExpense * 0.75 },
    { name: "Apr", Pendapatan: totalRevenue * 0.9, Pengeluaran: totalExpense * 0.85 },
    { name: "Mei", Pendapatan: totalRevenue * 0.95, Pengeluaran: totalExpense * 0.9 },
    { name: "Jun (Aktif)", Pendapatan: totalRevenue, Pengeluaran: totalExpense }
  ];

  const pieData = [
    { name: "Terisi (Occupied)", value: occupiedUnitsCount, color: "#16a34a" }, // green-600
    { name: "Tersedia (Available)", value: availableUnitsCount, color: "#10b981" }, // emerald-500
    { name: "Reserved", value: reservedUnitsCount, color: "#f59e0b" }, // amber-500
    { name: "Maintenance", value: maintenanceUnitsCount, color: "#ef4444" }, // red-500
    { name: "Cleaning", value: cleaningUnitsCount, color: "#3b82f6" } // blue-500
  ].filter(item => item.value > 0);

  // Handle server-side AI Analysis call
  const triggerAiAnalysis = async (type: "occupancy" | "finance" | "maintenance") => {
    setAiReportType(type);
    setLoadingAi(true);
    setAiResult("");

    // Package the active database state
    const databaseContext = {
      properties: properties.map((p) => ({ name: p.name, type: p.type, address: p.address })),
      unitsSummary: {
        total: totalUnitsCount,
        occupied: occupiedUnitsCount,
        available: availableUnitsCount,
        maintenance: maintenanceUnitsCount,
        cleaning: cleaningUnitsCount,
        reserved: reservedUnitsCount,
        ratePercent: occupancyRate
      },
      currentFinance: {
        revenueTotal: totalRevenue,
        expenseTotal: totalExpense,
        receivablesOwed: totalReceivables,
        netProfitResult: netProfit
      },
      recentExpenses: expenses.map((e) => ({ category: e.category, amount: e.amount, date: e.expenseDate, desc: e.description })),
      maintenanceTickets: maintenance.map((m) => ({ problem: m.description, priority: m.priority, status: m.status }))
    };

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          promptType: type,
          reportData: databaseContext
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiResult(data.analysis);
      } else {
        setAiResult(`### ⚠️ Terjadi Kesalahan\n\nGagal memproses data: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiResult(`### ⚠️ Hubungan Gagal\n\nKoneksi server terganggu: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-main-view">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="px-3 py-1 bg-white/20 text-xs font-semibold rounded-full inline-block backdrop-blur-md">
            PMS Enterprise v2.0
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang di PMS Pro
          </h1>
          <p className="text-green-50 text-sm md:text-base max-w-xl">
            Sistem ERP Real-time Property Management Terintegrasi untuk Hotel, Boarding House, Apartemen, dan Villa Anda.
          </p>
        </div>
        
        {/* Quick Insights Action Component */}
        <div className="flex gap-2">
          <button
            onClick={() => triggerAiAnalysis("occupancy")}
            className="px-4 py-2 bg-white text-emerald-700 font-semibold text-xs md:text-sm rounded-xl shadow-md hover:bg-green-50 transition duration-300 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 animate-pulse stroke-emerald-600" />
            AI Optimasi Okupansi
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Properties */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Properti</p>
            <p className="text-lg md:text-2xl font-bold text-gray-800">{properties.length}</p>
          </div>
        </div>

        {/* Total Rooms / Units Status */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Unit Terisi/Total</p>
            <p className="text-lg md:text-2xl font-bold text-gray-800">
              {occupiedUnitsCount} <span className="text-sm text-gray-400">/ {totalUnitsCount}</span>
            </p>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Okupansi Rate</p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg md:text-2xl font-bold text-gray-800">{occupancyRate}%</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">Tinggi</span>
            </div>
          </div>
        </div>

        {/* Net Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition duration-300">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Pendapatan Bersih</p>
            <p className="text-sm md:text-lg font-bold text-emerald-600">
              {formatIDR(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Multi financial micro KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase">Pendapatan Kotor</p>
            <p className="text-lg font-bold text-indigo-900">{formatIDR(totalRevenue)}</p>
          </div>
          <p className="text-xs text-emerald-600 bg-emerald-55 py-1 px-2 rounded-lg font-bold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +14.2%
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Pengeluaran</p>
            <p className="text-lg font-bold text-red-700">{formatIDR(totalExpense)}</p>
          </div>
          <p className="text-xs text-red-600 bg-red-55 py-1 px-2 rounded-lg font-bold flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> -5.8%
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Piutang</p>
            <p className="text-lg font-bold text-amber-600">{formatIDR(totalReceivables)}</p>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 py-1 px-2 rounded-lg font-bold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Jatuh Tempo
          </p>
        </div>
      </div>

      {/* AI Assistant Insight Dashboard Box (Expanded directly inside page) */}
      {aiReportType && (
        <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-sm animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500 text-white rounded-lg">
                <Sparkles className="h-5 w-5 animate-spin-slow" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">PMS Pro AI Analyst</h3>
                <p className="text-xs text-slate-500">Hasil Rekomendasi Pintar Berbahasa Indonesia</p>
              </div>
            </div>
            <button
              onClick={() => setAiReportType("")}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-slate-700 text-xs rounded-lg transition"
            >
              Selesai & Tutup
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-inner max-h-96 overflow-y-auto min-h-36">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600 animate-pulse">
                  Gemini sedang menganalisa data finansial dan rasio okupansi properti...
                </p>
              </div>
            ) : (
              <div className="prose prose-emerald max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
                {aiResult.split("\n").map((line, idx) => {
                  if (line.startsWith("###")) {
                    return <h4 key={idx} className="text-lg font-bold text-emerald-800 mt-4 mb-2">{line.replace("###", "")}</h4>;
                  }
                  if (line.startsWith("**")) {
                    return <p key={idx} className="font-semibold text-slate-900 mt-2">{line}</p>;
                  }
                  if (line.startsWith("-")) {
                    return <li key={idx} className="ml-4 list-disc text-slate-700">{line.replace("-", "").trim()}</li>;
                  }
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 self-center">Pertanyaan Alternatif:</span>
            <button
              onClick={() => triggerAiAnalysis("occupancy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 ${
                aiReportType === "occupancy" ? "bg-emerald-600 text-white" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              }`}
            >
              Rekomendasi Harga & Okupansi
            </button>
            <button
              onClick={() => triggerAiAnalysis("finance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 ${
                aiReportType === "finance" ? "bg-emerald-600 text-white" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              }`}
            >
              Kebocoran & Rasio Arus Kas
            </button>
            <button
              onClick={() => triggerAiAnalysis("maintenance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 ${
                aiReportType === "maintenance" ? "bg-emerald-600 text-white" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              }`}
            >
              Penjadwalan Preventif Aset
            </button>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Flow Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-800">Evaluasi Cashflow Semester I</h2>
              <p className="text-xs text-gray-400">Arus Pendapatan (Paid Invoices) vs Arus Pengeluaran (Expenses)</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cashflowData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(value) => formatIDR(value as number)} />
                <Area
                  type="monotone"
                  dataKey="Pendapatan"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Status Split Representation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Status Alokasi Kamar</h2>
            <p className="text-xs text-gray-400">Proporsi kondisi ketersediaan unit real-time</p>
          </div>
          
          <div className="h-44 my-4 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-650">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value} Unit</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Operational Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Maintenance urgent */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-850">Tiket Pemeliharaan Terkini</h3>
            <span className="text-xs text-red-650 bg-red-50 px-2 py-0.5 rounded-full font-bold">Paling Penting</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {maintenance.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Unit ID: {item.unitId}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-bold text-[10px] ${
                        item.priority === "High" || item.priority === "Critical"
                          ? "bg-red-100 text-red-800"
                          : item.priority === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-500 line-clamp-1">{item.description}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-xl font-semibold text-[11px] ${
                    item.status === "Open"
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                      : item.status === "Process"
                      ? "bg-cyan-50 text-cyan-600 border border-cyan-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
            {maintenance.length === 0 && (
              <p className="text-xs text-gray-400 py-4 text-center">Tidak ada laporan maintenance aktif</p>
            )}
          </div>
        </div>

        {/* Occupancy recommendation and insight matrix card */}
        <div className="bg-emerald-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="bg-white/10 w-32 h-32 rounded-full absolute -right-10 -bottom-10 blur-xl" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest font-bold bg-emerald-85 py-1 px-2.5 rounded-full">Rekomendasi Pintar</span>
              <h3 className="text-lg font-bold mt-2">Pemberitahuan Kontrak Jatuh Tempo</h3>
            </div>
            <span className="p-2 bg-white/20 rounded-xl"><Calendar className="h-5 w-5" /></span>
          </div>

          <div className="my-4 text-sm text-green-100">
            <p className="leading-relaxed">
              Terdapat **2 kontrak tenant** yang akan habis masa berlakunya dalam waktu **30 hari ke depan**. 
              Segera kirim proposal perpanjangan otomatis dengan digital sign terpadu.
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-white/60">Selesai diperiksa: {new Date().toLocaleDateString("id-ID")}</span>
            <span className="text-xs font-bold underline hover:text-green-200 cursor-pointer">Periksa Kontrak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
