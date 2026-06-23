import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ClipboardCheck,
  Package,
  Plus,
  Compass,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Calendar,
  Users,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  TrendingUp,
  Check,
  FileText,
  Layers,
  PlusCircle,
  X,
  MapPin,
  CheckSquare,
  Minus,
  Edit,
  Upload
} from "lucide-react";
import { Unit, Property, Employee } from "../types";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  category: "Consumables" | "Linens" | "Amenities" | "Tools";
}

interface HousekeepingLog {
  id: string;
  roomNumber: string;
  propertyName: string;
  cleanType: string;
  staffName: string;
  consumedItems: string[];
  completedAt: string;
  notes: string;
  imageUrl?: string;
}

interface ShiftRoster {
  id: string;
  day: string; // e.g. "Senin", "Selasa"
  staffName: string;
  staffRole: string;
  shiftType: "Pagi (07:00 - 15:00)" | "Siang (15:00 - 23:00)" | "Malam (23:00 - 07:00)";
  assignedArea: string;
  notes: string;
}

const defaultInventory: InventoryItem[] = [
  { id: "inv-1", name: "Sabun Mandi Gel Mini 30ml", quantity: 154, minQuantity: 50, category: "Amenities" },
  { id: "inv-2", name: "Sprei Kasur Putih King Premium", quantity: 48, minQuantity: 15, category: "Linens" },
  { id: "inv-3", name: "Sprei Kasur Putih Single Cotton", quantity: 35, minQuantity: 10, category: "Linens" },
  { id: "inv-4", name: "Sikat Gigi Hotel Pack Duo", quantity: 12, minQuantity: 40, category: "Amenities" },
  { id: "inv-5", name: "Cairan Pembersih Lantai Lavender (Liter)", quantity: 8, minQuantity: 5, category: "Consumables" },
  { id: "inv-6", name: "Pewangi Ruangan Spray Citrus Eco", quantity: 14, minQuantity: 4, category: "Consumables" },
  { id: "inv-7", name: "Handuk Mandi Putih Tebal", quantity: 60, minQuantity: 20, category: "Linens" },
  { id: "inv-8", name: "Kain Lap Mikrofiber Kuning", quantity: 15, minQuantity: 6, category: "Tools" }
];

const defaultSchedules: ShiftRoster[] = [
  { id: "roster-1", day: "Senin", staffName: "Agus Prasetyo", staffRole: "Senior Janitor", shiftType: "Pagi (07:00 - 15:00)", assignedArea: "Lantai 1-2 & Kamar Deluxe", notes: "Fokus pembersihan setelah weekend check-out" },
  { id: "roster-2", day: "Selasa", staffName: "Siti Rohmah", staffRole: "Chambermaid", shiftType: "Siang (15:00 - 23:00)", assignedArea: "Seluruh Kamar Suite", notes: "Ganti linen & amenities baru" },
  { id: "roster-3", day: "Rabu", staffName: "Budi Santoso", staffRole: "Public Area Cleaner", shiftType: "Malam (23:00 - 07:00)", assignedArea: "Lobby Utama & Sanitasi Lift", notes: "Deep cleaning area lift & resepsionis" },
  { id: "roster-4", day: "Kamis", staffName: "Dewi Lestari", staffRole: "Chambermaid", shiftType: "Pagi (07:00 - 15:00)", assignedArea: "Kamar Standar & Laundry Area", notes: "Sotir linen kotor dan restock sprei" }
];

const defaultLogs: HousekeepingLog[] = [
  {
    id: "log-1",
    roomNumber: "102",
    propertyName: "Grand Slipi Residence",
    cleanType: "Turnover Clean (Check-out)",
    staffName: "Agus Prasetyo",
    consumedItems: ["2x Sabun Mandi Gel Mini 30ml", "1x Sprei Kasur Putih King Premium", "2x Sikat Gigi Hotel Pack Duo"],
    completedAt: "23 Juni 2026, 10:15 WIB",
    notes: "Kondisi kamar sebelumnya sangat berdebu, disinfeksi penuh berhasil."
  },
  {
    id: "log-2",
    roomNumber: "205",
    propertyName: "Alam Sutera Suites",
    cleanType: "Express Clean (Daily)",
    staffName: "Siti Rohmah",
    consumedItems: ["2x Sabun Mandi Gel Mini 30ml"],
    completedAt: "23 Juni 2026, 08:30 WIB",
    notes: "Hanya merapikan sprei dan mengisi ulang sabun mandi."
  }
];

interface HousekeepingProps {
  units: Unit[];
  properties: Property[];
  employees?: Employee[];
  onUpdateUnitStatus: (id: string, status: any) => void;
}

