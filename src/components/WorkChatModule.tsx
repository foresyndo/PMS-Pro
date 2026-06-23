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
  Briefcase,
  PhoneCall,
  Calendar,
  FileText,
  User,
  Plus,
  Bell,
  X,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole, WorkChatMessage } from "../types";
import { isSupabaseConfigured } from "../lib/supabase";

// Import modular collaboration tab components
import VoiceCallTab from "./workchat/VoiceCallTab";
import CalendarTab from "./workchat/CalendarTab";
import PersonalNotesTab from "./workchat/PersonalNotesTab";

interface WorkChatModuleProps {
  activeRole: UserRole;
  chatMessages: WorkChatMessage[];
  onAddChatMessage: (msg: WorkChatMessage) => void;
  onClearChats?: () => void;
  supabaseLoading?: boolean;
}

const DEFAULT_CHANNELS = [
  { id: "#umum", name: "Umum & Pengumuman", desc: "Pemberitahuan umum, libur operasional, dan info penting seluruh tim." },
  { id: "#ops-lapangan", name: "Operasional Lapangan", desc: "Koordinasi harian antar resepsionis, manager, dan tim fasilitas." },
  { id: "#perbaikan-teknis", name: "Perbaikan Teknis", desc: "Laporan penanganan AC rusak, pipa bocor, kelistrikan, dan tukang." },
  { id: "#keuangan-admin", name: "Keuangan & Admin", desc: "Konfirmasi uang muka (deposit), invoice sewa lunas, dan pengeluaran token." },
  { id: "#penyewa-bantuan", name: "Bantuan Penyewa", desc: "Pertanyaan tamu, komplain wifi, barang tertinggal, bimbingan sewa kost." }
];

