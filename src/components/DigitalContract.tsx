import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
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

  const exportToPDF = (con: Contract) => {
    const tenantObj = tenants.find((t) => t.id === con.tenantId);
    const tenantName = tenantObj?.name || "Penyewa";
    const unitNo = getUnitNumber(con.unitId);
    const propName = getPropertyName(con.unitId);

    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Page border & Background accent
    doc.setFillColor(252, 251, 247); // warm white
    doc.rect(5, 5, 200, 287, "F");
    doc.setDrawColor(220, 215, 200);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281, "S");

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text("SURAT KONTRAK SEWA (LEASE AGREEMENT)", 15, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`No. Referensi: ${con.id.toUpperCase()}`, 15, 31);
    doc.text(`Tanggal Cetak: ${new Date(con.createdAt || Date.now()).toLocaleDateString("id-ID")}`, 15, 35);

    // Horizontal Accent Line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.2);
    doc.line(15, 39, 195, 39);

    // Section 1: Parties
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("I. PIHAK YANG BERSEPAKAT", 15, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text("PIHAK PERTAMA (Pengelola / Pemilik):", 15, 55);
    doc.setFont("helvetica", "bold");
    doc.text("PMS Pro (Milik Sahrul Viona)", 20, 60);

    doc.setFont("helvetica", "normal");
    doc.text("PIHAK KEDUA (Penyewa / Tenant):", 15, 68);
    doc.setFont("helvetica", "bold");
    doc.text(`${tenantName} (No. KTP: ${tenantObj?.ktpNumber || "N/A"})`, 20, 73);

    // Section 2: Properti & Kamar
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("II. DETAIL SPESIFIKASI UNIT & BIAYA SEWA", 15, 86);

    doc.setFont("helvetica", "normal");
    doc.text("Properti Induk    :", 15, 93);
    doc.setFont("helvetica", "bold");
    doc.text(propName, 48, 93);

    doc.setFont("helvetica", "normal");
    doc.text("Unit Kamar Sewa   :", 15, 98);
    doc.setFont("helvetica", "bold");
    doc.text(`No. Room ${unitNo}`, 48, 98);

    doc.setFont("helvetica", "normal");
    doc.text("Harga Sewa/Bulan  :", 15, 103);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${con.monthlyRent.toLocaleString("id-ID")}`, 48, 103);

    doc.setFont("helvetica", "normal");
    doc.text("Durasi Masa Sewa  :", 15, 108);
    doc.setFont("helvetica", "bold");
    doc.text(`${con.startDate} s.d ${con.endDate}`, 48, 108);

    // Section 3: Terms
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("III. KETENTUAN DAN SYARAT SEWA MENYEWA", 15, 120);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitTerms = doc.splitTextToSize(con.termsDescription || "", 170);
    doc.text(splitTerms, 15, 127);

    // Signatures
    const currentY = 220;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PIHAK PERTAMA", 25, currentY);
    doc.text("PIHAK KEDUA", 145, currentY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("[ Ditandatangani secara digital ]", 18, currentY + 10);
    doc.text("PMS Pro Owner & Admin", 25, currentY + 14);

    // Draw a digital signature box for tenant
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.rect(132, currentY + 3, 50, 16);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED SIGNATURE", 137, currentY + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`SECURE CODE: ${con.id.slice(0,8).toUpperCase()}`, 139, currentY + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(tenantName, 145, currentY + 24);

    // Bottom banner certified
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 35, 195, currentY + 35);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Surat Perjanjian Sewa Digital ini diterbitkan otomatis melalui aplikasi PMS Pro dan sah secara hukum.", 15, currentY + 41);
    doc.text("Memiliki kekuatan hukum yang sama dengan kontak basah menurut UU ITE No. 11/2008 & PP No. 71/2019.", 15, currentY + 45);

    // Save
    doc.save(`KONTRAK_SEWA_ROOM_${unitNo}_${tenantName.replace(/\s+/g, "_")}.pdf`);
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
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-300 transition"
                    title="Cetak lewat Browser"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={() => exportToPDF(selectedContract)}
                    className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 shadow transition"
                    title="Download File PDF Asli"
                  >
                    <Download className="h-3.5 w-3.5" /> Unduh PDF
                  </button>
                </div>
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
