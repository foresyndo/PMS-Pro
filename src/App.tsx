import React, { useState, useEffect } from "react";
import {
  Building2,
  LayoutDashboard,
  Building,
  Home,
  CalendarDays,
  Users,
  DollarSign,
  Wrench,
  Sparkles,
  Award,
  FileCheck,
  LogOut,
  Sliders,
  ChevronRight,
  User,
  ShieldAlert,
  Menu,
  X,
  Clock,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  INITIAL_PROPERTIES,
  INITIAL_UNITS,
  INITIAL_TENANTS,
  INITIAL_RESERVATIONS,
  INITIAL_CONTRACTS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_MAINTENANCE,
  INITIAL_CHAT_MESSAGES,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_LEAVE_REQUESTS
} from "./data";

import {
  Property,
  Unit,
  Tenant,
  Reservation,
  Contract,
  Invoice,
  Expense,
  MaintenanceTicket,
  UserRole,
  PaymentLog,
  WorkChatMessage,
  Employee,
  Attendance,
  Payroll,
  LeaveRequest
} from "./types";

import SupabaseModule from "./components/SupabaseModule";
import {
  isSupabaseConfigured,
  loadAllFromSupabase,
  upsertToSupabase,
  deleteFromSupabase,
  pushAllToSupabase
} from "./lib/supabase";
import { Database } from "lucide-react";

// Import modules
import Dashboard from "./components/Dashboard";
import PropertyModule from "./components/PropertyModule";
import UnitModule from "./components/UnitModule";
import BookingModule from "./components/BookingModule";
import TenantModule from "./components/TenantModule";
import FinanceModule from "./components/FinanceModule";
import MaintenanceModule from "./components/MaintenanceModule";
import HousekeepingInventory from "./components/HousekeepingInventory";
import CrmMarketing from "./components/CrmMarketing";
import DigitalContract from "./components/DigitalContract";
import WorkChatModule from "./components/WorkChatModule";
import HRISModule from "./components/HRISModule";

