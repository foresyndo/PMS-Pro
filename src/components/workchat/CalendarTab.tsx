import React, { useState, useEffect } from "react";
import { UserRole } from "../../types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Bell, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  X,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
}

interface CalendarTabProps {
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

const PRESET_MEETING_LOCATIONS = [
  "Google Meet (Online Sim)",
  "Ruang Rapat Kantor Utama",
  "Lobby Lounge Properti",
  "Ruang Makan Bersama",
  "Area Taman / Poolside"
];

export default function CalendarTab({ currentRole, roleName, onShowNotification }: CalendarTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  
  // Calendar month/year navigation state
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
  
  // Custom reminder popups triggered during sandbox use
  const [activeAlarm, setActiveAlarm] = useState<Meeting | null>(null);

  // Load meetings
  useEffect(() => {
    const raw = localStorage.getItem("pms_meetings");
    if (raw) {
      try {
        setMeetings(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to load meetings data", e);
      }
    } else {
      // Seed initial meetings
      const seed: Meeting[] = [
        {
          id: "meet-1",
          title: "Breafing Pagi Serah Terima Shift",
          date: new Date().toISOString().split("T")[0], // Today
          time: "08:30",
          location: "Lobby Lounge Properti",
          desc: "Evaluasi laporan penanganan komplain AC kamar 102 bersama Receptionist dan Staff Maintenance.",
          participants: ["Manager", "Receptionist", "Staff Maintenance"],
          isReminderEnabled: true,
          reminderLeadTime: "15 Menit",
          createdBy: "Manager",
          createdAt: new Date().toISOString()
        },
        {
          id: "meet-2",
          title: "Rencana Anggaran & Pajak Bulanan",
          date: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 1); // Tomorrow
            return date.toISOString().split("T")[0];
          })(),
          time: "14:00",
          location: "Google Meet (Online Sim)",
          desc: "Pembahasan revisi setoran invoice sewa lunas triwulan ke-2.",
          participants: ["Owner", "Manager", "Finance"],
          isReminderEnabled: true,
          reminderLeadTime: "1 Jam",
          createdBy: "Owner",
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem("pms_meetings", JSON.stringify(seed));
      setMeetings(seed);
    }
  }, []);

  const saveMeetings = (updated: Meeting[]) => {
    localStorage.setItem("pms_meetings", JSON.stringify(updated));
    setMeetings(updated);
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime || !selectedDate) return;

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
      createdAt: new Date().toISOString()
    };

    const updated = [...meetings, newMeet].sort((a, b) => {
      // Sort by date then time
      return (a.date + " " + a.time).localeCompare(b.date + " " + b.time);
    });

    saveMeetings(updated);
    setIsScheduling(false);

    // Reset fields
    setNewTitle("");
    setNewTime("");
    setNewLocation("Google Meet (Online Sim)");
    setNewDesc("");
    setNewParticipants(["Manager", "Receptionist"]);
    setIsReminderEnabled(true);
    setReminderLeadTime("15 Menit");

