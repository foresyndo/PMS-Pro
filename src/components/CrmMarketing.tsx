import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  Plus,
  Compass,
  Award,
  CircleDot
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: number;
  stage: "Prospect" | "Contacted" | "Negotiation" | "Deal";
  interest: string;
}

const initialLeads: Lead[] = [
  { id: "1", name: "Joko Prabowo", phone: "0812993322", source: "Instagram Ads", budget: 3500000, stage: "Prospect", interest: "Apartemen Studio" },
  { id: "2", name: "Siti Rahma", phone: "0811223344", source: "Mamikos", budget: 1800000, stage: "Contacted", interest: "Kost AC Kamar Mandi Dalam" },
  { id: "3", name: "Aditya Pratama", phone: "0877889922", source: "Facebook Marketplace", budget: 6000000, stage: "Negotiation", interest: "Villa Pool Seminyak" },
  { id: "4", name: "Mega Utami", phone: "0838112233", source: "Referensi Teman", budget: 2000000, stage: "Deal", interest: "Kost Eksekutif Coblong" }
];

export default function CrmMarketing() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showAddLead, setShowAddLead] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Mamikos");
  const [budget, setBudget] = useState(200000);
  const [interest, setInterest] = useState("");

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return alert("Nama dan nomor telepon peminat wajib diisi!");

    const newLead: Lead = {
      id: "lead-" + Date.now().toString(),
      name,
      phone,
      source,
      budget: Number(budget),
      stage: "Prospect",
      interest
    };

    setLeads([...leads, newLead]);
    setName("");
    setPhone("");
    setInterest("");
    setShowAddLead(false);
    alert("Prospek peminat baru ditambahkan ke pipeline CRM Sales.");
  };

  const advanceStage = (id: string) => {
    setLeads(leads.map(l => {
      if (l.id !== id) return l;
      const next: Record<Lead["stage"], Lead["stage"]> = {
        Prospect: "Contacted",
        Contacted: "Negotiation",
        Negotiation: "Deal",
        Deal: "Deal"
      };
      return { ...l, stage: next[l.stage] };
    }));
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
          <h2 className="text-xl font-extrabold text-slate-800">Sales CRM & Pipeline Marketing</h2>
          <p className="text-xs text-slate-500">Pantau pergerakan calon penyewa, prospek lead iklan, dan skema bonus agen</p>
        </div>

        <button
          onClick={() => setShowAddLead(!showAddLead)}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Registrasikan Lead Prospek
        </button>
      </div>

      {/* LEAD CONVERSION RATES AND STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Prospek Lead Aktif</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{leads.length} Leads</p>
          </div>
          <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl"><Users className="h-5 w-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Rasio Akumulasi Omset Lead</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {formatIDR(leads.reduce((sum, l) => sum + l.budget, 0))}
            </p>
          </div>
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="h-5 w-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Est. Komisi Agen Marketing</span>
            <p className="text-xl font-bold text-indigo-700 mt-1">
              {formatIDR(leads.filter(l => l.stage === "Deal").reduce((sum, l) => sum + l.budget, 0) * 0.05)}
            </p>
          </div>
          <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl"><Award className="h-5 w-5" /></span>
        </div>
      </div>

      {/* LEADS REGISTRATION FORM */}
      {showAddLead && (
        <form onSubmit={handleCreateLead} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 font-sans text-xs">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">Isi Berkas Lead Baru</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500">Nama Prospek Calon Tenant *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Joko Susanto"
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500">Nomor Handphone (WhatsApp) *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 0812..."
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500">Kanal Asal Lead Iklan</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Mamikos">Mamikos</option>
                <option value="Instagram Ads">Instagram Ads</option>
                <option value="Facebook Marketplace">Facebook Marketplace</option>
                <option value="Tiktok Ads">Tiktok Ads</option>
                <option value="Referensi Teman">Referensi Teman</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500">Unit Properti Minat</label>
              <input
                type="text"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="Kamar Kost Deluxe AC atau Villa"
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500">Plafon Budget Bulanan (IDR)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAddLead(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold font-sans"
            >
              Simpan Prospek
            </button>
          </div>
        </form>
      )}

      {/* CRM KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
        {/* Stage 1: Prospect */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-extrabold text-slate-850 text-xs flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-red-500" /> PROSPECT
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 border rounded-full font-bold">
              {leads.filter(l => l.stage === "Prospect").length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leads.filter(l => l.stage === "Prospect").map((l) => (
              <div key={l.id} className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <h5 className="font-extrabold text-stone-900 text-sm leading-tight">{l.name}</h5>
                <p className="text-[11px] text-indigo-700 font-semibold">{l.interest}</p>
                <div className="text-[10px] text-gray-400 font-sans space-y-0.5 leading-snug pb-2 border-b">
                  <p>📞 Phone: {l.phone}</p>
                  <p>📢 Source: {l.source}</p>
                  <p>💰 Est: {formatIDR(l.budget)}</p>
                </div>
                <button
                  onClick={() => advanceStage(l.id)}
                  className="w-full text-center py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]"
                >
                  Hubungi Calon ✔️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2: Contacted */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-extrabold text-slate-850 text-xs flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-yellow-500" /> CONTACTED
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 border rounded-full font-bold">
              {leads.filter(l => l.stage === "Contacted").length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leads.filter(l => l.stage === "Contacted").map((l) => (
              <div key={l.id} className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <h5 className="font-extrabold text-stone-900 text-sm leading-tight">{l.name}</h5>
                <p className="text-[11px] text-indigo-700 font-semibold">{l.interest}</p>
                <div className="text-[10px] text-gray-400 font-sans space-y-0.5 leading-snug pb-2 border-b">
                  <p>📞 Phone: {l.phone}</p>
                  <p>📢 Source: {l.source}</p>
                  <p>💰 Est: {formatIDR(l.budget)}</p>
                </div>
                <button
                  onClick={() => advanceStage(l.id)}
                  className="w-full text-center py-1.5 bg-yellow-50 text-yellow-800 font-bold rounded text-[10px]"
                >
                  Ajukan Penawaran ✔️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 3: Negotiation */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-extrabold text-slate-850 text-xs flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-cyan-500" /> NEGOTIATION
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 border rounded-full font-bold">
              {leads.filter(l => l.stage === "Negotiation").length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leads.filter(l => l.stage === "Negotiation").map((l) => (
              <div key={l.id} className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <h5 className="font-extrabold text-stone-900 text-sm leading-tight">{l.name}</h5>
                <p className="text-[11px] text-indigo-700 font-semibold">{l.interest}</p>
                <div className="text-[10px] text-gray-400 font-sans space-y-0.5 leading-snug pb-2 border-b">
                  <p>📞 Phone: {l.phone}</p>
                  <p>📢 Source: {l.source}</p>
                  <p>💰 Est: {formatIDR(l.budget)}</p>
                </div>
                <button
                  onClick={() => advanceStage(l.id)}
                  className="w-full text-center py-1.5 bg-emerald-600 text-white font-bold rounded text-[10px]"
                >
                  Close & Tandatangan Kontrak ✔️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 4: Deal */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-extrabold text-slate-850 text-xs flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" /> DEAL CLOSED
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 border rounded-full font-bold">
              {leads.filter(l => l.stage === "Deal").length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {leads.filter(l => l.stage === "Deal").map((l) => (
              <div key={l.id} className="bg-white p-3.5 rounded-xl border border-emerald-110 shadow-sm space-y-2">
                <h5 className="font-extrabold text-stone-900 text-sm leading-tight">{l.name}</h5>
                <p className="text-[11px] text-indigo-750 font-semibold">{l.interest}</p>
                <div className="text-[10px] text-gray-400 font-sans space-y-0.5 leading-snug pb-2 border-b">
                  <p>📞 Phone: {l.phone}</p>
                  <p>📢 Source: {l.source}</p>
                  <p className="text-emerald-600 font-extrabold">🤝 Deal: {formatIDR(l.budget)}</p>
                </div>
                <p className="text-center font-bold text-emerald-700 text-[10px]">
                  Telah Registrasi Kamar 🤝
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