export default function HousekeepingInventory({
  units = [],
  properties = [],
  employees = [],
  onUpdateUnitStatus
}: HousekeepingProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<"workspace" | "inventory" | "history" | "roster">("workspace");

  // Local state persisted in localStorage
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("pmspro_housekeeping_inventory");
    return saved ? JSON.parse(saved) : defaultInventory;
  });

  const [logs, setLogs] = useState<HousekeepingLog[]>(() => {
    const saved = localStorage.getItem("pmspro_housekeeping_logs");
    return saved ? JSON.parse(saved) : defaultLogs;
  });

  const [schedules, setSchedules] = useState<ShiftRoster[]>(() => {
    const saved = localStorage.getItem("pmspro_housekeeping_schedules");
    return saved ? JSON.parse(saved) : defaultSchedules;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("pmspro_housekeeping_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("pmspro_housekeeping_logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("pmspro_housekeeping_schedules", JSON.stringify(schedules));
  }, [schedules]);

  // Workspace Filters & Search
  const [roomQuery, setRoomQuery] = useState("");
  const [roomFilterStatus, setRoomFilterStatus] = useState<"all" | "Cleaning" | "Available" | "Occupied">("all");

  // Inventory Filters & Form
  const [invQuery, setInvQuery] = useState("");
  const [invFilterCat, setInvFilterCat] = useState<"all" | "Consumables" | "Linens" | "Amenities" | "Tools">("all");
  const [showAddInvForm, setShowAddInvForm] = useState(false);

  // New Inventory Item form states
  const [newInvName, setNewInvName] = useState("");
  const [newInvQty, setNewInvQty] = useState(20);
  const [newInvMinQty, setNewInvMinQty] = useState(5);
  const [newInvCat, setNewInvCat] = useState<InventoryItem["category"]>("Amenities");

  // Interactive Cleaning Task Modal
  const [activeCleanModalUnit, setActiveCleanModalUnit] = useState<Unit | null>(null);
  const [cleanType, setCleanType] = useState<string>("Turnover Clean (Check-out)");
  const [assignedStaff, setAssignedStaff] = useState<string>("Agus Prasetyo");
  const [cleaningNotes, setCleaningNotes] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  // Interactive checklist states inside modal
  const [checklistBedLinen, setChecklistBedLinen] = useState(false);
  const [checklistSnackSoap, setChecklistSnackSoap] = useState(false);
  const [checklistToilet, setChecklistToilet] = useState(false);
  const [checklistFloor, setChecklistFloor] = useState(false);
  const [checklistDisinfect, setChecklistDisinfect] = useState(false);

  // Staff Schedule Form inside Roster Tab
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [rDay, setRDay] = useState("Senin");
  const [rStaff, setRStaff] = useState("Agus Prasetyo");
  const [rShift, setRShift] = useState<ShiftRoster["shiftType"]>("Pagi (07:00 - 15:00)");
  const [rArea, setRArea] = useState("Lantai 1");
  const [rNotes, setRNotes] = useState("");

  // Determine a list of available staff (combine employees with role "Housekeeping"/"Staff" or static ones)
  const getHousekeepingStaff = () => {
    const fromHR = employees
      .filter((e) => e.status === "Active" && 
        (e.role.toLowerCase().includes("housekeeping") || 
         e.role.toLowerCase().includes("janitor") || 
         e.role.toLowerCase().includes("staff") ||
         e.department.toLowerCase().includes("hr") ||
         e.department.toLowerCase().includes("operasional"))
      )
      .map((e) => e.name);

    const staticStaff = ["Agus Prasetyo", "Siti Rohmah", "Budi Santoso", "Dewi Lestari"];
    // Combine unique names
    return Array.from(new Set([...fromHR, ...staticStaff]));
  };

  const hkStaffList = getHousekeepingStaff();

  // Create clean notification / alerts logs
  const registerInternalLog = (text: string) => {
    console.log(`[Housekeeping Subsystem] ${text}`);
  };

  // Trigger auto-calculation & deduction of inventory upon clean confirmation
  const handleConfirmCleanAndDeduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCleanModalUnit) return;

    // Build lists of consumed materials based on what checklist items are active
    const consumed: string[] = [];
    const inventoryUpdates = [...inventory];

    // Helper to safety-deduct from cloned inventory state
    const deductItem = (id: string, qtyNeeded: number, label: string) => {
      const idx = inventoryUpdates.findIndex(item => item.id === id);
      if (idx !== -1) {
        const item = inventoryUpdates[idx];
        const newQty = Math.max(0, item.quantity - qtyNeeded);
        inventoryUpdates[idx] = { ...item, quantity: newQty };
        consumed.push(`${qtyNeeded}x ${item.name}`);
      } else {
        consumed.push(`${qtyNeeded}x ${label} (Stok tdk terdaftar)`);
      }
    };

    if (checklistBedLinen) {
      // Deduct 1 linen
      deductItem("inv-2", 1, "Sprei Kasur Putih King Premium");
    }
    if (checklistSnackSoap) {
      // Deduct 2 Mini soap and 2 toothbrushes
      deductItem("inv-1", 2, "Sabun Mandi Gel Mini 30ml");
      deductItem("inv-4", 2, "Sikat Gigi Hotel Pack Duo");
    }
    if (checklistToilet || checklistFloor) {
      // Deduct 1 cleaning liquid and 1 citrus spray (eco)
      deductItem("inv-5", 1, "Cairan Pembersih Lantai Lavender (Liter)");
    }
    if (checklistDisinfect) {
      deductItem("inv-6", 1, "Pewangi Ruangan Spray Citrus Eco");
    }

    if (consumed.length === 0) {
      consumed.push("Tidak ada barang logistik yang terpakai.");
    }

    // 1. Update unit status in parent PMS state to 'Available' (or clean)
    onUpdateUnitStatus(activeCleanModalUnit.id, "Available");

    // 2. Add into persistent history log state
    const propName = properties.find(p => p.id === activeCleanModalUnit.propertyId)?.name || "Apartments Pro";
    const newLog: HousekeepingLog = {
      id: "log-" + Date.now().toString(),
      roomNumber: activeCleanModalUnit.unitNumber,
      propertyName: propName,
      cleanType: cleanType,
      staffName: assignedStaff,
      consumedItems: consumed,
      completedAt: new Date().toLocaleString("id-ID", { hour12: false }) + " WIB",
      notes: cleaningNotes || "Pembersihan berkala rutin.",
      imageUrl: uploadedImage || undefined
    };

    setLogs([newLog, ...logs]);
    setInventory(inventoryUpdates);
    
    // Reset modal state
    setActiveCleanModalUnit(null);
    setCleaningNotes("");
    setChecklistBedLinen(false);
    setChecklistSnackSoap(false);
    setChecklistToilet(false);
    setChecklistFloor(false);
    setChecklistDisinfect(false);
    setUploadedImage(null);

    alert(`Hore! Kamar No ${activeCleanModalUnit.unitNumber} berhasil disterilisasi & siap disewa. Logistik dikonsumsi: ${consumed.join(", ")}`);
  };

  // Add new item into local storage inventory
  const handleAddNewInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return alert("Masukkan nama barang!");

    const newItem: InventoryItem = {
      id: "inv-" + Date.now().toString(),
      name: newInvName,
      quantity: Number(newInvQty),
      minQuantity: Number(newInvMinQty),
      category: newInvCat
    };

    setInventory([newItem, ...inventory]);
    setNewInvName("");
    setNewInvQty(20);
    setNewInvMinQty(5);
    setShowAddInvForm(false);
    alert(`Barang "${newItem.name}" terdaftar dalam database logistik.`);
  };

  // Add schedules inside Roster
  const handleAddRosterSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoster: ShiftRoster = {
      id: "roster-" + Date.now().toString(),
      day: rDay,
      staffName: rStaff,
      staffRole: "Housekeeping Operator",
      shiftType: rShift,
      assignedArea: rArea,
      notes: rNotes || "Tugas reguler harian."
    };

    setSchedules([...schedules, newRoster]);
    setRNotes("");
    setShowScheduleForm(false);
    alert(`Jadwal piket piknik ${newRoster.day} untuk ${newRoster.staffName} berhasil disimpan.`);
  };

  // Quick Restock & Use buttons in logistics tab
  const handleQuickQuantityChange = (id: string, diff: number) => {
    setInventory(inventory.map(item => {
      if (item.id !== id) return item;
      const targetQty = item.quantity + diff;
      return { ...item, quantity: Math.max(0, targetQty) };
    }));
  };

  // Delete Logistik
  const handleDeleteInventory = (id: string) => {
    if (window.confirm("Menghapus item inventaris ini?")) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Menghapus entri jadwal piket staf ini?")) {
      setSchedules(schedules.filter(sch => sch.id !== id));
    }
  };

  // Counting statistic numbers
  const totalRooms = units.length;
  const countDirty = units.filter(u => u.status === "Cleaning").length;
  const countClean = units.filter(u => u.status === "Available").length;
  const countOccupied = units.filter(u => u.status === "Occupied").length;
  
  const countLowStock = inventory.filter(item => item.quantity <= item.minQuantity).length;

  return (
    <div className="space-y-6 font-sans text-xs text-slate-800">
      
      {/* HEADER STATEMENT */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border border-slate-700">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-slate-900">
              <Sparkles className="h-5 w-5 text-slate-950 animate-pulse" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">Portal Divisi Housekeeping & Logistik</h2>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            Monitor sterilisasi unit kamar, otomasi ganti sprei & amandemen logistik, logs riwayat, dan roster shift staf real-time.
          </p>
        </div>

        {/* SUB NAVIGATION TAB CONTROL */}
        <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab("workspace")}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition text-[10px] cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "workspace"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" /> Workspace Kamar ({countDirty} Dirty)
          </button>
          <button
            onClick={() => setActiveSubTab("inventory")}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition text-[10px] cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "inventory"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Package className="h-3.5 w-3.5" /> Logistik & Stok {countLowStock > 0 && <span className="h-2 w-2 rounded-full bg-rose-500" />}
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition text-[10px] cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Riwayat Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveSubTab("roster")}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition text-[10px] cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "roster"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> Jadwal Shift ({schedules.length})
          </button>
        </div>
      </div>

      {/* HOUSEKEEPING STATIC KPI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div id="stat-hk-dirty" className="bg-white p-4 rounded-2xl border border-rose-100 shadow-3xs text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Butuh Dibersihkan</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-black text-rose-600 tracking-tight">{countDirty}</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Unit Kamar</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-rose-700 font-semibold bg-rose-50/50 px-2 py-0.5 rounded-lg border border-rose-100 w-max">
            <AlertTriangle className="h-3 w-3" /> Prioritas Utama
          </div>
        </div>

        <div id="stat-hk-clean" className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-3xs text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Ready Available (Bersih)</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">{countClean}</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Unit Kamar</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-max">
            <CheckCircle className="h-3 w-3" /> Bebas Disewa
          </div>
        </div>

        <div id="stat-hk-occupied" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-slate-400" />
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Dihuni Tenant</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{countOccupied}</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Unit Kamar</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-150 w-max">
            <Compass className="h-3 w-3" /> Terisi Aktif
          </div>
        </div>

        <div id="stat-hk-stock" className="bg-white p-4 rounded-2xl border border-amber-100 shadow-3xs text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Kritis (Limit Minimum)</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`text-3xl font-black tracking-tight ${countLowStock > 0 ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
              {countLowStock}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Barang</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-max">
            <Package className="h-3 w-3" /> Amandemen Stok
          </div>
        </div>

        <div id="stat-hk-tasks-today" className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-3xs text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-indigo-500" />
          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide">Selesai Hari Ini</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-black text-indigo-600 tracking-tight">{logs.length}</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">Tugas</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-max">
            <TrendingUp className="h-3 w-3" /> Produktivitas Tinggi
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER CORRESPONDING TO ACTIVE TAB */}

      {/* ------------------- TAB 1: WORKSPACE KAMAR ------------------- */}
      {activeSubTab === "workspace" && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5 text-left">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Kamar... (cth: 104)"
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  className="w-full bg-white pl-9 pr-3 py-2 border border-slate-250 rounded-xl text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Status selectors */}
              <div className="flex bg-slate-200/70 p-0.5 rounded-xl border border-slate-250/20 text-[10px] font-bold">
                <button
                  onClick={() => setRoomFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${roomFilterStatus === "all" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Semua ({totalRooms})
                </button>
                <button
                  onClick={() => setRoomFilterStatus("Cleaning")}
                  className={`px-3 py-1.5 rounded-lg transition ${roomFilterStatus === "Cleaning" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Butuh Dibersihkan ({countDirty})
                </button>
                <button
                  onClick={() => setRoomFilterStatus("Available")}
                  className={`px-3 py-1.5 rounded-lg transition ${roomFilterStatus === "Available" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Tersedia ({countClean})
                </button>
                <button
                  onClick={() => setRoomFilterStatus("Occupied")}
                  className={`px-3 py-1.5 rounded-lg transition ${roomFilterStatus === "Occupied" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Occupied ({countOccupied})
                </button>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 self-end md:self-auto uppercase">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Ganti status ke <strong>"Cleaning"</strong> untuk menguji alur tugas pembersihan.
            </div>
          </div>

          {/* ROOMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {units
              .filter(u => {
                if (roomQuery && !u.unitNumber.toLowerCase().includes(roomQuery.toLowerCase())) return false;
                if (roomFilterStatus === "all") return true;
                if (roomFilterStatus === "Cleaning") return u.status === "Cleaning";
                if (roomFilterStatus === "Available") return u.status === "Available";
                if (roomFilterStatus === "Occupied") return u.status === "Occupied";
                return true;
              })
              .map((unit) => {
                const prop = properties.find(p => p.id === unit.propertyId);
                const isDirty = unit.status === "Cleaning";
                const isClean = unit.status === "Available";
                
                // Find if there is any scheduled team for this room
                const areaMatched = schedules.find(sch => sch.assignedArea.toLowerCase().includes(unit.unitNumber));

                return (
                  <div
                    key={unit.id}
                    className={`bg-white border rounded-3xl p-4.5 transition flex flex-col justify-between gap-4 relative overflow-hidden shadow-3xs group hover:shadow-2xs ${
                      isDirty 
                        ? "border-rose-150 bg-rose-50/10 hover:bg-rose-50/20" 
                        : isClean 
                        ? "border-emerald-150 hover:bg-emerald-50/10" 
                        : "border-slate-150 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Visual indicators */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      isDirty ? "bg-rose-500" : isClean ? "bg-emerald-500" : "bg-slate-400"
                    }`} />

                    {/* Room title & Header */}
                    <div className="space-y-1 pl-1 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-base font-black text-slate-900 font-mono">ROOM {unit.unitNumber}</strong>
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase flex items-center gap-1 tracking-wider mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" /> {prop?.name || "Premium Asset"}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border select-none ${
                          isDirty
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : isClean
                            ? "bg-emerald-100 text-emerald-800 border-emerald-250"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}>
                          {unit.status}
                        </span>
                      </div>

                      {/* Room Specifications (Type, Max Tenants) */}
                      <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-100/80 text-[10px] text-slate-550 font-semibold font-mono">
                        <div>🚿 Bed: <span className="font-bold text-slate-800">{unit.type || "Studio"}</span></div>
                        <div>📐 Ukuran: <span className="font-bold text-slate-800">{unit.size || 24} m²</span></div>
                      </div>
                    </div>

                    {/* Footer Task Assignee Area & button */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-slate-200 text-slate-650 rounded">
                          <User className="h-3 w-3" />
                        </div>
                        <div className="text-left leading-tight">
                          <span className="text-[8px] text-gray-400 uppercase font-black block">Staff In Charge</span>
                          <strong className="text-slate-800 font-black">{areaMatched ? areaMatched.staffName : "Reguler Janitor"}</strong>
                        </div>
                      </div>

                      {/* Operation Button */}
                      {isDirty ? (
                        <button
                          onClick={() => {
                            setActiveCleanModalUnit(unit);
                            // Preselect staff
                            if (areaMatched) setAssignedStaff(areaMatched.staffName);
                          }}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          Selesaikan ✔️
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onUpdateUnitStatus(unit.id, "Cleaning");
                            registerInternalLog(`Room ${unit.unitNumber} marked as DIRTY/NEED CLEANING.`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-800 font-extrabold uppercase rounded-xl transition cursor-pointer"
                        >
                          Tugaskan Sapu 🧹
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}


      {/* ------------------- TAB 2: LOGISTIK & STOK INVENTARIS ------------------- */}
      {activeSubTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: CONTROLS & ADD ITEM */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="text-emerald-500 h-4 w-4" /> Registrasi Logistik Baru
                  </h3>
                  <p className="text-[10px] text-gray-450 mt-0.5">Tambah jenis barang konsumsi tamu hotel atau kosan</p>
                </div>
              </div>

              <form onSubmit={handleAddNewInventoryItem} className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">Nama Barang Logistik *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Slipper Sendal Tamu Putih"
                    value={newInvName}
                    onChange={(e) => setNewInvName(e.target.value)}
                    className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase block">Stok Awal</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newInvQty}
                      onChange={(e) => setNewInvQty(Number(e.target.value))}
                      className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase block">Alasan Limit (Min Qty)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newInvMinQty}
                      onChange={(e) => setNewInvMinQty(Number(e.target.value))}
                      className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">Klasifikasi Kategori</label>
                  <select
                    value={newInvCat}
                    onChange={(e) => setNewInvCat(e.target.value as any)}
                    className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white text-xs cursor-pointer focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Amenities">Amenities (Sabun, Sampo, Sikat gigi)</option>
                    <option value="Linens">Linens (Sprei kasur, Seimut, Handuk)</option>
                    <option value="Consumables">Consumables (Cairan sabun pel, Token, Tissue)</option>
                    <option value="Tools">Tools (Sapu, Kain lap micro, Vakum debu)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-[10px] tracking-wide"
                >
                  <Plus className="h-3.5 w-3.5" /> Daftarkan ke Gudang
                </button>
              </form>
            </div>

            {/* QUICK NOTIFICATION GUDANG BANNER */}
            <div className="bg-slate-550 bg-slate-900 p-4.5 rounded-3xl text-left text-white border border-slate-800 space-y-2.5">
              <span className="text-[8px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded uppercase">Integrasi Logistik</span>
              <p className="text-[10px] text-slate-300 font-semibold leading-normal">
                Sistem amandemen inventaris ini akan auto-mengurangi stok sprei/sabun/amenities setiap kali tim housekeeping menyelesaikan checklist checklist pembersihan kamar.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMNS: TABLE & INVENTORIES LOG */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left lg:col-span-2">
            
            {/* INLINE FILTER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari item logistik..."
                  value={invQuery}
                  onChange={(e) => setInvQuery(e.target.value)}
                  className="w-full bg-slate-50 pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {(["all", "Amenities", "Linens", "Consumables", "Tools"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setInvFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase transition cursor-pointer ${
                      invFilterCat === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "all" ? "Semua" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* INVENTORY LIST */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-extrabold uppercase text-slate-400 border-b border-slate-150">
                    <th className="py-2.5 px-3">Nama Gudang Logistik / Kategori</th>
                    <th className="py-2.5 px-3 text-center">Tersedia</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {inventory
                    .filter(item => {
                      if (invQuery && !item.name.toLowerCase().includes(invQuery.toLowerCase())) return false;
                      if (invFilterCat !== "all" && item.category !== invFilterCat) return false;
                      return true;
                    })
                    .map((item) => {
                      const isLow = item.quantity <= item.minQuantity;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 divide-x divide-slate-100">
                          <td className="py-3 px-3">
                            <strong className="text-slate-800 font-sans">{item.name}</strong>
                            <p className="text-[9px] text-slate-400 font-sans font-bold flex items-center gap-1 uppercase mt-0.5">
                              <Layers className="h-2.5 w-2.5 text-slate-400" /> {item.category}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-1 rounded-md ${
                              isLow ? "bg-red-50 text-red-700 font-black text-xs" : "bg-slate-100 text-slate-800"
                            }`}>
                              {item.quantity} Unit
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {isLow ? (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-900 border border-red-200 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse font-sans w-max">
                                <AlertTriangle className="h-3 w-3" /> RESTOCK
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[8px] font-black uppercase flex items-center gap-1 font-sans w-max">
                                <Check className="h-3 w-3 text-emerald-600" /> OK
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1 font-sans">
                              {/* Dec */}
                              <button
                                onClick={() => handleQuickQuantityChange(item.id, -1)}
                                className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 flex items-center gap-0.5 cursor-pointer"
                                title="Kurangi 1"
                              >
                                <Minus className="h-3 w-3" /> 1
                              </button>
                              {/* Restock */}
                              <button
                                onClick={() => handleQuickQuantityChange(item.id, 10)}
                                className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-300 flex items-center gap-0.5 cursor-pointer font-black"
                                title="Tambah 10"
                              >
                                <Plus className="h-3 w-3" /> 10
                              </button>
                              {/* Trash */}
                              <button
                                onClick={() => handleDeleteInventory(item.id)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded-md transition cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}


      {/* ------------------- TAB 3: RIWAYAT BULANAN LOGS ------------------- */}
      {activeSubTab === "history" && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150">
            <div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="text-emerald-500 h-4 w-4" /> Log Audit Aktivitas Housekeeping
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Daftar pembersihan kamar yang selesai beserta kalkulasi logistik yang terpakai</p>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm("Mengosongkan semua riwayat audit pembersihan fisik?")) {
                  setLogs([]);
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold uppercase text-[9px] border border-rose-100 select-none transition cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <ClipboardCheck className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Belum ada riwayat pembersihan yang terekam.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Selesaikan tugas pembersihan pada tab Workspace Kamar untuk menguji penciptaan log.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-8.5 w-8.5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-850 font-black text-xs font-mono">
                        {log.roomNumber}
                      </span>
                      <div>
                        <strong className="text-slate-800 text-xs">Room {log.roomNumber} ({log.propertyName})</strong>
                        <p className="text-[9px] text-gray-400 font-extrabold uppercase mt-0.5">{log.cleanType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-black rounded-md">{log.completedAt}</span>
                      <strong className="font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">PJ: {log.staffName}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2.5 border-t border-slate-150 text-[10px]">
                    <div className="md:col-span-1 text-left">
                      <span className="text-[8px] text-gray-400 uppercase font-black block">Logistik Terpakai:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.consumedItems.map((item, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-900 border border-emerald-150 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-3 text-left space-y-2">
                      <span className="text-[8px] text-gray-400 uppercase font-black block">Catatan Pemeriksaan:</span>
                      <p className="text-[10px] text-slate-600 mt-1 italic font-semibold leading-relaxed">
                        "{log.notes || "Kondisi sangat bersih, amenities diganti lengkap."}"
                      </p>

                      {log.imageUrl && (
                        <div className="pt-2">
                          <span className="text-[8px] text-gray-400 uppercase font-black block mb-1">Bukti Foto Lampiran:</span>
                          <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                            <img
                              src={log.imageUrl}
                              alt="Bukti pembersihan"
                              className="max-h-28 object-cover rounded-xl transition hover:opacity-90 cursor-pointer"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ------------------- TAB 4: ROSTER SHIFT STAFF ------------------- */}
      {activeSubTab === "roster" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PLANNER PANEL */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left lg:col-span-1">
            <div className="flex justify-between items-center pb-1 border-b border-slate-150">
              <div>
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="text-emerald-500 h-4 w-4" /> Penjadwalan Piket Staf
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Tugaskan penanggung jawab logistik & shift harian</p>
              </div>
            </div>

            <form onSubmit={handleAddRosterSchedule} className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Hari Piket</label>
                <select
                  value={rDay}
                  onChange={(e) => setRDay(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white text-xs cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Senin">Senin (Monday)</option>
                  <option value="Selasa">Selasa (Tuesday)</option>
                  <option value="Rabu">Rabu (Wednesday)</option>
                  <option value="Kamis">Kamis (Thursday)</option>
                  <option value="Jumat">Jumat (Friday)</option>
                  <option value="Sabtu">Sabtu (Saturday)</option>
                  <option value="Minggu">Minggu (Sunday)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Operator / Staf Housekeeping</label>
                <select
                  value={rStaff}
                  onChange={(e) => setRStaff(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white text-xs cursor-pointer"
                >
                  {hkStaffList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Shift Kerja harian</label>
                <select
                  value={rShift}
                  onChange={(e) => setRShift(e.target.value as any)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white text-xs cursor-pointer"
                >
                  <option value="Pagi (07:00 - 15:00)">Pagi (07:00 - 15:00)</option>
                  <option value="Siang (15:00 - 23:00)">Siang (15:00 - 23:00)</option>
                  <option value="Malam (23:00 - 07:00)">Malam (23:00 - 07:00)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Area Penugasan (Urutan Kamar / Koridor)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamar 104, 105 & Lobby"
                  value={rArea}
                  onChange={(e) => setRArea(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Catatan Tambahan</label>
                <textarea
                  placeholder="Spesifikasi pemeliharaan khusus..."
                  value={rNotes}
                  onChange={(e) => setRNotes(e.target.value)}
                  className="w-full text-slate-800 p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:bg-white"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase rounded-xl transition cursor-pointer text-[10px] tracking-wide"
              >
                Simpan Piket Roster
              </button>
            </form>
          </div>

          {/* VISUAL SHIFT TIMELINE / ROSTERS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left lg:col-span-2">
            <div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="text-slate-500 h-4 w-4" /> Jadwal Kegiatan Piket Aktif Minggu Ini
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Penempatan shift harian tim kebersihan untuk menjamin kecepatan ketersediaan unit kamar (turnover)</p>
            </div>

            <div className="space-y-3">
              {schedules.map((sch) => (
                <div key={sch.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-start hover:border-slate-200 transition">
                  <div className="space-y-1.5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded uppercase">
                        {sch.day}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[9px] font-black rounded border border-blue-200">
                        {sch.shiftType}
                      </span>
                    </div>

                    <p className="text-slate-800 font-bold text-xs">
                      {sch.staffName} <span className="text-slate-400 font-mono text-[9px]">({sch.staffRole})</span>
                    </p>

                    <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px] leading-relaxed font-semibold">
                      <span className="text-gray-400 uppercase font-black text-[9px]">Wilayah Kerja:</span>
                      <strong className="text-slate-800 font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100/50 w-max">{sch.assignedArea}</strong>

                      <span className="text-gray-400 uppercase font-black text-[9px]">Delegasi:</span>
                      <span className="text-slate-600 italic">"{sch.notes}"</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSchedule(sch.id)}
                    className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition shrink-0 cursor-pointer"
                    title="Hapus Piket"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* -------------------------------------
          MODAL INTERACTIVE ROOM CLEARANCE & CONSUMPTION
          ------------------------------------- */}
      {activeCleanModalUnit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmCleanAndDeduct} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Header Dialog */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-left">
                <span className="p-1.5 bg-rose-500 rounded text-slate-950 animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide">Penyelesaian Kamar No {activeCleanModalUnit.unitNumber}</h4>
                  <p className="text-[10px] text-rose-300 font-mono">Modul Sterilisasi & Potong Inventaris Logistis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCleanModalUnit(null)}
                className="text-slate-400 hover:text-white transition text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Inner modal inputs & interactives */}
            <div className="p-5 overflow-y-auto space-y-4 bg-slate-50 text-xs text-left">
              
              {/* Basic delegation attributes */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">Jenis Pekerjaan</label>
                  <select
                    value={cleanType}
                    onChange={(e) => setCleanType(e.target.value)}
                    className="w-full text-slate-800 p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold cursor-pointer"
                  >
                    <option value="Turnover Clean (Check-out)">Turnover Clean (Check-out)</option>
                    <option value="Express Clean (Daily)">Express Clean (Harian Kilat)</option>
                    <option value="Deep Disinfection (Monthly)">Deep Disinfection (Menyeluruh)</option>
                    <option value="Linen Replacement Only">Ganti Linen Saja</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">Staf Pembersih</label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full text-slate-800 p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold cursor-pointer"
                  >
                    {hkStaffList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CHECKLIST STEPS INTERACTION (SMART CONSUMPTION TRIGGERS) */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Interactive Clean Checklist</span>
                  <p className="text-[10px] text-gray-400 leading-normal mt-0.5">Sebutkan tugas yang selesai demi keselamatan & autodebet stok gudang</p>
                </div>

                {/* Individual checkable rows */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistBedLinen}
                      onChange={(e) => setChecklistBedLinen(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="text-left font-semibold">
                      <p className="text-slate-800 text-xs text-[11px]">Sprei kasur diganti baru & rapi.</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.2 block">📦 Memakai: <strong className="text-slate-650">1x Sprei Putih King Luxury (-1)</strong></span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistSnackSoap}
                      onChange={(e) => setChecklistSnackSoap(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="text-left font-semibold">
                      <p className="text-slate-800 text-xs text-[11px]">Amenities Kamar Mandi dilengkapkan.</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.2 block">📦 Memakai: <strong className="text-slate-650">2x Sabun Mandi Gel & 2x Sikat Gigi (-2)</strong></span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistToilet}
                      onChange={(e) => setChecklistToilet(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="text-left font-semibold">
                      <p className="text-slate-800 text-xs text-[11px]">Pembersihan toilet & wastafel disiram desinfektan.</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.2 block">📦 Memakai: <strong className="text-slate-650">1x Cairan Pembersih Lantai Lavender (-1)</strong></span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistDisinfect}
                      onChange={(e) => setChecklistDisinfect(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                    />
                    <div className="text-left font-semibold">
                      <p className="text-slate-800 text-xs text-[11px]">Sanitasi penuh & semprot wangi Citrus Eco.</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.2 block">📦 Memakai: <strong className="text-slate-650">1x Pewangi Spray Citrus Eco (-1)</strong></span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom logs text */}
              <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-150 font-sans">
                <label className="text-[9px] font-black text-gray-500 uppercase block">Laporan Manual Janitor</label>
                <textarea
                  required
                  placeholder="Kondisi selesai. Kamar bersih wangi lavender siap dipakai check-in..."
                  value={cleaningNotes}
                  onChange={(e) => setCleaningNotes(e.target.value)}
                  className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                  rows={2}
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-150 text-left font-sans">
                <label className="text-[9px] font-black text-gray-500 uppercase block flex justify-between">
                  <span>Unggah Foto Bukti Kerja (Selesai Pembersihan)</span>
                  <span className="text-gray-400 font-normal">Base64 Offline</span>
                </label>
                
                {uploadedImage ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={uploadedImage}
                      alt="Uploaded proof"
                      className="w-full h-32 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
                      title="Hapus Foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="p-2 text-[9px] text-gray-500 font-mono text-center">
                      Foto bukti siap didokumentasikan di Riwayat Logs ✔️
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const files = e.dataTransfer.files;
                      if (files && files[0]) {
                        const file = files[0];
                        if (!file.type.startsWith("image/")) {
                          alert("Mohon masukkan tipe file gambar (.png, .jpg, .jpeg, etc)!");
                          return;
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          alert("Ukuran gambar melebihi limit 3MB!");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setUploadedImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`mt-2 border-2 border-dashed rounded-xl p-4 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                      isDragOver
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-slate-250 hover:border-emerald-500 hover:bg-emerald-50/10"
                    }`}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        const files = target.files;
                        if (files && files[0]) {
                          const file = files[0];
                          if (file.size > 3 * 1024 * 1024) {
                            alert("Ukuran gambar melebihi limit 3MB!");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUploadedImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-6 w-6 text-slate-400 animate-bounce" />
                    <div className="font-semibold text-slate-700 text-[11px]">
                      Tarik & Lepas gambar di sini, atau <span className="text-emerald-600 underline">Pilih File</span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium">Batas ukuran file maksimal 3 Megabyte (Format JPG, PNG)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between shrink-0">
              <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 uppercase">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> Auto Deduct Enabled
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCleanModalUnit(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
                >
                  Urungkan
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  Konfirmasi Selesai & Potong Stok ✔️
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
