import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Hash,
  Users,
  Search,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Clock,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole, WorkChatMessage } from "../types";
import { isSupabaseConfigured } from "../lib/supabase";

interface WorkChatModuleProps {
  activeRole: UserRole;
  chatMessages: WorkChatMessage[];
  onAddChatMessage: (msg: WorkChatMessage) => void;
  onClearChats?: () => void;
  supabaseLoading?: boolean;
}

const CHANNELS = [
  { id: "#umum", name: "Umum & Pengumuman", desc: "Pemberitahuan umum, libur operasional, dan info penting seluruh tim." },
  { id: "#ops-lapangan", name: "Operasional Lapangan", desc: "Koordinasi harian antar resepsionis, manager, dan tim fasilitas." },
  { id: "#perbaikan-teknis", name: "Perbaikan Teknis", desc: "Laporan penanganan AC rusak, pipa bocor, kelistrikan, dan tukang." },
  { id: "#keuangan-admin", name: "Keuangan & Admin", desc: "Konfirmasi uang muka (deposit), invoice sewa lunas, dan pengeluaran token." },
  { id: "#penyewa-bantuan", name: "Bantuan Penyewa", desc: "Pertanyaan tamu, komplain wifi, barang tertinggal, bimbingan sewa kost." }
];

const PRESET_MESSAGES: Record<string, string[]> = {
  "#umum": [
    "Selamat pagi semuanya, mohon pastikan laporan harian serah terima shift diisi tepat waktu.",
    "Pemberitahuan: Pemeliharaan gardu listrik area utama dijadwalkan besok jam 09.00-11.00 WIB.",
    "Mohon perhatian seluruh departemen agar mengunggah dokumen operasional terbaru ke sistem PMS."
  ],
  "#ops-lapangan": [
    "Kamar 102 dilaporkan sudah kosong (check-out). Tim housekeeping mohon segera bersiap.",
    "Apakah ada tambahan unit extra bed yang masih menganggur di gudang penyimpanan?",
    "Penyewa kamar 304 meminta penggantian handuk baru siang ini."
  ],
  "#perbaikan-teknis": [
    "Kerusakan pipa ledeng di toilet kamar mandi lantai 2 sudah berhasil kami atasi.",
    "Telah dipesan kompresor AC baru untuk unit 105. Kuitansi toko akan segera disetor.",
    "Lampu koridor timur mati dua buah, tim pemeliharaan akan segera mengganti bohlamnya sore ini."
  ],
  "#keuangan-admin": [
    "Invoice tagihan sewa bulanan tenant kamar 201 sudah lunas ditransfer. Mohon dicek.",
    "Silakan serahkan nota pembelian semen/pipa perbaikan hari ini ke divisi keuangan.",
    "Pembayaran deposit untuk pemesanan villa unit A telah diterima di rekening mandiri."
  ],
  "#penyewa-bantuan": [
    "Penyewa kamar 303 komplain koneksi wifi sangat lambat. Tolong tim IT restart modem.",
    "Kunci duplikat untuk penghuni baru kamar 206 sudah siap diambil di meja resepsionis.",
    "Tamu menanyakan apakah boleh melakukan late checkout hingga jam 15.00 sore ini?"
  ]
};

// Map roles to distinctive color themes optimized for modern dark interface
export const getRoleColorClass = (role: UserRole) => {
  switch (role) {
    case "Super Admin":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25 ring-rose-500/10";
    case "Owner":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25 ring-amber-500/10";
    case "Manager":
      return "bg-violet-500/10 text-violet-400 border-violet-500/25 ring-violet-500/10";
    case "Receptionist":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 ring-emerald-500/10";
    case "Finance":
      return "bg-blue-500/10 text-blue-400 border-blue-500/25 ring-blue-500/10";
    case "Marketing/Sales":
      return "bg-pink-500/10 text-pink-400 border-pink-500/25 ring-pink-500/10";
    case "Staff Maintenance":
      return "bg-orange-500/10 text-orange-400 border-orange-500/25 ring-orange-500/10";
    case "Tenant/Penyewa":
      return "bg-slate-500/10 text-slate-400 border-slate-500/25 ring-slate-500/10";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/20 ring-slate-500/10";
  }
};

