import React, { useState, useEffect, useRef } from "react";
import { UserRole } from "../../types";
import { 
  Phone, 
  Video, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  VideoOff, 
  Clock, 
  Volume2, 
  VolumeX, 
  User, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Activity,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CallLog {
  id: string;
  contactRole: UserRole;
  callType: "audio" | "video";
  direction: "incoming" | "outgoing";
  status: "Answered" | "Missed" | "Rejected";
  timestamp: string;
  duration?: number; // in seconds
}

interface VoiceCallTabProps {
  currentRole: UserRole;
  roleName: string;
  onShowNotification?: (title: string, message: string) => void;
}

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

const ROLE_NAMES: Record<UserRole, string> = {
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

const ROLE_AVATARS: Record<UserRole, string> = {
  "Super Admin": "AP", "Owner": "BS", "Manager": "DL", 
  "Receptionist": "AH", "Finance": "SR", "HR": "SR", 
  "Marketing/Sales": "CK", "Staff Maintenance": "RT", "Tenant/Penyewa": "RH"
};

export default function VoiceCallTab({ currentRole, roleName, onShowNotification }: VoiceCallTabProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  
  // Calling Machine States: "idle" | "dialing" | "incoming" | "active"
  const [callState, setCallState] = useState<"idle" | "dialing" | "incoming" | "active">("idle");
  const [targetContact, setTargetContact] = useState<UserRole>("Manager");
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing">("outgoing");
  
  // Active settings state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Real Local Media Stream tracking state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (callState === "active" && callType === "video" && !isCameraOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          activeStream = stream;
        })
        .catch((err) => {
          console.error("Gagal mendapatkan akses kamera / video call di chat:", err);
          setLocalStream(null);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
    };
  }, [callState, callType, isCameraOff]);

  // Timer state
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load call history
  useEffect(() => {
    const raw = localStorage.getItem("pms_call_history");
    if (raw) {
      try {
        setCallLogs(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse call history", e);
      }
    } else {
      // Seed initial history
      const seed: CallLog[] = [
        {
          id: "log-1",
          contactRole: "Manager",
          callType: "audio",
          direction: "outgoing",
          status: "Answered",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          duration: 145
        },
        {
          id: "log-2",
          contactRole: "Staff Maintenance",
          callType: "video",
          direction: "incoming",
          status: "Missed",
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      localStorage.setItem("pms_call_history", JSON.stringify(seed));
      setCallLogs(seed);
    }
  }, []);

  const saveCallLogs = (updated: CallLog[]) => {
    localStorage.setItem("pms_call_history", JSON.stringify(updated));
    setCallLogs(updated);
  };

  // Timer counter
  useEffect(() => {
    if (callState === "active") {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Outgoing Dialing auto connect simulator
  useEffect(() => {
    let connectTimeout: NodeJS.Timeout;
    if (callState === "dialing") {
      // Simulate recipient answering the phone after 3 seconds
      connectTimeout = setTimeout(() => {
        setCallState("active");
        if (onShowNotification) {
          onShowNotification(
            "Telepon Terhubung 📞",
            `${ROLE_NAMES[targetContact]} telah menjawab panggilan Anda.`
          );
        }
      }, 3000);
    }
    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
    };
  }, [callState, targetContact]);

  // Trigger calls manually
  const startOutgoingCall = (role: UserRole, type: "audio" | "video") => {
    if (role === currentRole) {
      alert("Anda tidak bisa menelpon diri Anda sendiri!");
      return;
    }
    setTargetContact(role);
    setCallType(type);
    setCallDirection("outgoing");
    setCallState("dialing");
    setIsMuted(false);
    setIsCameraOff(false);
  };

  // Simulate an incoming call from another role!
  const triggerSimulatedIncomingCall = (role: UserRole, type: "audio" | "video") => {
    if (role === currentRole) {
      alert("Akun simulator pemanggil tidak boleh sama dengan peran Anda saat ini!");
      return;
    }
    setTargetContact(role);
    setCallType(type);
    setCallDirection("incoming");
    setCallState("incoming");
  };

  const handleAcceptCall = () => {
    setCallState("active");
    if (onShowNotification) {
      onShowNotification(
        "Panggilan Dimulai",
        `Sedang tersambung dengan ${ROLE_NAMES[targetContact]}.`
      );
    }
  };

  const handleDeclineCall = () => {
    const newLog: CallLog = {
      id: "log-" + Date.now(),
      contactRole: targetContact,
      callType: callType,
      direction: "incoming",
      status: "Rejected",
      timestamp: new Date().toISOString()
    };
    saveCallLogs([newLog, ...callLogs]);
    setCallState("idle");
  };

  const handleEndCall = () => {
    // Record log
    const newLog: CallLog = {
      id: "log-" + Date.now(),
      contactRole: targetContact,
      callType: callType,
      direction: callDirection,
      status: "Answered",
      timestamp: new Date().toISOString(),
      duration: duration
    };
    saveCallLogs([newLog, ...callLogs]);
    setCallState("idle");
  };

  const clearCallHistory = () => {
    if (confirm("Hapus seluruh catatan panggilan kerja harian?")) {
      saveCallLogs([]);
    }
  };

  // Render timing stamp format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden">
      {/* Dial Panel Overlay / Calling States */}
      <AnimatePresence mode="wait">
        {callState !== "idle" ? (
          <motion.div
            key="calling-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col justify-between p-8 text-center"
          >
            {/* Top info badge */}
            <div className="flex items-center justify-center gap-1.5 py-4">
              <Activity className="w-4 h-4 text-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {callState === "dialing" && "Sedang memanggil rekan kerja..."}
                {callState === "incoming" && "Panggilan Masuk..."}
                {callState === "active" && `Panggilan ${callType === "video" ? "Video" : "Suara"} Berlangsung`}
              </span>
            </div>

            {/* Avatar & Calling Info card */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-5">
              <div className="relative">
                {/* Visual pulse animations */}
                {(callState === "dialing" || callState === "incoming") && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-150"></span>
                    <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse scale-125"></span>
                  </>
                )}
                
                <div className={`w-28 h-28 rounded-full border-2 border-indigo-500/40 bg-slate-900 flex items-center justify-center text-3xl font-bold font-mono text-indigo-300 ring-8 ring-slate-950 shadow-2xl overflow-hidden relative`}>
                  {callType === "video" && !isCameraOff && callState === "active" ? (
                    localStream ? (
                      <video
                        ref={(el) => {
                          if (el) el.srcObject = localStream;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-500 flex items-center justify-center text-white relative">
                        {/* Fake simulated camera feed representation */}
                        <span className="absolute bottom-2 right-2 text-[8px] bg-slate-950/70 p-1 px-1.5 rounded uppercase">Umpan Video</span>
                        <span className="animate-spin text-lg">📹</span>
                      </div>
                    )
                  ) : (
                    ROLE_AVATARS[targetContact]
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">{ROLE_NAMES[targetContact]}</h3>
                <span className="text-xs bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-full text-slate-400 font-mono inline-block mt-1">
                  {targetContact}
                </span>
              </div>

              {/* Connected Timer / Sound wave simulation */}
              {callState === "active" && (
                <div className="space-y-4">
                  <div className="text-3xl font-extrabold text-white font-mono tracking-wider">
                    {formatTime(duration)}
                  </div>

                  {/* soundwave bars */}
                  <div className="flex gap-1 justify-center h-8 items-end">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span 
                        key={i} 
                        className="w-1.5 bg-indigo-500/80 rounded animate-bounce shrink-0"
                        style={{ 
                          height: `${Math.floor(Math.random() * 24) + 6}px`,
                          animationDelay: `${i * 120}ms`,
                          animationDuration: "0.8s"
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="py-6 max-w-sm mx-auto w-full">
              {callState === "incoming" ? (
                /* Accept / Decline triggers for incoming calls */
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    onClick={handleDeclineCall}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition duration-150 cursor-pointer shadow-lg shadow-rose-600/10 border border-rose-500/20"
                    title="Tolak Panggilan"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCall}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-505 text-white rounded-full flex items-center justify-center transition duration-150 cursor-pointer shadow-lg shadow-emerald-600/10 border border-emerald-500/20 animate-bounce"
                    title="Terima Panggilan"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                /* Controls for Active / Outgoing dialing states */
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3.5 rounded-xl transition cursor-pointer ${
                      isMuted 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" 
                        : "bg-slate-900 text-slate-350 hover:bg-slate-800"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {callType === "video" && (
                    <button
                      type="button"
                      onClick={() => setIsCameraOff(!isCameraOff)}
                      className={`p-3.5 rounded-xl transition cursor-pointer ${
                        isCameraOff 
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" 
                          : "bg-slate-900 text-slate-350 hover:bg-slate-800"
                      }`}
                      title={isCameraOff ? "Aktifkan Kamera" : "Matikan Kamera"}
                    >
                      {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3.5 rounded-xl transition cursor-pointer ${
                      !isSpeakerOn 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" 
                        : "bg-slate-900 text-slate-350 hover:bg-slate-800"
                    }`}
                    title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={callState === "active" ? handleEndCall : () => setCallState("idle")}
                    className="p-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center shadow-lg shadow-rose-600/10 border border-rose-500/20"
                    title="Akhiri Panggilan"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Calling Dashboard panel */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden" key="dialer">
            
            {/* Staff list panel & simulator panel */}
            <div className="flex-1 p-6 flex flex-col justify-start border-r border-slate-800 bg-slate-950 overflow-y-auto">
              <span className="text-[10px] font-extrabold text-indigo-400 font-mono tracking-widest uppercase mb-3 text-left">
                Hubungi Rekan Kerja
              </span>

              {/* List of contact card keys */}
              <div className="space-y-2 flex-1">
                {ROLES_LIST.map(role => {
                  const isUserSelf = role === currentRole;
                  return (
                    <div
                      key={role}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isUserSelf 
                          ? "bg-slate-900/40 border-slate-900 opacity-60" 
                          : "bg-slate-900 border-slate-850 hover:border-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono">
                          {ROLE_AVATARS[role]}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-200">{ROLE_NAMES[role]}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{role} {isUserSelf && "(Anda)"}</span>
                        </div>
                      </div>

                      {!isUserSelf && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startOutgoingCall(role, "audio")}
                            className="p-2.5 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-600 text-slate-400 hover:text-white rounded-lg transition cursor-pointer shadow"
                            title="Panggilan Suara"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startOutgoingCall(role, "video")}
                            className="p-2.5 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-600 text-slate-400 hover:text-white rounded-lg transition cursor-pointer shadow"
                            title="Panggilan Video"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Simulated Incoming Call setup box from sandbox */}
              <div className="mt-6 p-4 bg-slate-900/50 border border-slate-900 rounded-xl space-y-3 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">
                  <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                  Simulasi Panggilan Masuk
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Ingin menguji skenario menerima telepon? Pilih pengirim dan klik tombol di bawah untuk memicu panggilan masuk instan.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase font-mono">Sumber Pemanggil:</label>
                    <select
                      value={targetContact}
                      onChange={(e) => setTargetContact(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[11px] text-white focus:outline-none"
                    >
                      {ROLES_LIST.filter(r => r !== currentRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => triggerSimulatedIncomingCall(targetContact, "audio")}
                      className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 text-[10px] font-bold rounded cursor-pointer leading-tight text-center truncate"
                    >
                      📞 Panggil Suara
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSimulatedIncomingCall(targetContact, "video")}
                      className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 text-[10px] font-bold rounded cursor-pointer leading-tight text-center truncate"
                    >
                      📹 Panggil Video
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Calling History panel (Right) */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-start bg-slate-900/10 overflow-y-auto">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4 text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-505 uppercase tracking-widest font-mono">
                    RIWAYAT PANGGILAN
                  </span>
                  <h4 className="text-xs text-slate-400 font-medium">Log panggilan kerja harian</h4>
                </div>

                {callLogs.length > 0 && (
                  <button
                    onClick={clearCallHistory}
                    className="p-1 px-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-500 hover:text-rose-400 text-[10px] rounded flex items-center gap-1 cursor-pointer transition font-mono uppercase"
                  >
                    <Trash2 className="w-3 h-3" /> Bersih
                  </button>
                )}
              </div>

              {/* List logs */}
              <div className="space-y-2">
                {callLogs.length > 0 ? (
                  callLogs.map(log => {
                    const isIncoming = log.direction === "incoming";
                    const isMissed = log.status === "Missed";
                    const isRejected = log.status === "Rejected";

                    return (
                      <div
                        key={log.id}
                        className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg flex items-center justify-between gap-3 text-left font-sans shadow-inner"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {isIncoming ? (
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg shrink-0">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          )}

                          <div className="overflow-hidden">
                            <h5 className="font-extrabold text-xs text-slate-300 truncate">
                              {ROLE_NAMES[log.contactRole] || log.contactRole}
                            </h5>
                            <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                              {log.contactRole} • {log.callType === "video" ? "Video" : "Suara"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-bold block ${
                            isMissed ? "text-rose-400 animate-pulse" :
                            isRejected ? "text-amber-500" : "text-emerald-400"
                          }`}>
                            {isMissed && "Tak Terjawab"}
                            {isRejected && "Ditolak"}
                            {!isMissed && !isRejected && "Tersambung"}
                          </span>
                          <span className="text-[8.5px] text-slate-500 font-mono block mt-0.5">
                            {log.duration ? `${formatTime(log.duration)}` : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-14 text-center text-slate-700">
                    <Activity className="w-8 h-8 text-slate-800 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs">Sesi panggilan kosong</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
