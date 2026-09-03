import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Building,
  Home,
  Users,
  Sparkles,
  Wrench,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Send,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  Info
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  RuleItem,
  KOS_RULES,
  HOTEL_RULES,
  FO_STAFF_RULES,
  HK_STAFF_RULES,
  OTHER_STAFF_RULES,
  SANCTION_MATRIX
} from "../data/rulesData";
import { Property, UserRole } from "../types";

interface RulesAndSopModuleProps {
  properties?: Property[];
  currentRole?: UserRole;
}

export default function RulesAndSopModule({
  properties = [],
  currentRole = "Super Admin"
}: RulesAndSopModuleProps) {
  const [activeTab, setActiveTab] = useState<
    "kos" | "hotel" | "fo" | "hk" | "sec" | "sanksi" | "checklist"
  >("kos");

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<string, boolean>>({
    "kos-1": true,
    "htl-1": true,
    "fo-1": true,
    "hk-1": true
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal share WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waRecipientName, setWaRecipientName] = useState("");
  const [waRecipientPhone, setWaRecipientPhone] = useState("");
  const [waSelectedCategory, setWaSelectedCategory] = useState<"kos" | "hotel" | "karyawan">("kos");

  // Checklist SOP State
  const [checklistItems, setChecklistItems] = useState<{ id: string; label: string; checked: boolean; dept: string }[]>([
    { id: "c-fo-1", dept: "Front Office", label: "Pemeriksaan seragam, nametag, dan standar grooming 5S", checked: true },
    { id: "c-fo-2", dept: "Front Office", label: "Hitung uang modal kasir (cash float) & cek mesin EDC", checked: true },
    { id: "c-fo-3", dept: "Front Office", label: "Baca buku Log Book handover shift sebelumnya & cek status pending", checked: false },
    { id: "c-fo-4", dept: "Front Office", label: "Cek daftar kedatangan tamu VIP dan alokasi kamar Clean & Inspected", checked: false },
    { id: "c-fo-5", dept: "Front Office", label: "Pemeriksaan kelengkapan kartu kunci (keycard) & amplop invoice", checked: false },
    { id: "c-hk-1", dept: "Housekeeping", label: "Cek ketersediaan linen bersih, sarung bantal, duvet cover di lemari linen", checked: true },
    { id: "c-hk-2", dept: "Housekeeping", label: "Periksa kelengkapan trolley (caddy cart): chemical, APD sarung tangan & kantong sampah", checked: true },
    { id: "c-hk-3", dept: "Housekeeping", label: "Inspeksi kamar status Vacant Dirty & utamakan kamar reservasi hari ini", checked: false },
    { id: "c-hk-4", dept: "Housekeeping", label: "Laporkan temuan barang tertinggal tamu (Lost & Found) ke buku register FO", checked: false },
    { id: "c-hk-5", dept: "Housekeeping", label: "Periksa fungsi AC, keran wastafel, dan lampu kamar sebelum ubah status ke Clean", checked: false },
    { id: "c-sec-1", dept: "Security & K3", label: "Patroli keliling area parkir & pastikan CCTV menyala normal", checked: true },
    { id: "c-sec-2", dept: "Security & K3", label: "Pengecekan kunci gembok gerbang utama jam malam (23:00 WIB)", checked: false }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleExpand = (id: string) => {
    setExpandedRuleIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Teks tata tertib berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Get active items list
  const getCurrentItems = (): RuleItem[] => {
    let source: RuleItem[] = [];
    if (activeTab === "kos") source = KOS_RULES;
    else if (activeTab === "hotel") source = HOTEL_RULES;
    else if (activeTab === "fo") source = FO_STAFF_RULES;
    else if (activeTab === "hk") source = HK_STAFF_RULES;
    else if (activeTab === "sec") source = OTHER_STAFF_RULES;
    else return [];

    return source.filter((item) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSeverity =
        severityFilter === "ALL" || item.severity === severityFilter;

      return matchSearch && matchSeverity;
    });
  };

  // Export PDF Document
  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const currentProperty = properties[0]?.name || "PMS PRO INDONESIA";
    let titleHeader = "DOKUMEN RESMI TATA TERTIB & REGULASI";
    let itemsToPrint: RuleItem[] = [];

    if (activeTab === "kos") {
      titleHeader = "TATA TERTIB & PERATURAN PENGHUNI KOS-KOSAN";
      itemsToPrint = KOS_RULES;
    } else if (activeTab === "hotel") {
      titleHeader = "TATA TERTIB & KETENTUAN MENGINAP TAMU HOTEL";
      itemsToPrint = HOTEL_RULES;
    } else if (activeTab === "fo") {
      titleHeader = "STANDAR OPERASIONAL PROSEDUR (SOP) FRONT OFFICE";
      itemsToPrint = FO_STAFF_RULES;
    } else if (activeTab === "hk") {
      titleHeader = "STANDAR OPERASIONAL PROSEDUR (SOP) HOUSEKEEPING";
      itemsToPrint = HK_STAFF_RULES;
    } else if (activeTab === "sec") {
      titleHeader = "SOP MAINTENANCE & KEAMANAN PROPERTI";
      itemsToPrint = OTHER_STAFF_RULES;
    } else {
      titleHeader = "STANDAR REGULASI OPERASIONAL & TATA TERTIB TERPADU";
      itemsToPrint = [...KOS_RULES, ...HOTEL_RULES];
    }

    // Page 1 Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(currentProperty.toUpperCase(), 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(titleHeader, 14, 25);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Dokumen Legalitas & Pedoman Operasional Baku • Terbit: ${new Date().toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "long", year: "numeric" }
      )}`,
      14,
      30
    );

    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(14, 33, 196, 33);

    let y = 40;

    itemsToPrint.forEach((item, index) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.code}: ${item.title}`, 14, y);
      y += 5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const splitSummary = doc.splitTextToSize(item.summary, 180);
      doc.text(splitSummary, 14, y);
      y += splitSummary.length * 4.5 + 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      item.details.forEach((det) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const bulletLine = doc.splitTextToSize(`• ${det}`, 176);
        doc.text(bulletLine, 18, y);
        y += bulletLine.length * 4;
      });

      if (item.penalty) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28); // rose-700
        const penaltyLine = doc.splitTextToSize(`Sanksi: ${item.penalty}`, 176);
        doc.text(penaltyLine, 18, y);
        y += penaltyLine.length * 4;
      }

      y += 4;
    });

    // Signature Area at end
    if (y > 230) {
      doc.addPage();
      y = 30;
    } else {
      y += 10;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Pihak Manajemen Pengelola", 24, y);
    doc.text("Penghuni / Tamu / Karyawan", 130, y);

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("(.....................................................)", 20, y);
    doc.text("(.....................................................)", 126, y);

    doc.save(`Tata-Tertib-SOP-${activeTab.toUpperCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("Dokumen PDF Tata Tertib & SOP berhasil diunduh!");
  };

  // Generate WhatsApp Message Content
  const generateWhatsAppMessage = () => {
    const propName = properties[0]?.name || "Manajemen Properti";
    let header = `*TATA TERTIB RESMI - ${propName.toUpperCase()}*\n`;

    if (waSelectedCategory === "kos") {
      header += `_Pedoman Hak & Kewajiban Penghuni Kos-Kosan_\n\n`;
      header += `Halo Kak ${waRecipientName || "Penghuni"}, berikut ringkasan tata tertib penting yang wajib dipatuhi demi kenyamanan bersama:\n\n`;
      KOS_RULES.slice(0, 5).forEach((r) => {
        header += `📌 *${r.code}: ${r.title}*\n${r.summary}\n• _Ketentuan: ${r.details[0]}_\n\n`;
      });
      header += `🚨 *Sanksi Pelanggaran:* Pelanggaran berat seperti Narkoba, Miras & Asusila berakibat pemutusan sewa sepihak.\n\nTerima kasih atas kerja samanya menjaga lingkungan kos yang aman dan nyaman.`;
    } else if (waSelectedCategory === "hotel") {
      header += `_Panduan Menginap & Ketentuan Tamu Hotel_\n\n`;
      header += `Yth. Bapak/Ibu ${waRecipientName || "Tamu Terhormat"},\nSelamat datang di ${propName}. Berikut ketentuan menginap yang berlaku:\n\n`;
      header += `🕒 *Check-In:* Mulai 14:00 WIB | *Check-Out:* Maks 12:00 WIB\n`;
      header += `🚭 *100% Non-Smoking Room:* Dilarang merokok di kamar ber-AC (Denda pembersihan Rp 1.000.000)\n`;
      header += `🔒 *Barang Berharga:* Harap selalu gunakan Brankas Kamar (Safety Deposit Box)\n`;
      header += `🚫 *Dilarang:* Durian & hewan peliharaan di area kamar tidur\n\n`;
      header += `Jika memerlukan bantuan resepsionis, silakan hubungi Front Desk di ext 0. Selamat beristirahat!`;
    } else {
      header += `_Panduan Standar Operasional Prosedur (SOP) Staf_\n\n`;
      header += `Halo Rekan ${waRecipientName || "Tim Operasional"},\nMohon pastikan standar pelayanan prima diterapkan dengan disiplin pada shift hari ini:\n\n`;
      header += `1. Terapkan 5S (Senyum, Salam, Sapa, Sopan, Santun) dalam 3 detik pertama.\n`;
      header += `2. Penanganan komplain dengan metode L.A.S.T (Listen, Apologize, Solve, Thank).\n`;
      header += `3. Prosedur ketuk kamar 3x sebelum memasuki kamar tamu.\n`;
      header += `4. Laporkan temuan barang tertinggal (Lost & Found) segera ke buku register.\n\n`;
      header += `Mari jaga kepuasan tamu dan profesionalitas kerja kita bersama!`;
    }

    return header;
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    let cleanPhone = waRecipientPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(url, "_blank");
    setShowWhatsAppModal(false);
    showToast("Template pesan WhatsApp siap dikirimkan!");
  };

  const currentItems = getCurrentItems();

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-slate-800">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Regulasi &amp; SOP Terpadu Properti
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-emerald-200/80 font-medium">
                Standard Operational Procedure Kos &amp; Hotel Indonesia
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
              Tata Tertib Penghuni &amp; SOP Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Panduan regulasi lengkap untuk memastikan ketertiban penghuni kos, kenyamanan tamu hotel,
              serta standar baku operasional mulai dari Front Office, Housekeeping, hingga Keamanan.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-900/30 cursor-pointer"
              title="Unduh dokumen formal format PDF"
            >
              <Download className="h-4 w-4" />
              <span>Cetak PDF Resmi</span>
            </button>

            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              title="Kirimkan tata tertib ke WhatsApp penghuni atau staf"
            >
              <Share2 className="h-4 w-4 text-emerald-400" />
              <span>Bagikan via WA</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Count */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Aturan Kos-Kosan
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-emerald-400">{KOS_RULES.length}</span>
              <span className="text-[10px] text-slate-400">Pasal Regulasi</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Regulasi Tamu Hotel
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-sky-400">{HOTEL_RULES.length}</span>
              <span className="text-[10px] text-slate-400">Ketentuan Baku</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              SOP Front Office
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-amber-400">{FO_STAFF_RULES.length}</span>
              <span className="text-[10px] text-slate-400">Alur Pelayanan</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              SOP Housekeeping
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-purple-400">{HK_STAFF_RULES.length}</span>
              <span className="text-[10px] text-slate-400">Prosedur Sanitasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("kos")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "kos"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Tata Tertib Kosan ({KOS_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hotel")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "hotel"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Tata Tertib Tamu Hotel ({HOTEL_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("fo")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "fo"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>SOP Front Office ({FO_STAFF_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hk")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "hk"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>SOP Housekeeping ({HK_STAFF_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sec")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "sec"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>SOP Maintenance &amp; K3</span>
        </button>

        <button
          onClick={() => setActiveTab("sanksi")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "sanksi"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Matriks Sanksi &amp; Denda</span>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "checklist"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCheck2 className="h-4 w-4 text-emerald-400" />
          <span>Checklist Audit Shift</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR (Untuk tab peraturan/SOP) */}
      {activeTab !== "sanksi" && activeTab !== "checklist" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-emerald-600" /> Filter Tingkat:
            </span>
            <button
              onClick={() => setSeverityFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                severityFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSeverityFilter("Wajib")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                severityFilter === "Wajib"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Wajib Dipatuhi
            </button>
            <button
              onClick={() => setSeverityFilter("Larangan Keras")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                severityFilter === "Larangan Keras"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              Larangan Keras
            </button>
            <button
              onClick={() => setSeverityFilter("Standar Operasional")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                severityFilter === "Standar Operasional"
                  ? "bg-sky-600 text-white"
                  : "bg-sky-50 text-sky-800 hover:bg-sky-100"
              }`}
            >
              Standar Operasional
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pasal, kata kunci, denda..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* CONTENT: TAB ATURAN & SOP */}
      {activeTab !== "sanksi" && activeTab !== "checklist" && (
        <div className="space-y-4">
          {currentItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Tidak ada pasal yang cocok dengan pencarian</p>
              <p className="text-xs text-slate-400">
                Coba gunakan kata kunci lain seperti "merokok", "deposit", "kunci", atau reset filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSeverityFilter("ALL");
                }}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            currentItems.map((item) => {
              const isExpanded = !!expandedRuleIds[item.id];
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-emerald-400">
                          {item.code}
                        </span>

                        {item.severity && (
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                              item.severity === "Larangan Keras"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : item.severity === "Wajib"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-800">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const fullText = `${item.code} - ${item.title}\n\n${item.summary}\n\nRincian:\n${item.details
                            .map((d, i) => `${i + 1}. ${d}`)
                            .join("\n")}${item.penalty ? `\n\nSanksi: ${item.penalty}` : ""}`;
                          handleCopyText(fullText, item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
                        title="Salin teks pasal"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>

                      <div className="p-2 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Expanded Details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-white space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Ketentuan &amp; Tata Laksana Baku:
                        </span>
                        <ul className="space-y-2 text-xs text-slate-700">
                          {item.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                              <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-emerald-200/60">
                                {idx + 1}
                              </span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Penalty Box */}
                      {item.penalty && (
                        <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/70 flex items-start gap-2.5 text-xs text-rose-900">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-extrabold text-rose-800">
                              Sanksi Pelanggaran:
                            </strong>
                            <span>{item.penalty}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENT: TAB MATRIKS SANKSI & DENDA RESMI */}
      {activeTab === "sanksi" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Matriks Disiplin, Sanksi &amp; Konsekuensi Hukum
                </h3>
                <p className="text-xs text-slate-500">
                  Pedoman penegakan disiplin bertingkat untuk menjaga keselamatan, kebersihan, dan integritas operasional.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SANCTION_MATRIX.map((s, idx) => {
              const isSevere = idx >= 2;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between space-y-4 ${
                    idx === 3
                      ? "border-rose-300 ring-1 ring-rose-100"
                      : idx === 2
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          idx === 3
                            ? "bg-rose-600 text-white"
                            : idx === 2
                            ? "bg-amber-500 text-slate-950 font-black"
                            : idx === 1
                            ? "bg-sky-100 text-sky-800 border border-sky-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Tingkat {idx + 1}: {s.level}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Target: {s.target}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Bentuk Pelanggaran:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {s.infractions.map((inf, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{inf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold ${
                      idx === 3
                        ? "bg-rose-50 text-rose-900 border border-rose-200 font-bold"
                        : "bg-slate-50 text-slate-800 border border-slate-200"
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Konsekuensi / Tindakan Manajemen:
                    </span>
                    {s.consequence}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT: TAB CHECKLIST AUDIT SHIFT KARYAWAN */}
      {activeTab === "checklist" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                Checklist Kepatuhan SOP Harian Karyawan (Daily Shift Audit)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alat bantu serah terima tugas (Handover) untuk memastikan standar kerja FO, Housekeeping, dan Keamanan terpenuhi.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">
                Selesai:{" "}
                <strong className="text-emerald-600 font-black">
                  {checklistItems.filter((i) => i.checked).length}
                </strong>{" "}
                / {checklistItems.length}
              </span>
              <button
                onClick={() =>
                  setChecklistItems((prev) => prev.map((item) => ({ ...item, checked: true })))
                }
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition"
              >
                Centang Semua
              </button>
            </div>
          </div>

          {/* Department Groupings */}
          {["Front Office", "Housekeeping", "Security & K3"].map((dept) => {
            const items = checklistItems.filter((i) => i.dept === dept);
            return (
              <div key={dept} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Departemen {dept}
                  </h4>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        item.checked
                          ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-lg border flex items-center justify-center transition ${
                            item.checked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {item.checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-semibold ${item.checked ? "line-through opacity-70" : ""}`}>
                          {item.label}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.checked
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {item.checked ? "Selesai" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL BAGIKAN VIA WHATSAPP */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Bagikan Ringkasan Tata Tertib</h3>
                  <p className="text-xs text-slate-400">Kirim teks resmi ke WhatsApp penghuni atau grup staf</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Kategori Ringkasan</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWaSelectedCategory("kos")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      waSelectedCategory === "kos"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Penghuni Kos
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSelectedCategory("hotel")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      waSelectedCategory === "hotel"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Tamu Hotel
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSelectedCategory("karyawan")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      waSelectedCategory === "karyawan"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    SOP Karyawan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Penerima (Opsional)</label>
                  <input
                    type="text"
                    value={waRecipientName}
                    onChange={(e) => setWaRecipientName(e.target.value)}
                    placeholder="Contoh: Kak Budi / Tamu Kamar 204"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    value={waRecipientPhone}
                    onChange={(e) => setWaRecipientPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pratinjau Pesan WhatsApp</label>
                <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {generateWhatsAppMessage()}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateWhatsAppMessage());
                  showToast("Teks pesan WhatsApp disalin ke clipboard!");
                }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Salin Teks
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  Kirim ke WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
