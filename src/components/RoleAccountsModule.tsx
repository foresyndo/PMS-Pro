import React, { useState } from "react";
import {
  Shield,
  Key,
  Mail,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  UserCheck,
  Check,
  Info,
  Lock,
  LockKeyhole,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { UserRole } from "../types";

export interface RoleCredential {
  role: UserRole;
  email: string;
  passport: string;
}

interface RoleAccountsModuleProps {
  credentials: RoleCredential[];
  onUpdateCredentials: (updated: RoleCredential[]) => void;
  onResetToDefaults: () => void;
  onQuickLogin: (role: UserRole) => void;
}

export default function RoleAccountsModule({
  credentials,
  onUpdateCredentials,
  onResetToDefaults,
  onQuickLogin
}: RoleAccountsModuleProps) {
  const [localCreds, setLocalCreds] = useState<RoleCredential[]>(credentials);
  const [showPassport, setShowPassport] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const togglePassportVisibility = (roleName: string) => {
    setShowPassport((prev) => ({
      ...prev,
      [roleName]: !prev[roleName]
    }));
  };

  const handleFieldChange = (role: UserRole, field: "email" | "passport", value: string) => {
    const updated = localCreds.map((c) => {
      if (c.role === role) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setLocalCreds(updated);
  };

  const handleSaveAll = () => {
    onUpdateCredentials(localCreds);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang semua kredensial login ke default pabrik?")) {
      onResetToDefaults();
      // Sync internal state back to default props
      setTimeout(() => {
        setLocalCreds(credentials);
      }, 100);
    }
  };

  // Human-readable Indonesian description of permissions
  const getRolePermissions = (role: UserRole): string[] => {
    switch (role) {
      case "Super Admin":
        return [
          "Akses Penuh Semua Modul & Tab Fitur",
          "Konfigurasi Supabase Cloud & Sinkronisasi Data",
          "Manajemen & Pengaturan Akun Login Setiap Role",
          "Keuangan, Kontrak Digital, HRIS, & CRM Properti"
        ];
      case "Owner":
        return [
          "Akses Penuh Semua Modul & Tab Fitur",
          "Membaca Laporan Keuangan Eksekutif & Statistik Kamar",
          "Pengaturan Akun Akses Staf Operasional",
          "Tanda Tangan Kontrak Digital Pengurus Sewa"
        ];
      case "HR":
        return [
          "Modul Khusus Human Resource Information System (HRIS)",
          "Kelola Profil Staf Pegawai, Status, & Jabatan",
          "Pencatatan Absensi Harian (Check-in/out)",
          "Proses Roster Shift Kalender & Distribusi Roster",
          "Persetujuan Cuti & Gaji Bulanan (Payroll)"
        ];
      case "Manager":
        return [
          "Dashboard Manajemen Properti & Kamar",
          "Proses Reservasi Unit, Booking Manual & Check-In",
          "Penerimaan Formulir Keluhan Perbaikan Fasilitas",
          "Pemantauan Kebersihan Kamar (Housekeeping)",
          "Manajemen Data Tenant (Penyewa)"
        ];
      case "Receptionist":
        return [
          "Dashboard Pelayanan Tamu & Pemantauan Kamar",
          "Manajemen Booking, Reservasi, & Detail Tamu",
          "Registrasi Data Penyewa Kamar Baru di Lapangan"
        ];
      case "Finance":
        return [
          "Ekosistem Billing, Catatan Buku Kas & Keuangan",
          "Pembuatan Invoice Penyewa (Kuitansi Sewa)",
          "Konfirmasi Pembayaran Gaji Karyawan (Payroll)",
          "Pencatatan Biaya Pengeluaran Operasional & Perbaikan"
        ];
      case "Marketing/Sales":
        return [
          "Sistem Manajemen Hubungan Pelanggan (CRM)",
          "Pemantauan Jalur Prospek Leads Baru (Funnel)",
          "Integrasi Unit Kamar Kosong Siap Jual"
        ];
      case "Staff Maintenance":
        return [
          "Rincian Tiket Tugas Perbaikan Fasilitas Rusak",
          "Pembaruan Status Tugas Kerja (Pending, In Progress, Solved)",
          "Pencatatan Log Pemeliharaan Inventaris Kamar"
        ];
      case "Tenant/Penyewa":
        return [
          "Dashboard Portal Mandiri Penyewa Kamar",
          "Pencatatan Status Booking & Ringkasan Kontrak Aktif"
        ];
      default:
        return ["Akses Dasar Aplikasi"];
    }
  };

  const filteredCreds = localCreds.filter(
    (c) =>
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm font-sans text-xs animate-fade-in">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            Pengaturan Akun & Paspor Kunci Role
          </h2>
          <p className="text-slate-450 text-[11px] mt-0.5">
            Konfigurasi alamat email login dan paspor (kata sandi) resmi untuk setiap role level sistem.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-600 hover:text-slate-800 font-extrabold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer text-[10px] tracking-wider"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset ke Default
          </button>
          
          <button
            onClick={handleSaveAll}
            className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm text-[10px] tracking-wider"
          >
            <Save className="h-3.5 w-3.5" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* COMPACT EXPLANATORY CARD */}
      <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-xl mb-6 flex gap-3 text-slate-700">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 uppercase tracking-wide text-[10px]">Petunjuk Keamanan & Pengujian</h4>
          <p className="leading-relaxed text-[11px] font-medium text-slate-605">
            Role terdaftar di bawah dapat digunakan untuk mensimulasikan login di halaman depan aplikasi menggunakan kombinasi <strong>Email</strong> dan <strong>Paspor (Kata Sandi)</strong> yang Anda simpan di sini. Data ini tersimpan aman di database local browser.
          </p>
        </div>
      </div>

      {/* SEARCH AND FEEDBACK BAR */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Cari berdasarkan role atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700 w-full max-w-sm"
        />

        {saveSuccess && (
          <div className="flex items-center gap-1 px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-bold animate-pulse text-[10px] uppercase">
            <Check className="h-3.5 w-3.5 shrink-0" />
            Kredensial disimpan & disinkronkan!
          </div>
        )}
      </div>

      {/* MATRIX LIST OF ROLES */}
      <div className="space-y-4">
        {filteredCreds.length === 0 ? (
          <div className="text-center py-10 text-slate-450 italic font-semibold">
            Tidak ada role yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredCreds.map((cred) => (
            <div
              key={cred.role}
              className="border border-slate-150 hover:border-slate-300 rounded-2xl p-4 transition-all bg-white shadow-3xs hover:shadow-2xs flex flex-col lg:flex-row gap-5 justify-between items-stretch lg:items-center"
            >
              {/* Role Title Icon & Scope Summary */}
              <div className="space-y-1.5 flex-1 lg:max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 border text-slate-700">
                    <Shield className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-[12px] uppercase leading-none">{cred.role}</h3>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1 tracking-wide">
                      {cred.role === "Super Admin" || cred.role === "Owner" ? "Akses Manajemen Multi" : "Akses Operasional Terbatas"}
                    </span>
                  </div>
                </div>
                
                {/* Visual indicator of page/tab authorizations */}
                <div className="pt-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Izin Hak Akses Tab:</span>
                  <ul className="space-y-1 mt-1 shrink-0">
                    {getRolePermissions(cred.role).map((permission, index) => (
                      <li key={index} className="flex items-start gap-1 text-[10px] text-slate-500 font-semibold leading-relaxed">
                        <Check className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Editable email credentials column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center">
                
                {/* Email input field */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-slate-400 font-extrabold block">ID Email Login:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={cred.email}
                      onChange={(e) => handleFieldChange(cred.role, "email", e.target.value)}
                      placeholder="email@pms.pro"
                      className="pl-9.5 pr-4 py-2 w-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 hover:bg-slate-50/50 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Password/Passport input field */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-slate-400 font-extrabold block">Paspor Kunci (Passphrase/Sandi):</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassport[cred.role] ? "text" : "password"}
                      value={cred.passport}
                      onChange={(e) => handleFieldChange(cred.role, "passport", e.target.value)}
                      placeholder="Ketik password"
                      className="pl-9.5 pr-10 py-2 w-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 hover:bg-slate-50/50 rounded-xl font-bold text-slate-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassportVisibility(cred.role)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-650 p-1"
                    >
                      {showPassport[cred.role] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Action utilities - Login Simulation Fast Pass */}
              <div className="flex flex-col justify-center items-center lg:items-end gap-1.5 shrink-0 self-center border-t md:border-t-0 md:pt-0 pt-4 mt-2">
                <span className="text-[9px] uppercase text-slate-400 font-extrabold hidden lg:block">Simulasi Login</span>
                <button
                  onClick={() => onQuickLogin(cred.role)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-700 hover:text-white text-slate-100 font-extrabold uppercase rounded-xl transition flex items-center justify-center gap-1.5 text-[10px] w-full lg:w-auto hover:shadow-md cursor-pointer shadow-xs whitespace-nowrap"
                  title={`Langsung berpindah interface ke role ${cred.role}`}
                >
                  <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  Masuk Sebagai {cred.role.split("/")[0]}
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
