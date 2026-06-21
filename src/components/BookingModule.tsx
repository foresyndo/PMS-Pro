import React, { useState } from "react";
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
  Phone
} from "lucide-react";
import { Reservation, Tenant, Unit, Property, ReservationStatus, PaymentStatus } from "../types";

interface BookingModuleProps {
  reservations: Reservation[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onAddReservation: (res: Reservation) => void;
  onUpdateReservation: (res: Reservation) => void;
}

export default function BookingModule({
  reservations,
  tenants,
  units,
  properties,
  onAddReservation,
  onUpdateReservation
}: BookingModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState("2026-06");

  // Form states
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [selectedPropId, setSelectedPropId] = useState(properties[0]?.id || "");
  const [unitId, setUnitId] = useState("");
  const [checkInDate, setCheckInDate] = useState("2026-06-20");
  const [checkOutDate, setCheckOutDate] = useState("2026-06-25");
  const [deposit, setDeposit] = useState(500000);
  const [totalPrice, setTotalPrice] = useState(3000000);
  const [status, setStatus] = useState<ReservationStatus>("Confirmed");

  // Filter unit lists depending on chosen property
  const currentUnits = units.filter(u => u.propertyId === selectedPropId);

  // Helper date lists generator for monthly visual calendar grid
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1); // June 2026 has 30 days

