import React, { useState, useEffect, useRef } from "react";
import { UserRole } from "../types";
import { 
  Calendar as CalendarIcon, 
  Video, 
  Phone, 
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
  Bell, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  X,
  Play,
  Users,
  MapPin,
  Sparkles,
  Info,
  ListTodo,
  Paperclip,
  Upload,
  Download,
  FileText,
  File,
  FileUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface MeetingAttachment {
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  location: string;
  desc: string;
  participants: UserRole[];
  isReminderEnabled: boolean;
  reminderLeadTime: string; // "5 Menit" | "15 Menit" | "1 Jam" | "1 Hari"
  createdBy: UserRole;
  createdAt: string;
  agendaTopics?: string[];
  attachments?: MeetingAttachment[];
  rsvpStatus?: Record<string, "Hadir" | "Tidak Hadir" | "Belum Menjawab">;
}

interface CallLog {
  id: string;
  contactRole: UserRole;
  callType: "audio" | "video";
  direction: "incoming" | "outgoing";
  status: "Answered" | "Missed" | "Rejected";
  timestamp: string;
  duration?: number; // seconds
}

interface CalendarRapatModuleProps {
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
  "Super Admin": "AP", 
  "Owner": "BS", 
  "Manager": "DL", 
  "Receptionist": "AH", 
  "Finance": "SR", 
  "HR": "SR", 
  "Marketing/Sales": "CK", 
  "Staff Maintenance": "RT", 
  "Tenant/Penyewa": "RH"
};

const PRESET_MEETING_LOCATIONS = [
  "Google Meet (Online Sim)",
  "Microsoft Teams (Online)",
  "Zoom Video Call Suite",
  "Ruang Rapat Kantor Utama",
  "Lobby Lounge Properti",
  "Sesi Video Call Internal"
];

// Helper to synthesize custom retro beep ringtones using Web Audio API safely
function playSoundAlert(type: "ring" | "alert" | "end") {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "ring") {
      // Periodic telephone ringing chime
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // major third interval
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === "alert") {
      // Urgent wake-up notice pitch
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 pitch
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === "end") {
      // Descending beep
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
      osc.frequency.setValueAtTime(220.00, audioCtx.currentTime + 0.1); // A3
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.debug("Audio play blocked until gesture activation", e);
  }
}

