import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  User,
  CheckCircle,
  FilePlus,
  Clock,
  Check,
  XCircle,
  Calendar,
  Layers,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  BedDouble,
  Building,
  Sparkles,
  DollarSign,
  Info,
  X,
  ExternalLink,
  Percent,
  CalendarCheck,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import {
  Reservation,
  Tenant,
  Unit,
  Property,
  ReservationStatus,
  PaymentStatus,
  UnitStatus
} from "../types";

interface BookingModuleProps {
  reservations: Reservation[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onAddReservation: (res: Reservation) => void;
  onUpdateReservation: (res: Reservation) => void;
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];

const DAY_NAMES_SHORT_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function BookingModule({
  reservations,
  tenants,
  units,
  properties,
  onAddReservation,
  onUpdateReservation
}: BookingModuleProps) {
  // Current real-world date context (defaults to current date: September 4, 2026)
  const todayObj = useMemo(() => new Date(), []);
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth() + 1; // 1-12
  const todayDay = todayObj.getDate();
  const todayFormatted = `${todayYear}-${String(todayMonth).padStart(2, "0")}-${String(todayDay).padStart(2, "0")}`;

  // Interactive Planner Date States - default to latest date/month/year
  const [selectedYear, setSelectedYear] = useState<number>(todayYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayMonth); // 1-12
  const [viewMode, setViewMode] = useState<"month" | "two-weeks" | "week">("month");

  // Filter States
  const [filterPropertyId, setFilterPropertyId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Selection States
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Pre-Booking Form States (defaulting to latest current date)
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [selectedPropId, setSelectedPropId] = useState(properties[0]?.id || "");
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [checkInDate, setCheckInDate] = useState(todayFormatted);
  const [checkOutDate, setCheckOutDate] = useState(
    () => {
      const nextDay = new Date(todayYear, todayMonth - 1, todayDay + 3);
      return `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;
    }
  );
  const [deposit, setDeposit] = useState(500000);
  const [totalPrice, setTotalPrice] = useState(1500000);
  const [status, setStatus] = useState<ReservationStatus>("Confirmed");

  // Quick navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setSelectedYear(todayYear);
    setSelectedMonth(todayMonth);
  };

  // Compute days in the active month
  const totalDaysInSelectedMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Generate date array based on viewMode
  const displayedDays = useMemo(() => {
    const allDays = Array.from({ length: totalDaysInSelectedMonth }, (_, i) => i + 1);

    if (viewMode === "month") {
      return allDays;
    }

    if (viewMode === "two-weeks") {
      // Show 14 days around today if in same month, or first 14 days
      if (selectedYear === todayYear && selectedMonth === todayMonth) {
        const start = Math.max(1, Math.min(todayDay - 2, totalDaysInSelectedMonth - 13));
        return Array.from({ length: Math.min(14, totalDaysInSelectedMonth - start + 1) }, (_, i) => start + i);
      }
      return allDays.slice(0, 14);
    }

    if (viewMode === "week") {
      // Show 7 days
      if (selectedYear === todayYear && selectedMonth === todayMonth) {
        const start = Math.max(1, Math.min(todayDay - 1, totalDaysInSelectedMonth - 6));
        return Array.from({ length: Math.min(7, totalDaysInSelectedMonth - start + 1) }, (_, i) => start + i);
      }
      return allDays.slice(0, 7);
    }

    return allDays;
  }, [viewMode, selectedYear, selectedMonth, totalDaysInSelectedMonth, todayYear, todayMonth, todayDay]);

  // Filtered units list
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchProperty = filterPropertyId === "all" || u.propertyId === filterPropertyId;
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      const matchSearch =
        searchQuery.trim() === "" ||
        u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProperty && matchStatus && matchSearch;
    });
  }, [units, filterPropertyId, filterStatus, searchQuery]);

  // Quick lookup helper: find reservation for a unit on a specific day
  const getReservationForDay = (targetUnitId: string, day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reservations.find(res => {
      if (res.unitId !== targetUnitId) return false;
      if (res.status === "Cancelled") return false;
      return dateStr >= res.checkInDate && dateStr <= res.checkOutDate;
    });
  };

  // Occupancy metrics calculation for the active month
  const occupancyMetrics = useMemo(() => {
    const activeUnits = filterPropertyId === "all" ? units : units.filter(u => u.propertyId === filterPropertyId);
    const totalRooms = activeUnits.length;
    if (totalRooms === 0) {
      return {
        totalRooms: 0,
        occupancyRate: 0,
        occupiedToday: 0,
        reservedThisMonth: 0,
        availableToday: 0,
        maintenanceCount: 0
      };
    }

    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const monthStart = `${monthPrefix}-01`;
    const monthEnd = `${monthPrefix}-${String(totalDaysInSelectedMonth).padStart(2, "0")}`;

    // Reservations intersecting this month
    const relevantReservations = reservations.filter(r => {
      if (r.status === "Cancelled") return false;
      if (filterPropertyId !== "all" && r.propertyId !== filterPropertyId) return false;
      return r.checkInDate <= monthEnd && r.checkOutDate >= monthStart;
    });

    // Calculate room nights occupied
    let totalRoomNightsOccupied = 0;
    const totalPossibleRoomNights = totalRooms * totalDaysInSelectedMonth;

    for (let d = 1; d <= totalDaysInSelectedMonth; d++) {
      const dStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const occupiedOnD = activeUnits.filter(u => {
        return relevantReservations.some(
          r => r.unitId === u.id && dStr >= r.checkInDate && dStr <= r.checkOutDate
        );
      }).length;
      totalRoomNightsOccupied += occupiedOnD;
    }

    const occupancyRate = totalPossibleRoomNights > 0
      ? Math.round((totalRoomNightsOccupied / totalPossibleRoomNights) * 100)
      : 0;

    // Today status
    const isViewingCurrentMonth = selectedYear === todayYear && selectedMonth === todayMonth;
    const targetCheckDate = isViewingCurrentMonth ? todayFormatted : `${monthPrefix}-01`;

    const occupiedCount = activeUnits.filter(u => {
      return relevantReservations.some(
        r => r.unitId === u.id && targetCheckDate >= r.checkInDate && targetCheckDate <= r.checkOutDate
      );
    }).length;

    const maintenanceCount = activeUnits.filter(u => u.status === "Maintenance" || u.status === "Cleaning").length;
    const availableCount = Math.max(0, totalRooms - occupiedCount - maintenanceCount);

    return {
      totalRooms,
      occupancyRate,
      occupiedToday: occupiedCount,
      reservedThisMonth: relevantReservations.length,
      availableToday: availableCount,
      maintenanceCount
    };
  }, [units, reservations, filterPropertyId, selectedYear, selectedMonth, totalDaysInSelectedMonth, todayYear, todayMonth, todayFormatted]);

  // Click empty cell to quickly open booking form for that unit and date
  const handleCellClick = (unit: Unit, day: number) => {
    const existing = getReservationForDay(unit.id, day);
    if (existing) {
      setSelectedReservation(existing);
    } else {
      // Empty cell: Quick Pre-Booking
      const clickedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayAfter = new Date(selectedYear, selectedMonth - 1, day + 2);
      const clickedEnd = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, "0")}-${String(dayAfter.getDate()).padStart(2, "0")}`;

      setSelectedPropId(unit.propertyId);
      setUnitId(unit.id);
      setCheckInDate(clickedDate);
      setCheckOutDate(clickedEnd);
      setTotalPrice(unit.price * 2);
      setShowAddForm(true);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !unitId) {
      alert("Penyewa, properti induk dan Nomor unit ketersediaan wajib ditentukan!");
      return;
    }

    if (checkOutDate <= checkInDate) {
      alert("Tanggal check-out harus setelah tanggal check-in!");
      return;
    }

    const newRes: Reservation = {
      id: "res-" + Date.now().toString(),
      tenantId,
      propertyId: selectedPropId,
      unitId,
      checkInDate,
      checkOutDate,
      deposit: Number(deposit),
      totalPrice: Number(totalPrice),
      paymentStatus: "Unpaid",
      status,
      createdAt: new Date().toISOString()
    };

    onAddReservation(newRes);
    setShowAddForm(false);
  };

  const getStatusBadge = (s: ReservationStatus) => {
    switch (s) {
      case "Checked In":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Checked Out":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getReservationColorClass = (s: ReservationStatus) => {
    switch (s) {
      case "Checked In":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs";
      case "Confirmed":
        return "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs";
      case "Pending":
        return "bg-amber-500 hover:bg-amber-600 text-white shadow-xs";
      case "Checked Out":
        return "bg-slate-500 hover:bg-slate-600 text-white";
      case "Cancelled":
        return "bg-rose-500 text-white line-through opacity-60";
      default:
        return "bg-blue-600 text-white";
    }
  };

  const updateStatus = (res: Reservation, next: ReservationStatus) => {
    onUpdateReservation({ ...res, status: next });
    if (selectedReservation && selectedReservation.id === res.id) {
      setSelectedReservation({ ...selectedReservation, status: next });
    }
  };

  const getPropertyName = (pId: string) => {
    const found = properties.find(p => p.id === pId);
    return found ? found.name : "Properti Tidak Dikenal";
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper WhatsApp direct link
  const getWhatsAppLink = (res: Reservation) => {
    const tenant = tenants.find(t => t.id === res.tenantId);
    const unit = units.find(u => u.id === res.unitId);
    const prop = properties.find(p => p.id === res.propertyId);
    if (!tenant?.phone) return "#";
    let cleanPhone = tenant.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${tenant.name},\nKami dari Manajemen ${prop?.name || "Forsdig PMS Pro"}.\n\nKonfirmasi Reservasi:\n• Kamar: ${unit?.unitNumber || "-"}\n• Check-In: ${res.checkInDate}\n• Check-Out: ${res.checkOutDate}\n• Total Biaya: ${formatIDR(res.totalPrice)}\n• Status: ${res.status}\n\nMohon konfirmasi kesiapan kedatangan Anda. Terima kasih!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER UTAMA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Real-Time Planner
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Hari Ini: {todayDay} {MONTH_NAMES_ID[todayMonth - 1]} {todayYear}
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-emerald-600" />
            PMS Room Occupancy Planner
          </h2>
          <p className="text-xs text-slate-500">
            Jadwal visual ketersediaan kamar, status reservasi real-time, dan pemetaan check-in/check-out harian
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Lompat ke tanggal & bulan hari ini"
          >
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
            <span>Hari Ini ({todayDay} {MONTH_NAMES_ID[todayMonth - 1].slice(0, 3)})</span>
          </button>

          <button
            onClick={() => {
              // Pre-fill with current date
              setCheckInDate(todayFormatted);
              const dayPlus = new Date(todayYear, todayMonth - 1, todayDay + 2);
              setCheckOutDate(`${dayPlus.getFullYear()}-${String(dayPlus.getMonth() + 1).padStart(2, "0")}-${String(dayPlus.getDate()).padStart(2, "0")}`);
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer ml-auto lg:ml-0"
          >
            <FilePlus className="h-4 w-4" />
            <span>Booking Baru</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Okupansi</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {occupancyMetrics.occupancyRate}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Bulan {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Terisi (In-House)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {occupancyMetrics.occupiedToday} <span className="text-xs font-semibold text-slate-400">/ {occupancyMetrics.totalRooms}</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Kamar aktif terisi
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reservasi Masuk</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {occupancyMetrics.reservedThisMonth}
          </div>
          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
            Total booking bulan ini
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Siap Huni</span>
            <BedDouble className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {occupancyMetrics.availableToday}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Kamar kosong tersedia
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Maintenance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {occupancyMetrics.maintenanceCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Perbaikan / Cleaning
          </p>
        </div>
      </div>

      {/* PLANNER CONTROLS & FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Month & Year Stepper */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                aria-label="Pilih Bulan Occupancy Planner"
                className="bg-transparent text-xs font-black text-slate-800 px-2 py-1 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES_ID.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Pilih Tahun Occupancy Planner"
                className="bg-transparent text-xs font-black text-slate-800 px-2 py-1 focus:outline-none cursor-pointer border-l border-slate-200"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === "month"
                    ? "bg-white text-emerald-700 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                1 Bulan Penuh
              </button>
              <button
                onClick={() => setViewMode("two-weeks")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === "two-weeks"
                    ? "bg-white text-emerald-700 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                14 Hari
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === "week"
                    ? "bg-white text-emerald-700 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                7 Hari
              </button>
            </div>
          </div>

          {/* Filters: Property & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterPropertyId}
                onChange={(e) => setFilterPropertyId(e.target.value)}
                aria-label="Filter berdasarkan Properti"
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Properti ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter status kamar"
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Available">Tersedia (Available)</option>
                <option value="Occupied">Terisi (Occupied)</option>
                <option value="Reserved">Terjadwal (Reserved)</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kamar / tipe..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap text-[11px] text-slate-500">
          <div className="flex items-center gap-3 flex-wrap font-medium">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-600 block" /> Checked In (Aktif)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-600 block" /> Confirmed (Pasti)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 block" /> Pending (Menunggu DP)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-500 block" /> Checked Out
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-dashed border-slate-300 bg-white block" /> Kosong (Klik untuk Booking)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              Kolom Berwarna = Hari Ini ({todayDay} {MONTH_NAMES_ID[todayMonth - 1].slice(0, 3)} {todayYear})
            </span>
          </div>
        </div>
      </div>

      {/* PLANNER TIMELINE GRID */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full border-collapse select-none">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-30 shadow-xs">
                <th className="p-3 text-left border-r border-slate-200 sticky left-0 bg-slate-100 min-w-44 z-40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 font-black text-xs">Daftar Kamar / Unit</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({filteredUnits.length} Unit)
                    </span>
                  </div>
                </th>

                {displayedDays.map((day) => {
                  const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                  const dayOfWeek = dateObj.getDay();
                  const dayName = DAY_NAMES_SHORT_ID[dayOfWeek];
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isToday =
                    selectedYear === todayYear &&
                    selectedMonth === todayMonth &&
                    day === todayDay;

                  return (
                    <th
                      key={day}
                      className={`p-1.5 px-2 border-r border-slate-200 text-center min-w-10 transition-colors ${
                        isToday
                          ? "bg-emerald-500 text-white font-black ring-2 ring-emerald-400 z-20"
                          : isWeekend
                          ? "bg-slate-100/90 text-rose-600"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-wider">{dayName}</div>
                      <div className={`text-xs ${isToday ? "font-black scale-110" : "font-bold"}`}>
                        {day}
                      </div>
                      {isToday && (
                        <div className="text-[7px] uppercase font-black tracking-tighter bg-white text-emerald-700 px-1 rounded mt-0.5">
                          Kini
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayedDays.length + 1}
                    className="p-12 text-center text-slate-400 text-xs"
                  >
                    Tidak ada unit kamar yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((room) => {
                  const roomProperty = properties.find((p) => p.id === room.propertyId);

                  return (
                    <tr
                      key={room.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-xs group"
                    >
                      {/* Sticky Room Label on the Left */}
                      <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-white sticky left-0 z-20 shadow-xs group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-800 text-xs truncate flex items-center gap-1.5">
                              <span>No. {room.unitNumber}</span>
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  room.status === "Occupied"
                                    ? "bg-emerald-500"
                                    : room.status === "Reserved"
                                    ? "bg-blue-500"
                                    : room.status === "Maintenance"
                                    ? "bg-rose-500"
                                    : room.status === "Cleaning"
                                    ? "bg-sky-500"
                                    : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-36">
                              {room.type} • Lt.{room.floor}
                            </div>
                            <div className="text-[9px] text-emerald-600 font-bold truncate max-w-36">
                              {roomProperty?.name || "Properti"}
                            </div>
                          </div>

                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium text-slate-500 bg-slate-100">
                            {formatIDR(room.price).replace(",00", "")}
                          </span>
                        </div>
                      </td>

                      {/* Day Columns */}
                      {displayedDays.map((day) => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const reservation = getReservationForDay(room.id, day);
                        const isCheckInStart = reservation?.checkInDate === dateStr;
                        const isCheckOutEnd = reservation?.checkOutDate === dateStr;

                        const isToday =
                          selectedYear === todayYear &&
                          selectedMonth === todayMonth &&
                          day === todayDay;

                        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                        const dayOfWeek = dateObj.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        const tenant = reservation ? tenants.find((t) => t.id === reservation.tenantId) : null;

                        return (
                          <td
                            key={day}
                            onClick={() => handleCellClick(room, day)}
                            className={`p-0.5 border-r border-slate-100 min-w-10 h-12 relative transition-colors cursor-pointer ${
                              isToday ? "bg-emerald-50/40" : isWeekend ? "bg-slate-50/50" : ""
                            } hover:bg-emerald-50/80`}
                            title={
                              reservation
                                ? `Tamu: ${tenant?.name || "Penyewa"} (${reservation.status}) | CheckIn: ${reservation.checkInDate} s/d ${reservation.checkOutDate}`
                                : `Kamar ${room.unitNumber} Kosong (${day} ${MONTH_NAMES_ID[selectedMonth - 1]}). Klik untuk Reservasi Cepat.`
                            }
                          >
                            {reservation ? (
                              <div
                                className={`h-10 w-full rounded-md p-1 text-[8px] font-bold leading-tight flex flex-col justify-center transition-transform hover:scale-102 cursor-pointer ${getReservationColorClass(
                                  reservation.status
                                )} ${
                                  isCheckInStart ? "rounded-l-lg border-l-2 border-white/50" : ""
                                } ${isCheckOutEnd ? "rounded-r-lg border-r-2 border-white/50" : ""}`}
                              >
                                {isCheckInStart ? (
                                  <div className="truncate font-black">
                                    ▶ {tenant?.name ? tenant.name.split(" ")[0] : "Tamu"}
                                  </div>
                                ) : (
                                  <div className="truncate text-[7px] opacity-90">
                                    {tenant?.name ? tenant.name.split(" ")[0] : "•"}
                                  </div>
                                )}
                                <div className="text-[7px] truncate opacity-80 font-mono">
                                  {reservation.status === "Checked In" ? "In-House" : reservation.status}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-slate-400 font-extrabold text-xs">
                                +
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL RESERVATION MODAL / POPUP */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  Detail Kartu Reservasi
                </span>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  ID: {selectedReservation.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReservation(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Tenant info */}
              {(() => {
                const t = tenants.find((item) => item.id === selectedReservation.tenantId);
                const u = units.find((item) => item.id === selectedReservation.unitId);
                const p = properties.find((item) => item.id === selectedReservation.propertyId);

                return (
                  <>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tamu / Penyewa</span>
                          <h4 className="text-sm font-black text-slate-800">{t?.name || "Tamu Tidak Dikenal"}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">{t?.phone || "No HP Kosong"}</p>
                          {t?.email && <p className="text-[11px] text-slate-500">{t.email}</p>}
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(
                            selectedReservation.status
                          )}`}
                        >
                          {selectedReservation.status}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">NIK/KTP: {t?.ktpNumber || "-"}</span>
                        <span className="text-slate-500">Profesi: {t?.jobTitle || "-"}</span>
                      </div>
                    </div>

                    {/* Room & Stay dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                          Unit & Properti
                        </span>
                        <div className="text-sm font-black text-emerald-950">
                          Kamar {u?.unitNumber || "-"}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium">
                          {p?.name || "-"} ({u?.type})
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Biaya & Pembayaran
                        </span>
                        <div className="text-sm font-black text-slate-900">
                          {formatIDR(selectedReservation.totalPrice)}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          Status: {selectedReservation.paymentStatus}
                        </div>
                      </div>
                    </div>

                    {/* Schedule Dates */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Check-In</span>
                        <span className="font-extrabold text-slate-800">{selectedReservation.checkInDate}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Check-Out</span>
                        <span className="font-extrabold text-slate-800">{selectedReservation.checkOutDate}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {selectedReservation.status === "Confirmed" && (
                          <button
                            onClick={() => updateStatus(selectedReservation, "Checked In")}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" /> Check-In Sekarang
                          </button>
                        )}

                        {selectedReservation.status === "Checked In" && (
                          <button
                            onClick={() => updateStatus(selectedReservation, "Checked Out")}
                            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <LogOutIcon className="w-4 h-4" /> Check-Out Tamu
                          </button>
                        )}

                        {selectedReservation.status !== "Cancelled" && (
                          <button
                            onClick={() => updateStatus(selectedReservation, "Cancelled")}
                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition cursor-pointer"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>

                      {t?.phone && (
                        <a
                          href={getWhatsAppLink(selectedReservation)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                        >
                          <Phone className="w-4 h-4 text-emerald-600" />
                          Kirim Konfirmasi via WhatsApp
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION FORM MODAL */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Pengajuan Reservasi & Booking Kamar Baru
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Pilih Tenant / Tamu *</label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  required
                >
                  <option value="">-- Pilih Profil Tamu --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (KTP: {t.ktpNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Properti Induk</label>
                  <select
                    value={selectedPropId}
                    onChange={(e) => {
                      setSelectedPropId(e.target.value);
                      const propUnits = units.filter((u) => u.propertyId === e.target.value);
                      if (propUnits.length > 0) {
                        setUnitId(propUnits[0].id);
                        setTotalPrice(propUnits[0].price * 2);
                      } else {
                        setUnitId("");
                      }
                    }}
                    className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Pilih Kamar / Unit *</label>
                  <select
                    value={unitId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setUnitId(uid);
                      const targetUnit = units.find((u) => u.id === uid);
                      if (targetUnit) {
                        setTotalPrice(targetUnit.price * 2);
                      }
                    }}
                    className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                    required
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {units
                      .filter((u) => u.propertyId === selectedPropId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          Kamar {u.unitNumber} ({u.type} - {formatIDR(u.price)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tanggal Check-In *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tanggal Check-Out *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Uang Deposit Pengaman</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Total Harga Booking</label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Status Pembukuan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none text-sm bg-white"
                >
                  <option value="Confirmed">Confirmed (Dikonfirmasi)</option>
                  <option value="Pending">Pending (Menunggu DP)</option>
                  <option value="Checked In">Checked In (Telah Masuk)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs hover:bg-slate-50 font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                Simpan Reservasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SPREADSHEET DETAIL RESERVASI BERJALAN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Log Reservasi & Booking Tamu
            </h3>
            <p className="text-[11px] text-slate-400">
              Daftar seluruh reservasi hotel, kost, apartemen & villa
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Total: {reservations.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-3.5">Periode Menginap</th>
                <th className="p-3.5">Nama Tamu / HP</th>
                <th className="p-3.5">Unit Kamar & Properti</th>
                <th className="p-3.5">Harga & Deposit</th>
                <th className="p-3.5">Status Reservasi</th>
                <th className="p-3.5 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {reservations.map((res) => {
                const tenant = tenants.find((t) => t.id === res.tenantId);
                const unit = units.find((u) => u.id === res.unitId);

                return (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="bg-slate-100 py-1 px-2.5 rounded-md font-bold text-slate-700 block text-[10px] w-fit font-mono">
                          {res.checkInDate}
                        </span>
                        <span className="text-rose-500 block text-[10px] font-mono font-medium">
                          s/d {res.checkOutDate}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 block text-xs">
                          {tenant?.name || "Penyewa"}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] block">
                          {tenant?.phone || "N/A"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">
                          Kamar {unit?.unitNumber || "N/A"}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {getPropertyName(res.propertyId)}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-800 block">
                          {formatIDR(res.totalPrice)}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          Deposit: {formatIDR(res.deposit)}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block ${getStatusBadge(
                            res.status
                          )}`}
                        >
                          {res.status}
                        </span>
                        <span
                          className={`block text-[10px] font-bold ${
                            res.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          • {res.paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedReservation(res)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          Detail
                        </button>

                        {res.status === "Confirmed" && (
                          <button
                            onClick={() => updateStatus(res, "Checked In")}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold hover:bg-emerald-100 rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Check-In
                          </button>
                        )}

                        {res.status === "Checked In" && (
                          <button
                            onClick={() => updateStatus(res, "Checked Out")}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 font-bold hover:bg-slate-200 rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Check-Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Minimalist LogOut Icon helper
function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
