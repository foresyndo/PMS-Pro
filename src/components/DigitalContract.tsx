import React, { useState, useRef } from "react";
import {
  FileText,
  Calendar,
  PenTool,
  Download,
  Printer,
  FileCheck,
  Plus,
  Trash2,
  Compass
} from "lucide-react";
import { Contract, Tenant, Unit, Property } from "../types";

interface DigitalContractProps {
  contracts: Contract[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onAddContract: (contract: Contract) => void;
}

export default function DigitalContract({
  contracts,
  tenants,
  units,
  properties,
  onAddContract
}: DigitalContractProps) {
  const [showGen, setShowGen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form Inputs
  const [tenantId, setTenantId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [startDate, setStartDate] = useState("2026-06-21");
  const [endDate, setEndDate] = useState("2027-06-21");
  const [terms, setTerms] = useState(
    "1. Penyewa wajib merawat fasilitas kamar dengan baik.\n2. Pembayaran maksimal tanggal 5 setiap bulan.\n3. Uang deposit dikembalikan saat masa sewa selesai jika tidak ada kerusakan."
  );

  // Simulated signature drawing pad ref/states
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPropertyName = (uId: string) => {
    const u = units.find(unit => unit.id === uId);
    if (!u) return "N/A";
    const p = properties.find(prop => prop.id === u.propertyId);
    return p ? p.name : "N/A";
  };

  const getUnitNumber = (uId: string) => {
    const u = units.find(unit => unit.id === uId);
    return u ? u.unitNumber : "N/A";
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#16a34a"; // green-600
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !unitId) return alert("Pilih tenant dan kamar unit sewa terlebih dahulu!");

    // Construct contract content
    const chosenTenantName = tenants.find(t=>t.id===tenantId)?.name || "Penyewa";
    const chosenUnitNo = getUnitNumber(unitId);
    const chosenPropName = getPropertyName(unitId);

    const docContent = `
SURAT PERJANJIAN SEWA MENYEWA PROPERTI
--------------------------------------
Dokumen Kontrak: PRO/CON/${Date.now().toString().slice(-4)}

Antara pengelola PMS Pro selaku PIHAK PERTAMA (Pemilik properti), dengan:
Nama Penyewa  : ${chosenTenantName} (PIHAK KEDUA)

Dengan kesepakatan menyewa unit di bawah spesifikasi berikut:
Properti Induk : ${chosenPropName}
Nomor Kamar    : Room ${chosenUnitNo}
Tanggal Mulai  : ${startDate}
Tanggal Selesai: ${endDate}

Adapun ketentuan sewa yang disepakati adalah sebagai berikut:
${terms}

Surat perjanjian penyewaan ini ditandatangani secara sadar melalui media digital PMS Pro.
    `;

    const propertyId = units.find(u => u.id === unitId)?.propertyId || "";
    const rentVal = units.find(u => u.id === unitId)?.price || 0;

    const newContract: Contract = {
      id: "con-" + Date.now().toString(),
      tenantId,
      propertyId,
      unitId,
      startDate,
      endDate,
      monthlyRent: rentVal,
      termsDescription: docContent,
      tenantSignature: signed ? "SIGNED_BY_TENANT" : undefined,
      ownerSignature: "SIGNED_BY_SAHRUL_VIONA",
      createdAt: new Date().toISOString()
    };

    onAddContract(newContract);
    setShowGen(false);
    setSigned(false);
    alert("Surat Perjanjian Sewa Digital (Lease Agreement) berhasil diterbitkan.");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Kontrak Sewa Digital (Lease)</h2>
          <p className="text-xs text-slate-500">Buat draf kontrak otomatis, tanda tangan pad digital, dan cetak legalitas .PDF</p>
        </div>

        <button
          onClick={() => setShowGen(!showGen)}
          className="px-4 py-2.5 bg-emerald-600 font-semibold text-white text-xs md:text-sm rounded-xl shadow hover:bg-emerald-700 transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Rancang Kontrak Baru
        </button>
      </div>

      {showGen && (
        <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 pb-2 border-b">
            <FileText className="h-4 w-4 text-emerald-600" /> Rancang Template Surat Kontrak
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Pilih Tenant / Penyewa *</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-gray-205 rounded-xl bg-white"
                required
              >
                <option value="">-- Pilih Tenant --</option>
                {tenants.map(t=> (
                  <option key={t.id} value={t.id}>{t.name} (KTP: {t.ktpNumber})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Pilih Kamar Unit Sewa *</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-gray-205 rounded-xl bg-white"
                required
              >
                <option value="">-- Pilih Kamar --</option>
                {units.map(u => {
                  const prop = properties.find(p=>p.id===u.propertyId);
                  return (
                    <option key={u.id} value={u.id}>Kamar No. {u.unitNumber} ({prop?.name})</option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Tanggal Mulai Sewa *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-gray-205 rounded-xl bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Tanggal Selesai Sewa *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-gray-205 rounded-xl bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Ketentuan Tambahan Sewa Menyewa (Wajib)</label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full text-slate-800 p-2.5 border border-gray-205 rounded-xl"
            />
          </div>

          {/* Interactive Pad Signature Canvas */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-gray-600 block">Tanda Tangan Tangan Digital (Gambar di Area Hijau):</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <canvas
                ref={canvasRef}
                width={300}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-dashed border-emerald-400 rounded-2xl bg-slate-50 cursor-crosshair max-w-full"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-[10px] font-bold"
              >
                Clear Signature
              </button>
            </div>
            {signed && <p className="text-[10px] text-emerald-600 font-bold">✓ Tanda Tangan Terbaca di Koordinat Pad.</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowGen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Terbitkan Kontrak
            </button>
          </div>
        </form>
      )}

      {/* RENDER ACTIVE LEASES TABLE AND ACTION PRINT DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Left lists contracts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-4">
          <h4 className="font-extrabold uppercase text-slate-700 tracking-wider">Log Kontrak Terbit</h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {contracts.map((con) => {
              const tenantObj = tenants.find(t=>t.id===con.tenantId);
              return (
                <div
                  key={con.id}
                  onClick={() => setSelectedContract(con)}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-left ${
                    selectedContract?.id === con.id
                      ? "border-emerald-600 bg-emerald-50/40"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <p className="font-extrabold text-stone-900 leading-snug">{tenantObj?.name || "Penyewa"}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-1">Room {getUnitNumber(con.unitId)} - {getPropertyName(con.unitId)}</p>
                  
                  <div className="flex justify-between items-center mt-3 text-[10px] text-gray-400 font-bold">
                    <span>Masa sewa: {con.startDate} s.d {con.endDate}</span>
                    <span className="text-emerald-700 uppercase bg-green-50 px-2 rounded-lg py-0.2 border border-green-200">ACTIVE</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right detailed display read/print letter layout */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4 text-left">
          {selectedContract ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Review Surat Perjanjian Resmi</h4>
                  <p className="text-[10px] text-gray-400">Tanda Tangan Digital Tersimpan</p>
                </div>
                
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 shadow"
                >
                  <Printer className="h-4 w-4" /> Cetak / PDF
                </button>
              </div>

              {/* Box display draft formatting */}
              <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 font-mono text-gray-800 leading-relaxed text-[11px] whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {selectedContract.termsDescription}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                <FileCheck className="h-4 w-4 text-emerald-600" /> Dokumen ini sah secara hukum dan bersertifikasi tanda tangan digital PMS Pro.
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <FileText className="h-12 w-12 text-slate-300 animate-pulse" />
              <p className="font-bold">Silahkan pilih kontrak di panel kiri</p>
              <p className="text-[11px]">atau rancang kontrak sewa baru melalui tombol di kanan atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