export default function CalendarRapatModule({ currentRole, roleName, onShowNotification }: CalendarRapatModuleProps) {
  // Main Tab Navigation inside the module
  const [moduleSubTab, setModuleSubTab] = useState<"calendar" | "videocall">("calendar");

  // State log lists
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  // Selection dates
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Create Form State
  const [isScheduling, setIsScheduling] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("Google Meet (Online Sim)");
  const [newDesc, setNewDesc] = useState("");
  const [newParticipants, setNewParticipants] = useState<UserRole[]>(["Manager", "Receptionist"]);
  const [isReminderEnabled, setIsReminderEnabled] = useState(true);
  const [reminderLeadTime, setReminderLeadTime] = useState("15 Menit");
  const [newAgendaTopics, setNewAgendaTopics] = useState<string[]>([]);
  const [agendaInput, setAgendaInput] = useState("");
  const [dragOverMeetingId, setDragOverMeetingId] = useState<string | null>(null);
  
  // Custom Alarm Popup UI State
  const [activeAlarm, setActiveAlarm] = useState<Meeting | null>(null);

  // Calling Machine States: "idle" | "dialing" | "incoming" | "active"
  const [callState, setCallState] = useState<"idle" | "dialing" | "incoming" | "active">("idle");
  const [targetContact, setTargetContact] = useState<UserRole>("Manager");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing">("outgoing");

  // Call options state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

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
          console.error("Gagal mendapatkan akses kamera / video call:", err);
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

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC negotiation configurations & simulated media log parameters
  const [webrtcLogs, setWebrtcLogs] = useState<string[]>([]);
  const [webrtcStatus, setWebrtcStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [activeMeetingSubject, setActiveMeetingSubject] = useState<string | null>(null);

  // Load and seed initial database entries
  useEffect(() => {
    // 1. Load Calendar Meetings
    const storedMeetings = localStorage.getItem("pms_meetings");
    if (storedMeetings) {
      try {
        const parsed = JSON.parse(storedMeetings) as Meeting[];
        const backfilled = parsed.map(m => {
          if (!m.rsvpStatus) {
            const rsvp: Record<string, "Hadir" | "Tidak Hadir" | "Belum Menjawab"> = {};
            m.participants.forEach(p => {
              rsvp[p] = p === m.createdBy ? "Hadir" : "Belum Menjawab";
            });
            return { ...m, rsvpStatus: rsvp };
          }
          return m;
        });
        setMeetings(backfilled);
      } catch (e) {
        console.error("Failed parsing stored meetings", e);
      }
    } else {
      const todayString = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split("T")[0];

      const seed: Meeting[] = [
        {
          id: "meet-seed-1",
          title: "Evaluasi Komplain AC & Bocoran Kamar 105",
          date: todayString,
          time: "10:30",
          location: "Lobby Lounge Properti",
          desc: "Diskusi sinkronisasi antara Manager dan Staff Maintenance mengenai penanganan instalasi AC baru.",
          participants: ["Manager", "Staff Maintenance"],
          isReminderEnabled: true,
          reminderLeadTime: "15 Menit",
          createdBy: "Manager",
          createdAt: new Date().toISOString(),
          agendaTopics: [
            "Identifikasi penyebab kebocoran plafon di Kamar 105",
            "Evaluasi kinerja unit AC dan rencana penggantian suku cadang",
            "Alokasi jadwal pengerjaan oleh Staff Maintenance"
          ],
          rsvpStatus: {
            "Manager": "Hadir",
            "Staff Maintenance": "Belum Menjawab"
          }
        },
        {
          id: "meet-seed-2",
          title: "Rapat Koordinasi Anggaran Finansial Triwulan",
          date: tomorrowString,
          time: "14:00",
          location: "Zoom Video Call Suite",
          desc: "Review pembukuan setoran sewa kost-kostan bulanan dan tagihan listrik prabayar bersama Owner.",
          participants: ["Owner", "Manager", "Finance"],
          isReminderEnabled: true,
          reminderLeadTime: "1 Jam",
          createdBy: "Owner",
          createdAt: new Date().toISOString(),
          agendaTopics: [
            "Review laporan keuangan triwulan kedua",
            "Analisis tunggakan pembayaran sewa beberapa unit tenant",
            "Persetujuan pengeluaran darurat untuk perbaikan fasilitas umum"
          ],
          rsvpStatus: {
            "Owner": "Hadir",
            "Manager": "Hadir",
            "Finance": "Belum Menjawab"
          }
        }
      ];
      localStorage.setItem("pms_meetings", JSON.stringify(seed));
      setMeetings(seed);
    }

    // 2. Load call history logs
    const storedCalls = localStorage.getItem("pms_call_history");
    if (storedCalls) {
      try {
        setCallLogs(JSON.parse(storedCalls));
      } catch (e) {
        console.error("Failed to parse call logs", e);
      }
    } else {
      const seedHistory: CallLog[] = [
        {
          id: "call-seed-1",
          contactRole: "Manager",
          callType: "video",
          direction: "incoming",
          status: "Answered",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          duration: 342
        },
        {
          id: "call-seed-2",
          contactRole: "Receptionist",
          callType: "audio",
          direction: "outgoing",
          status: "Missed",
          timestamp: new Date(Date.now() - 8640000).toISOString()
        }
      ];
      localStorage.setItem("pms_call_history", JSON.stringify(seedHistory));
      setCallLogs(seedHistory);
    }
  }, []);

  const saveMeetings = (updated: Meeting[]) => {
    localStorage.setItem("pms_meetings", JSON.stringify(updated));
    setMeetings(updated);
  };

  const saveCallLogs = (updated: CallLog[]) => {
    localStorage.setItem("pms_call_history", JSON.stringify(updated));
    setCallLogs(updated);
  };

  // Video call duration timer integration
  useEffect(() => {
    if (callState === "active") {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
        // Play subtle ambient signal every 15 secs so calling feels real
        if (callDuration % 10 === 0) {
          // Play micro click sound wave
        }
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

  // Outgoing Call Simulation Connect flow
  useEffect(() => {
    let connectTimeout: NodeJS.Timeout;
    if (callState === "dialing") {
      // Loop chime ringtone
      const intervalChime = setInterval(() => {
        playSoundAlert("ring");
      }, 1200);

      connectTimeout = setTimeout(() => {
        clearInterval(intervalChime);
        setCallState("active");
        playSoundAlert("alert"); // notification sound
        if (onShowNotification) {
          onShowNotification(
            "Video Call Terhubung! 📹",
            `${ROLE_NAMES[targetContact]} telah bergabung dalam rapat video call.`
          );
        }
      }, 3500);

      return () => {
        clearInterval(intervalChime);
        clearTimeout(connectTimeout);
      };
    }
  }, [callState, targetContact]);

  // Incoming Call Ringtone
  useEffect(() => {
    let ringInterval: NodeJS.Timeout;
    if (callState === "incoming") {
      playSoundAlert("ring");
      ringInterval = setInterval(() => {
        playSoundAlert("ring");
      }, 1500);
    }
    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [callState]);

  // Create scheduled meeting request handler
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime || !selectedDate) return;

    const initialRsvp: Record<string, "Hadir" | "Tidak Hadir" | "Belum Menjawab"> = {};
    newParticipants.forEach(p => {
      initialRsvp[p] = p === currentRole ? "Hadir" : "Belum Menjawab";
    });

    const newMeet: Meeting = {
      id: "meet-" + Date.now(),
      title: newTitle.trim(),
      date: selectedDate,
      time: newTime,
      location: newLocation,
      desc: newDesc.trim(),
      participants: newParticipants,
      isReminderEnabled: isReminderEnabled,
      reminderLeadTime: reminderLeadTime,
      createdBy: currentRole,
      createdAt: new Date().toISOString(),
      agendaTopics: newAgendaTopics,
      rsvpStatus: initialRsvp
    };

    const updated = [...meetings, newMeet].sort((a, b) => {
      return (a.date + " " + a.time).localeCompare(b.date + " " + b.time);
    });

    saveMeetings(updated);
    setIsScheduling(false);

    // Reset components creation inputs
    setNewTitle("");
    setNewTime("");
    setNewLocation("Google Meet (Online Sim)");
    setNewDesc("");
    setNewParticipants(["Manager", "Receptionist"]);
    setIsReminderEnabled(true);
    setReminderLeadTime("15 Menit");
    setNewAgendaTopics([]);
    setAgendaInput("");

    playSoundAlert("alert");

    if (onShowNotification) {
      onShowNotification(
        "Rapat Terjadwal! 📅",
        `Rapat "${newMeet.title}" berhasil diatur untuk ${newMeet.date} pukul ${newMeet.time} WIB.`
      );
    } else {
      alert(`Jadwal Rapat Baru "${newMeet.title}" sukses diatur!`);
    }
  };

  const handleAddAgendaTopic = (meetingId: string, topic: string) => {
    if (!topic.trim()) return;
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const oldTopics = m.agendaTopics || [];
        return {
          ...m,
          agendaTopics: [...oldTopics, topic.trim()]
        };
      }
      return m;
    });
    saveMeetings(updated);
  };

  const handleRemoveAgendaTopic = (meetingId: string, index: number) => {
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const oldTopics = m.agendaTopics || [];
        return {
          ...m,
          agendaTopics: oldTopics.filter((_, idx) => idx !== index)
        };
      }
      return m;
    });
    saveMeetings(updated);
  };

  const handleUpdateRSVP = (meetingId: string, role: UserRole, status: "Hadir" | "Tidak Hadir" | "Belum Menjawab") => {
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const oldRsvp = m.rsvpStatus || {};
        const newRsvp = { ...oldRsvp, [role]: status };
        return {
          ...m,
          rsvpStatus: newRsvp
        };
      }
      return m;
    });
    saveMeetings(updated);
    if (onShowNotification) {
      onShowNotification(
        "RSVP Diperbarui! 📝",
        `Kehadiran ${role} diubah menjadi "${status}" secara real-time.`
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleAddAttachment = (meetingId: string, name: string, url: string, size: string) => {
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const oldAttachments = m.attachments || [];
        const newAttachment = {
          name,
          url,
          size,
          uploadedAt: new Date().toISOString()
        };
        return {
          ...m,
          attachments: [...oldAttachments, newAttachment]
        };
      }
      return m;
    });
    saveMeetings(updated);
  };

  const handleRemoveAttachment = (meetingId: string, index: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus lampiran dokumen ini?")) {
      const updated = meetings.map(m => {
        if (m.id === meetingId) {
          const oldAttachments = m.attachments || [];
          return {
            ...m,
            attachments: oldAttachments.filter((_, idx) => idx !== index)
          };
        }
        return m;
      });
      saveMeetings(updated);
    }
  };

  const handleFileUpload = (meetingId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // File size limit config: 1.5MB (fits comfortably in local pms_meetings localStorage block)
    const MAX_SIZE = 1.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const errMsg = `Batas maksimum file adalah 1.5 MB untuk kestabilan penyimpanan browser. File "${file.name}" berukuran ${formatFileSize(file.size)}.`;
      if (onShowNotification) {
        onShowNotification("Ukuran File Terlalu Besar ⚠️", errMsg);
      } else {
        alert(errMsg);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      handleAddAttachment(meetingId, file.name, dataUrl, formatFileSize(file.size));
      if (onShowNotification) {
        onShowNotification(
          "File Berhasil Diunggah! 📎",
          `Dokumen "${file.name}" siap diakses oleh para peserta sebelum rapat dimulai.`
        );
      }
    };
    reader.onerror = () => {
      alert("Gagal membaca file tersebut.");
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMeeting = (id: string, title: string) => {
    if (confirm(`Yakin ingin membatalkan jadwal rapat "${title}"?`)) {
      const filtered = meetings.filter(m => m.id !== id);
      saveMeetings(filtered);
      playSoundAlert("end");
    }
  };

  // Toggle checklist participants
  const toggleParticipant = (role: UserRole) => {
    if (newParticipants.includes(role)) {
      setNewParticipants(newParticipants.filter(r => r !== role));
    } else {
      setNewParticipants([...newParticipants, role]);
    }
  };

  // Immediate Alert Alarm simulation
  const checkAndSimulateAlarm = (meet: Meeting) => {
    setActiveAlarm(meet);
    playSoundAlert("alert");
    if (onShowNotification) {
      onShowNotification(
        `🚨 NOTIFIKASI REMINDER RAPAT`,
        `Rapat "${meet.title}" segera dimulai di ${meet.location}!`
      );
    }
  };

  // Video Call trigger handlers
  const startOutgoingVideoCall = (role: UserRole, isVideo: boolean = true) => {
    if (role === currentRole) {
      alert("Anda tidak bisa menelpon akun Anda sendiri!");
      return;
    }
    setTargetContact(role);
    setCallType(isVideo ? "video" : "audio");
    setCallDirection("outgoing");
    setCallState("dialing");
    setIsMuted(false);
    setIsCameraOff(false);
    setActiveMeetingSubject("Sesi Video Call Internal");
    setWebrtcStatus("connecting");
    setWebrtcLogs([
      "Initializing WebRTC RTCPeerConnection...",
      "Gathering local media stream tracks...",
      "ICE Candidate gathering initialized..."
    ]);
  };

  const startOutgoingWebRTCCall = (role: UserRole, meet?: Meeting) => {
    if (role === currentRole) {
      alert("Tidak ada staff internal lain yang terdaftar di rapat ini untuk ditelpon saat ini.");
      return;
    }
    setTargetContact(role);
    setCallType("video");
    setCallDirection("outgoing");
    setCallState("dialing");
    setIsMuted(false);
    setIsCameraOff(false);

    setActiveMeetingSubject(meet ? meet.title : "Diskusi Sesi Rapat");
    setWebrtcStatus("connecting");
    setWebrtcLogs([
      "WebRTC: Initializing Peer Connection...",
      "WebRTC: Local Media Constraints matched (Video: 1080p, Audio: 48kHz Stereo)",
      "WebRTC: Querying ICE Servers (stun.l.google.com)...",
      "WebRTC: SDP Offer generated under active session."
    ]);

    setTimeout(() => {
      setWebrtcLogs(prev => [...prev, "WebRTC: Sending SDP Offer over secure signaling channel...", "WebRTC: Awaiting Peer Response."]);
    }, 1000);

    setTimeout(() => {
      setWebrtcLogs(prev => [...prev, "WebRTC: Remote candidate received.", "WebRTC: Executing SetRemoteDescription..."]);
    }, 2000);

    setTimeout(() => {
      setWebrtcLogs(prev => [...prev, "WebRTC: Negotiation state changed to SECURE_STABLE.", "WebRTC: ICE connection fully established."]);
    }, 2900);

    setTimeout(() => {
      setWebrtcLogs(prev => [...prev, "WebRTC: Live WebRTC P2P stream resolved (VP8 loopback).", "WebRTC: Direct video call connected successfully!"]);
      setWebrtcStatus("connected");
    }, 3600);
  };

  const triggerSimulatedIncomingCall = (role: UserRole, isVideo: boolean) => {
    if (role === currentRole) {
      alert("Pilih peran lain sebagai pengirim simulasi telepon masuk.");
      return;
    }
    setTargetContact(role);
    setCallType(isVideo ? "video" : "audio");
    setCallDirection("incoming");
    setCallState("incoming");
  };

  const handleAcceptCall = () => {
    setCallState("active");
    playSoundAlert("alert");
    setActiveMeetingSubject("Rapat Tim (Incoming)");
    setWebrtcStatus("connected");
    setWebrtcLogs([
      "WebRTC: Connection requested from incoming peer...",
      "WebRTC: Analyzing incoming SDP Offer...",
      "WebRTC: Matching local audio/video media tracks...",
      "WebRTC: Constructing SDP Answer...",
      "WebRTC: SetRemoteDescription completed.",
      "WebRTC: SDP Answer dispatched over signaling protocol.",
      "WebRTC: ICE candidate gathering finalized. Negotiation: STABLE."
    ]);
  };

  const handleDeclineCall = () => {
    const newLog: CallLog = {
      id: "call-" + Date.now(),
      contactRole: targetContact,
      callType: callType,
      direction: "incoming",
      status: "Rejected",
      timestamp: new Date().toISOString()
    };
    saveCallLogs([newLog, ...callLogs]);
    setCallState("idle");
    setWebrtcStatus("disconnected");
    setWebrtcLogs([]);
    setActiveMeetingSubject(null);
    playSoundAlert("end");
  };

  const handleEndCall = () => {
    const newLog: CallLog = {
      id: "call-" + Date.now(),
      contactRole: targetContact,
      callType: callType,
      direction: callDirection,
      status: "Answered",
      timestamp: new Date().toISOString(),
      duration: callDuration
    };
    saveCallLogs([newLog, ...callLogs]);
    setCallState("idle");
    setWebrtcStatus("disconnected");
    setWebrtcLogs([]);
    setActiveMeetingSubject(null);
    playSoundAlert("end");
  };

  const handleDeleteLog = () => {
    if (confirm("Bersihkan seluruh daftar log riwayat panggilan harian?")) {
      saveCallLogs([]);
    }
  };

  // Calendar dates processing helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedDateMeetings = meetings.filter(m => m.date === selectedDate);
  const getMeetingsForDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const testDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return meetings.filter(m => m.date === testDate);
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative flex flex-col h-[calc(100vh-140px)] text-left">
      
      {/* Alarm Screen Overlay for Rapat reminders simulation */}
      <AnimatePresence>
        {activeAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-left"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -15 }}
              className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
                <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-xl animate-bounce">
                  <Bell className="w-6 h-6 animate-swing" />
                </div>
                <div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-mono">
                    PENGINGAT OTOMATIS AKTIF
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-100 mt-1">Rapat Segera Dimulai!</h4>
                </div>
              </div>

              <div className="space-y-2.5 py-2">
                <h3 className="text-base font-bold text-slate-100">{activeAlarm.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
                  {activeAlarm.desc || "Tidak ada agenda tertulis tambahan."}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Waktu Mulai</div>
                      <span className="font-semibold text-slate-200">{activeAlarm.time} WIB</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Media/Tempat</div>
                      <span className="font-semibold text-slate-200 truncate block w-28">{activeAlarm.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Undangan Anggota Staff:</div>
                  <div className="flex flex-wrap gap-1">
                    {activeAlarm.participants.map(p => (
                      <span key={p} className="text-[10px] font-mono bg-slate-950 text-slate-400 px-2.5 py-0.5 rounded border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAlarm(null);
                    playSoundAlert("end");
                  }}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                >
                  Tutup Notifikasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Automatically redirect to the video call integration tab if location is video
                    setActiveAlarm(null);
                    const hasVideo = activeAlarm.location.toLowerCase().includes("video") || activeAlarm.location.toLowerCase().includes("meet") || activeAlarm.location.toLowerCase().includes("zoom");
                    if (hasVideo) {
                      setModuleSubTab("videocall");
                      // Find first participant that isn't me to call
                      const partner = activeAlarm.participants.find(p => p !== currentRole) || "Manager";
                      startOutgoingWebRTCCall(partner, activeAlarm);
                    } else {
                      alert(`Bergabung dengan pertemuan Rapat di: ${activeAlarm.location}`);
                    }
                  }}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/10 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Gabung Rapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global calling screen overlay */}
      <AnimatePresence mode="wait">
        {callState !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col justify-between p-8 text-center"
          >
            {/* Call State Chime Banner */}
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                {callState === "dialing" && "MEMANGGIL REKAN KERJA..."}
                {callState === "incoming" && "PANGGILAN VIDEO TIM MAKSUD..."}
                {callState === "active" && `MEETING VIDEO TELEPON BERLANGSUNG • ${callType === "video" ? "UMBAL VIDEO HD" : "SUARA"}`}
              </span>
            </div>

            {/* Calling core layout viewport */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              
              {/* If call is active & is video, show simulated dual split screen cameras */}
              {callState === "active" && callType === "video" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl h-[40vh] md:h-[45vh] mt-2">
                  
                  {/* Participant 1: Remote companion */}
                  <div className="bg-slate-950 rounded-2xl border-2 border-indigo-500/20 relative overflow-hidden flex flex-col items-center justify-center p-4">
                    <span className="absolute top-3 left-3 bg-slate-900/85 border border-indigo-500/30 text-[9px] font-mono font-bold text-indigo-300 px-2 py-0.5 rounded">
                      REKAN TIM (ONLINE)
                    </span>
                    
                    {/* Simulated incoming camera view */}
                    {!isCameraOff ? (
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-400/30 flex items-center justify-center text-4xl mx-auto shadow-inner">
                          👩‍💼
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{ROLE_NAMES[targetContact]}</h4>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-850 ml-1 font-mono">{targetContact}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1" />
                          Umpan Video Aktif (30fps)
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 space-y-2">
                        <VideoOff className="w-10 h-10 mx-auto" />
                        <p className="text-xs">Kamera Rekan Dimatikan</p>
                      </div>
                    )}
                  </div>

                  {/* Participant 2: Local User Camera */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4">
                    <span className="absolute top-3 left-3 bg-slate-900/85 border border-slate-800 text-[9px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded z-10">
                      UMPAK SAYA ({currentRole})
                    </span>

                    {!isCameraOff ? (
                      localStream ? (
                        <div className="absolute inset-0 w-full h-full">
                          <video
                            ref={(el) => {
                              if (el) el.srcObject = localStream;
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-2xl"
                          />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/70 p-2 rounded-xl text-[10px] text-white">
                            <span className="font-semibold">{roleName}</span>
                            <span className="text-emerald-400 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              Kamera Aktif (Live)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30 flex items-center justify-center text-4xl mx-auto shadow-inner animate-pulse">
                            👨‍💻
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{roleName}</h4>
                            <span className="text-[10px] text-emerald-400 bg-slate-900 border border-emerald-950 p-1 px-2 rounded-full font-bold">Kamera Anda (Simulasi)</span>
                          </div>
                          <div className="flex gap-1 justify-center h-4 items-end">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <span 
                                key={i} 
                                className="w-1 bg-emerald-400/60 rounded animate-bounce"
                                style={{ 
                                  height: `${Math.floor(Math.random() * 12) + 4}px`,
                                  animationDelay: `${i * 100}ms`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-600 space-y-2">
                        <VideoOff className="w-10 h-10 mx-auto" />
                        <p className="text-xs">Kamera Anda Dinonaktifkan</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Simple Call / Dialing / Audio stream UI */
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    {(callState === "dialing" || callState === "incoming") && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-150" />
                        <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse scale-125" />
                      </>
                    )}
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center text-3xl font-bold font-mono text-indigo-300 shadow-2xl relative">
                      {ROLE_AVATARS[targetContact] || "TS"}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{ROLE_NAMES[targetContact]}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{targetContact}</p>
                  </div>

                  {callState === "active" && (
                    <div className="space-y-4 pt-2">
                      <div className="text-3xl font-extrabold text-white font-mono tracking-wider">
                        {formatCallTime(callDuration)}
                      </div>
                      <div className="flex gap-1.5 justify-center h-6 items-end">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <span 
                            key={i} 
                            className="w-1 bg-indigo-500/80 rounded animate-bounce"
                            style={{ 
                              height: `${Math.floor(Math.random() * 18) + 6}px`,
                              animationDelay: `${i * 80}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Real-time WebRTC Signaling and Tunnel Logs */}
            {webrtcLogs.length > 0 && (
              <div className="w-full max-w-xl mx-auto bg-slate-950/80 rounded-2xl border border-emerald-500/25 p-4 text-left font-mono text-[10px] space-y-2 shadow-inner mt-4 shrink-0">
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold tracking-wide">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span>WEBRTC PEERCONNECTION CONSOLE DIAGNOSTICS</span>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    STATUS: {webrtcStatus.toUpperCase()}
                  </span>
                </div>
                {activeMeetingSubject && (
                  <div className="text-slate-400 text-[10px] flex items-center justify-between font-sans">
                    <span>Sesi Rapat: <strong className="text-indigo-400 font-semibold">{activeMeetingSubject}</strong></span>
                    <span className="text-[9.5px] font-mono text-slate-505">VP8, Stereo Opus</span>
                  </div>
                )}
                <div className="max-h-24 overflow-y-auto space-y-1 text-emerald-500/90 custom-scrollbar pr-1">
                  {webrtcLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <span className="text-slate-600 select-none">[{idx + 1}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-slate-500 border-t border-emerald-500/10 pt-1.5 mt-1">
                  <span>SDP HANDSHAKE: <strong className={webrtcStatus === "connected" ? "text-emerald-400" : "text-amber-500"}>{webrtcStatus === "connected" ? "STABLE" : "NEGOTIATING"}</strong></span>
                  <span>ICE GATHERING: <strong className="text-emerald-400">COMPLETED</strong></span>
                  <span>BITRATE: <strong className="text-emerald-400">~2420 KBPS</strong></span>
                </div>
              </div>
            )}

            {/* Control keys */}
            <div className="max-w-sm mx-auto w-full py-4 shrink-0">
              {callState === "incoming" ? (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleDeclineCall}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-lg shadow-rose-600/20"
                    title="Tolak Panggilan"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-lg shadow-emerald-600/30 animate-bounce"
                    title="Terima Panggilan"
                  >
                    <Video className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl transition cursor-pointer ${
                      isMuted ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                    title="Mute Mic"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setIsCameraOff(!isCameraOff)}
                    className={`p-3 rounded-xl transition cursor-pointer ${
                      isCameraOff ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                    title="Toggle Kamera"
                  >
                    {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3 rounded-xl transition cursor-pointer ${
                      !isSpeakerOn ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                    title="Toggle Speaker"
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer shadow-md shadow-rose-600/10"
                    title="Akhiri Telepon"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Header */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              Kalender Rapat & Video Call Suite
              <span className="text-[9.5px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold tracking-wider">
                COMM-HUB
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Kelola penjadwalan janji temu, setel pengingat otomatis (alarm), dan hubungi rekan sejawat via video call HD interaktif.
            </p>
          </div>
        </div>

        {/* Workspace selector tabs */}
        <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-xl max-w-xs justify-start">
          <button
            onClick={() => setModuleSubTab("calendar")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              moduleSubTab === "calendar" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-150"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Kalender & Rapat
          </button>
          
          <button
            onClick={() => setModuleSubTab("videocall")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              moduleSubTab === "videocall" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-150"
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Video Call Staff
          </button>
        </div>
      </div>

      {/* Main body canvas for Calendars or Video Call tab split view */}
      <div className="flex-1 flex overflow-hidden">
        
        {moduleSubTab === "calendar" ? (
          /* CALENDAR SCHEDULER VIEW */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left box: Calendar Sheet */}
            <div className="flex-1 p-6 overflow-y-auto border-r border-slate-800 bg-slate-950 flex flex-col">
              
              {isScheduling ? (
                /* Schedule Rapat Form layout */
                <form onSubmit={handleCreateMeeting} className="space-y-4 max-w-xl text-left bg-slate-900/40 p-5 rounded-2xl border border-slate-850 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-805">
                    <h3 className="text-xs font-extrabold text-indigo-400 tracking-wider uppercase font-mono">📅 JADWALKAN RAPAT BARU</h3>
                    <button
                      type="button"
                      onClick={() => setIsScheduling(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Judul Agenda Pertemuan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rapat Evaluasi Roster & Gaji..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Tanggal Pelaksanaan</label>
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Jam Mulai (WIB)</label>
                      <input
                        type="time"
                        required
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Tempat & Media Rapat</label>
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-250 focus:outline-none focus:border-indigo-500"
                    >
                      {PRESET_MEETING_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Multi-role picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Pilih Anggota Tim Terundang ({newParticipants.length})</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                      {ROLES_LIST.map(role => {
                        const isChecked = newParticipants.includes(role);
                        return (
                          <label key={role} className="flex items-center gap-2 text-slate-300 text-[11px] select-none cursor-pointer p-1 rounded hover:bg-slate-900">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleParticipant(role)}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-950 w-3.5 h-3.5"
                            />
                            <span className="truncate">{role}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Agenda Deskripsi Bahasan</label>
                    <textarea
                      rows={2}
                      placeholder="Tuliskan poin-poin pembahasan penting..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Interactive Agenda Builder */}
                  <div className="space-y-2 bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-indigo-400 block uppercase font-mono flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-400" /> Builder Agenda Rapat (Poin-Poin Topik)
                      </label>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {newAgendaTopics.length} Topik
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik topik rapat baru (misal: Evaluasi KPI bulanan)..."
                        value={agendaInput}
                        onChange={(e) => setAgendaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (agendaInput.trim()) {
                              setNewAgendaTopics([...newAgendaTopics, agendaInput.trim()]);
                              setAgendaInput("");
                            }
                          }
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (agendaInput.trim()) {
                            setNewAgendaTopics([...newAgendaTopics, agendaInput.trim()]);
                            setAgendaInput("");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah
                      </button>
                    </div>

                    {newAgendaTopics.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pt-1">
                        {newAgendaTopics.map((topic, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-850 p-1.5 px-2.5 rounded-lg group hover:border-slate-800 transition"
                          >
                            <div className="flex items-start gap-2 min-w-0 text-left">
                              <span className="text-indigo-400 font-bold text-xs select-none mt-0.5">•</span>
                              <p className="text-xs text-slate-300 break-words">{topic}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewAgendaTopics(newAgendaTopics.filter((_, idx) => idx !== index))}
                              className="text-slate-500 hover:text-rose-500 transition p-0.5 cursor-pointer"
                              title="Hapus topik agenda"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic pt-1">Belum ada topik agenda ditambahkan. Ketik di atas lalu tekan enter/klik Tambah.</p>
                    )}
                  </div>

                  {/* Automatic reminder alerts panel */}
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="p-2 bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-500/25">
                        <Bell className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-400 block font-mono">SETEL PENGINGAT OTOMATIS</span>
                        <span className="text-[11px] text-slate-400">Aktifkan pop-up alarm otomatis menjelang rapat</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isReminderEnabled}
                        onChange={(e) => setIsReminderEnabled(e.target.checked)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-950 w-4 h-4 cursor-pointer"
                      />
                      {isReminderEnabled && (
                        <select
                          value={reminderLeadTime}
                          onChange={(e) => setReminderLeadTime(e.target.value)}
                          className="bg-slate-950 border border-slate-805 rounded p-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="5 Menit">5 Menit Sebelum</option>
                          <option value="15 Menit">15 Menit Sebelum</option>
                          <option value="1 Jam">1 Jam Sebelum</option>
                          <option value="1 Hari">1 Hari Sebelum</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsScheduling(false)}
                      className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi Jadwal
                    </button>
                  </div>
                </form>
              ) : (
                /* Master Calendar grid sheet */
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-indigo-400 tracking-wider uppercase font-mono">KALENDER PELAKSANAAN</span>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1">
                        Peta Sesi Janji Temu Bulanan
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-805 p-1 px-2 rounded-xl">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1 px-1.5 hover:bg-slate-950 text-slate-400 hover:text-white rounded transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-200 font-bold font-mono">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="p-1 px-1.5 hover:bg-slate-950 text-slate-400 hover:text-white rounded transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day grid mapping calendar sheet */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-extrabold text-slate-500 border-b border-slate-850 pb-2">
                    <div>MING</div>
                    <div>SEN</div>
                    <div>SEL</div>
                    <div>RAB</div>
                    <div>KAM</div>
                    <div>JUM</div>
                    <div>SAB</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 flex-1 min-h-[300px]">
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                      <div key={`buffer-${idx}`} className="bg-transparent" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1;
                      const formattedMonth = String(currentMonth + 1).padStart(2, "0");
                      const formattedDay = String(day).padStart(2, "0");
                      const cellDate = `${currentYear}-${formattedMonth}-${formattedDay}`;

                      const isSelected = cellDate === selectedDate;
                      const isToday = cellDate === new Date().toISOString().split("T")[0];
                      const dateMeetings = getMeetingsForDay(day);

                      return (
                        <button
                          key={`day-${day}`}
                          onClick={() => setSelectedDate(cellDate)}
                          className={`aspect-square sm:aspect-video rounded-xl p-2 text-left flex flex-col justify-between border cursor-pointer transition ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/10" 
                              : isToday 
                              ? "bg-slate-900 border-indigo-500/40 text-indigo-400 font-extrabold" 
                              : "bg-slate-900/45 border-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-800"
                          }`}
                        >
                          <span className="text-xs font-mono font-extrabold">{day}</span>
                          {dateMeetings.length > 0 && (
                            <div className="flex gap-1 mt-auto">
                              {dateMeetings.slice(0, 3).map((item, idx) => (
                                <span 
                                  key={item.id || idx} 
                                  className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400 animate-pulse"}`} 
                                  title={item.title}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setIsScheduling(true)}
                    className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-505/20 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <Plus className="w-4 h-4" /> Atur Rapat Kerja Baru Untuk Tanggal Pilihan ({selectedDate})
                  </button>
                </div>
              )}
            </div>

            {/* Right box: Sesi Rapat Hari Ini */}
            <div className="w-full md:w-96 p-6 overflow-y-auto bg-slate-900/25 flex flex-col">
              <div className="pb-4 border-b border-slate-800 mb-4 flex items-center justify-between text-left">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase font-mono">SINKRONISASI RAPAT</span>
                  <p className="text-xs text-slate-200 font-extrabold mt-0.5">
                    {new Date(selectedDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-505/10 text-indigo-400 font-mono border border-indigo-500/25 p-1 px-2.5 rounded-full font-bold">
                  {selectedDateMeetings.length} Sesi
                </span>
              </div>

              {/* Day meetings scheduler listings */}
              <div className="space-y-4 flex-1">
                {selectedDateMeetings.length > 0 ? (
                  selectedDateMeetings.map(meet => (
                    <div key={meet.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-sm space-y-3 hover:border-slate-800 transition">
                      <div className="flex items-start justify-between gap-3 text-left">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-205 leading-snug">{meet.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {meet.time} WIB • Diatur: {meet.createdBy}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMeeting(meet.id, meet.title)}
                          className="p-1 text-slate-600 hover:text-rose-500 transition cursor-pointer"
                          title="Batalkan Rapat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal text-left">
                        {meet.desc || "Tidak ada rincian agenda kerja khusus terlampir."}
                      </p>

                      {/* Interactive In-Card Agenda Builder */}
                      <div className="pt-2.5 border-t border-slate-900/60 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-indigo-400 block uppercase font-mono flex items-center gap-1">
                            <ListTodo className="w-3.5 h-3.5 text-indigo-400" /> Agenda Topik Pertemuan:
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-500">
                            {(meet.agendaTopics || []).length} Topik
                          </span>
                        </div>

                        {/* Bullet-point topics list */}
                        {(meet.agendaTopics || []).length > 0 ? (
                          <div className="space-y-1.5 pl-1 max-h-36 overflow-y-auto custom-scrollbar">
                            {(meet.agendaTopics || []).map((topic, index) => (
                              <div key={index} className="flex items-start justify-between gap-2 bg-slate-900/60 p-1.5 px-2 rounded-lg border border-slate-950 hover:border-slate-850 group transition">
                                <div className="flex items-start gap-1.5 min-w-0 text-left">
                                  <span className="text-indigo-400 font-bold select-none text-xs mt-0.5">•</span>
                                  <p className="text-[11px] text-slate-300 leading-normal break-words">{topic}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAgendaTopic(meet.id, index)}
                                  className="text-slate-500 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer shrink-0"
                                  title="Hapus topik agenda ini"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic pl-1">Belum ada topik agenda yang didefinisikan.</p>
                        )}

                        {/* Fast inline agenda builder input */}
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-900/40">
                          <input
                            type="text"
                            placeholder="Tambah poin agenda..."
                            id={`inline-agenda-input-${meet.id}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const inputEl = document.getElementById(`inline-agenda-input-${meet.id}`) as HTMLInputElement;
                                if (inputEl && inputEl.value.trim()) {
                                  handleAddAgendaTopic(meet.id, inputEl.value);
                                  inputEl.value = "";
                                }
                              }
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-1.5 px-2 text-[10.5px] text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById(`inline-agenda-input-${meet.id}`) as HTMLInputElement;
                              if (inputEl && inputEl.value.trim()) {
                                handleAddAgendaTopic(meet.id, inputEl.value);
                                inputEl.value = "";
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold p-1.5 px-2.5 rounded-lg transition cursor-pointer shrink-0"
                            title="Tambah poin agenda"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>

                      {/* File Attachments Block - Slide & Document Upload */}
                      <div className="pt-2.5 border-t border-slate-900/60 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-extrabold text-indigo-400 block uppercase font-mono flex items-center gap-1">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Dokumen & Slide Pendukung:
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-500">
                            {(meet.attachments || []).length} Berkas
                          </span>
                        </div>

                        {/* Attachments List */}
                        {(meet.attachments || []).length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                            {(meet.attachments || []).map((file, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-950 hover:border-slate-850 p-2 rounded-xl transition group/file"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-slate-200 font-bold truncate" title={file.name}>
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-mono">
                                      {file.size} • {new Date(file.uploadedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Download button */}
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="p-1 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-400 hover:text-white rounded border border-indigo-550/20 text-[9px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                                    title="Unduh Berkas"
                                  >
                                    <Download className="w-3 h-3" /> Unduh
                                  </a>
                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(meet.id, idx)}
                                    className="p-1 text-slate-500 hover:text-rose-500 transition cursor-pointer"
                                    title="Hapus berkas ini"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic pl-1">Belum ada slide presentasi atau dokumen pendukung.</p>
                        )}

                        {/* Drag and Drop Zone Container */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverMeetingId(meet.id);
                          }}
                          onDragLeave={() => {
                            setDragOverMeetingId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverMeetingId(null);
                            handleFileUpload(meet.id, e.dataTransfer.files);
                          }}
                          onClick={() => {
                            document.getElementById(`file-input-${meet.id}`)?.click();
                          }}
                          className={`border border-dashed p-3 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 group ${
                            dragOverMeetingId === meet.id
                              ? "border-teal-400 bg-teal-950/20 text-teal-300"
                              : "border-slate-800 bg-slate-950/40 hover:border-indigo-500/40 hover:bg-slate-950/80 text-slate-400"
                          }`}
                          title="Klik atau seret slide presentasi / dokumen ke sini untuk mengunggah"
                        >
                          <input
                            type="file"
                            id={`file-input-${meet.id}`}
                            className="hidden"
                            onChange={(e) => {
                              handleFileUpload(meet.id, e.target.files);
                              // resets form so same file can be reloaded
                              e.target.value = "";
                            }}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                          />
                          <FileUp className={`w-5 h-5 transition ${dragOverMeetingId === meet.id ? "text-teal-400 scale-110" : "text-slate-500 group-hover:text-indigo-400"}`} />
                          <span className="text-[10.5px] font-semibold">
                            {dragOverMeetingId === meet.id
                              ? "Lepaskan file rapat sekarang"
                              : "Unggah / Seret file pancingan ke sini"}
                          </span>
                          <span className="text-[8.5px] text-slate-600 font-mono">
                            Maksimal 1.5MB (PDF, PPTX, Slide, JPG, DOC)
                          </span>
                        </div>
                      </div>

                      <div className="p-1 px-2.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] text-slate-300 font-mono flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{meet.location}</span>
                      </div>

                      <div className="pt-2.5 border-t border-slate-900 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-slate-500 block uppercase font-mono">DAFTAR PESERTA & KONFIRMASI:</span>
                          <div className="flex gap-1.5 text-[8.5px] font-mono">
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                              {Object.values(meet.rsvpStatus || {}).filter(v => v === "Hadir").length} Hadir
                            </span>
                            <span className="bg-rose-950/40 text-rose-400 border border-rose-500/10 px-1.5 py-0.5 rounded">
                              {Object.values(meet.rsvpStatus || {}).filter(v => v === "Tidak Hadir").length} Absen
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                          {meet.participants.map(p => {
                            const rsvp = meet.rsvpStatus?.[p] || "Belum Menjawab";
                            const isCurrent = p === currentRole;

                            return (
                              <div key={p} className="flex items-center justify-between gap-2 bg-slate-900/40 border border-slate-950/80 p-1.5 rounded-lg">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-slate-950 text-[9px] font-mono font-bold text-indigo-400 border border-slate-800 flex items-center justify-center shrink-0">
                                    {ROLE_AVATARS[p] || "ST"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10.5px] font-bold text-slate-200 truncate font-sans">
                                      {ROLE_NAMES[p] || p}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-mono truncate">
                                      {p} {isCurrent && <span className="text-indigo-400 font-bold">(Anda)</span>}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={rsvp}
                                    onChange={(e) => handleUpdateRSVP(meet.id, p, e.target.value as any)}
                                    className={`bg-slate-950 border border-slate-805 rounded px-1.5 py-0.5 text-[9px] font-bold font-mono focus:outline-none focus:border-indigo-500 cursor-pointer ${
                                      rsvp === "Hadir"
                                        ? "text-emerald-400"
                                        : rsvp === "Tidak Hadir"
                                        ? "text-rose-400"
                                        : "text-amber-400"
                                    }`}
                                    title={`Ubah status konfirmasi ${ROLE_NAMES[p] || p}`}
                                  >
                                    <option value="Hadir" className="text-emerald-400 bg-slate-950">Hadir</option>
                                    <option value="Tidak Hadir" className="text-rose-400 bg-slate-950">Absen</option>
                                    <option value="Belum Menjawab" className="text-amber-400 bg-slate-950">Pending</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Interactive Personal RSVP banner if current role is invited */}
                        {meet.participants.includes(currentRole) && (
                          <div className="bg-indigo-950/20 border border-indigo-900/40 p-2 rounded-xl space-y-1.5 mt-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-indigo-400 font-mono block">RESPON KEHADIRAN ANDA ({currentRole}):</span>
                              <span className="text-[8px] text-slate-500 font-mono">Konfirmasi Cepat</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateRSVP(meet.id, currentRole, "Hadir")}
                                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition text-center cursor-pointer ${
                                  (meet.rsvpStatus?.[currentRole] || "Belum Menjawab") === "Hadir"
                                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40 font-extrabold"
                                    : "bg-slate-950 text-slate-500 border-slate-805 hover:bg-slate-900 hover:text-slate-400"
                                }`}
                              >
                                ✓ Hadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRSVP(meet.id, currentRole, "Tidak Hadir")}
                                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition text-center cursor-pointer ${
                                  (meet.rsvpStatus?.[currentRole] || "Belum Menjawab") === "Tidak Hadir"
                                    ? "bg-rose-600/20 text-rose-400 border-rose-500/40 font-extrabold"
                                    : "bg-slate-950 text-slate-500 border-slate-805 hover:bg-slate-900 hover:text-slate-400"
                                }`}
                              >
                                ✗ Absen
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRSVP(meet.id, currentRole, "Belum Menjawab")}
                                className={`px-2 py-1 rounded text-[9.5px] font-bold border transition text-center cursor-pointer ${
                                  (meet.rsvpStatus?.[currentRole] || "Belum Menjawab") === "Belum Menjawab"
                                    ? "bg-amber-600/20 text-amber-400 border-amber-500/40 font-extrabold"
                                    : "bg-slate-950 text-slate-500 border-slate-805 hover:bg-slate-900 hover:text-slate-400"
                                }`}
                              >
                                ? Ragu
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* WebRTC Video Call Meeting Start Trigger */}
                      <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1 text-[8.5px] font-bold text-teal-400 bg-teal-450/10 p-1 px-2 rounded border border-teal-500/10 font-mono">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                          <span>WEBRTC ENCRYPTED</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const recipient = meet.participants.find(p => p !== currentRole) || "Manager";
                            setModuleSubTab("videocall");
                            startOutgoingWebRTCCall(recipient, meet);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-bold py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-lg shadow-indigo-600/10 border border-indigo-500/20"
                          title="Mulai panggilan video WebRTC dengan rekan tim yang terundang"
                        >
                          <Video className="w-3.5 h-3.5" /> Mulai Rapat
                        </button>
                      </div>

                      {/* Automated Alarm Simulation Trigger Button */}
                      {meet.isReminderEnabled && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => checkAndSimulateAlarm(meet)}
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[9.5px] font-mono border border-purple-500/20 p-1.5 px-2.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Aktifkan simulasi pengujian pop up pengingat alarm otomatis"
                          >
                            <Bell className="w-3.5 h-3.5" /> Uji Alarm
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-600 flex flex-col items-center justify-center space-y-3">
                    <CalendarIcon className="w-12 h-12 text-slate-75 *0 text-indigo-400/30 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Jadwal Rapat Kosong</p>
                      <p className="text-[10px] text-slate-500">Tidak ada sesi pertemuan untuk tanggal ini.</p>
                    </div>
                    <button
                      onClick={() => setIsScheduling(true)}
                      className="text-xs text-indigo-400 hover:underline font-bold"
                    >
                      + Atur Sesi Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIDEO CALL STAFF ROOM */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Box: Video Call Contact Dialer Hub */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 flex flex-col text-left">
              <span className="text-[9.5px] font-extrabold text-indigo-400 bg-indigo-500/5 p-1 px-2 rounded-lg border border-indigo-500/10 tracking-widest uppercase font-mono mb-4 w-max">
                KOMUNIKASI DIRECT STAFF VIDEO CALL
              </span>

              {/* List staff credentials */}
              <div className="space-y-2.5 flex-1 max-w-2xl">
                {ROLES_LIST.map(role => {
                  const isSelf = role === currentRole;
                  return (
                    <div
                      key={role}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition duration-150 ${
                        isSelf 
                          ? "bg-slate-900/30 border-slate-900 opacity-60" 
                          : "bg-slate-900/90 border-slate-850 hover:border-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono shadow-inner">
                          {ROLE_AVATARS[role]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-200">{ROLE_NAMES[role]}</h4>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            {role} {isSelf && "(Akun Anda)"}
                          </span>
                        </div>
                      </div>

                      {!isSelf && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startOutgoingVideoCall(role, false)}
                            className="p-2 px-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Panggilan Suara"
                          >
                            <Phone className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                          
                          <button
                            onClick={() => startOutgoingVideoCall(role, true)}
                            className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow cursor-pointer border border-indigo-500/20"
                            title="Panggilan Video"
                          >
                            <Video className="w-3.5 h-3.5" /> Call HD
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Simulated Incoming Video Call Setup Sandbox */}
              <div className="mt-8 p-5 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl space-y-3.5 max-w-2xl text-left">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono">
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  PENGUJI SIMULATOR PANGGILAN VIDEO MASUK (2-ARAH)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gunakan simulator ini untuk menguji tanggapan panggilan video masuk dari departemen atau pegawai lain. Pilih pengirim pemicu serta jenis panggilannya.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block font-mono">Pegawai Pemanggil:</label>
                    <select
                      value={targetContact}
                      onChange={(e) => setTargetContact(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                    >
                      {ROLES_LIST.filter(r => r !== currentRole).map(role => (
                        <option key={role} value={role}>{role} ({ROLE_NAMES[role]})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => triggerSimulatedIncomingCall(targetContact, false)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer text-center truncate"
                    >
                      📞 Panggil Suara
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSimulatedIncomingCall(targetContact, true)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer text-center truncate"
                    >
                      📹 Panggil Video
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Call logs history */}
            <div className="w-full md:w-80 p-6 bg-slate-900/25 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-left">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase font-mono">RIWAYAT AKTIVITAS</span>
                  <p className="text-xs text-slate-300 font-extrabold mt-0.5">Log Panggilan Kerja</p>
                </div>
                {callLogs.length > 0 && (
                  <button
                    onClick={handleDeleteLog}
                    className="p-1 px-2 hover:bg-slate-950 text-slate-500 hover:text-rose-450 border border-slate-850 rounded text-[9.5px] uppercase font-mono flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3 h-3" /> Bersih
                  </button>
                )}
              </div>

              {/* Logs renderer */}
              <div className="space-y-2 flex-1">
                {callLogs.length > 0 ? (
                  callLogs.map(log => {
                    const isIncoming = log.direction === "incoming";
                    const isMissed = log.status === "Missed";
                    const isRejected = log.status === "Rejected";

                    return (
                      <div key={log.id} className="bg-slate-950 border border-slate-855 p-3 rounded-xl flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isIncoming ? (
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg shrink-0">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs text-slate-205 truncate">
                              {ROLE_NAMES[log.contactRole] || log.contactRole}
                            </h5>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block truncate">
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
                          <span className="text-[8.5px] text-slate-505 font-mono block mt-0.5">
                            {log.duration ? `${formatCallTime(log.duration)}` : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center text-slate-700 flex flex-col items-center justify-center space-y-2">
                    <Info className="w-8 h-8 text-slate-800" />
                    <p className="text-xs">Sesi panggilan kosong.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