export default function App() {
  // Session states
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>("Super Admin");
  const [userEmail, setUserEmail] = useState("sahrul.viona12@gmail.com");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active database state logs
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);

  // Chat state with LocalStorage backup
  const [chatMessages, setChatMessages] = useState<WorkChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("pms_chat_messages");
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch (e) {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  useEffect(() => {
    localStorage.setItem("pms_chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleAddChatMessage = (msg: WorkChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
    saveToCloud("work_chats", msg);
  };

  const handleClearChats = () => {
    setChatMessages(INITIAL_CHAT_MESSAGES);
    registerLog("Reset database percakapan chat ke default", "Sistem");
  };

  // Supabase Integration & Load State
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<Record<string, boolean>>({});

  const saveToCloud = async (tableName: string, data: any) => {
    if (isSupabaseConfigured()) {
      await upsertToSupabase(tableName, data);
    }
  };

  const removeFromCloud = async (tableName: string, id: string) => {
    if (isSupabaseConfigured()) {
      await deleteFromSupabase(tableName, id);
    }
  };

  const loadDataFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setSupabaseLoading(true);
    try {
      const results = await loadAllFromSupabase();
      setSupabaseStatus(results.tablesStatus);
      const activeTablesCount = Object.values(results.tablesStatus).filter(Boolean).length;
      
      if (activeTablesCount > 0) {
        if (results.tablesStatus["properties"] && results.properties.length > 0) setProperties(results.properties);
        if (results.tablesStatus["units"] && results.units.length > 0) setUnits(results.units);
        if (results.tablesStatus["tenants"] && results.tenants.length > 0) setTenants(results.tenants);
        if (results.tablesStatus["reservations"] && results.reservations.length > 0) setReservations(results.reservations);
        if (results.tablesStatus["contracts"] && results.contracts.length > 0) setContracts(results.contracts);
        if (results.tablesStatus["invoices"] && results.invoices.length > 0) setInvoices(results.invoices);
        if (results.tablesStatus["expenses"] && results.expenses.length > 0) setExpenses(results.expenses);
        if (results.tablesStatus["maintenance_tickets"] && results.maintenanceTickets.length > 0) setMaintenance(results.maintenanceTickets);
        if (results.tablesStatus["work_chats"] && results.workChats && results.workChats.length > 0) {
          setChatMessages(results.workChats);
        }
        
        registerLog("Data PMS ter-sinkronisasi langsung dengan Supabase Cloud!", "Sistem");
      }
    } catch (err: any) {
      console.error("Load failed:", err);
      registerLog(`Gagal memuat awan database: ${err.message || err}`, "Sistem");
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handlePushDataToSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setSupabaseLoading(true);
    try {
      const res = await pushAllToSupabase({
        properties,
        units,
        tenants,
        reservations,
        contracts,
        invoices,
        expenses,
        maintenanceTickets: maintenance,
        paymentLogs: [],
        workChats: chatMessages
      });
      if (res.success) {
        registerLog("Berhasil seeding database lokal ke Supabase Cloud", "Sistem");
        loadDataFromSupabase();
      } else {
        registerLog("Gagal push data. Periksa skema tabel di SQL editor.", "Sistem");
      }
    } catch (err: any) {
      registerLog(`Unggahan Supabase mengalami error: ${err.message || err}`, "Sistem");
    } finally {
      setSupabaseLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadDataFromSupabase();
    }
  }, []);

  // States for handling deep linked simulated QR scans
  const [prefilledUnitId, setPrefilledUnitId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const unitId = params.get("unitId");
    
    if (unitId && action) {
      setPrefilledUnitId(unitId);
      if (action === "maintenance") {
        setActiveTab("maintenance");
        registerLog(`Memperoleh deep-link scan QR untuk laporan pemeliharaan unit ID: ${unitId}`, "Maintenance");
      } else if (action === "pay") {
        setActiveTab("keuangan");
        registerLog(`Memperoleh deep-link scan QR untuk portal tagihan unit ID: ${unitId}`, "Keuangan");
      }
      
      // Clean query parameters from URL history smoothly
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleSimulateTenantAction = (action: string, id: string) => {
    setPrefilledUnitId(id);
    if (action === "maintenance") {
      setActiveTab("maintenance");
      registerLog(`Simulasi scan QR Penghuni: Melapor kerusakan unit No: ${units.find(u=>u.id===id)?.unitNumber}`, "Maintenance");
    } else if (action === "pay") {
      setActiveTab("keuangan");
      registerLog(`Simulasi scan QR Penghuni: Portal tagihan unit No: ${units.find(u=>u.id===id)?.unitNumber}`, "Keuangan");
    }
  };
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE);
  
  // HRIS State lists
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [payroll, setPayroll] = useState<Payroll[]>(INITIAL_PAYROLL);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);

  const handleAddEmployee = (emp: Employee) => {
    setEmployees([emp, ...employees]);
    registerLog(`Menambahkan karyawan baru: "${emp.name}" (${emp.role})`, "Sistem");
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees(employees.map(e => e.id === emp.id ? emp : e));
    registerLog(`Memperbarui data profil karyawan "${emp.name}"`, "Sistem");
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(employees.filter(e => e.id !== id));
    if (emp) registerLog(`Menghapus data karyawan "${emp.name}" dari sistem`, "Sistem");
  };

  const handleAddAttendance = (att: Attendance) => {
    setAttendance([att, ...attendance]);
    const empName = employees.find(e => e.id === att.employeeId)?.name || att.employeeId;
    registerLog(`Pencatatan kehadiran manual untuk: "${empName}" status: ${att.status}`, "Sistem");
  };

  const handleAddPayroll = (pay: Payroll) => {
    setPayroll([pay, ...payroll]);
    const empName = employees.find(e => e.id === pay.employeeId)?.name || pay.employeeId;
    registerLog(`Slip pembayaran gaji bulan ${pay.month} berhasil diterbitkan: "${empName}"`, "Sistem");
  };

  const handleUpdatePayroll = (pay: Payroll) => {
    setPayroll(payroll.map(p => p.id === pay.id ? pay : p));
    const empName = employees.find(e => e.id === pay.employeeId)?.name || pay.employeeId;
    registerLog(`Gaji bersih terbayar lunas kepada staf: "${empName}"`, "Sistem");
  };

  const handleAddLeaveRequest = (leave: LeaveRequest) => {
    setLeaveRequests([leave, ...leaveRequests]);
    const empName = employees.find(e => e.id === leave.employeeId)?.name || leave.employeeId;
    registerLog(`Staf "${empName}" mengajukan cuti baru`, "Sistem");
  };

  const handleUpdateLeaveRequest = (leave: LeaveRequest) => {
    setLeaveRequests(leaveRequests.map(l => l.id === leave.id ? leave : l));
    const empName = employees.find(e => e.id === leave.employeeId)?.name || leave.employeeId;
    registerLog(`Persetujuan cuti "${empName}" diubah: ${leave.status}`, "Sistem");
  };
  const [activities, setActivities] = useState<any[]>([
    { id: "1", timestamp: "14:20:11", title: "Sistem PMS Pro Aktif & Tersinkronisasi", category: "Sistem", operator: "System" }
  ]);

  // Helper logging operations
  const registerLog = (title: string, category: "Sistem" | "Booking" | "Kamar" | "Keuangan" | "Maintenance") => {
    const freshLog = {
      id: "log-" + Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("id-ID"),
      title,
      category,
      operator: activeRole
    };
    setActivities([freshLog, ...activities.slice(0, 15)]);
  };

  // State mutators (passed to subcomponents for CRUD behavior with automatic Supabase sync)
  const handleAddProperty = (prop: Property) => {
    setProperties([prop, ...properties]);
    registerLog(`Menambahkan aset baru: "${prop.name}"`, "Sistem");
    saveToCloud("properties", prop);
  };

  const handleUpdateProperty = (prop: Property) => {
    setProperties(properties.map(p => p.id === prop.id ? prop : p));
    registerLog(`Memperbarui info properti "${prop.name}"`, "Sistem");
    saveToCloud("properties", prop);
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
    registerLog(`Menghapus properti ID: ${id}`, "Sistem");
    removeFromCloud("properties", id);
  };

  const handleAddUnit = (unit: Unit) => {
    setUnits([unit, ...units]);
    registerLog(`Mendaftarkan kamar baru No: ${unit.unitNumber}`, "Kamar");
    saveToCloud("units", unit);
  };

  const handleUpdateUnit = (unit: Unit) => {
    setUnits(units.map(u => u.id === unit.id ? unit : u));
    registerLog(`Merubah spesifikasi kamar No: ${unit.unitNumber}`, "Kamar");
    saveToCloud("units", unit);
  };

  const handleUpdateUnitStatus = (id: string, state: any) => {
    const updatedUnits = units.map(u => {
      if (u.id === id) {
        const up = { ...u, status: state };
        saveToCloud("units", up);
        return up;
      }
      return u;
    });
    setUnits(updatedUnits);
    registerLog(`Merubah status unit kamar ke: ${state}`, "Kamar");
  };

  const handleDeleteUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
    registerLog(`Menghapus kamar ID: ${id}`, "Kamar");
    removeFromCloud("units", id);
  };

  const handleAddReservation = (res: Reservation) => {
    setReservations([res, ...reservations]);
    saveToCloud("reservations", res);
    
    // Auto update target unit status to Reserved
    const updatedUnits = units.map(u => {
      if (u.id === res.unitId) {
        const up = { ...u, status: "Reserved" as const };
        saveToCloud("units", up);
        return up;
      }
      return u;
    });
    setUnits(updatedUnits);
    registerLog(`Membuat pemesanan baru untuk tenant ID: ${res.tenantId}`, "Booking");
  };

  const handleUpdateReservation = (res: Reservation) => {
    setReservations(reservations.map(r => r.id === res.id ? res : r));
    saveToCloud("reservations", res);
    
    // Support auto statuses alignment if Checked In
    if (res.status === "Checked In") {
      setUnits(units.map(u => {
        if (u.id === res.unitId) {
          const up = { ...u, status: "Occupied" as const };
          saveToCloud("units", up);
          return up;
        }
        return u;
      }));
    } else if (res.status === "Checked Out") {
      setUnits(units.map(u => {
        if (u.id === res.unitId) {
          const up = { ...u, status: "Cleaning" as const };
          saveToCloud("units", up);
          return up;
        }
        return u;
      }));
    } else if (res.status === "Cancelled") {
      setUnits(units.map(u => {
        if (u.id === res.unitId) {
          const up = { ...u, status: "Available" as const };
          saveToCloud("units", up);
          return up;
        }
        return u;
      }));
    }
    registerLog(`Merubah status booking reservasi ke: ${res.status}`, "Booking");
  };

  const handleAddTenant = (ten: Tenant) => {
    setTenants([ten, ...tenants]);
    registerLog(`Registrasi tenant baru: "${ten.name}"`, "Sistem");
    saveToCloud("tenants", ten);
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
    registerLog(`Menghapus directory tenant ID: ${id}`, "Sistem");
    removeFromCloud("tenants", id);
  };

  const handleAddInvoice = (inv: Invoice) => {
    setInvoices([inv, ...invoices]);
    registerLog(`Menerbitkan tagihan ${inv.invoiceNumber} senilai Rp ${inv.totalAmount.toLocaleString()}`, "Keuangan");
    saveToCloud("invoices", inv);
  };

  const handleUpdateInvoiceStatus = (id: string, status: any) => {
    const updatedInvs = invoices.map(i => {
      if (i.id === id) {
        const up = { ...i, status };
        saveToCloud("invoices", up);
        return up;
      }
      return i;
    });
    setInvoices(updatedInvs);
    registerLog(`Pembayaran tagihan invoice lunas dikonfirmasi`, "Keuangan");
  };

  const handleAddPayment = (pay: PaymentLog) => {
    registerLog(`Penerimaan pembayaran dari transaksi ref: ${pay.transactionNumber}`, "Keuangan");
    saveToCloud("payment_logs", pay);
  };

  const handleAddExpense = (exp: Expense) => {
    setExpenses([exp, ...expenses]);
    registerLog(`Pencatatan opex pengeluaran Baru: Rp ${exp.amount.toLocaleString()}`, "Keuangan");
    saveToCloud("expenses", exp);
  };

  const handleAddTicket = (tick: MaintenanceTicket) => {
    setMaintenance([tick, ...maintenance]);
    saveToCloud("maintenance_tickets", tick);
    
    // Set Room status to Maintenance
    const updatedUnits = units.map(u => {
      if (u.id === tick.unitId) {
        const up = { ...u, status: "Maintenance" as const };
        saveToCloud("units", up);
        return up;
      }
      return u;
    });
    setUnits(updatedUnits);
    registerLog(`Komplain fasilitas rusak tercatat di kamar unit`, "Maintenance");
  };

  const handleUpdateTicket = (tick: MaintenanceTicket) => {
    setMaintenance(maintenance.map(m => m.id === tick.id ? tick : m));
    saveToCloud("maintenance_tickets", tick);
    
    if (tick.status === "Completed") {
      const updatedUnits = units.map(u => {
        if (u.id === tick.unitId) {
          const up = { ...u, status: "Available" as const };
          saveToCloud("units", up);
          return up;
        }
        return u;
      });
      setUnits(updatedUnits);
    }
    registerLog(`Status perbaikan fasilitas di-update ke: ${tick.status}`, "Maintenance");
  };

  const handleAddContract = (con: Contract) => {
    setContracts([con, ...contracts]);
    registerLog(`Kontrak sewa digital diterbitkan`, "Sistem");
    saveToCloud("contracts", con);
  };

  // Multi-role access control check helper
  const isTabAvailable = (tab: string) => {
    if (tab === "hris") {
      return activeRole === "Super Admin" || activeRole === "HR";
    }
    if (tab === "workchat") return true;
    if (activeRole === "Super Admin" || activeRole === "Owner") return true;

    switch (activeRole) {
      case "HR":
        return ["dashboard", "hris"].includes(tab);
      case "Manager":
        return ["dashboard", "properti", "kamar", "booking", "tenant", "maintenance", "cleaning"].includes(tab);
      case "Receptionist":
        return ["dashboard", "kamar", "booking", "tenant"].includes(tab);
      case "Finance":
        return ["dashboard", "keuangan", "reports"].includes(tab);
      case "Marketing/Sales":
        return ["dashboard", "crm", "kamar"].includes(tab);
      case "Staff Maintenance":
        return ["maintenance", "cleaning"].includes(tab);
      case "Tenant/Penyewa":
        return ["tenant-dashboard", "booking"].includes(tab);
      default:
        return false;
    }
  };

  // Nav items specifications
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "supabase", label: "Supabase Cloud", icon: Database },
    { id: "workchat", label: "Chat Kerja", icon: MessageSquare },
    { id: "properti", label: "Properti", icon: Building },
    { id: "kamar", label: "Kamar & Unit", icon: Home },
    { id: "booking", label: "Reservasi & Booking", icon: CalendarDays },
    { id: "tenant", label: "Daftar Tenant", icon: Users },
    { id: "keuangan", label: "Billing & Keuangan", icon: DollarSign },
    { id: "maintenance", label: "Perbaikan", icon: Wrench },
    { id: "cleaning", label: "Housekeeping", icon: Sparkles },
    { id: "crm", label: "Sales & CRM", icon: Award },
    { id: "contracts", label: "Kontrak Digital", icon: FileCheck },
    { id: "hris", label: "Human Resource", icon: Briefcase }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          /* PRESTIGE LOGIN MODIFICATION SCREEN */
          <motion.div
            key="login-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row min-h-screen"
          >
            {/* Dark logo left wing banner */}
            <div className="bg-gradient-to-br from-emerald-900 to-green-600 md:w-1/2 p-8 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-emerald-300 animate-pulse" />
                <span className="font-display font-extrabold text-xl tracking-tight">PMS PRO</span>
              </div>

              <div className="space-y-4 max-w-sm">
                <h1 className="text-3xl font-display font-extrabold leading-tight">
                  Sistem ERP Tata Kelola Properti Indonesia Terintegrasi.
                </h1>
                <p className="text-emerald-100 text-xs font-semibold leading-relaxed">
                  Pantau unit terisi, tagihan sewa otomatis, maintenance AC, kontrak legal terdigitalisasi dalam satu pipeline dashboard terpadu.
                </p>
              </div>

              <p className="text-xs text-white/40">© 2026 Sahrul Viona - Properti Management System</p>
            </div>

            {/* Login control fields panel */}
            <div className="md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-14 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-display font-extrabold text-slate-800">Masuk Aplikasi</h2>
                <p className="text-xs text-slate-400 font-semibold">Silahkan pilih role cepat di bawah untuk kemudahan eksplorasi fitur</p>
              </div>

              {/* Instant Switch Credentials Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3">
                <span className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Pilih Cepat Profil Akses:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(["Super Admin", "Owner", "Manager", "Receptionist", "Finance", "Marketing/Sales", "Staff Maintenance"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setActiveRole(r);
                        setIsLoggedIn(true);
                        // Redirect to accessible menu depending on active role selection
                        if (r === "Staff Maintenance") {
                          setActiveTab("maintenance");
                        } else if (r === "Finance") {
                          setActiveTab("keuangan");
                        } else {
                          setActiveTab("dashboard");
                        }
                      }}
                      className="px-3 py-2 bg-white border hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 font-bold rounded-xl transition cursor-pointer text-left flex items-center justify-between"
                    >
                      <span>{r}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50 text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-slate-400">Atau masuk menggunakan ID developer terdaftar:</span>
                <p className="text-xs font-mono font-bold text-slate-600 mt-1">sahrul.viona12@gmail.com</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ENTERPRISE APP SHELL INTERPRETER */
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden"
          >
            {/* SIDEBAR NAVIGATION - DESKTOP ONLY */}
            <aside className="hidden md:flex flex-col justify-between w-64 bg-white text-slate-650 border-r border-slate-200 p-5 flex-shrink-0 relative overflow-hidden select-none">
              <div className="space-y-4 relative z-10 h-full flex flex-col">
                {/* Branding with standard Clean-Utility Logo */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 -mx-5 -mt-2 px-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                    <span className="text-white font-bold text-lg font-display">P</span>
                  </div>
                  <div className="leading-none text-left">
                    <h1 className="text-base font-extrabold tracking-tight text-slate-800 font-display">PMS Pro</h1>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">Enterprise Suite</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mt-2 text-left">Main Menu</div>

                {/* Navigation Links Grid mapping */}
                <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
                  {navItems.map((item) => {
                    const isAvailable = isTabAvailable(item.id);
                    if (!isAvailable) return null;

                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition duration-200 uppercase tracking-wider ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <IconComp className={`h-4 w-4 transition-transform duration-200 ${isActive ? "text-emerald-700 scale-110" : "text-slate-400 opacity-80"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Soft action log out button with minimal styling */}
                <div className="space-y-3">
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-700 transition uppercase text-slate-550 cursor-pointer text-left"
                  >
                    <LogOut className="h-4 w-4 opacity-80" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Elegant active user metadata card of Clean Utility Theme */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/40 -mx-5 -mb-5 p-5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Akses Otoritas</span>
                      <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[8px] font-bold rounded uppercase">{activeRole}</span>
                    </div>
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 font-bold border border-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] shadow-sm shrink-0">
                        SV
                      </div>
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-slate-750 truncate">Sahrul Viona</div>
                        <div className="text-[9px] text-slate-400 font-medium truncate">Developer Account</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN APP SHELL CONTENT PANELS */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* HEADER BAR FOR SYSTEM STATE CONTEXT CONTROLS */}
              <header className="bg-white border-b border-gray-150 py-3.5 px-6 flex items-center justify-between shadow-sm relative z-20">
                <div className="flex items-center gap-3">
                  {/* Mobile nav bar triggers */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2 text-slate-700 border hover:bg-slate-50 rounded"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="hidden sm:flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-full text-xs text-slate-650">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold font-mono">LIVE WIB: {new Date().toLocaleTimeString("id-ID")}</span>
                  </div>
                </div>

                {/* Interactive Dynamic Switch Role in Header for Evaluation convenience */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-150 py-1.5 px-3 border border-gray-150 rounded-full text-xs">
                    <Sliders className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase hidden md:inline">Demo Switcher:</span>
                    <select
                      value={activeRole}
                      onChange={(e) => {
                        const nextRole = e.target.value as UserRole;
                        setActiveRole(nextRole);
                        // Redirect automatically
                        if (nextRole === "Staff Maintenance") {
                          setActiveTab("maintenance");
                        } else if (nextRole === "Finance") {
                          setActiveTab("keuangan");
                        } else if (nextRole === "HR") {
                          setActiveTab("hris");
                        } else {
                          setActiveTab("dashboard");
                        }
                        registerLog(`Mengubah otorisasi sistem ke: ${nextRole}`, "Sistem");
                      }}
                      className="bg-transparent text-slate-850 font-extrabold border-none outline-none focus:ring-0 text-xs py-0 pr-6"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Owner">Owner (Pemilik)</option>
                      <option value="HR">Human Resource (HR)</option>
                      <option value="Manager">Manager</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Finance">Finance Acc</option>
                      <option value="Marketing/Sales">Marketing</option>
                      <option value="Staff Maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* Logged user email representation */}
                  <div className="hidden lg:flex items-center gap-2 text-xs">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 border flex items-center justify-center text-emerald-800 font-bold">
                      SV
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{userEmail.split("@")[0]}</p>
                      <p className="text-[9px] text-gray-400 font-sans tracking-wide">Developer</p>
                    </div>
                  </div>
                </div>
              </header>

              {/* DYNAMIC COMPONENT PANEL CANVAS VIEW */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {activeTab === "dashboard" && isTabAvailable("dashboard") && (
                  <Dashboard
                    properties={properties}
                    units={units}
                    invoices={invoices}
                    expenses={expenses}
                    maintenance={maintenance}
                  />
                )}

                {activeTab === "supabase" && isTabAvailable("supabase") && (
                  <SupabaseModule
                    supabaseLoading={supabaseLoading}
                    supabaseStatus={supabaseStatus}
                    onPullData={loadDataFromSupabase}
                    onPushData={handlePushDataToSupabase}
                  />
                )}

                {activeTab === "workchat" && isTabAvailable("workchat") && (
                  <WorkChatModule
                    activeRole={activeRole}
                    chatMessages={chatMessages}
                    onAddChatMessage={handleAddChatMessage}
                    onClearChats={handleClearChats}
                    supabaseLoading={supabaseLoading}
                  />
                )}

                {activeTab === "properti" && isTabAvailable("properti") && (
                  <PropertyModule
                    properties={properties}
                    onAddProperty={handleAddProperty}
                    onUpdateProperty={handleUpdateProperty}
                    onDeleteProperty={handleDeleteProperty}
                  />
                )}

                {activeTab === "kamar" && isTabAvailable("kamar") && (
                  <UnitModule
                    units={units}
                    properties={properties}
                    onAddUnit={handleAddUnit}
                    onUpdateUnit={handleUpdateUnit}
                    onDeleteUnit={handleDeleteUnit}
                    onSimulateTenantAction={handleSimulateTenantAction}
                  />
                )}

                {activeTab === "booking" && isTabAvailable("booking") && (
                  <BookingModule
                    reservations={reservations}
                    tenants={tenants}
                    units={units}
                    properties={properties}
                    onAddReservation={handleAddReservation}
                    onUpdateReservation={handleUpdateReservation}
                  />
                )}

                {activeTab === "tenant" && isTabAvailable("tenant") && (
                  <TenantModule
                    tenants={tenants}
                    contracts={contracts}
                    onAddTenant={handleAddTenant}
                    onDeleteTenant={handleDeleteTenant}
                  />
                )}

                {activeTab === "keuangan" && isTabAvailable("keuangan") && (
                  <FinanceModule
                    invoices={invoices}
                    payments={[]}
                    expenses={expenses}
                    tenants={tenants}
                    properties={properties}
                    units={units}
                    maintenance={maintenance}
                    payroll={payroll}
                    employees={employees}
                    onAddInvoice={handleAddInvoice}
                    onAddPayment={handleAddPayment}
                    onAddExpense={handleAddExpense}
                    onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                    onUpdatePayroll={handleUpdatePayroll}
                    prefilledUnitId={prefilledUnitId}
                    onClearPrefill={() => setPrefilledUnitId(null)}
                  />
                )}

                {activeTab === "maintenance" && isTabAvailable("maintenance") && (
                  <MaintenanceModule
                    maintenance={maintenance}
                    units={units}
                    properties={properties}
                    onAddTicket={handleAddTicket}
                    onUpdateTicket={handleUpdateTicket}
                    prefilledUnitId={prefilledUnitId}
                    onClearPrefill={() => setPrefilledUnitId(null)}
                  />
                )}

                {activeTab === "cleaning" && isTabAvailable("cleaning") && (
                  <HousekeepingInventory
                    units={units}
                    properties={properties}
                    onUpdateUnitStatus={handleUpdateUnitStatus}
                  />
                )}

                {activeTab === "crm" && isTabAvailable("crm") && (
                  <CrmMarketing />
                )}

                {activeTab === "contracts" && isTabAvailable("contracts") && (
                  <DigitalContract
                    contracts={contracts}
                    tenants={tenants}
                    units={units}
                    properties={properties}
                    onAddContract={handleAddContract}
                  />
                )}

                {activeTab === "hris" && isTabAvailable("hris") && (
                  <HRISModule
                    employees={employees}
                    attendance={attendance}
                    payroll={payroll}
                    leaveRequests={leaveRequests}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    onAddAttendance={handleAddAttendance}
                    onUpdatePayroll={handleUpdatePayroll}
                    onAddPayroll={handleAddPayroll}
                    onUpdateLeaveRequest={handleUpdateLeaveRequest}
                    onAddLeaveRequest={handleAddLeaveRequest}
                  />
                )}
              </div>

              {/* FOOTER AUDIT TRAILS TIMELINE PANEL */}
              <footer className="bg-slate-900 text-slate-400 py-3 px-6 text-xs flex justify-between items-center relative z-10 border-t border-slate-800">
                <span className="font-extrabold text-[10px] tracking-wide text-emerald-500 uppercase flex items-center gap-1 animate-pulse">
                  ● Real-time Systems Sync
                </span>
                
                {activities.length > 0 && (
                  <p className="truncate max-w-sm font-mono text-slate-350 text-[10px] leading-tight">
                    [{activities[0].timestamp}] {activities[0].operator}: {activities[0].title}
                  </p>
                )}
                
                <span className="text-[10px] text-slate-500 font-semibold">Uji Coba Sempurna v2.0</span>
              </footer>
            </main>

            {/* MOBILE SIDEBAR MODAL OVERLAY */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex md:hidden">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
                <div className="relative flex flex-col w-64 max-w-xs bg-white text-slate-650 p-5 z-10 border-r border-slate-200">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-sm font-display">P</div>
                      <span className="font-display font-extrabold text-slate-800 text-base">PMS PRO</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-850 rounded-lg border border-slate-100 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <nav className="space-y-1 flex-1 overflow-y-auto pt-4 text-left">
                    {navItems.map((item) => {
                      if (!isTabAvailable(item.id)) return null;
                      const IconComp = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                            isActive
                              ? "bg-emerald-50 text-emerald-850"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <IconComp className={`h-4 w-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-red-50 text-slate-500 hover:text-red-700 uppercase transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 animate-pulse text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