const DEFAULT_GROUPS = [
  { id: "g-ops", name: "Tim Manajemen PMS", desc: "Rapat koordinasi antar pembuat kebijakan pms.", members: ["Super Admin", "Owner", "Manager"] },
  { id: "g-lapangan", name: "Grup Satgas Sarpras", desc: "Koordinasi teknis penanganan unit, kebersihan dan renovasi.", members: ["Manager", "Receptionist", "Staff Maintenance"] }
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
    "Penyewa kamar 303 komplain wifi sangat lambat. Tolong tim IT restart modem.",
    "Kunci duplikat untuk penghuni baru kamar 206 sudah siap diambil di meja pendaftaran.",
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
    case "HR":
      return "bg-teal-500/10 text-teal-400 border-teal-500/25 ring-teal-500/10";
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

export const ROLE_NAMES: Record<UserRole, string> = {
  "Super Admin": "Andi Pratama",
  "Owner": "Budi Santoso",
  "Manager": "Dewi Lestari",
  "Receptionist": "Anton Hartono",
  "Finance": "Siti Rahma",
  "HR": "Siti Rahma (HR)",
  "Marketing/Sales": "Citra Kirana",
  "Staff Maintenance": "Rudi Tabuti",
  "Tenant/Penyewa": "Rian Hidayat"
};

const ROLES_LIST: UserRole[] = [
  "Super Admin",
  "Owner",
  "Manager",
  "Receptionist",
  "Finance",
  "HR",
  "Marketing/Sales",
  "Staff Maintenance",
  "Tenant/Penyewa"
];

export default function WorkChatModule({
  activeRole,
  chatMessages,
  onAddChatMessage,
  onClearChats,
  supabaseLoading = false
}: WorkChatModuleProps) {
  // Top level modules navigation: "chat" | "call" | "calendar" | "notes"
  const [activeTab, setActiveTab] = useState<"chat" | "call" | "calendar" | "notes">("chat");
  
  // Chat context navigation states
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [selectedChatType, setSelectedChatType] = useState<"channel" | "group" | "dm">("channel");
  const [selectedChatId, setSelectedChatId] = useState<string>("#umum");

  const [typedMessage, setTypedMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  
  // State for adding custom Channel & Group
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<UserRole[]>(["Manager"]);

  // Local augmented message store (adds Groups and DMs that works locally side-by-side with main chatMessages props)
  const [localExtendedMessages, setLocalExtendedMessages] = useState<WorkChatMessage[]>([]);

  // Simulation: state to switch who is sending the message
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(activeRole);
  const [simulatedName, setSimulatedName] = useState(ROLE_NAMES[activeRole] || "Staff PMS");

  // Floating Toast Notifications inside the workspace
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Sync simulatedRole if activeRole from PMS dashboard changes
  useEffect(() => {
    setSimulatedRole(activeRole);
    setSimulatedName(ROLE_NAMES[activeRole] || "Staff PMS");
  }, [activeRole]);

  // Load custom channels, groups & chat messages from local storage
  useEffect(() => {
    const localCh = localStorage.getItem("pms_custom_channels");
    if (localCh) {
      try { setChannels(JSON.parse(localCh)); } catch (e) {}
    }
    const localGr = localStorage.getItem("pms_custom_groups");
    if (localGr) {
      try { setGroups(JSON.parse(localGr)); } catch (e) {}
    }
    const localMsgs = localStorage.getItem("pms_extended_messages");
    if (localMsgs) {
      try { setLocalExtendedMessages(JSON.parse(localMsgs)); } catch (e) {}
    }
  }, []);

  // Auto scroll to chat bottom
  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [chatMessages, localExtendedMessages, selectedChatId, activeTab, selectedChatType]);

  const showLocalToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleRoleChange = (role: UserRole) => {
    setSimulatedRole(role);
    setSimulatedName(ROLE_NAMES[role] || "Staff PMS");
    // Auto-update DMs partner when switching role to inspect another DM thread if on DM screen
    if (selectedChatType === "dm" && selectedChatId === role) {
      // Find another available partner so we don't chat with ourselves
      const other = ROLES_LIST.find(r => r !== role);
      if (other) {
        setSelectedChatId(other);
      }
    }
  };

  // Create Channel action
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    let cleanName = newChannelName.trim().toLowerCase();
    if (!cleanName.startsWith("#")) {
      cleanName = "#" + cleanName;
    }

    const newChan = {
      id: cleanName,
      name: newChannelName.trim(),
      desc: newChannelDesc.trim() || "Saluran kustom untuk koordinasi khusus."
    };

    const updated = [...channels, newChan];
    setChannels(updated);
    localStorage.setItem("pms_custom_channels", JSON.stringify(updated));
    setSelectedChatId(cleanName);
    setSelectedChatType("channel");
    
    // reset
    setNewChannelName("");
    setNewChannelDesc("");
    setShowChannelModal(false);
    showLocalToast("Kanal Baru Dibuat! 🚀", `Kanal ${cleanName} sudah siap digunakan.`);
  };

  // Create Group Action
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const gId = "g-" + Date.now();
    const newGrp = {
      id: gId,
      name: newGroupName.trim(),
      desc: newGroupDesc.trim() || "Grup koordinasi kustom staf PMS.",
      members: [...newGroupMembers, simulatedRole]
    };

    const updated = [...groups, newGrp];
    setGroups(updated);
    localStorage.setItem("pms_custom_groups", JSON.stringify(updated));
    setSelectedChatId(gId);
    setSelectedChatType("group");

    // reset
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupMembers(["Manager"]);
    setShowGroupModal(false);
    showLocalToast("Grup Obrolan Berhasil! 👥", `Grup ${newGrp.name} berhasil dibuat.`);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMsg: WorkChatMessage = {
      id: "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      senderName: simulatedName,
      senderRole: simulatedRole,
      channel: selectedChatId, // serves as channel/group/dm indicator
      message: typedMessage.trim(),
      createdAt: new Date().toISOString()
    };

    if (selectedChatType === "channel") {
      // Send to main channel (uses main prop function to sync)
      onAddChatMessage(newMsg);
    } else {
      // Send to local DMs and Groups
      const updatedLocal = [...localExtendedMessages, newMsg];
      setLocalExtendedMessages(updatedLocal);
      localStorage.setItem("pms_extended_messages", JSON.stringify(updatedLocal));
    }

    setTypedMessage("");
  };

  const handleSendPresetOnChannel = (preset: string) => {
    const newMsg: WorkChatMessage = {
      id: "chat-preset-" + Date.now(),
      senderName: simulatedName,
      senderRole: simulatedRole,
      channel: selectedChatId,
      message: preset,
      createdAt: new Date().toISOString()
    };

    if (selectedChatType === "channel") {
      onAddChatMessage(newMsg);
    } else {
      const updatedLocal = [...localExtendedMessages, newMsg];
      setLocalExtendedMessages(updatedLocal);
      localStorage.setItem("pms_extended_messages", JSON.stringify(updatedLocal));
    }
  };

  // Get current messages selection
  const getCurrentChatMessages = () => {
    if (selectedChatType === "channel") {
      // Load from main synced messages + filter by channel
      return chatMessages.filter(m => m.channel === selectedChatId);
    } else if (selectedChatType === "group") {
      // Load from local group channel messages
      return localExtendedMessages.filter(m => m.channel === selectedChatId);
    } else {
      // DM Logic -> selectedChatId holds target contact Role
      // We filter messages where:
      // (sender is me AND recipient is target) OR (sender is target AND recipient matches me)
      // Since DM selector stores the target companion's role name in 'channel', we check matching pairs!
      return localExtendedMessages.filter(m => {
        const isMeSender = m.senderRole === simulatedRole && m.channel === `dm-${simulatedRole}-${selectedChatId}`;
        const isPartnerSender = m.senderRole === selectedChatId && m.channel === `dm-${selectedChatId}-${simulatedRole}`;
        
        // Let's also support older general mapping for compatibility
        const isGeneralDM = m.channel === `dm-${selectedChatId}-${simulatedRole}` || m.channel === `dm-${simulatedRole}-${selectedChatId}`;
        return isGeneralDM;
      });
    }
  };

  const handleSendDmMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim() || selectedChatType !== "dm") return;

    const dmChannelId = `dm-${simulatedRole}-${selectedChatId}`;

    const newMsg: WorkChatMessage = {
      id: "dm-" + Date.now(),
      senderName: simulatedName,
      senderRole: simulatedRole,
      channel: dmChannelId, // Store composite key for parsing
      message: typedMessage.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedLocal = [...localExtendedMessages, newMsg];
    setLocalExtendedMessages(updatedLocal);
    localStorage.setItem("pms_extended_messages", JSON.stringify(updatedLocal));
    setTypedMessage("");
  };

  const currentMessages = getCurrentChatMessages().filter(msg => {
    if (!messageSearchQuery.trim()) return true;
    return (
      msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  });

  const toggleGroupMemberSelection = (role: UserRole) => {
    if (newGroupMembers.includes(role)) {
      setNewGroupMembers(newGroupMembers.filter(r => r !== role));
    } else {
      setNewGroupMembers([...newGroupMembers, role]);
    }
  };

  const activeChatDetails = () => {
    if (selectedChatType === "channel") {
      const chan = channels.find(c => c.id === selectedChatId);
      return { name: chan?.name || selectedChatId, desc: chan?.desc || "" };
    } else if (selectedChatType === "group") {
      const grp = groups.find(g => g.id === selectedChatId);
      return { name: grp?.name || "Grup Tim", desc: grp?.desc || "" };
    } else {
      const partnerName = ROLE_NAMES[selectedChatId as UserRole] || selectedChatId;
      return { name: `DM: ${partnerName}`, desc: `Pesan langsung tertutup sesama rekan (${selectedChatId}).` };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      
      {/* Dynamic Floating Workspace Alerts Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-indigo-500/35 p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm"
          >
            <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg shrink-0">
              <Bell className="w-4 h-4 animate-swing" />
            </div>
            <div className="text-left font-sans">
              <h5 className="font-extrabold text-xs text-white leading-snug">{toast.title}</h5>
              <p className="text-[10.5px] text-slate-300 mt-1.5 leading-relaxed">{toast.desc}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-white p-1 ml-auto shrink-0 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Main Workspace Tab Select Row */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl shadow-inner">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              Forsdig PMS Pro Workspace
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/25 font-bold uppercase font-mono">
                Hub Kolaborasi
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 leading-normal">
              Koordinasi internal tim kerja: Chat, Saluran, VoIP Call, Meeting Planner, dan Memo pribadi.
            </p>
          </div>
        </div>

        {/* Modular Nav Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Obrolan Kerja
          </button>
          
          <button
            onClick={() => setActiveTab("call")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "call" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Panggilan Tim
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "calendar" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Kalender & Rapat
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "notes" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Catatan Pribadi
          </button>
        </div>
      </div>

      {/* Main Container Sandbox Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Render Modular Tabs conditionally */}
        {activeTab === "call" && (
          <div className="flex-1">
            <VoiceCallTab currentRole={simulatedRole} roleName={simulatedName} onShowNotification={showLocalToast} />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex-1">
            <CalendarTab currentRole={simulatedRole} roleName={simulatedName} onShowNotification={showLocalToast} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className="flex-1">
            <PersonalNotesTab currentRole={simulatedRole} roleName={simulatedName} />
          </div>
        )}

        {activeTab === "chat" && (
          <>
            {/* Sidebar Columns - Obrolan, Saluran, DM */}
            <div className="w-80 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between shrink-0 hidden md:flex">
              {/* Channel Search box */}
              <div className="p-4 border-b border-slate-800/80 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari kanal, grup, rekan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.value || e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  />
                </div>

                {/* Sub chat selector buttons */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-850">
                  <button
                    onClick={() => {
                      setSelectedChatType("channel");
                      setSelectedChatId("#umum");
                    }}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      selectedChatType === "channel" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Saluran
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChatType("group");
                      setSelectedChatId("g-ops");
                    }}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      selectedChatType === "group" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-505 hover:text-slate-300"
                    }`}
                  >
                    Grup
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChatType("dm");
                      // Select first non-me user role as partner
                      const companion = ROLES_LIST.find(r => r !== simulatedRole) || "Manager";
                      setSelectedChatId(companion);
                    }}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                      selectedChatType === "dm" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-505 hover:text-slate-300"
                    }`}
                  >
                    DM Saya
                  </button>
                </div>
              </div>

              {/* Scrollable listing */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {selectedChatType === "channel" && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-slate-500 px-3 py-2 uppercase tracking-wider flex items-center justify-between font-mono">
                      <span>SALURAN KOORDINASI ({channels.length})</span>
                      <button
                        onClick={() => setShowChannelModal(true)}
                        className="p-1 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 rounded border border-slate-900 cursor-pointer"
                        title="Buat Saluran Baru"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {channels.filter(ch => ch.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ch) => {
                      const isActive = selectedChatId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChatId(ch.id)}
                          className={`w-full flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-left transition duration-150 border ${
                            isActive
                              ? "bg-slate-900 border-indigo-500/35 text-white shadow"
                              : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                          }`}
                        >
                          <Hash className="w-4 h-4 mt-0.5 text-indigo-400/80" />
                          <div className="overflow-hidden">
                            <div className="font-bold text-xs truncate">{ch.name}</div>
                            <p className="text-[10px] text-slate-500 mt-1 lines-clamp-1 truncate w-[190px]">{ch.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedChatType === "group" && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-slate-500 px-3 py-2 uppercase tracking-wider flex items-center justify-between font-mono">
                      <span>PERCAKAPAN GRUP ({groups.length})</span>
                      <button
                        onClick={() => setShowGroupModal(true)}
                        className="p-1 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 rounded border border-slate-900 cursor-pointer"
                        title="Buat Grup Baru"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((g) => {
                      const isActive = selectedChatId === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedChatId(g.id)}
                          className={`w-full flex flex-col items-start gap-1 p-3.5 rounded-xl text-left transition duration-150 border ${
                            isActive
                              ? "bg-slate-900 border-indigo-500/35 text-white shadow"
                              : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <div className="font-bold text-xs truncate flex-1">{g.name}</div>
                          </div>
                          <p className="text-[10px] text-slate-500 lines-clamp-1 truncate w-[200px]">{g.desc}</p>
                          <div className="flex items-center gap-1 mt-1 text-[8.5px] text-slate-500">
                            <span>Anggota ({g.members?.length || 0}):</span>
                            <span className="truncate w-140 inline-block font-mono bg-slate-950 px-1 py-0.2 rounded border border-slate-900">{g.members?.slice(0, 3).join(", ")}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedChatType === "dm" && (
                  <div className="space-y-1 text-left">
                    <div className="text-[9px] font-bold text-slate-500 px-3 py-2 uppercase tracking-wider font-mono">
                      PESAN LANGSUNG STAF OBROLAN
                    </div>

                    {ROLES_LIST.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase())).map((role) => {
                      const isMe = role === simulatedRole;
                      const isActive = selectedChatId === role;

                      return (
                        <button
                          key={role}
                          onClick={() => {
                            if (isMe) {
                              alert("Anda tidak bisa memulai chat mandiri pribadi DM dengan akun Anda sendiri! Silakan ganti pengirim terlebih dahulu.");
                              return;
                            }
                            setSelectedChatId(role);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition duration-150 border ${
                            isActive
                              ? "bg-slate-900 border-indigo-505 text-white shadow animate-pulse-once"
                              : isMe 
                              ? "opacity-50 cursor-not-allowed border-transparent text-slate-600" 
                              : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-350"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMe ? "bg-slate-500" : "bg-emerald-400"}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isMe ? "bg-slate-600" : "bg-emerald-500"}`}></span>
                            </span>
                            <div className="truncate">
                              <div className="font-extrabold text-xs leading-none text-slate-200">{ROLE_NAMES[role]}</div>
                              <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">{role} {isMe && "(Anda)"}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ID CONTROL PANEL FOR SENDER OVERRIDE IN SIMULATION */}
              <div className="p-4 bg-slate-950/95 border-t border-slate-800/80 shrink-0">
                <div className="flex flex-col gap-2 rounded-xl bg-slate-900/50 p-3 border border-indigo-950">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-widest font-mono">
                      <Sparkles className="w-3 h-3 text-indigo-300 animate-bounce" />
                      Ganti Akun Pengirim
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 border border-slate-850 rounded">SIMULATOR</span>
                  </div>
                  
                  <div className="space-y-1.5 mt-0.5 text-left">
                    <div>
                      <select
                        value={simulatedRole}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {ROLES_LIST.map((r) => (
                          <option key={r} value={r}>
                            {r} ({ROLE_NAMES[r]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-normal font-sans">
                    Ganti identitas di atas untuk menguji kirim pesan 2-arah.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Chat Threads view */}
            <div className="flex-1 flex flex-col bg-slate-950 justify-between overflow-hidden relative">
              
              {/* Thread header */}
              <div className="bg-slate-900 px-6 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 text-left">
                  <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hidden sm:block">
                    {selectedChatType === "channel" && <Hash className="w-4 h-4 shrink-0" />}
                    {selectedChatType === "group" && <Users className="w-4 h-4 shrink-0" />}
                    {selectedChatType === "dm" && <User className="w-4 h-4 shrink-0" />}
                  </span>
                  <div>
                    {/* Mobile selectors for channels */}
                    <div className="md:hidden">
                      <select
                        value={selectedChatId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("#")) {
                            setSelectedChatType("channel");
                          } else if (val.startsWith("g-")) {
                            setSelectedChatType("group");
                          } else {
                            setSelectedChatType("dm");
                          }
                          setSelectedChatId(val);
                        }}
                        className="bg-slate-950 text-slate-100 font-extrabold text-xs rounded-lg border border-slate-805 py-1.5 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-lg"
                      >
                        <optgroup label="Saluran">
                          {channels.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                        </optgroup>
                        <optgroup label="Grup">
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </optgroup>
                        <optgroup label="Pesan Langsung (DM)">
                          {ROLES_LIST.filter(r => r !== simulatedRole).map(r => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
                        </optgroup>
                      </select>
                    </div>

                    <h3 className="hidden md:block font-bold text-slate-205 text-sm flex items-center gap-2">
                      {activeChatDetails().name}
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded ml-2 font-bold select-all">
                        {selectedChatId}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-snug mt-1 hidden sm:block">
                      {activeChatDetails().desc}
                    </p>
                  </div>
                </div>

                {/* Search current thread filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari obrolan..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-[11px] py-1.5 pl-7 pr-3 text-slate-200 w-32 sm:w-44 transition placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Message scroll log render */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-950/20 to-slate-900/60 flex flex-col justify-start">
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg, index) => {
                    const isMyself = msg.senderRole === simulatedRole;
                    const roleColorCls = getRoleColorClass(msg.senderRole);
                    const timestamp = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("id", {
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : "—";

                    return (
                      <motion.div
                        key={msg.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 max-w-[85%] ${isMyself ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl shrink-0 border flex items-center justify-center font-bold text-xs ring-4 ring-slate-900/20 font-mono ${roleColorCls}`}>
                          {msg.senderName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Speech Bubble Details */}
                        <div className="space-y-1 w-full text-left">
                          <div className={`flex items-center gap-2 text-[10.5px] ${isMyself ? "justify-end" : ""}`}>
                            <span className="font-bold text-slate-300">{msg.senderName}</span>
                            <span className={`text-[8.5px] px-1.5 font-bold rounded-full font-mono border ${roleColorCls}`}>
                              {msg.senderRole}
                            </span>
                            <span className="text-[10px] text-slate-550 font-mono">{timestamp}</span>
                          </div>

                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                            isMyself
                              ? "bg-indigo-600 text-white rounded-tr-none border-indigo-505/20 font-medium"
                              : "bg-slate-900 text-slate-205 rounded-tl-none border-slate-800/80 shadow-inner"
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="my-auto text-center py-10 opacity-60">
                    <MessageSquare className="w-12 h-12 text-slate-800 mx-auto mb-3 animate-ping-once" />
                    <h5 className="text-xs text-slate-400 font-bold">Kanal {selectedChatId} Kosong</h5>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto px-6">
                      Ketikkan pesan koordinasi pertama Anda di kolom bawah menggunakan akun simulated {simulatedRole}!
                    </p>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Balasan Preset helper bottom rail */}
              {selectedChatType === "channel" && PRESET_MESSAGES[selectedChatId] && (
                <div className="bg-slate-900/60 p-2.5 px-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2 shrink-0">
                  <span className="text-[8.5px] font-extrabold text-slate-500 uppercase flex items-center gap-1 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Balasan Cepat:
                  </span>
                  {PRESET_MESSAGES[selectedChatId]?.map((pres, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendPresetOnChannel(pres)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-md transition duration-100 border border-slate-850 truncate max-w-xs cursor-pointer"
                    >
                      {pres}
                    </button>
                  ))}
                </div>
              )}

              {/* Message typing box composer */}
              <div className="bg-slate-900 px-6 py-4 border-t border-slate-800/80 shrink-0">
                <form
                  onSubmit={selectedChatType === "dm" ? handleSendDmMessage : handleSendMessage}
                  className="flex gap-2.5"
                >
                  <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 focus-within:!border-indigo-500/80 p-1 flex items-center px-3 shadow-inner">
                    <div className={`mr-2.5 px-2 bg-slate-900 py-1 rounded text-[9px] font-bold border uppercase font-mono hidden sm:block ${getRoleColorClass(simulatedRole)}`}>
                      {simulatedRole}
                    </div>
                    <input
                      type="text"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      placeholder={`Ketik pesan kerja harian ke ${activeChatDetails().name}...`}
                      className="w-full bg-transparent py-2.5 text-xs focus:outline-none text-slate-200 placeholder-slate-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!typedMessage.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition duration-150 shadow border border-indigo-500/10 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </>
        )}
      </div>

      {/* CREATE CHANNEL DIALOG/MODAL */}
      <AnimatePresence>
        {showChannelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-6 text-left"
          >
            <motion.form
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -15 }}
              onSubmit={handleCreateChannel}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">📢 Buat Saluran Baru</span>
                <button type="button" onClick={() => setShowChannelModal(false)} className="text-slate-500 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Nama Saluran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: renovasi-harian"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Topik / Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsikan koordinasi khusus kanal ini..."
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-805">
                <button
                  type="button"
                  onClick={() => setShowChannelModal(false)}
                  className="px-3 py-2 bg-slate-955 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Buat Saluran
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE GROUP DIALOG/MODAL */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-6 text-left"
          >
            <motion.form
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -15 }}
              onSubmit={handleCreateGroup}
              className="w-full max-w-sm bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-2xl font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">👥 Buat Grup Obrolan</span>
                <button type="button" onClick={() => setShowGroupModal(false)} className="text-slate-500 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Nama Grup Obrolan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Restrukturisasi"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Deskripsi Grup / Divisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembahasan seputar pengadaan alat..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Members multi-tick */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Undang Anggota</label>
                <div className="max-h-24 overflow-y-auto p-1.5 bg-slate-955 border border-slate-800 rounded-lg space-y-1">
                  {ROLES_LIST.filter(r => r !== simulatedRole).map(role => (
                    <label key={role} className="flex items-center gap-2 text-xs text-slate-400 py-0.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newGroupMembers.includes(role)}
                        onChange={() => toggleGroupMemberSelection(role)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3 h-3"
                      />
                      <span>{role} ({ROLE_NAMES[role]})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-3 py-2 bg-slate-955 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Buat Grup
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
