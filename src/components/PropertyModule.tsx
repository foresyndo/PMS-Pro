import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Calendar,
  Maximize2,
  Trash2,
  Edit,
  Plus,
  Compass,
  FileText,
  DollarSign
} from "lucide-react";
import { Property, PropertyType } from "../types";

interface PropertyModuleProps {
  properties: Property[];
  onAddProperty: (prop: Property) => void;
  onUpdateProperty: (prop: Property) => void;
  onDeleteProperty: (id: string) => void;
}

export default function PropertyModule({
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty
}: PropertyModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [filterType, setFilterType] = useState<PropertyType | "All">("All");

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("Kost");
  const [address, setAddress] = useState("");
  const [landArea, setLandArea] = useState(200);
  const [buildingArea, setBuildingArea] = useState(300);
  const [floorsCount, setFloorsCount] = useState(2);
  const [buildYear, setBuildYear] = useState(new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setName("");
    setType("Kost");
    setAddress("");
    setLandArea(200);
    setBuildingArea(300);
    setFloorsCount(2);
    setBuildYear(new Date().getFullYear());
    setImageUrl("");
    setEditingProp(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return alert("Mohon lengkapi nama dan alamat properti!");

    const newProp: Property = {
      id: "prop-" + Date.now().toString(),
      name,
      type,
      address,
      landArea: Number(landArea),
      buildingArea: Number(buildingArea),
      floorsCount: Number(floorsCount),
      buildYear: Number(buildYear),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format&fit=crop&q=80"
    };

    onAddProperty(newProp);
    setShowAddForm(false);
    resetForm();
  };

  const handleEdit = (prop: Property) => {
    setEditingProp(prop);
    setName(prop.name);
    setType(prop.type);
    setAddress(prop.address);
    setLandArea(prop.landArea);
    setBuildingArea(prop.buildingArea);
    setFloorsCount(prop.floorsCount);
    setBuildYear(prop.buildYear);
    setImageUrl(prop.imageUrl || "");
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;

    const updated: Property = {
      ...editingProp,
      name,
      type,
      address,
      landArea: Number(landArea),
      buildingArea: Number(buildingArea),
      floorsCount: Number(floorsCount),
      buildYear: Number(buildYear),
      imageUrl: imageUrl || editingProp.imageUrl
    };

    onUpdateProperty(updated);
    setShowAddForm(false);
    resetForm();
  };

  const filteredProperties = filterType === "All"
    ? properties
    : properties.filter(p => p.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Manajemen Properti</h2>
          <p className="text-xs text-slate-500">Kelola dan analisis seluruh aset bangunan yang terdaftar</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Tambah Properti Baru
        </button>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
        {(["All", "Hotel", "Kost", "Apartement", "Villa"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
              filterType === t
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "All" ? "Semua Properti" : t}
          </button>
        ))}
      </div>

      {/* FORM OVERLAY/ACCORDION */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md animate-slide-up">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            {editingProp ? "Ubah Spesifikasi Properti" : "Daftarkan Properti Baru"}
          </h3>
          <form onSubmit={editingProp ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Nama Properti *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kost Singgah Sini Coblong"
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Kategori Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyType)}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Kost">Kost (Boarding House)</option>
                    <option value="Apartement">Apartement</option>
                    <option value="Villa">Villa Pool</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Tahun Bangun</label>
                  <input
                    type="number"
                    value={buildYear}
                    onChange={(e) => setBuildYear(Number(e.target.value))}
                    className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Alamat Lengkap *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Raya Utama No. Kavling..."
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Luas Tanah (m²)</label>
                <input
                  type="number"
                  value={landArea}
                  onChange={(e) => setLandArea(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Luas Bangunan (m²)</label>
                <input
                  type="number"
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Jumlah Lantai</label>
                <input
                  type="number"
                  value={floorsCount}
                  onChange={(e) => setFloorsCount(Number(e.target.value))}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Foto URL (Opsional)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash..."
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
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
                {editingProp ? "Simpan Perubahan" : "Simpan Properti"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROPERTY CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProperties.map((prop) => (
          <div
            key={prop.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row hover:shadow-md transition duration-300 relative group"
          >
            {/* Action buttons hover */}
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-80 group-hover:opacity-100 transition">
              <button
                onClick={() => handleEdit(prop)}
                className="p-1.5 bg-white shadow rounded-lg hover:bg-emerald-50 text-indigo-650 transition cursor-pointer"
                title="Suntik data properti"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm("Apakah anda yakin ingin menghapus properti ini beserta relasinya?")) {
                    onDeleteProperty(prop.id);
                  }
                }}
                className="p-1.5 bg-white shadow rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer"
                title="Hapus properti"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Media Cover */}
            <div className="w-full md:w-2/5 h-48 md:h-auto relative">
              <img
                src={prop.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format&fit=crop&q=80"}
                alt={prop.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-md rounded-full text-[10px] text-white font-bold tracking-wider">
                {prop.type.toUpperCase()}
              </span>
            </div>

            {/* Contents info */}
            <div className="w-full md:w-3/5 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-800 leading-snug">{prop.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="line-clamp-2">{prop.address}</span>
                </p>
              </div>

              {/* Specs parameters table */}
              <div className="grid grid-cols-2 gap-2 border-t border-b border-gray-100 py-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Tanah/Bangunan</span>
                    <span className="font-bold text-slate-800">{prop.landArea} / {prop.buildingArea}m²</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500">
                  <Compass className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold uppercase">Lantai & Bangun</span>
                    <span className="font-bold text-slate-800">{prop.floorsCount} Lt ({prop.buildYear})</span>
                  </div>
                </div>
              </div>

              {/* Actions details list */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Status Legalitas: <strong className="text-emerald-600 uppercase">SHM Aktif</strong></span>
                <span className="flex items-center gap-1 font-bold text-emerald-700 cursor-pointer hover:underline">
                  <FileText className="h-3.5 w-3.5" /> Sertifikat .PDF
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredProperties.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center col-span-2 shadow-sm">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-600">Properti Kosong</h4>
            <p className="text-xs text-gray-400 mt-1">Belum ada properti berjenis "{filterType}" yang ditambahkan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
