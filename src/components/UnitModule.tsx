import React, { useState } from "react";
import {
  Home,
  Check,
  Plus,
  Edit,
  Trash2,
  Tag,
  Eye,
  Settings,
  SlidersHorizontal,
  Layers,
  Sparkles,
  QrCode,
  Copy,
  ExternalLink,
  X,
  Upload
} from "lucide-react";
import { Unit, Property, UnitStatus } from "../types";

interface UnitModuleProps {
  units: Unit[];
  properties: Property[];
  onAddUnit: (unit: Unit) => void;
  onUpdateUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onSimulateTenantAction?: (action: string, unitId: string) => void;
}

export default function UnitModule({
  units,
  properties,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onSimulateTenantAction
}: UnitModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  
  // QR Code generator states
  const [activeQrUnit, setActiveQrUnit] = useState<Unit | null>(null);
  const [selectedQrType, setSelectedQrType] = useState<"maintenance" | "pay">("maintenance");
  const [copied, setCopied] = useState(false);

  // Filters states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<UnitStatus | "All">("All");

  // Input states
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [type, setType] = useState("Deluxe Suite");
  const [size, setSize] = useState(25);
  const [price, setPrice] = useState(2500000);
  const [status, setStatus] = useState<UnitStatus>("Available");
  const [facilitiesString, setFacilitiesString] = useState("Wi-Fi, AC, Kamar Mandi Dalam, Kasur Springbed");
  const [imageUrl, setImageUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const resetForm = () => {
    setPropertyId(properties[0]?.id || "");
    setUnitNumber("");
    setFloor(1);
    setType("Deluxe Suite");
    setSize(25);
    setPrice(2500000);
    setStatus("Available");
    setFacilitiesString("Wi-Fi, AC, Kamar Mandi Dalam, Kasur Springbed");
    setImageUrl("");
    setEditingUnit(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber) return alert("Nomor unit/kamar wajib diisi!");
    if (!propertyId) return alert("Pilih bangunan properti induk terlebih dahulu!");

    const facilities = facilitiesString.split(",").map(f => f.trim()).filter(f => f.length > 0);

    const newUnit: Unit = {
      id: "unit-" + Date.now().toString(),
      propertyId,
      unitNumber,
      floor: Number(floor),
      type,
      size: Number(size),
      price: Number(price),
      status,
      facilities,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80"
    };

    onAddUnit(newUnit);
    setShowAddForm(false);
    resetForm();
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setPropertyId(unit.propertyId);
    setUnitNumber(unit.unitNumber);
    setFloor(unit.floor);
    setType(unit.type);
    setSize(unit.size);
    setPrice(unit.price);
    setStatus(unit.status);
    setFacilitiesString(unit.facilities.join(", "));
    setImageUrl(unit.imageUrl || "");
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    const facilities = facilitiesString.split(",").map(f => f.trim()).filter(f => f.length > 0);

    const updated: Unit = {
      ...editingUnit,
      propertyId,
      unitNumber,
      floor: Number(floor),
      type,
      size: Number(size),
      price: Number(price),
      status,
      facilities,
      imageUrl: imageUrl || editingUnit.imageUrl
    };

    onUpdateUnit(updated);
    setShowAddForm(false);
    resetForm();
  };

  // Filter computation
  const filteredUnits = units.filter((unit) => {
    const matchProp = selectedPropertyId === "All" || unit.propertyId === selectedPropertyId;
    const matchState = selectedStatus === "All" || unit.status === selectedStatus;
    return matchProp && matchState;
  });

  const getStatusColor = (state: UnitStatus) => {
    switch (state) {
      case "Available": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Occupied": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Reserved": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Maintenance": return "bg-red-50 text-red-700 border-red-200";
      case "Cleaning": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  // Map Property Name helper
  const getPropertyName = (pId: string) => {
    const found = properties.find(p => p.id === pId);
    return found ? found.name : "Properti Tidak Dikenal";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Manajemen Kamar / Unit</h2>
          <p className="text-xs text-slate-500">Kelola kamar, denah, harga sewa, dan status operasional harian</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Tambah Unit Kamar
        </button>
      </div>

      {/* FILTERS CARD PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Properti:</span>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full text-slate-800 p-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="All">Semua Bangunan Properti</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full text-slate-800 p-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="All">Semua Kontrol Status</option>
            <option value="Available">Available (Tersedia)</option>
            <option value="Occupied">Occupied (Terisi)</option>
            <option value="Reserved">Reserved (Dipesan)</option>
            <option value="Maintenance">Maintenance (Dalam Perbaikan)</option>
            <option value="Cleaning">Cleaning (Pembersihan)</option>
          </select>
        </div>
      </div>

      {/* FORM WINDOW */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md animate-slide-up">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Home className="h-4 w-4 text-emerald-600" />
            {editingUnit ? "Ubah Konfigurasi Kamar" : "Daftarkan Kamar/Unit Baru"}
          </h3>
          <form onSubmit={editingUnit ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Pilih Properti Induk *</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  required
                >
                  <option value="">-- Pilih Induk Bangunan --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Nomor Kamar/Unit *</label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="Contoh: Room 204"
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Terletak di Lantai</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Tipe/Klasifikasi Kamar</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Contoh: Studio Deluxe / Kost AC"
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Luas Unit (m²)</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Harga Sewa Kamar (IDR) / Bulan</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Status Awal Kamar</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UnitStatus)}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                >
                  <option value="Available">Available (Bebas sewa)</option>
                  <option value="Occupied">Occupied (Terisi)</option>
                  <option value="Reserved">Reserved (Kunci Dipesan)</option>
                  <option value="Maintenance">Maintenance (Sedang Rusak)</option>
                  <option value="Cleaning">Cleaning (Pembersihan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Fasilitas Kamar (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={facilitiesString}
                  onChange={(e) => setFacilitiesString(e.target.value)}
                  placeholder="AC, Wi-Fi, Kamar Mandi Dalam..."
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-600 flex justify-between items-center">
                <span>Foto Kamar (Upload / Tarik file)</span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </label>
              
              {imageUrl ? (
                <div className="relative mt-1.5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-40 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Review foto kamar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
                    title="Hapus Foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/70 backdrop-blur-xs py-1 px-2.5 text-[10px] text-white rounded-lg truncate text-center font-sans">
                    Foto Terunggah (Base64 atau URL website)
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      const file = files[0];
                      if (!file.type.startsWith("image/")) {
                        alert("Mohon masukkan tipe file gambar (.png, .jpg, .jpeg, etc)!");
                        return;
                      }
                      if (file.size > 3 * 1024 * 1024) {
                        alert("Ukuran gambar melebihi limit 3MB!");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`mt-1 border-2 border-dashed rounded-xl p-6 transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                    isDragOver
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/5"
                  }`}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      const files = target.files;
                      if (files && files[0]) {
                        const file = files[0];
                        if (file.size > 3 * 1024 * 1024) {
                          alert("Ukuran gambar melebihi limit 3MB!");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-6 w-6 text-slate-400" />
                  <div className="font-bold text-slate-700 text-xs mt-1 font-sans">
                    Tarik & Lepas gambar di sini, atau <span className="text-emerald-600 underline cursor-pointer">Pilih File</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium font-sans">Format PNG, JPG, GIF hingga 3 MB</span>
                </div>
              )}
              
              {/* Fallback Input URL */}
              <div className="pt-2">
                <span className="text-[9px] text-gray-400 font-bold block uppercase font-sans">Atau masukkan URL Foto Manual (Alternatif)</span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-slate-800 p-2 mt-1 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-[11px]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                {editingUnit ? "Ubah Spesifikasi" : "Registrasikan Kamar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UNITS GRID LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUnits.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition duration-300 flex flex-col justify-between group"
          >
            {/* Header image with status overlays */}
            <div className="h-40 w-full relative">
              <img
                src={unit.imageUrl || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80"}
                alt={`Kamar ${unit.unitNumber}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow backdrop-blur-md ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/70 border border-slate-700 text-white font-bold backdrop-blur-md">
                  Lt {unit.floor}
                </span>
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                <button
                  onClick={() => handleEdit(unit)}
                  className="p-1.5 bg-white shadow rounded-lg hover:bg-emerald-50 text-indigo-700 cursor-pointer"
                  title="Ubah info kamar"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus Kamar No. ${unit.unitNumber}?`)) {
                      onDeleteUnit(unit.id);
                    }
                  }}
                  className="p-1.5 bg-white shadow rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                  title="Hapus kamar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Room info items */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 block truncate" title={getPropertyName(unit.propertyId)}>
                  {getPropertyName(unit.propertyId)}
                </span>
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-extrabold text-slate-800">No. {unit.unitNumber}</h4>
                  <span className="text-xs text-gray-400">{unit.size} m²</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">{unit.type}</p>
              </div>

              {/* Facilities tags mapping (clamped) */}
              <div className="flex flex-wrap gap-1 h-12 overflow-hidden py-1">
                {unit.facilities.slice(0, 3).map((fac, idx) => (
                  <span key={idx} className="bg-slate-50 border border-gray-150 text-gray-500 text-[10px] py-0.5 px-1.5 rounded font-medium">
                    {fac}
                  </span>
                ))}
                {unit.facilities.length > 3 && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] py-0.5 px-1.5 rounded font-extrabold">
                    +{unit.facilities.length - 3} lagi
                  </span>
                )}
              </div>

              {/* Price card footer */}
              <div className="flex justify-between items-end pt-2 border-t border-gray-100 gap-1.5">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 uppercase font-semibold">Sewa Bulanan</span>
                  <span className="text-xs font-bold text-emerald-600 block leading-tight">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0
                    }).format(unit.price)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveQrUnit(unit);
                    setSelectedQrType("maintenance");
                    setCopied(false);
                  }}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 hover:border-emerald-200 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  title="Lihat Portal QR Penghuni"
                >
                  <QrCode className="h-3.5 w-3.5 shrink-0" />
                  <span>QR Portal</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredUnits.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center col-span-full shadow-sm">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-gray-600">Kamar Tidak Ditemukan</h4>
            <p className="text-xs text-gray-400 mt-1">Kami tidak menemukan kamar yang memenuhi preferensi pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* QR CODE GENERATOR DIALOG MODAL */}
      {activeQrUnit && (() => {
        // Build path dynamically
        const directUrl = `${window.location.origin}${window.location.pathname}?action=${selectedQrType}&unitId=${activeQrUnit.id}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=059669&data=${encodeURIComponent(directUrl)}`;

        const handleCopyLink = () => {
          navigator.clipboard.writeText(directUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 overflow-hidden shadow-2xl relative animate-scale-up text-left">
              
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    QR Portal Kamar No. {activeQrUnit.unitNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveQrUnit(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Selector Tab for target URL */}
                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl gap-1 font-sans">
                  <button
                    onClick={() => {
                      setSelectedQrType("maintenance");
                      setCopied(false);
                    }}
                    className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      selectedQrType === "maintenance"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Lapor Kerusakan
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQrType("pay");
                      setCopied(false);
                    }}
                    className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      selectedQrType === "pay"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Portal Tagihan
                  </button>
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col items-center justify-center space-y-3 relative overflow-hidden group">
                  <div className="w-[180px] h-[180px] bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
                    Scan via Smartphone Camera
                  </span>
                </div>

                {/* Direct Link Copier */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">URL Link Langsung</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={directUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-650 text-xs p-2.5 rounded-xl select-all outline-none font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 bg-slate-850 hover:bg-slate-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Visual guidelines */}
                <div className="text-[10px] text-slate-500 leading-snug bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/55 font-sans">
                  <p className="font-semibold text-emerald-800 mb-0.5">💡 Rekomendasi Penggunaan:</p>
                  Print QR Code ini dan pasang di pintu kamar <strong>No. {activeQrUnit.unitNumber}</strong>. Penghuni dapat memindai QR untuk melapor kerusakan fasilitas atau melunasi tagihan sewa.
                </div>
              </div>

              {/* Simulation Footer Button */}
              {onSimulateTenantAction && (
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-stretch gap-2 font-sans">
                  <button
                    onClick={() => {
                      onSimulateTenantAction(selectedQrType, activeQrUnit.id);
                      setActiveQrUnit(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Simulasikan Scan Smartphone</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        );
      })()}
    </div>
  );
}
