import React, { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  User,
  Plus,
  Compass,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { MaintenanceTicket, Property, Unit, MaintenanceStatus, MaintenancePriority } from "../types";

interface MaintenanceModuleProps {
  maintenance: MaintenanceTicket[];
  units: Unit[];
  properties: Property[];
  onAddTicket: (ticket: MaintenanceTicket) => void;
  onUpdateTicket: (ticket: MaintenanceTicket) => void;
  prefilledUnitId?: string | null;
  onClearPrefill?: () => void;
}

export default function MaintenanceModule({
  maintenance,
  units,
  properties,
  onAddTicket,
  onUpdateTicket,
  prefilledUnitId,
  onClearPrefill
}: MaintenanceModuleProps) {
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [unitId, setUnitId] = useState("");

  React.useEffect(() => {
    if (prefilledUnitId) {
      setUnitId(prefilledUnitId);
      setShowForm(true);
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefilledUnitId, onClearPrefill]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("Medium");
  const [cost, setCost] = useState(150000);
  const [reportedBy, setReportedBy] = useState("Viona (Receptionist)");
  const [assignedStaff, setAssignedStaff] = useState("Eko (Teknisi AC)");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !description) return alert("Pilih nomor unit kamar dan deskripsi keluhan kerusakan!");

    const propertyId = units.find(u => u.id === unitId)?.propertyId || "";

    const newTicket: MaintenanceTicket = {
      id: "ticket-" + Date.now().toString(),
      propertyId,
      unitId,
      reportedBy,
      technician: assignedStaff,
      description,
      priority,
      cost: Number(cost),
      status: "Open",
      createdAt: new Date().toISOString()
    };

    onAddTicket(newTicket);
    setDescription("");
    setShowForm(false);
    alert("Laporan pemeliharaan terdaftar. Tim Teknisi di-notifikasi.");
  };

  const getPriorityBadge = (p: MaintenancePriority) => {
    switch (p) {
      case "Critical": return "bg-red-100 text-red-800 border-red-300";
      case "High": return "bg-orange-100 text-orange-850 border-orange-300";
      case "Medium": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Low": return "bg-blue-105 text-blue-800 border-blue-300";
    }
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
          <h2 className="text-xl font-extrabold text-slate-800 font-sans">Sistem Pemeliharaan & Tiket Teknisi</h2>
          <p className="text-xs text-slate-500">Log penanganan kerusakan AC, air, kelistrikan, dan kompensasi penanganan biaya</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Log Kerusakan Baru
        </button>
      </div>

      {/* NEW TICKET FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md animate-slide-up font-sans">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-600" />
            Pengaduan Fasilitas Rusak
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Kamar Unit Bermasalah *</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  required
                >
                  <option value="">-- Cari Kamar --</option>
                  {units.map(u => {
                    const prop = properties.find(p=>p.id===u.propertyId);
                    return (
                      <option key={u.id} value={u.id}>Rm No. {u.unitNumber} - {prop?.name}</option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Prioritas Penanganan</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="Low">Low (Bisa Ditunda)</option>
                    <option value="Medium">Medium (Sedang)</option>
                    <option value="High">High (Perlu Segera)</option>
                    <option value="Critical">Critical (Darurat Air/Listrik)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Estimasi Pengeluaran Jasa</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Keluhan Kronologi Rusak / Tindakan Masalah *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kebocoran pipa pralon kamar mandi luar dsb..."
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Pelapor Keluhan</label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Teknisi / Staff Ditugaskan</label>
                <input
                  type="text"
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Kirim Laporan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRID LOGS OF ACTIVE TICKETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {maintenance.map((tick) => {
          const unitObj = units.find(u => u.id === tick.unitId);
          const propObj = properties.find(p => p.id === unitObj?.propertyId);

          return (
            <div
              key={tick.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                    <Wrench className="h-4 w-4 text-emerald-600" /> Room {unitObj?.unitNumber || "N/A"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getPriorityBadge(tick.priority)}`}>
                    {tick.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold block uppercase">{propObj?.name}</p>
                  <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2" title={tick.description}>
                    {tick.description}
                  </p>
                </div>

                {/* Assigned Technisi information */}
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-150 text-xs text-gray-600 space-y-1 leading-snug">
                  <p>👱 Pelapor: <strong className="text-slate-800">{tick.reportedBy}</strong></p>
                  <p>🛠️ Teknisi: <strong className="text-slate-800">{tick.technician}</strong></p>
                  <p>💰 Biaya Rusak: <strong className="text-slate-800">{formatIDR(tick.cost)}</strong></p>
                </div>
              </div>

              {/* Maintenance state actions */}
              <div className="flex justify-between items-center mt-4 border-t pt-3 border-gray-100">
                <span className="text-[10px] text-gray-400 font-sans font-semibold">Reg: {tick.createdAt.slice(0, 10)}</span>
                
                <div className="flex gap-1.5">
                  {tick.status === "Open" && (
                    <button
                      onClick={() => onUpdateTicket({ ...tick, status: "Process" })}
                      className="px-2.5 py-1 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded font-extrabold hover:bg-yellow-100 text-[10px] leading-none"
                    >
                      Proses Kerja
                    </button>
                  )}
                  {tick.status === "Process" && (
                    <button
                      onClick={() => onUpdateTicket({ ...tick, status: "Completed" })}
                      className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-extrabold hover:bg-green-100 text-[10px] leading-none"
                    >
                      Selesai Perbaikan
                    </button>
                  )}
                  {tick.status === "Completed" && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 border-emerald-250 border rounded font-bold text-[10px] flex items-center gap-1 select-all">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {maintenance.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center col-span-full shadow-sm">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-gray-600">Laporan Pemeliharaan Aman</h4>
            <p className="text-xs text-gray-400 mt-1">Kami tidak menemukan laporan kerusakan aktif di database saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
