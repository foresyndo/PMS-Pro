import React, { useState } from "react";
import {
  User,
  Phone,
  Paperclip,
  ShieldCheck,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  Search,
  Plus,
  Trash2,
  Calendar
} from "lucide-react";
import { Tenant, Contract } from "../types";

interface TenantModuleProps {
  tenants: Tenant[];
  contracts: Contract[];
  onAddTenant: (newTenant: Tenant) => void;
  onDeleteTenant: (id: string) => void;
}

export default function TenantModule({
  tenants,
  contracts,
  onAddTenant,
  onDeleteTenant
}: TenantModuleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Input States
  const [name, setName] = useState("");
  const [ktpNumber, setKtpNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [ktpUrl, setKtpUrl] = useState("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=80");

  const resetForm = () => {
    setName("");
    setKtpNumber("");
    setPhone("");
    setAddress("");
    setJobTitle("");
    setEmergencyName("");
    setEmergencyRelation("");
    setEmergencyPhone("");
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return alert("Nama dan nomor handphone wajib diisi!");

    const newTenant: Tenant = {
      id: "t-" + Date.now().toString(),
      name,
      ktpNumber,
      phone,
      address,
      jobTitle,
      emergencyContact: {
        name: emergencyName || "N/A",
        relation: emergencyRelation || "N/A",
        phone: emergencyPhone || "N/A"
      },
      ktpUrl,
      createdAt: new Date().toISOString()
    };

    onAddTenant(newTenant);
    resetForm();
    alert("Tenant baru berhasil didaftarkan ke sistem database PMS Pro.");
  };

  // Search filter
  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery) ||
    t.ktpNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Direktori Penyewa / Tenant</h2>
          <p className="text-xs text-slate-500 font-medium">Data kelengkapan verifikasi KTP, pekerjaan, dan kontak darurat</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Daftarkan Tenant Baru
        </button>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2 pl-4">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama penyewa, nomor HP, atau nomor KTP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-slate-800 text-xs border-none outline-none focus:ring-0"
        />
      </div>

      {/* ADD NEW TENANT Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md animate-slide-up">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Isi Kelengkapan Berkas Tenant
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Nama Lengkap Tenant *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rian Aditya"
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Nomor KTP / Paspor *</label>
                <input
                  type="text"
                  value={ktpNumber}
                  onChange={(e) => setKtpNumber(e.target.value)}
                  placeholder="327311..."
                  maxLength={16}
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Nomor Handphone (WhatsApp) *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08381122..."
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Alamat Rumah Sesuai KTP</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Sukasenang No. 10, Kel. Margahayu..."
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Pekerjaan / Instansi Korporat</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Senior Supervisor di Telkomsel"
                  className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Emergency Contacts subform */}
            <div className="pt-2 border-t border-gray-100">
              <span className="block text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-2">Kontak Darurat (Emergency Contact)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500">Nama Kontak Darurat</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Nama Orang Tua / Kerabat"
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500">Hubungan / Status</label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="Ayah / Saudara Kandung / Atasan"
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500">No. HP Hubungi *</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="08129988..."
                    className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1 pb-1">
              <label className="text-xs font-bold text-gray-600 block">Identitas Fisik KTP (Simulasi Foto)</label>
              <input
                type="text"
                value={ktpUrl}
                onChange={(e) => setKtpUrl(e.target.value)}
                className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg text-xs"
                placeholder="https://..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                Simpan & Validasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TENANT LIST CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTenants.map((tenant) => {
          // Check active contracts
          const activeContract = contracts.find(c => c.tenantId === tenant.id);
          
          return (
            <div
              key={tenant.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-emerald-50 border-2 border-emerald-500/20 flex-shrink-0 flex items-center justify-center font-bold text-emerald-800">
                    {tenant.name.split(" ").map(w=>w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800">{tenant.name}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {tenant.jobTitle || "Pekerjaan belum diatur"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-lg font-bold border border-emerald-250 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Terverifikasi KTP
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Hapus seluruh data riwayat penyewa ini?")) {
                        onDeleteTenant(tenant.id);
                      }
                    }}
                    className="p-1 px-1.5 hover:bg-red-50 text-red-650 rounded transition"
                    title="Hapus tenant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid content specs */}
              <div className="grid grid-cols-2 gap-4 my-4 bg-slate-50/50 p-3 rounded-xl border border-gray-150 text-xs text-gray-650">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Detail Kontak</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-emerald-600" /> {tenant.phone}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">No. KTP ID</span>
                  <p className="font-mono text-slate-700">{tenant.ktpNumber}</p>
                </div>
              </div>

              {/* Emergency info block */}
              <div className="border-t border-dashed border-gray-200 pt-3 text-xs flex justify-between items-center text-gray-500">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">Kontak Kondisi Darurat:</span>
                  <span className="font-bold text-slate-700">{tenant.emergencyContact.name} ({tenant.emergencyContact.relation})</span>
                </div>
                <span className="font-mono text-slate-600 bg-gray-100 py-0.5 px-2 rounded font-semibold text-[10px]">{tenant.emergencyContact.phone}</span>
              </div>

              {/* Progress timeline kontrak sewa */}
              {activeContract ? (
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-emerald-700 flex items-center gap-1"><Calendar className="h-3 w-3" /> Kontrak Sewa Aktif</span>
                    <span className="text-gray-500">{activeContract.startDate} s.d {activeContract.endDate}</span>
                  </div>
                  {/* Linear progress simulation */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full w-3/5" />
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-gray-100 text-center bg-gray-50 p-2 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[11px] text-gray-400 font-bold flex items-center justify-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Kontrak Sewa Kosong / Kedaluwarsa
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredTenants.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center col-span-2 shadow-sm">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-pulse" />
            <h4 className="text-sm font-bold text-gray-600">Tenant Kosong</h4>
            <p className="text-xs text-gray-400 mt-1">Belum ada penyewa yang sesuai dengan filter pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