    if (onShowNotification) {
      onShowNotification(
        "Rapat Terjadwal! 📅",
        `Rapat "${newMeet.title}" berhasil diatur pada ${newMeet.date} pkl ${newMeet.time}.`
      );
    }
  };

  const handleDeleteMeeting = (id: string, title: string) => {
    if (confirm(`Yakin ingin membatalkan jadwal rapat "${title}"?`)) {
      const filtered = meetings.filter(m => m.id !== id);
      saveMeetings(filtered);
    }
  };

  const toggleParticipant = (role: UserRole) => {
    if (newParticipants.includes(role)) {
      setNewParticipants(newParticipants.filter(r => r !== role));
    } else {
      setNewParticipants([...newParticipants, role]);
    }
  };

  // Immediate Simulation Trigger for Reminders!
  const triggerReminderNow = (meet: Meeting) => {
    setActiveAlarm(meet);
    if (onShowNotification) {
      onShowNotification(
        `🚨 PENGINGAT RAPAT: ${meet.title}`,
        `Segera dimulai di ${meet.location} bersama ${meet.participants.join(", ")}.`
      );
    }
  };

  // Calendar Logic
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay(); // Sunday=0, Monday=1 etc
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear); // Offset formatting

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

  // Filter meetings for selected calendar date
  const selectedDateMeetings = meetings.filter(m => m.date === selectedDate);

  // Check if a specific date day has any meetings
  const getMeetingsForDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const testDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return meetings.filter(m => m.date === testDate);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden relative">
      {/* Alarm Screen Overlay for immediate sandbox testing feedback */}
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
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] bg-amber-500/25 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-mono">
                    Pengingat Alarm Aktif
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-100 mt-1">Rapat Segera Dimulai</h4>
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
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Waktu</div>
                      <span className="font-semibold text-slate-200">{activeAlarm.time} WIB</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Lokasi</div>
                      <span className="font-semibold text-slate-200 truncate block w-28">{activeAlarm.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mt-1">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Anggota Terundang:</div>
                  <div className="flex flex-wrap gap-1">
                    {activeAlarm.participants.map(p => (
                      <span key={p} className="text-[10px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveAlarm(null)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                >
                  Tutup / Diamkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Menghubungkan ke ${activeAlarm.location}...`);
                    setActiveAlarm(null);
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

      {/* Main Bar header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            Kalender & Penjadwal Rapat Kerja
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
              Meeting Sync
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Atur agenda diskusi, lokasi pertemuan, dan aktifkan alarm pengingat rapat tim.
          </p>
        </div>

        <button
          onClick={() => setIsScheduling(!isScheduling)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow duration-150 cursor-pointer"
        >
          {isScheduling ? "Lihat Kalender" : <><Plus className="w-3.5 h-3.5" /> Buat Jadwal Baru</>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isScheduling ? (
          /* Form Scheduler */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/10 flex items-center justify-center">
            <form
              onSubmit={handleCreateMeeting}
              className="w-full max-w-xl bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-4 shadow-xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">📅 JADWAL RAPAT BARU</h4>
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Nama / Judul Pertemuan Rapat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Evaluasi Atap Bocor & Booking Kamar..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Tanggal Rapat (Calendar)</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Waktu Mulai (WIB)</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Media / Lokasi Pertemuan</label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {PRESET_MEETING_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Participants multi-select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Pilih Anggota Tim Terundang Rapat</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-900/50 rounded-lg border border-slate-850">
                  {ROLES_LIST.map(role => {
                    const isChecked = newParticipants.includes(role);
                    return (
                      <label key={role} className="flex items-center gap-2 text-slate-300 text-xs p-1 select-none cursor-pointer hover:bg-slate-900 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleParticipant(role)}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3.5 h-3.5"
                        />
                        <span className="truncate">{role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Agenda / Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsikan koordinasi pembahasan penting..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              {/* Reminder configurations */}
              <div className="p-3 bg-indigo-950/15 border border-indigo-900/40 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/25">
                    <Bell className="w-4 h-4 animate-swing" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider font-mono">Reminder Alarm</span>
                    <span className="text-[11px] text-slate-400">Atur pop-up alarm peringatan rapat</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isReminderEnabled}
                    onChange={(e) => setIsReminderEnabled(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-4 h-4 cursor-pointer"
                  />
                  {isReminderEnabled && (
                    <select
                      value={reminderLeadTime}
                      onChange={(e) => setReminderLeadTime(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-200 focus:outline-none"
                    >
                      <option value="5 Menit">5 Menit Sebelum</option>
                      <option value="15 Menit">15 Menit Sebelum</option>
                      <option value="1 Jam">1 Jam Sebelum</option>
                      <option value="1 Hari">1 Hari Sebelum</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="px-3 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 p-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl text-xs font-bold hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi Jadwal
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Calendar Grid UI and Meeting details side-by-side */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Calendar grid (Left) */}
            <div className="flex-1 p-6 flex flex-col justify-start border-r border-slate-800/80 bg-slate-950">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-indigo-400 font-mono tracking-widest uppercase">
                  Kalender Rapat
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 rounded cursor-pointer hover:bg-slate-800 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-slate-200 font-bold font-sans">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 rounded cursor-pointer hover:bg-slate-800 transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid wrapper */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-sans font-semibold text-slate-500 mb-2 border-b border-slate-900 pb-1.5 font-mono">
                <div>MIN</div>
                <div>SEN</div>
                <div>SEL</div>
                <div>RAB</div>
                <div>KAM</div>
                <div>JUM</div>
                <div>SAB</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[220px]">
                {/* Empty buffer cells for offset layout */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-transparent" />
                ))}

                {/* Day cells rendering */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const formattedMonth = String(currentMonth + 1).padStart(2, "0");
                  const formattedDay = String(day).padStart(2, "0");
                  const cellDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
                  
                  const isToday = cellDate === new Date().toISOString().split("T")[0];
                  const isSelected = cellDate === selectedDate;
                  const dateMeetings = getMeetingsForDay(day);

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDate(cellDate)}
                      className={`aspect-square sm:aspect-video rounded-lg p-1.5 text-center flex flex-col justify-between transition border cursor-pointer relative group ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                          : isToday 
                          ? "bg-slate-900 border-slate-755 text-indigo-400 font-bold" 
                          : "bg-slate-900/50 border-slate-900/10 text-slate-300 hover:bg-slate-800/60 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-xs">{day}</span>

                      {/* Display small dots in bottom for meetings */}
                      {dateMeetings.length > 0 && (
                        <div className="flex gap-1 justify-center mt-auto">
                          {dateMeetings.slice(0, 3).map((m, i) => (
                            <span 
                              key={m.id || i} 
                              className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400 animate-pulse"}`} 
                              title={m.title}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-900/30 text-[10px] text-slate-500 font-sans leading-relaxed">
                ℹ️ Klik kotak tanggal di atas untuk memfilter atau menjadwalkan rapat harian di properti Anda. Tanggal dengan bulatan ungu menandakan terdapat rapat aktif.
              </div>
            </div>

            {/* List for the selected day (Right) */}
            <div className="w-full md:w-96 p-6 flex flex-col justify-start bg-slate-900/20 overflow-y-auto">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4 flex-wrap gap-2 text-left">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                    DAFTAR PERTEMUAN RAPAT
                  </span>
                  <h4 className="text-xs text-slate-300 font-bold font-sans mt-0.5">
                    {new Date(selectedDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </h4>
                </div>

                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/25 p-1 px-2 rounded-full font-bold">
                  {selectedDateMeetings.length} Rapat
                </span>
              </div>

              {/* Rapat records display */}
              <div className="space-y-3">
                {selectedDateMeetings.length > 0 ? (
                  selectedDateMeetings.map(meet => (
                    <div
                      key={meet.id}
                      className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-sm hover:border-slate-800 transition text-left space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 font-sans">
                        <div className="space-y-0.5 max-w-[80%]">
                          <h5 className="font-extrabold text-xs text-slate-200 leading-snug">
                            {meet.title}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {meet.time} WIB • Diatur oleh {meet.createdBy}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteMeeting(meet.id, meet.title)}
                          className="p-1 text-slate-600 hover:text-rose-500 transition cursor-pointer"
                          title="Hapus Rapat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        {meet.desc || "Tidak ada agenda khusus."}
                      </p>

                      <div className="flex items-center gap-1.5 p-1.5 px-2 bg-slate-900 border border-slate-850 rounded-lg text-[10.5px] text-slate-300 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{meet.location}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-900 text-[10px] space-y-1.5">
                        <span className="text-slate-500 font-bold block">PESERTA TIM:</span>
                        <div className="flex flex-wrap gap-1">
                          {meet.participants.map(p => (
                            <span key={p} className="bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded border border-slate-850">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Immediate action to trigger alarm popup */}
                      {meet.isReminderEnabled && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => triggerReminderNow(meet)}
                            className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded px-2 py-1 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Simulasikan trigger pengingat alarm instan untuk rapat ini"
                          >
                            <Bell className="w-2.5 h-2.5 animate-pulse" /> Uji Alarm Pengingat
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-slate-650 flex flex-col items-center justify-center">
                    <CalendarIcon className="w-10 h-10 text-slate-800 mb-3 animate-pulse" />
                    <p className="text-xs text-slate-500">Tidak ada jadwal rapat hari ini.</p>
                    <button
                      onClick={() => setIsScheduling(true)}
                      className="text-indigo-400 hover:underline hover:text-indigo-300 text-[11px] font-bold mt-2 font-mono cursor-pointer"
                    >
                      + Atur Pertemuan Sekarang
                    </button>
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
