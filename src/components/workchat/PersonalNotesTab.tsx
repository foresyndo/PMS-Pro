import React, { useState, useEffect } from "react";
import { UserRole } from "../../types";
import { 
  Plus, 
  Trash2, 
  Search, 
  BookOpen, 
  Tag, 
  Clock, 
  PlusCircle, 
  CheckCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // "amber" | "emerald" | "indigo" | "rose" | "slate"
  category: string; // "Tugas" | "Pribadi" | "Memo" | "Ide"
  updatedAt: string;
}

interface PersonalNotesTabProps {
  currentRole: UserRole;
  roleName: string;
}

const NOTE_COLORS = [
  { id: "slate", bg: "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100", dot: "bg-slate-400" },
  { id: "amber", bg: "bg-amber-950/40 border-amber-500/30 hover:bg-amber-950/60 text-amber-100", dot: "bg-amber-400" },
  { id: "emerald", bg: "bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-950/60 text-emerald-100", dot: "bg-emerald-400" },
  { id: "indigo", bg: "bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-950/60 text-indigo-100", dot: "bg-indigo-400" },
  { id: "rose", bg: "bg-rose-950/40 border-rose-500/30 hover:bg-rose-950/60 text-rose-100", dot: "bg-rose-400" },
];

const CATEGORIES = ["Tugas", "Pribadi", "Memo", "Ide"];