const ROLE_NAMES: Record<UserRole, string> = {
  "Super Admin": "Andi Pratama",
  "Owner": "Budi Santoso",
  "Manager": "Dewi Lestari",
  "Receptionist": "Anton Hartono",
  "Finance": "Siti Rahma",
  "Marketing/Sales": "Citra Kirana",
  "Staff Maintenance": "Rudi Tabuti",
  "Tenant/Penyewa": "Rian Hidayat"
};

export default function WorkChatModule({
  activeRole,
  chatMessages,
  onAddChatMessage,
  onClearChats,
  supabaseLoading = false
}: WorkChatModuleProps) {
  const [selectedChannel, setSelectedChannel] = useState("#umum");
  const [typedMessage, setTypedMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  
  // Simulation: state to switch who is sending the message
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(activeRole);
  const [simulatedName, setSimulatedName] = useState(ROLE_NAMES[activeRole] || "Staff PMS");

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat messages bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, selectedChannel]);

  // Keep simulatedRole in sync if system-wide activeRole changes
  useEffect(() => {
    setSimulatedRole(activeRole);
    setSimulatedName(ROLE_NAMES[activeRole] || "Staff PMS");
  }, [activeRole]);

  const handleRoleChange = (role: UserRole) => {
    setSimulatedRole(role);
    setSimulatedName(ROLE_NAMES[role] || "Staff PMS");
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMsg: WorkChatMessage = {
      id: "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      senderName: simulatedName,
      senderRole: simulatedRole,
      channel: selectedChannel,
      message: typedMessage.trim(),
      createdAt: new Date().toISOString()
    };

    onAddChatMessage(newMsg);
    setTypedMessage("");
  };

  const handleSendPreset = (preset: string) => {
    const newMsg: WorkChatMessage = {
      id: "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      senderName: simulatedName,
      senderRole: simulatedRole,
      channel: selectedChannel,
      message: preset,
      createdAt: new Date().toISOString()
    };
    onAddChatMessage(newMsg);
  };

  // Filter messages for current channel + search filter
  const displayedMessages = chatMessages.filter((msg) => {
    const isChannelMatch = msg.channel === selectedChannel;
    if (!isChannelMatch) return false;
    if (!messageSearchQuery.trim()) return true;
    return (
      msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.senderRole.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  });

  // Filter channels based in sidebar search
  const filteredChannels = CHANNELS.filter(
    (ch) =>
      ch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group roles for visual list
  const rolesList: UserRole[] = [
    "Super Admin",
    "Owner",
    "Manager",
    "Receptionist",
    "Finance",
    "Marketing/Sales",
    "Staff Maintenance",
    "Tenant/Penyewa"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Header Panel */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-inner animate-pulse">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Kanal Koordinasi & Chat Kerja
              <span className="text-xs bg-indigo-500/25 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                Multi-Role Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Media komunikasi internal real-time antar departemen pengelola properti.
            </p>
          </div>
        </div>

        {/* Database Config Indicator */}
        <div className="flex items-center gap-2.5">
          {isSupabaseConfigured() ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Supabase Terkoneksi (Awan/Live)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-lg text-xs font-semibold shadow-sm">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Penyimpanan Browser (Simulasi)
            </div>
          )}

          {onClearChats && (
            <button
              onClick={onClearChats}
              className="p-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 bg-slate-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 text-xs transition duration-200 flex items-center gap-1.5 font-medium shadow-sm cursor-pointer"
              title="Reset Chat ke Data Default"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Diskusi
            </button>
          )}
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Channels and Simulation */}
        <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 hidden md:flex">
          {/* Channel Search box */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Cari kanal atau topik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150 shadow-inner"
              />
            </div>
          </div>

          {/* List of Channels */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest flex items-center justify-between font-mono">
              <span>SALURAN KOORDINASI</span>
              <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] py-0.5 px-2 rounded font-mono">
                {CHANNELS.length} SEC
              </span>
            </div>

            {filteredChannels.map((ch) => {
              const isActive = selectedChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition duration-200 border ${
                    isActive
                      ? "bg-slate-900 border-indigo-500/40 text-white shadow-lg shadow-indigo-900/10"
                      : "border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                  }`}
                >
                  <Hash className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                  <div className="overflow-hidden">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span className="truncate">{ch.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredChannels.length === 0 && (
              <div className="p-4 text-xs text-slate-600 text-center">
                Materi/Saluran tidak ditemukan.
              </div>
            )}

            {/* Simulated Active Profiles */}
            <div className="pt-6">
              <div className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Users className="w-3.5 h-3.5 text-indigo-400/70" />
                <span>DAFTAR ONLINE PERAN</span>
              </div>
              <div className="p-2 space-y-1 bg-slate-900/20 rounded-xl border border-slate-900 mt-2">
                {rolesList.map((role) => {
                  const roleCls = getRoleColorClass(role);
                  return (
                    <div key={role} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-900/40 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold text-slate-300">{ROLE_NAMES[role]}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium font-mono ${roleCls}`}>
                        {role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIMULATED IDENTITY COMPOSER CONTROLE PANEL */}
          <div className="p-4 bg-slate-950/95 border-t border-slate-800">
            <div className="flex flex-col gap-2 rounded-xl bg-slate-900/50 p-3.5 border border-indigo-950">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-widest font-mono">
                  <Sparkles className="w-3 h-3 text-indigo-300 animate-bounce" />
                  Ganti Akun Pengirim
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">SIMULATION</span>
              </div>
              
              <div className="space-y-2 mt-1">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Simulasikan Sebagai Peran:</label>
                  <select
                    value={simulatedRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r} ({ROLE_NAMES[r]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Kustom Nama Staff:</label>
                  <input
                    type="text"
                    value={simulatedName}
                    onChange={(e) => setSimulatedName(e.target.value)}
                    placeholder="Nama simulasi staff..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-1.5 text-[10px] text-slate-400 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/20 leading-relaxed font-sans">
                Ganti peran di atas untuk mensimulasikan diskusi dua arah antar departemen PMS (Manager, Tenant, Maintenance, dll).
              </div>
            </div>
          </div>
        </div>

        {/* Right Active Room Area */}
        <div className="flex-1 flex flex-col bg-slate-950 justify-between">
          
          {/* Active room header */}
          <div className="bg-slate-900 px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hidden sm:block">
                <Hash className="w-4 h-4 shrink-0" />
              </span>
              <div>
                {/* On mobile: Render Selector select dropdown. On Desktop: text header */}
                <div className="flex items-center gap-2">
                  <div className="md:hidden">
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="bg-slate-950 text-slate-100 font-bold text-sm rounded-lg border border-slate-800 py-1.5 px-3 focus:outline-none focus:border-indigo-500 shadow-lg cursor-pointer"
                    >
                      {CHANNELS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.id} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <h3 className="hidden md:block font-bold text-slate-200 flex items-center gap-2">
                    {CHANNELS.find((c) => c.id === selectedChannel)?.name || selectedChannel}
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded ml-2">
                      {selectedChannel}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-normal mt-1 hidden sm:block">
                  {CHANNELS.find((c) => c.id === selectedChannel)?.desc}
                </p>
              </div>
            </div>

            {/* Toolbar Search message and identity */}
            <div className="flex items-center gap-4">
              {/* Message Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari obrolan..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="bg-slate-950 hover:bg-slate-900 focus:bg-slate-900 border border-slate-805 focus:border-indigo-500 rounded-lg text-xs py-1.5 pl-8 pr-3 text-slate-200 w-40 sm:w-48 transition placeholder-slate-500 focus:outline-none shadow-inner"
                />
              </div>

              {/* Quick Mobile role preview indicator */}
              <div className="md:hidden flex items-center gap-2 bg-slate-950/50 p-1 px-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Sebagai:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border leading-none ${getRoleColorClass(simulatedRole)}`}>
                  {simulatedRole}
                </span>
              </div>
            </div>
          </div>

          {/* Messages list render */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-950/20 to-slate-950/40">
            {displayedMessages.length > 0 ? (
              <div className="space-y-5">
                {displayedMessages.map((msg, index) => {
                  const isMyself = msg.senderRole === simulatedRole && msg.senderName === simulatedName;
                  const roleColorCls = getRoleColorClass(msg.senderRole);
                  const parsedTime = new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3.5 max-w-[85%] ${isMyself ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar Initials Badge */}
                      <div className={`w-9.5 h-9.5 rounded-xl shrink-0 border flex items-center justify-center font-bold text-xs ring-4 ring-slate-900/30 font-mono transition duration-300 hover:scale-105 ${roleColorCls}`}>
                        {msg.senderName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>

                      {/* Content block */}
                      <div className="space-y-1 w-full">
                        {/* Meta header info */}
                        <div className={`flex items-center gap-2 text-xs flex-wrap ${isMyself ? "justify-end" : ""}`}>
                          <span className="font-bold text-slate-200">{msg.senderName}</span>
                          <span className={`text-[9px] px-2 py-0.2 rounded-full border font-semibold font-mono ${roleColorCls}`}>
                            {msg.senderRole}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{parsedTime}</span>
                        </div>

                        {/* Interactive speech bubbles */}
                        <div className={`p-4.5 rounded-2xl text-[13.5px] leading-relaxed shadow-lg transition-transform duration-200 cursor-default ${
                          isMyself
                            ? "bg-indigo-600 text-white rounded-tr-none border border-indigo-500/50 shadow-indigo-600/10 font-medium"
                            : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/80 shadow-black/30 hover:border-slate-700 font-normal"
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-600">
                <MessageSquare className="w-14 h-14 text-slate-800 mb-4 animate-bounce" />
                <h4 className="text-sm font-semibold text-slate-400">
                  {messageSearchQuery ? "Tidak ada pesan yang cocok" : "Belum ada obrolan pekerjaan"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                  {messageSearchQuery 
                    ? "Coba sesuaikan kata kunci pencarian Anda untuk menemukan koordinasi harian yang lama."
                    : `Mulai diskusikan pendelegasian atau laporan pemeliharaan di saluran ${selectedChannel}.`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick presets helper context bottom rail */}
          <div className="bg-slate-900/60 p-3 px-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1.5 select-none font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              BALASAN SCHEDULER CEPAT:
            </span>
            {PRESET_MESSAGES[selectedChannel]?.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPreset(preset)}
                className="text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition duration-150 border border-slate-800 hover:border-slate-700 truncate max-w-xs cursor-pointer shadow-sm shadow-black/10"
                title={preset}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Typing Form Field Composer */}
          <div className="bg-slate-900 px-6 py-4.5 border-t border-slate-800/80">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 hover:border-slate-750 focus-within:!border-indigo-500/80 transition duration-150 flex items-center px-4.5 shadow-inner">
                
                {/* Simulated role avatar inline for typing section */}
                <div className={`mr-3 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase font-mono shadow-sm hidden sm:block ${getRoleColorClass(simulatedRole)}`}>
                  {simulatedRole}
                </div>

                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={`Ketik pesan koordinasi kerja harian ke ${selectedChannel}...`}
                  className="w-full bg-transparent py-3.5 text-sm focus:outline-none text-slate-100 placeholder-slate-550"
                />
              </div>

              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-4 rounded-xl flex items-center justify-center transition duration-200 shrink-0 shadow-lg shadow-indigo-600/10 border border-indigo-500/20 cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

            <div className="md:hidden mt-3.5 p-2 bg-slate-950 rounded-xl flex items-center justify-between gap-3.5 border border-slate-850">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono tracking-wider">SENDER AKUN:</span>
                <select
                  value={simulatedRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 px-2 text-[11px] text-white focus:outline-none cursor-pointer"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r} - {ROLE_NAMES[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