  const getReservationForDay = (unitNumber: string, day: number) => {
    // Return reservation details if any overlap on specific date of June 2026
    const formattedDay = `2026-06-${day.toString().padStart(2, "0")}`;
    return reservations.find((res) => {
      const matchUnit = units.find(u => u.id === res.unitId)?.unitNumber === unitNumber;
      if (!matchUnit) return false;
      return formattedDay >= res.checkInDate && formattedDay <= res.checkOutDate;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !unitId) return alert("Penyewa, properti induk dan Nomor unit ketersediaan wajib ditentukan!");

    // Simple validity check
    if (checkOutDate <= checkInDate) {
      return alert("Tanggal check-out harus melebihi tanggal check-in!");
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
    alert("Reservasi baru berhasil diregistrasikan ke database PMS.");
  };

  const getStatusBadge = (s: ReservationStatus) => {
    switch (s) {
      case "Checked In": return "bg-green-100 text-green-800 border-green-300";
      case "Checked Out": return "bg-gray-100 text-gray-800 border-gray-300";
      case "Confirmed": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Pending": return "bg-yellow-105 text-yellow-850 border-yellow-205";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const updateStatus = (res: Reservation, next: ReservationStatus) => {
    onUpdateReservation({ ...res, status: next });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Sistem Reservasi & Booking</h2>
          <p className="text-xs text-slate-500">Kelola timeline check-in, deposit pengaman, dan status reservasi kamar</p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <FilePlus className="h-4 w-4" />
          Pre-Booking Baru
        </button>
      </div>

      {/* IN-DEPTH HOTEL-STYLE SCHEDULE TIMELINE GRAPH */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              PMS Room Occupancy Planner (Juni 2026)
            </h3>
            <p className="text-[11px] text-gray-400">Peta keterisian kamar hotel & kost harian visual</p>
          </div>
          <span className="text-[11px] bg-slate-100 border px-3 py-1 rounded-lg text-slate-600 font-semibold block">
            Bulan Aktif: Juni 2026
          </span>
        </div>

        {/* Scrollable grid representation */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-gray-500 font-bold border-b">
                <th className="p-3 text-left border-r sticky left-0 bg-slate-50 min-w-32 z-10 shadow-md">No. Kamar</th>
                {daysInMonth.map((day) => (
                  <th key={day} className="p-1 px-2 border-r text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.slice(0, 8).map((room) => (
                <tr key={room.id} className="border-b hover:bg-slate-50/50 text-xs">
                  <td className="p-3 font-semibold text-slate-700 border-r bg-white sticky left-0 z-10 shadow-md flex items-center justify-between">
                    <span>No. {room.unitNumber}</span>
                    <span className="text-[9px] text-gray-400 font-medium truncate max-w-16">({room.status})</span>
                  </td>
                  
                  {daysInMonth.map((day) => {
                    const reservation = getReservationForDay(room.unitNumber, day);
                    const isCheckInStart = reservation?.checkInDate === `2026-06-${day.toString().padStart(2, "0")}`;
                    
                    return (
                      <td key={day} className="p-1 border-r min-w-8 h-10 relative">
                        {reservation ? (
                          <div
                            className={`absolute inset-y-1 left-0 right-0 rounded-md py-1 px-0.5 text-[8px] leading-tight text-white font-semibold flex items-center justify-center cursor-pointer transition-all ${
                              reservation.status === "Checked In"
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-amber-500 hover:bg-amber-600"
                            }`}
                            title={`Tenant: ${tenants.find(t=>t.id===reservation.tenantId)?.name || "Penyewa"} | CheckIn: ${reservation.checkInDate} s/d CheckOut: ${reservation.checkOutDate}`}
                          >
                            <span className="truncate max-w-full">
                              {isCheckInStart ? (tenants.find(t=>t.id===reservation.tenantId)?.name.split(" ")[0]) : ""}■
                            </span>
                          </div>
                        ) : (
                          <span className="block w-full h-full" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION FORM */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md animate-slide-up">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Pengajuan Reservasi Kamar Baru
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Pilih Tenant / Penyewa *</label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  required
                >
                  <option value="">-- Cari Profil Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (KTP: {t.ktpNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Properti Induk</label>
                  <select
                    value={selectedPropId}
                    onChange={(e) => {
                      setSelectedPropId(e.target.value);
                      setUnitId(""); // Reset unit
                    }}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Pilih Kamar / Unit *</label>
                  <select
                    value={unitId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setUnitId(uid);
                      const targetUnit = units.find(u => u.id === uid);
                      if (targetUnit) {
                        setTotalPrice(targetUnit.price); // Set total price auto
                      }
                    }}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                    required
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {currentUnits.map(u => (
                      <option key={u.id} value={u.id}>Room {u.unitNumber} ({u.type} - {formatIDR(u.price)})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Tanggal Check-In *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Tanggal Check-Out *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Uang Deposit Pengaman</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Total Harga Booking</label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Status Pembukuan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm bg-white"
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
                onClick={() => {
                  setShowAddForm(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Simpan Reservasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SPREADSHEET DETAIL RESERVASIES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Log Histori Booking Berjalan</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-gray-550 border-b">
                <th className="p-4">Tanggal Mulai</th>
                <th className="p-4">Tenant / HP</th>
                <th className="p-4">Unit Kamar</th>
                <th className="p-4">Harga & Jaminan</th>
                <th className="p-4">Status Transaksi</th>
                <th className="p-4">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-800 font-medium">
              {reservations.map((res) => {
                const tenant = tenants.find(t => t.id === res.tenantId);
                const unit = units.find(u => u.id === res.unitId);
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50">
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="bg-slate-100 py-1 px-2.5 rounded font-bold text-slate-700 block text-[10px] w-fit">
                          {res.checkInDate}
                        </span>
                        <span className="text-red-400 block text-[10px]">s.d {res.checkOutDate}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 block text-sm">{tenant?.name || "Penyewa"}</span>
                        <span className="text-slate-500 font-mono text-[10px] block">{tenant?.phone || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 block">Kamar {unit?.unitNumber || "N/A"}</span>
                        <span className="text-slate-400 block text-[10px]">{getPropertyName(res.propertyId)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">{formatIDR(res.totalPrice)}</span>
                        <span className="text-gray-400 block text-[10px]">Deposit Scur: {formatIDR(res.deposit)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(res.status)}`}>
                          {res.status}
                        </span>
                        <span className={`block text-[10px] font-bold ${res.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                          • Keuangan: {res.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {res.status === "Confirmed" && (
                          <button
                            onClick={() => updateStatus(res, "Checked In")}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold hover:bg-emerald-100 rounded text-[10px]"
                          >
                            Check-In
                          </button>
                        )}
                        {res.status === "Checked In" && (
                          <button
                            onClick={() => updateStatus(res, "Checked Out")}
                            className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-300 font-bold hover:bg-slate-100 rounded text-[10px]"
                          >
                            Check-Out
                          </button>
                        )}
                        {(res.status === "Pending" || res.status === "Confirmed") && (
                          <button
                            onClick={() => updateStatus(res, "Cancelled")}
                            className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 font-bold hover:bg-red-100 rounded text-[10px]"
                          >
                            Batalkan
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
