import React, { useState } from "react";
import {
  Database,
  CloudLightning,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  FileCode,
  Terminal,
  HelpCircle
} from "lucide-react";
import {
  isSupabaseConfigured,
  getSupabaseInitSQL
} from "../lib/supabase";

interface SupabaseModuleProps {
  supabaseLoading: boolean;
  supabaseStatus: Record<string, boolean>;
  onPullData: () => Promise<void>;
  onPushData: () => Promise<void>;
}

export default function SupabaseModule({
  supabaseLoading,
  supabaseStatus,
  onPullData,
  onPushData
}: SupabaseModuleProps) {
  const [copied, setCopied] = useState(false);
  const [localPushing, setLocalPushing] = useState(false);
  const [localPulling, setLocalPulling] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const isConfigured = isSupabaseConfigured();
  const sqlCode = getSupabaseInitSQL();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syncTables = [
    { displayName: "Properti (properties)", dbName: "properties", desc: "Menampung seluruh data portofolio bangunan/villa" },
    { displayName: "Kamar & Unit (units)", dbName: "units", desc: "Menampung detail sewa, tipe unit, dan ketersediaan" },
    { displayName: "Daftar Tenant (tenants)", dbName: "tenants", desc: "Menampung profil penyewa dan kontak darurat" },
    { displayName: "Booking & Reservasi (reservations)", dbName: "reservations", desc: "Pemesanan sewa jangka pendek & panjang" },
    { displayName: "Dokumen Kontrak (contracts)", dbName: "contracts", desc: "Menyimpan data sewa legal & tanda tangan digital" },
    { displayName: "Tagihan Bulanan (invoices)", dbName: "invoices", desc: "Invoice, rincian biaya sewa, status pembayaran" },
    { displayName: "Arus Kas Pengeluaran (expenses)", dbName: "expenses", desc: "OPEX, biaya perawatan, gaji, token listrik" },
    { displayName: "Laporan Pemeliharaan (maintenance_tickets)", dbName: "maintenance_tickets", desc: "Komplain kerusakan, AC, ledeng, status perbaikan" },
    { displayName: "Log Pembayaran (payment_logs)", dbName: "payment_logs", desc: "Riwayat pembayaran & bukti transfer sewa" }
  ];

  const handlePullClick = async () => {
    setLocalPulling(true);
    try {
      await onPullData();
    } finally {
      setLocalPulling(false);
    }
  };

  const handlePushClick = async () => {
    const doubleCheck = window.confirm(
      "Apakah Anda yakin ingin menimpa data di Supabase dengan data lokal saat ini? Semua data lokal akan diunggah!"
    );
    if (!doubleCheck) return;
    setLocalPushing(true);
    try {
      await onPushData();
    } finally {
      setLocalPushing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 text-left font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Database className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Supabase Cloud Database
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Koneksi real-time untuk meminimalkan kehilangan data dan menyinkronkan portal kamar penyewa secara global
          </p>
        </div>

        {/* STATUS BADGE */}
        <div className="flex items-center gap-3">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-55 text-emerald-800 rounded-full border border-emerald-200 text-xs font-extrabold shadow-sm bg-emerald-50 animate-pulse">
              <CloudLightning className="h-4 w-4 text-emerald-600" />
              <span>TERKONEKSI (LIVE SINKRON)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-800 rounded-full border border-rose-200 text-xs font-bold shadow-sm">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>SUPABASE CHIP BELUM DIKONFIGURASI</span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK INSTRUCTION ALERT BOX */}
      {!isConfigured && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <h3 className="font-extrabold text-sm">Variabel Lingkungan Belum Terbaca</h3>
          </div>
          <p className="text-xs leading-relaxed max-w-2xl">
            Untuk mengaktifkan sinkronisasi real-time secara dinamis, isikan data URL & API key Supabase Anda pada file <code>.env</code> menggunakan format yang diminta. Apabila dilakukan lewat AI Studio UI, isi variabel di menu Secrets:
          </p>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono select-all space-y-1">
            <p>VITE_SUPABASE_URL="https://[PROJECT_ID].supabase.co"</p>
            <p>VITE_SUPABASE_ANON_KEY="[YOUR_ANON_PUBLISHABLE_KEY]"</p>
          </div>
        </div>
      )}

      {/* TWO PANEL COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MID MAIN PANEL: SCHEMA TABLE STATUS & MANUAL RETRIEVAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ACTION BUTTON PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Operasi Sinkronisasi Manual</h3>
              <p className="text-[11px] text-slate-400">Tarik data cloud terbaru ke browser atau timpa database cloud dengan data demo saat ini</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* PULL DATA */}
              <button
                disabled={!isConfigured || supabaseLoading || localPulling}
                onClick={handlePullClick}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition duration-200 select-none cursor-pointer ${
                  isConfigured
                    ? "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                    : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-xs block text-slate-800 uppercase">Tarik Cloud Data</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Banyak pembaruan dari perangkat berbeda? Tarik data terbaru.</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 shadow-xs">
                  <DownloadCloud className={`h-4 w-4 text-slate-600 ${localPulling ? "animate-bounce" : ""}`} />
                </div>
              </button>

              {/* PUSH DATA */}
              <button
                disabled={!isConfigured || supabaseLoading || localPushing}
                onClick={handlePushClick}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition duration-200 select-none cursor-pointer ${
                  isConfigured
                    ? "bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-xs block text-emerald-800 uppercase">Push Data Lokal (Seeding)</span>
                  <span className="text-[10px] text-emerald-600/70 block font-medium">Unggah seluruh data lokal saat ini ke database Supabase Cloud.</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200 shrink-0 shadow-xs">
                  <UploadCloud className={`h-4 w-4 text-emerald-600 ${localPushing ? "animate-pulse" : ""}`} />
                </div>
              </button>
            </div>
          </div>

          {/* TABLES TRACKINGS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Status Tabel Sinkronisasi</h3>
                <p className="text-[10px] text-slate-400 font-medium">Daftar tabel yang dilacak oleh sistem manajemen properti</p>
              </div>
              <div className="px-2 py-0.5 bg-slate-200/70 border border-slate-250 text-slate-600 text-[9px] font-bold rounded">
                ⚡ AUTO UPLOAD ACTIVE
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {syncTables.map((tab, idx) => {
                const isFound = supabaseStatus[tab.dbName];
                return (
                  <div key={idx} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-700 block">{tab.displayName}</span>
                      <span className="text-[10px] text-slate-400 block font-light">{tab.desc}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isConfigured ? (
                        isFound ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Tabel OK</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60" title="Butuh Inisialisasi SQL">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Butuh SQL</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100/80 px-2 py-1 rounded-lg">
                          Offline Mode
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SQL INSTRUCTION & COPY CODES */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCode className="h-5 w-5 text-emerald-600 shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-sm">Skema Inisialisasi Database</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Jalankan skrip ini sekali di konsol <strong>SQL Editor</strong> Supabase Anda untuk membuat relasi tabel, tipe data yang benar, serta aturan Row-Level-Security (RLS).
            </p>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-slate-300 text-[10px] font-mono rounded-xl h-[260px] overflow-y-auto overflow-x-hidden border border-slate-800 text-left select-all leading-relaxed whitespace-pre-wrap">
                {sqlCode}
              </pre>
              
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={handleCopySql}
                  className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-white rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition shadow-xl font-sans text-[10px] font-bold uppercase tracking-wider"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-450" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-150">
              <span className="font-bold text-slate-600 uppercase block mb-0.5">ℹ️ Catatan Penting:</span>
              Skrip di atas otomatis mengaktifkan integrasi <strong>RLS (Row Level Security)</strong> publik agar program demo dapat terhubung secara aman tanpa memerlukan konfigurasi email kustom.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