export default function PersonalNotesTab({ currentRole, roleName }: PersonalNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  
  // Create / Edit State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("slate");
  const [newCategory, setNewCategory] = useState("Memo");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Load notes on role change
  useEffect(() => {
    const raw = localStorage.getItem("pms_personal_notes");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const roleNotes = parsed[currentRole] || [];
        setNotes(roleNotes);
      } catch (e) {
        console.error("Failed to parse personal notes", e);
        setNotes([]);
      }
    } else {
      // Seed initial notes
      const initialNotes: Record<string, Note[]> = {
        "Super Admin": [
          {
            id: "n-1",
            title: "Backup Database Bulanan",
            content: "Lakukan ekspor skema database lewat Supabase Module setiap tanggal 25 malam pukul 23:55 WIB.",
            color: "indigo",
            category: "Tugas",
            updatedAt: new Date().toISOString()
          },
          {
            id: "n-2",
            title: "Ide Fitur Auto-Billing",
            content: "Tambahkan pemicu penagihan otomatis yang langsung mengirimkan PDF tagihan via email dan Whatsapp tenant pada H-3 jatuh tempo sewa.",
            color: "amber",
            category: "Ide",
            updatedAt: new Date().toISOString()
          }
        ],
        "Manager": [
          {
            id: "n-3",
            title: "Inspeksi Kamar Kosong",
            content: "Jadwalkan pembersihan intensif untuk kamar VIP yang baru dicheckout minggu ini bersama tim laundry & housekeeping.",
            color: "emerald",
            category: "Tugas",
            updatedAt: new Date().toISOString()
          }
        ]
      };
      const roleNotes = initialNotes[currentRole] || [
        {
          id: "n-default",
          title: "Catatan Selamat Datang",
          content: `Ini adalah ruang catatan pribadi Anda sebagai ${currentRole}. Ketik agenda rahasia, ide, atau pengingat pribadi harian di sini. Catatan ini hanya bisa diakses oleh Anda!`,
          color: "slate",
          category: "Memo",
          updatedAt: new Date().toISOString()
        }
      ];
      setNotes(roleNotes);
    }
  }, [currentRole]);

  // Save notes to localStorage
  const saveToStorage = (updatedNotes: Note[]) => {
    const raw = localStorage.getItem("pms_personal_notes");
    let allNotes: Record<string, Note[]> = {};
    if (raw) {
      try {
        allNotes = JSON.parse(raw);
      } catch (e) {}
    }
    allNotes[currentRole] = updatedNotes;
    localStorage.setItem("pms_personal_notes", JSON.stringify(allNotes));
    setNotes(updatedNotes);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (editingNoteId) {
      // Update existing
      const updated = notes.map(n => {
        if (n.id === editingNoteId) {
          return {
            ...n,
            title: newTitle.trim(),
            content: newContent.trim(),
            color: newColor,
            category: newCategory,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });
      saveToStorage(updated);
      setEditingNoteId(null);
    } else {
      // Add new
      const newNote: Note = {
        id: "note-" + Date.now(),
        title: newTitle.trim(),
        content: newContent.trim(),
        color: newColor,
        category: newCategory,
        updatedAt: new Date().toISOString()
      };
      saveToStorage([newNote, ...notes]);
    }

    // Reset Form
    setNewTitle("");
    setNewContent("");
    setNewColor("slate");
    setNewCategory("Memo");
    setIsAdding(false);
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewColor(note.color);
    setNewCategory(note.category);
    setIsAdding(true);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan pribadi ini?")) {
      const filtered = notes.filter(n => n.id !== id);
      saveToStorage(filtered);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                        n.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "Semua" || n.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden">
      {/* Tab Header Banner */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Catatan Kerja & Memo Pribadi
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              Role: {currentRole}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Penyimpanan memo rahasia khusus milik <strong className="text-slate-300">{roleName}</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingNoteId(null);
            setNewTitle("");
            setNewContent("");
            setNewColor("slate");
            setNewCategory("Memo");
            setIsAdding(!isAdding);
          }}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow duration-150 cursor-pointer"
        >
          {isAdding ? "Batal" : <><Plus className="w-3.5 h-3.5" /> Memo Baru</>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Search and Note List side */}
        <div className="w-80 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari isi catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory("Semua")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                  selectedCategory === "Semua"
                    ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-400"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
              >
                Semua
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                    selectedCategory === cat
                      ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-400"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => {
                const colorsDef = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                return (
                  <button
                    key={note.id}
                    onClick={() => handleStartEdit(note)}
                    className={`w-full flex flex-col text-left p-3.5 rounded-xl border transition ${colorsDef.bg}`}
                  >
                    <div className="flex items-center justify-between gap-2.5 w-full">
                      <span className="font-bold text-xs truncate">{note.title || "Memo Tanpa Judul"}</span>
                      <span className="text-[9px] bg-slate-950/60 text-slate-400 px-1.5 py-0.2 rounded font-mono uppercase">
                        {note.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-slate-800/10 text-[9px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {new Date(note.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${colorsDef.dot}`} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-600">
                <FileText className="w-10 h-10 mx-auto text-slate-800 mb-2 animate-pulse" />
                <p className="text-xs">Memo tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Custom Form Composer / Main Details */}
        <div className="flex-1 bg-slate-900/40 p-6 overflow-y-auto flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveNote}
                className="bg-slate-950 p-6 rounded-xl border border-slate-850 shadow-xl space-y-4 max-w-2xl mx-auto w-full text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {editingNoteId ? "📄 Edit Memo Kerja" : "📝 Tambah Memo Baru"}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Otomatis Terarsip</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Kategori catatan</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Warna label & accent</label>
                    <div className="flex items-center gap-1.5 py-1.5">
                      {NOTE_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewColor(c.id)}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            c.id === "slate" ? "bg-slate-700" :
                            c.id === "amber" ? "bg-amber-500" :
                            c.id === "emerald" ? "bg-emerald-500" :
                            c.id === "indigo" ? "bg-indigo-500" : "bg-rose-500"
                          } ${newColor === c.id ? "border-white scale-110 shadow-lg ring-1 ring-emerald-400" : "border-transparent opacity-80"}`}
                          title={`Warna ${c.id}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Judul Memo / Agenda</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembagian token cadangan..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Isi Catatan Pribadi</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Tulis detail catatan kerja rahasia atau pengingat harian Anda di sini..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {editingNoteId ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(editingNoteId)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {editingNoteId ? "Simpan Perubahan" : "Simpan Catatan"}
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-10"
              >
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full mb-4 animate-bounce">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-300">
                  Panel Catatan {currentRole} Aktif
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Semua catatan di enkripsi lokal di browser Anda. Setiap role staf PMS memiliki memori catatan pribadi bebas gangguan yang saling terpisah.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-2.5 w-full text-left lg:hidden">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Memo Anda:</div>
                  {notes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleStartEdit(n)}
                      className="w-full p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs flex justify-between items-center text-left hover:border-emerald-500/40"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 inline-block uppercase bg-slate-900 px-1 py-0.2 rounded">{n.category}</span>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold hover:underline">Edit &rsaquo;</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEditingNoteId(null);
                      setNewTitle("");
                      setNewContent("");
                      setNewColor("slate");
                      setNewCategory("Memo");
                      setIsAdding(true);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-800 text-slate-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 mt-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Buat Memo Sekarang
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
