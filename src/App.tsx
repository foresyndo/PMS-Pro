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
  MessageSquare,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Trash2,
  Plus,
  Calendar
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
import WorkChatModule, { ROLE_NAMES } from "./components/WorkChatModule";
import CalendarRapatModule from "./components/CalendarRapatModule";
import HRISModule from "./components/HRISModule";
import RoleAccountsModule, { RoleCredential } from "./components/RoleAccountsModule";

export default function App() {
  // Default and saved multi-role credentials config
  const DEFAULT_ROLE_CREDENTIALS: RoleCredential[] = [
    { role: "Super Admin", email: "admin@pms.pro", passport: "admin123" },
    { role: "Owner", email: "owner@pms.pro", passport: "owner123" },
    { role: "Manager", email: "manager@pms.pro", passport: "manager123" },
    { role: "Receptionist", email: "recep@pms.pro", passport: "recep123" },
    { role: "Finance", email: "finance@pms.pro", passport: "finance123" },
    { role: "Marketing/Sales", email: "marketing@pms.pro", passport: "sales123" },
    { role: "Staff Maintenance", email: "staff@pms.pro", passport: "staff123" },
    { role: "Tenant/Penyewa", email: "tenant@pms.pro", passport: "tenant123" },
    { role: "HR", email: "hrd@pms.pro", passport: "hrd123" }
  ];

  const [roleCredentials, setRoleCredentials] = useState<RoleCredential[]>(() => {
    try {
      const saved = localStorage.getItem("pms_role_credentials");
      return saved ? JSON.parse(saved) : DEFAULT_ROLE_CREDENTIALS;
    } catch (e) {
      return DEFAULT_ROLE_CREDENTIALS;
    }
  });

  useEffect(() => {
    localStorage.setItem("pms_role_credentials", JSON.stringify(roleCredentials));
  }, [roleCredentials]);

  // Session states
  const [isLoggedIn, setIsLoggedIn] = useState(false); // set to false for testing/demo so login screen actually presents itself naturally! Oh wait, let's keep default as true or let user toggle it, wait, we can default isLoggedIn to false, or let's keep it false so they see the page. Wait, let's look at standard default. Previously it was true. Let's default to false so users can see the magnificent new login and registration screen instantly!
  const [activeRole, setActiveRole] = useState<UserRole>("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@pms.pro");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modified Login Portal States
  const [loginSubTab, setLoginSubTab] = useState<"login" | "register" | "accounts">("login");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassport, setManualPassport] = useState("");
  const [showPassportLogin, setShowPassportLogin] = useState(false);

  // User registration states
  const [regEmail, setRegEmail] = useState("");
  const [regPassport, setRegPassport] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("Manager");
  const [regSuccess, setRegSuccess] = useState(false);

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
        if (results.tablesStatus["role_credentials"] && results.roleCredentials && results.roleCredentials.length > 0) {
          setRoleCredentials(results.roleCredentials);
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
        workChats: chatMessages,
        roleCredentials
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

  const [payrollEmails, setPayrollEmails] = useState<any[]>(() => {
    const saved = localStorage.getItem("pmspro_payroll_emails");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse payroll emails", e);
      }
    }
    return [];
  });

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
    const matchedEmployee = employees.find(e => e.id === pay.employeeId);
    const empName = matchedEmployee?.name || pay.employeeId;
    registerLog(`Slip pembayaran gaji bulan ${pay.month} berhasil diterbitkan: "${empName}"`, "Sistem");

    // Send mock email for publishing slip
    const mockEmail = {
      id: "email-" + Date.now().toString(),
      recipientEmail: matchedEmployee?.email || "employee@pmspro.com",
      recipientName: empName,
      subject: `[PMS PRO] Slip Gaji Baru Diterbitkan - ${pay.month}`,
      body: `Halo ${empName},\n\nSlip gaji Anda untuk periode ${pay.month} telah diterbitkan oleh bagian HRD dengan rincian berikut:\n- Gaji Pokok: Rp ${pay.basicSalary.toLocaleString("id-ID")}\n- Tunjangan: Rp ${pay.allowance.toLocaleString("id-ID")}\n- Potongan: Rp ${pay.deductions.toLocaleString("id-ID")}\n- Gaji Bersih: Rp ${pay.netSalary.toLocaleString("id-ID")}\n\nStatus saat ini: MENUNGGU PERSETUJUAN & PROSES TRANSFER DANA OLEH DIVISI KEUANGAN (FINANCE).\n\nSalam,\nDepartemen HRD\nPMS Pro Properties`,
      sentAt: new Date().toLocaleString("id-ID"),
      status: "Disampaikan (Published)",
      type: "Published"
    };
    const updatedEmails = [mockEmail, ...payrollEmails];
    setPayrollEmails(updatedEmails);
    localStorage.setItem("pmspro_payroll_emails", JSON.stringify(updatedEmails));
  };

  const handleUpdatePayroll = (pay: Payroll) => {
    setPayroll(payroll.map(p => p.id === pay.id ? pay : p));
    const matchedEmployee = employees.find(e => e.id === pay.employeeId);
    const empName = matchedEmployee?.name || pay.employeeId;
    registerLog(`Gaji bersih terbayar lunas kepada staf: "${empName}"`, "Sistem");

    // Send mock email for finance approval / payment
    if (pay.status === "Paid") {
      const mockEmail = {
        id: "email-" + Date.now().toString(),
        recipientEmail: matchedEmployee?.email || "employee@pmspro.com",
        recipientName: empName,
        subject: `[PMS PRO] GAJI TELAH DITRANSFER - Periode ${pay.month}`,
        body: `Halo ${empName},\n\nKabar baik! Gaji Anda untuk periode ${pay.month} telah DISETUJUI & DITRANSFER LUNAS oleh Divisi Keuangan (Finance) ke rekening terdaftar Anda.\n\nJumlah Ditransfer: Rp ${pay.netSalary.toLocaleString("id-ID")}\nReferensi Pembayaran: TRF-MANDIRI-${Date.now().toString().slice(-6)}\n\nSilakan periksa mutasi rekening Anda atau unduh file slip gaji PDF resmi melalui portal HRIS PMS Pro.\n\nSalam,\nDepartemen Keuangan (Finance)\nPMS Pro Properties`,
        sentAt: new Date().toLocaleString("id-ID"),
        status: "Sukses Terkirim (Paid)",
        type: "Approved"
      };
      const updatedEmails = [mockEmail, ...payrollEmails];
      setPayrollEmails(updatedEmails);
      localStorage.setItem("pmspro_payroll_emails", JSON.stringify(updatedEmails));
    }
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
    if (tab === "role-accounts") {
      return activeRole === "Super Admin" || activeRole === "Owner";
    }
    if (tab === "hris") {
      return activeRole === "Super Admin" || activeRole === "HR";
    }
    if (tab === "workchat" || tab === "calendar-rapat") return true;
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
    { id: "calendar-rapat", label: "Kalender Rapat", icon: Calendar },
    { id: "properti", label: "Properti", icon: Building },
    { id: "kamar", label: "Kamar & Unit", icon: Home },
    { id: "booking", label: "Reservasi & Booking", icon: CalendarDays },
    { id: "tenant", label: "Daftar Tenant", icon: Users },
    { id: "keuangan", label: "Billing & Keuangan", icon: DollarSign },
    { id: "maintenance", label: "Perbaikan", icon: Wrench },
    { id: "cleaning", label: "Housekeeping", icon: Sparkles },
    { id: "crm", label: "Sales & CRM", icon: Award },
    { id: "contracts", label: "Kontrak Digital", icon: FileCheck },
    { id: "hris", label: "Human Resource", icon: Briefcase },
    { id: "role-accounts", label: "Akses & Akun Role", icon: Lock }
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
            <div className="md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-14 space-y-6 overflow-y-auto max-h-screen">
              <div className="space-y-1.5 text-left">
                <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Portal Akses ERP</h2>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Gunakan pilihan masuk instan cepat atau gunakan email & paspor kustom hasil pengaturan admin.
                </p>
              </div>
              {/* Login Method Toggle Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 font-bold self-start text-[11px] mb-2 shadow-3xs">
                <button
                  type="button"
                  onClick={() => setLoginSubTab("login")}
                  className={`px-3.5 py-1.5 uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    loginSubTab === "login"
                      ? "bg-white text-emerald-800 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Masuk ERP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginSubTab("register");
                    setRegSuccess(false);
                  }}
                  className={`px-3.5 py-1.5 uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    loginSubTab === "register"
                      ? "bg-white text-emerald-800 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                  Daftar User Baru
                </button>
              </div>

              {loginSubTab === "login" && (
                /* MANUAL EMAIL AND PASSPORT FORM */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmedEmail = manualEmail.trim().toLowerCase();
                    const matched = roleCredentials.find(
                      (c) => c.email.trim().toLowerCase() === trimmedEmail && c.passport === manualPassport
                    );
                    if (matched) {
                      setActiveRole(matched.role);
                      setUserEmail(matched.email);
                      setIsLoggedIn(true);
                      if (matched.role === "Staff Maintenance") {
                        setActiveTab("maintenance");
                      } else if (matched.role === "Finance") {
                        setActiveTab("keuangan");
                      } else if (matched.role === "HR") {
                        setActiveTab("hris");
                      } else {
                        setActiveTab("dashboard");
                      }
                      setManualEmail("");
                      setManualPassport("");
                      registerLog(`User ${matched.email} (${matched.role}) berhasil masuk ke sistem`, "Sistem");
                    } else {
                      alert("Gagal masuk. Email login atau paspor kunci Anda salah!");
                    }
                  }}
                  className="space-y-4 animate-fade-in text-xs text-left"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Email Kredensial:</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="contoh: admin@pms.pro"
                        className="pl-9 pr-4 py-2.5 w-full border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl font-bold text-slate-850 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Paspor Kunci (Sandi):</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassportLogin ? "text" : "password"}
                        required
                        value={manualPassport}
                        onChange={(e) => setManualPassport(e.target.value)}
                        placeholder="Masukkan paspor kunci..."
                        className="pl-9 pr-10 py-2.5 w-full border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl font-bold text-slate-850 font-mono bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassportLogin(!showPassportLogin)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-650 p-1"
                      >
                        {showPassportLogin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                  >
                    Masuk Ke Sistem ERP
                  </button>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-semibold">
                    <span className="font-extrabold text-slate-700 block mb-0.5">Petunjuk Akses:</span>
                    Pastikan Anda telah mendaftarkan user baru di tab <strong className="text-emerald-700">Daftar User Baru</strong> dan mencatat kredensial sebelum login.
                  </div>
                </form>
              )}

              {loginSubTab === "register" && (
                /* REGISTER NEW USER FORM */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmedEmail = regEmail.trim();
                    if (!trimmedEmail || !regPassport.trim()) {
                      alert("Tolong isi lengkap email dan paspor kunci baru!");
                      return;
                    }

                    // Check if email already exists
                    const exists = roleCredentials.some(
                      (c) => c.email.trim().toLowerCase() === trimmedEmail.toLowerCase()
                    );
                    if (exists) {
                      alert("Email ini sudah terdaftar di sistem! Tolong gunakan email lain.");
                      return;
                    }

                    const newCred: RoleCredential = {
                      role: regRole,
                      email: trimmedEmail,
                      passport: regPassport.trim()
                    };

                    const updated = [...roleCredentials, newCred];
                    setRoleCredentials(updated);
                    saveToCloud("role_credentials", newCred);
                    
                    // Prepopulate manual login credentials
                    setManualEmail(trimmedEmail);
                    setManualPassport(regPassport.trim());
                    
                    setRegEmail("");
                    setRegPassport("");
                    setRegSuccess(true);
                    
                    registerLog(`User baru ${trimmedEmail} (${regRole}) berhasil didaftarkan`, "Sistem");
                  }}
                  className="space-y-4 animate-fade-in text-xs text-left"
                >
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-250 flex items-start gap-2.5 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black block uppercase text-[9px] tracking-wide mb-0.5">Pendaftaran Akun Baru</span>
                      Daftarkan akun kustom dengan level otoritas role spesifik ke dalam memory lokal sistem.
                    </div>
                  </div>

                  {regSuccess && (
                     <div className="p-3 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] text-center animate-bounce">
                       🌟 Registrasi Sukses! Akun baru tersimpan. Silahkan klik tab "MASUK ERP".
                     </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Pilih Hak Otoritas Role:</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl font-extrabold text-slate-800 bg-white"
                    >
                      <option value="Super Admin">Super Admin (Akses Mutlak)</option>
                      <option value="Owner">Owner (Pemilik Properti/Kost)</option>
                      <option value="Manager">Manager (Pengurus Harian)</option>
                      <option value="Receptionist">Receptionist (Resepsionis)</option>
                      <option value="HR">HR (Roster & Payroll)</option>
                      <option value="Finance">Finance (Keuangan & Invoice)</option>
                      <option value="Marketing/Sales">Marketing / Sales CRM</option>
                      <option value="Staff Maintenance">Staff Maintenance (Teknisi)</option>
                      <option value="Tenant/Penyewa">Tenant / Penyewa Kamar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Daftar Email User Baru:</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="contoh: sahrul@pms.pro"
                        className="pl-9 pr-4 py-2.5 w-full border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl font-bold text-slate-850 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Tentukan Paspor Kunci (Sandi):</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regPassport}
                        onChange={(e) => setRegPassport(e.target.value)}
                        placeholder="contoh: pass123"
                        className="pl-9 pr-4 py-2.5 w-full border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-xl font-bold font-mono text-slate-850 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-emerald-700 hover:text-white text-slate-100 font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Akun & Masukkan Ke Daftar
                  </button>
                </form>
              )}



              <div className="text-center pt-2 border-t border-slate-105">
                <span className="text-xs text-slate-400">ID Developer Aktif Terdaftar:</span>
                <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">sahrul.viona12@gmail.com</p>
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

                {/* Logged user email representation */}
                <div className="flex items-center gap-3">
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

                {activeTab === "calendar-rapat" && isTabAvailable("calendar-rapat") && (
                  <CalendarRapatModule
                    currentRole={activeRole}
                    roleName={ROLE_NAMES[activeRole] || "Staff PMS"}
                    onShowNotification={(title, desc) => {
                      alert(`${title}: ${desc}`);
                    }}
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
                    employees={employees}
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
                    payrollEmails={payrollEmails}
                    currentRole={activeRole}
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

                {activeTab === "role-accounts" && isTabAvailable("role-accounts") && (
                  <RoleAccountsModule
                    credentials={roleCredentials}
                    onUpdateCredentials={(updated) => setRoleCredentials(updated)}
                    onResetToDefaults={() => setRoleCredentials(DEFAULT_ROLE_CREDENTIALS)}
                    onQuickLogin={(role) => {
                      const match = roleCredentials.find(c => c.role === role);
                      setActiveRole(role);
                      if (match) {
                        setUserEmail(match.email);
                      }
                      setIsLoggedIn(true);
                      if (role === "Staff Maintenance") {
                        setActiveTab("maintenance");
                      } else if (role === "Finance") {
                        setActiveTab("keuangan");
                      } else {
                        setActiveTab("dashboard");
                      }
                      registerLog(`Beralih langsung ke interface: ${role}`, "Sistem");
                    }}
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
