import React, { useState } from "react";
import { jsPDF } from "jspdf";
import {
  Users,
  Briefcase,
  Contact,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Download,
  CalendarDays,
  Sparkles,
  UserCheck,
  UserX,
  QrCode,
  Smartphone,
  Sun,
  Moon,
  Sunset,
  CalendarCheck,
  RefreshCw,
  Mail,
  Send,
  Eye
} from "lucide-react";
import { Employee, Attendance, Payroll, LeaveRequest, ShiftSchedule, ShiftType, UserRole } from "../types";

interface HRISModuleProps {
  employees: Employee[];
  attendance: Attendance[];
  payroll: Payroll[];
  leaveRequests: LeaveRequest[];
  payrollEmails?: any[];
  currentRole?: UserRole;
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddAttendance: (att: Attendance) => void;
  onUpdatePayroll: (pay: Payroll) => void;
  onAddPayroll: (pay: Payroll) => void;
  onUpdateLeaveRequest: (leave: LeaveRequest) => void;
  onAddLeaveRequest: (leave: LeaveRequest) => void;
}

export default function HRISModule({
  employees,
  attendance,
  payroll,
  leaveRequests,
  payrollEmails = [],
  currentRole = "Super Admin",
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddAttendance,
  onUpdatePayroll,
  onAddPayroll,
  onUpdateLeaveRequest,
  onAddLeaveRequest
}: HRISModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"employees" | "attendance" | "payroll" | "leaves" | "shifts">("employees");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Shift Schedules State
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>(() => {
    const saved = localStorage.getItem("pmspro_shift_schedules");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse shift schedules", e);
      }
    }
    
    // Create some initial rolling shifts for July 2026 for active employees
    const initialShifts: ShiftSchedule[] = [];
    const empIds = ["emp-1", "emp-2", "emp-3", "emp-4"];
    const shiftsList: ShiftType[] = ["Morning", "Afternoon", "Night", "Off"];
    
    // Pre-populate first 10 days of July 2026 for demonstration
    for (let day = 1; day <= 12; day++) {
      const dateStr = `2026-07-${day.toString().padStart(2, "0")}`;
      empIds.forEach((empId, index) => {
        const patternIndex = (day + index) % 4;
        initialShifts.push({
          id: `shift-${empId}-${dateStr}`,
          employeeId: empId,
          date: dateStr,
          shift: shiftsList[patternIndex]
        });
      });
    }
    return initialShifts;
  });

  // Save changes to shift schedules
  React.useEffect(() => {
    localStorage.setItem("pmspro_shift_schedules", JSON.stringify(shiftSchedules));
  }, [shiftSchedules]);

  // Drag and drop feedback / search states
  const [draggedEmployeeId, setDraggedEmployeeId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ date: string; shift: ShiftType } | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("emp-1");
  const [quickAssignCell, setQuickAssignCell] = useState<{ date: string; shift: ShiftType } | null>(null);
  const [schedulerMode, setSchedulerMode] = useState<"hr-view" | "employee-view">("hr-view");
  const [schedulerSearch, setSchedulerSearch] = useState<string>("");
  const [isExportingShift, setIsExportingShift] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Email Notification modal & filter states
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [emailFilter, setEmailFilter] = useState<"all" | "Published" | "Approved">("all");


  // CRUD & Form State for Employee
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    status: "Active" as "Active" | "Inactive",
    joinedDate: new Date().toISOString().split("T")[0],
    salary: 4000000
  });

  // Attendance Form State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "08:00",
    checkOut: "17:00",
    status: "Present" as "Present" | "Absent" | "Late" | "Leave"
  });

  // Payroll Form State
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employeeId: "",
    month: "Juni 2026",
    basicSalary: 4000000,
    allowance: 500000,
    deductions: 0
  });

  // Leave Form State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveType: "Annual" as "Annual" | "Sick" | "Maternity" | "Unpaid" | "Other",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });

  // QR Code Daily Attendance States
  const [qrWorkDay, setQrWorkDay] = useState(new Date().toISOString().split("T")[0]);
  const [scannedEmployeeId, setScannedEmployeeId] = useState("");
  const [scanSimulationTime, setScanSimulationTime] = useState("08:00");
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState("");
  const [scanErrorMessage, setScanErrorMessage] = useState("");

  // Monthly Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSelectedMonth, setReportSelectedMonth] = useState("Juni 2026");
  const [reportIncludeAttendance, setReportIncludeAttendance] = useState(true);
  const [reportIncludePayroll, setReportIncludePayroll] = useState(true);

  const handleSimulateQRScan = () => {
    if (!scannedEmployeeId) {
      setScanErrorMessage("Harap pilih karyawan terlebih dahulu!");
      setScanSuccessMessage("");
      return;
    }

    const emp = employees.find(e => e.id === scannedEmployeeId);
    if (!emp) {
      setScanErrorMessage("Data karyawan tidak ditemukan.");
      setScanSuccessMessage("");
      return;
    }

    if (emp.status !== "Active") {
      setScanErrorMessage(`Karyawan "${emp.name}" saat ini non-aktif.`);
      setScanSuccessMessage("");
      return;
    }

    // Check if check-in already recorded for that day
    const alreadyLogged = attendance.find(a => a.employeeId === scannedEmployeeId && a.date === qrWorkDay);
    if (alreadyLogged) {
      setScanErrorMessage(`${emp.name} sudah tercatat presensi untuk tanggal ${qrWorkDay}.`);
      setScanSuccessMessage("");
      return;
    }

    setIsScanningQR(true);
    setScanErrorMessage("");
    setScanSuccessMessage("");

    setTimeout(() => {
      setIsScanningQR(false);

      // Determine attendance status based on scanning time limit of 08:15
      const [hour, minute] = scanSimulationTime.split(":").map(Number);
      const isLate = (hour > 8) || (hour === 8 && minute > 15);
      const status = isLate ? "Late" as const : "Present" as const;

      const newAtt: Attendance = {
        id: `att-qr-${Date.now()}`,
        employeeId: scannedEmployeeId,
        date: qrWorkDay,
        checkIn: scanSimulationTime,
        checkOut: "17:00",
        status: status
      };

      onAddAttendance(newAtt);
      setScanSuccessMessage(`SUKSES PINDAI! ${emp.name} berhasil check-in pada pukul ${scanSimulationTime} (${isLate ? "TERLAMBAT" : "TEPAT WAKTU"}).`);
      setScanErrorMessage("");
    }, 1200);
  };

  // -------------------------
  // STATS & COMPUTED METRICS
  // -------------------------
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === "Active").length;
  
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayPresent = attendance.filter(a => a.date === todayDateStr && a.status === "Present").length;
  const todayLate = attendance.filter(a => a.date === todayDateStr && a.status === "Late").length;
  const todayAbsent = attendance.filter(a => a.date === todayDateStr && a.status === "Absent").length;

  const pendingLeaves = leaveRequests.filter(l => l.status === "Pending").length;
  const pendingPayrolls = payroll.filter(p => p.status === "Pending").length;
  const totalPayrollCost = payroll.filter(p => p.status === "Paid").reduce((acc, curr) => acc + curr.netSalary, 0);

  // -------------------------
  // EMPLOYEE CRUD HANDLERS
  // -------------------------
  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "Operations",
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      salary: 5000000
    });
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      department: emp.department,
      status: emp.status,
      joinedDate: emp.joinedDate,
      salary: emp.salary
    });
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.email || !employeeForm.role) {
      alert("Nama, Email, dan Jabatan wajib diisi!");
      return;
    }

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        ...employeeForm
      });
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        ...employeeForm
      };
      onAddEmployee(newEmp);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus profil karyawan ${name}?`)) {
      onDeleteEmployee(id);
    }
  };

  // -------------------------
  // ATTENDANCE HANDLERS
  // -------------------------
  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.employeeId) {
      alert("Pilih karyawan terlebih dahulu!");
      return;
    }

    const newAtt: Attendance = {
      id: `att-${Date.now()}`,
      employeeId: attendanceForm.employeeId,
      date: attendanceForm.date,
      checkIn: attendanceForm.checkIn,
      checkOut: attendanceForm.checkOut,
      status: attendanceForm.status
    };
    onAddAttendance(newAtt);
    setIsAttendanceModalOpen(false);
  };

  // Easy Quick check-in helper
  const quickCheckIn = (empId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const checkExist = attendance.find(a => a.employeeId === empId && a.date === today);
    if (checkExist) {
      alert("Karyawan ini sudah melakukan absensi hari ini!");
      return;
    }

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const formattedTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    const status = currentHour >= 8 && currentMinute > 15 ? "Late" as const : "Present" as const;

    const newAtt: Attendance = {
      id: `att-${Date.now()}`,
      employeeId: empId,
      date: today,
      checkIn: formattedTime,
      checkOut: "17:00",
      status: status
    };
    onAddAttendance(newAtt);
    alert(`Absen masuk sukses untuk ${employees.find(e => e.id === empId)?.name} pada pukul ${formattedTime}!`);
  };

  // -------------------------
  // PAYROLL HANDLERS
  // -------------------------
  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollForm.employeeId) {
      alert("Pilih karyawan terlebih dahulu!");
      return;
    }

    const netVal = payrollForm.basicSalary + payrollForm.allowance - payrollForm.deductions;
    const newPay: Payroll = {
      id: `pay-${Date.now()}`,
      employeeId: payrollForm.employeeId,
      month: payrollForm.month,
      basicSalary: Number(payrollForm.basicSalary),
      allowance: Number(payrollForm.allowance),
      deductions: Number(payrollForm.deductions),
      netSalary: netVal,
      status: "Pending" as const
    };
    onAddPayroll(newPay);
    setIsPayrollModalOpen(false);
  };

  const processPayment = (pay: Payroll) => {
    if (window.confirm(`Proses pembayaran gaji untuk bulan ${pay.month} sebesar Rp ${pay.netSalary.toLocaleString()}?`)) {
      onUpdatePayroll({
        ...pay,
        status: "Paid",
        paymentDate: new Date().toISOString().split("T")[0]
      });
    }
  };

  // -------------------------
  // LEAVE REQUEST HANDLERS
  // -------------------------
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.employeeId || !leaveForm.reason) {
      alert("Pilih karyawan dan isi alasan cuti!");
      return;
    }

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: leaveForm.employeeId,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: "Pending" as const,
      createdAt: new Date().toISOString()
    };
    onAddLeaveRequest(newLeave);
    setIsLeaveModalOpen(false);
  };

  const updateLeaveStatus = (leave: LeaveRequest, stat: "Approved" | "Rejected") => {
    onUpdateLeaveRequest({
      ...leave,
      status: stat
    });
  };

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || "Karyawan Tidak Ditemukan";
  };

  const exportSalarySlipPDF = (pay: Payroll) => {
    const emp = employees.find(e => e.id === pay.employeeId);
    if (!emp) {
      alert("Data karyawan untuk slip gaji ini tidak ditemukan.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 1. Decorative border and soft background
    doc.setFillColor(248, 250, 252); // soft slate background
    doc.rect(5, 5, 200, 287, "F");
    
    // Outer white container
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 190, 277, "F");
    
    // Border line style
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277, "S");

    // Top Emerald Accent Bar
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(10, 10, 190, 4, "F");

    // 2. HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("PMS PRO PROPERTIES", 18, 26);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Sistem Manajemen & Otomasi Operasional Properti Kontemporer", 18, 31);
    doc.text("Gedung Utama PMS Pro, Lt. 3 | Jakarta, Indonesia", 18, 35);
    doc.text("Email: hrd@pmsproproperties.co.id | Telp: (021) 855-9000", 18, 39);

    // Right Header: Document Type Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105); // emerald-650
    doc.text("SLIP GAJI BULANAN", 135, 26);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Periode: ${pay.month}`, 135, 31);
    doc.text(`No. Slip: SLIP/${pay.month.replace(/\s+/g, "").toUpperCase()}/${pay.id.toUpperCase().slice(-5)}`, 135, 35);
    doc.text(`Tgl Cetak: ${new Date().toLocaleDateString("id-ID")}`, 135, 39);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 45, 195, 45);

    // 3. EMPLOYEE DETAILS GRID (with a clean gray box)
    doc.setFillColor(248, 250, 252); // grey-50 accent
    doc.rect(15, 50, 180, 40, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, 50, 180, 40, "S");

    // Table / Grid Headers and Values
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("INFORMASI KARYAWAN", 20, 57);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1);
    doc.line(20, 59, 58, 59);

    // Column 1
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Nama Karyawan", 20, 66);
    doc.text("ID / Posisi", 20, 72);
    doc.text("Departemen", 20, 78);
    doc.text("Tanggal Masuk", 20, 84);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`:  ${emp.name}`, 48, 66);
    doc.text(`:  ${emp.id.toUpperCase()} / ${emp.role}`, 48, 72);
    doc.text(`:  ${emp.department}`, 48, 78);
    doc.text(`:  ${emp.joinedDate}`, 48, 84);

    // Column 2
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Telepon", 110, 66);
    doc.text("Email", 110, 72);
    doc.text("Status Kerja", 110, 78);
    doc.text("Metode Pembayaran", 110, 84);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`:  ${emp.phone}`, 142, 66);
    doc.text(`:  ${emp.email}`, 142, 72);
    doc.text(`:  Aktif (Permanent)`, 142, 78);
    doc.text(`:  Transfer Bank Mandiri`, 142, 84);

    // 4. INCOME AND DEDUCTIONS DETAILS
    // Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("I. RINCIAN PENDAPATAN (EARNINGS)", 15, 103);
    doc.text("II. RINCIAN POTONGAN (DEDUCTIONS)", 110, 103);

    // Left Line & Right Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 106, 100, 106);
    doc.line(110, 106, 195, 106);

    // Itemized table left (Income)
    // Row 1: Gaji Pokok
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Gaji Pokok Utama", 15, 113);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${pay.basicSalary.toLocaleString("id-ID")}`, 72, 113);

    // Row 2: Tunjangan / Bonus
    doc.setFont("helvetica", "normal");
    doc.text("Tunjangan & Bonus", 15, 121);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`+ Rp ${pay.allowance.toLocaleString("id-ID")}`, 70, 121);

    // Total Earning
    doc.setTextColor(30, 41, 59);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 126, 100, 126);
    doc.setFont("helvetica", "bold");
    doc.text("Total Pendapatan Kotor", 15, 132);
    const totalGross = pay.basicSalary + pay.allowance;
    doc.text(`Rp ${totalGross.toLocaleString("id-ID")}`, 72, 132);


    // Itemized table right (Deductions)
    // Row 1: BPJS / Kehadiran
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text("Potongan Absensi / BPJS", 110, 113);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // rose-600
    doc.text(`- Rp ${pay.deductions.toLocaleString("id-ID")}`, 167, 113);

    // Row 2: Pajak Penerimaan
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text("Estimasi Pajak PPh21", 110, 121);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`- Rp 0`, 167, 121);

    // Total Deductions
    doc.setTextColor(30, 41, 59);
    doc.line(110, 126, 195, 126);
    doc.setFont("helvetica", "bold");
    doc.text("Total Potongan Gaji", 110, 132);
    doc.text(`Rp ${pay.deductions.toLocaleString("id-ID")}`, 167, 132);


    // Double line divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.7);
    doc.line(15, 140, 195, 140);

    // 5. NET SALARY SUMMARY BOX
    doc.setFillColor(240, 253, 250); // emerald-50
    doc.rect(15, 146, 180, 24, "F");
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(0.5);
    doc.rect(15, 146, 180, 24, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("TOTAL TAKE HOME PAY (GAJI BERSIH)", 20, 153);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text(`Rp ${pay.netSalary.toLocaleString("id-ID")}`, 20, 163);

    // Dynamic right side badge: Status Lunas or Pending
    if (pay.status === "Paid") {
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(130, 151, 55, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("TERBAYAR LUNAS", 140, 160);
    } else {
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(130, 151, 55, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("PENDING TRANSFER", 135, 160);
    }

    // Informative confirmation
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rincian ini dibuat secara elektronik dari sistem PMS Pro Properties dan berlaku sebagai bukti penerimaan upah yang sah.`, 15, 176);
    doc.text(`Status Pembayaran: ${pay.status === "Paid" ? `Lunas ditransfer pada tanggal ${pay.paymentDate || new Date().toISOString().split("T")[0]}` : "Menunggu proses transfer admin HRD"}`, 15, 180);

    // 6. BANK SPECIFICATIONS SECTION
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("III. KETERANGAN & VERIFIKASI BANK", 15, 192);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 195, 195, 195);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Nama Bank Penerima", 15, 201);
    doc.text("Nomor Rekening", 15, 206);
    doc.text("Nama Pemilik Rekening", 15, 211);
    doc.text("Catatan Sistem", 15, 216);

    doc.setFont("helvetica", "bold");
    doc.text(":  Bank Mandiri KCP Kemang Timur", 50, 201);
    const simulatedAccountNum = (emp.id ? emp.id.replace(/\D/g, "") : "") || "9021";
    doc.text(`:  121-00-9882910-${simulatedAccountNum}`, 50, 206);
    doc.text(`:  ${emp.name}`, 50, 211);
    doc.text(":  Sistem Gaji Terintegrasi Digital Ledger PMS Pro", 50, 216);

    // 7. SIGNATURES AND APPROVALS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Dibuat Oleh,", 30, 236);
    doc.text("Diterima Oleh,", 140, 236);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Tanda tangan hrd digital", 25, 248);
    doc.text("Tanda tangan penerima", 137, 248);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("Ismail Marzuki", 28, 256);
    doc.text(`${emp.name}`, 140, 256);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("HR & Operations Specialist", 22, 260);
    doc.text("Karyawan Penerima", 138, 260);

    // Footer signature stamps
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Slip Gaji ID: ${pay.id.toUpperCase()} • Generated automatically in secure PMS Pro runtime.`, 55, 271);

    // Save the PDF
    doc.save(`Slip_Gaji_${emp.name.replace(/\s+/g, "_")}_${pay.month.replace(/\s+/g, "_")}.pdf`);
  };

  const uniqueMonths = Array.from(new Set([
    ...payroll.map(p => p.month),
    "Juni 2026",
    "Juli 2026"
  ])).sort();

  const generateMonthlyReportPDF = (selectedMonth: string) => {
    // 1. Parsing selected month to filter attendance
    const [monthName, yearStr] = selectedMonth.split(" ");
    const MONTH_MAP_INDONESIAN: Record<string, string> = {
      "Januari": "01", "Februari": "02", "Maret": "03", "April": "04",
      "Mei": "05", "Juni": "06", "Juli": "07", "Agustus": "08",
      "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
    };
    const monthCode = MONTH_MAP_INDONESIAN[monthName] || "06";
    const datePrefix = `${yearStr || "2026"}-${monthCode}`;

    const filteredAttendance = attendance.filter(a => a.date.startsWith(datePrefix));
    const filteredPayroll = payroll.filter(p => p.month === selectedMonth);

    // Compute stats
    const totalExpected = filteredAttendance.length;
    const totalActualPresent = filteredAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
    const avgAttendanceRate = totalExpected > 0 ? Math.round((totalActualPresent / totalExpected) * 100) : 100;

    const totalGross = filteredPayroll.reduce((sum, p) => sum + p.basicSalary + p.allowance, 0);
    const totalPaid = filteredPayroll.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.netSalary, 0);
    const totalPending = filteredPayroll.filter(p => p.status === "Pending").reduce((sum, p) => sum + p.netSalary, 0);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Helper to draw border & page styling
    const drawPageDecorations = (pageNumber: number) => {
      // Background card
      doc.setFillColor(255, 255, 255);
      doc.rect(10, 10, 190, 277, "F");
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277, "S");

      // Top Emerald Accent Bar
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(10, 10, 190, 4, "F");
      
      // Footer page metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`PMS PRO PROPERTIES | Laporan SDM Bulanan`, 15, 280);
      doc.text(`Halaman ${pageNumber}`, 180, 280);
      
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(10, 275, 200, 275);
    };

    drawPageDecorations(1);

    // 2. HEADER BLOCK
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("PMS PRO PROPERTIES", 15, 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Gedung Utama PMS Pro, Lt. 3 | Jakarta, Indonesia | hrd@pmsproproperties.co.id", 15, 30);
    
    // Document Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("LAPORAN REKAPITULASI SDM & PAYROLL", 15, 39);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Periode Laporan  : ${selectedMonth}`, 15, 45);
    doc.text(`Tanggal Cetak     : ${new Date().toLocaleDateString("id-ID")}`, 15, 50);
    doc.text(`Dicetak Oleh        : Admin HRD / Super Admin`, 15, 55);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 59, 195, 59);

    let currentY = 65;

    // 3. SECTION 1: RINGKASAN EKSEKUTIF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("I. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)", 15, currentY);
    currentY += 4;
    
    // Draw background card
    doc.setFillColor(248, 250, 252); // grey-50
    doc.rect(15, currentY, 180, 38, "F");
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, currentY, 180, 38, "S");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    
    // Col 1: Kepegawaian & Presensi
    doc.setFont("helvetica", "bold");
    doc.text("A. MONITOR KEHADIRAN & SDM", 20, currentY + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`- Total Staf Terdaftar : ${employees.length} Orang`, 20, currentY + 13);
    doc.text(`- Total Log Presensi   : ${filteredAttendance.length} Entri`, 20, currentY + 19);
    doc.text(`- Rata-rata Hadir       : ${avgAttendanceRate}%`, 20, currentY + 25);
    doc.text(`- Rincian Presensi     : ${filteredAttendance.filter(a => a.status === "Present").length} Tepat, ${filteredAttendance.filter(a => a.status === "Late").length} Lambat`, 20, currentY + 31);

    // Col 2: Payroll Keuangan
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("B. REKAPITULASI BIAYA PAYROLL", 110, currentY + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`- Pengeluaran Kotor : Rp ${totalGross.toLocaleString("id-ID")}`, 110, currentY + 13);
    doc.text(`- Sudah Terbayar     : Rp ${totalPaid.toLocaleString("id-ID")}`, 110, currentY + 19);
    doc.text(`- Sisa Antrean Gaji : Rp ${totalPending.toLocaleString("id-ID")}`, 110, currentY + 25);
    doc.text(`- Total Slip Gaji       : ${filteredPayroll.length} Slip diterbitkan`, 110, currentY + 31);

    currentY += 46;

    // 4. SECTION 2: REKAPITULASI ABSENSI STAF
    if (reportIncludeAttendance) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("II. DETAIL REKAPITULASI PRESENSI KARYAWAN", 15, currentY);
      currentY += 4;

      // Table Header
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(15, currentY, 180, 7, "F");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Nama Staf", 18, currentY + 5);
      doc.text("Jabatan & Dept", 52, currentY + 5);
      doc.text("Hadir", 95, currentY + 5);
      doc.text("Terlambat", 115, currentY + 5);
      doc.text("Absen", 140, currentY + 5);
      doc.text("Cuti/Izin", 160, currentY + 5);
      doc.text("Rasio", 182, currentY + 5);
      
      currentY += 7;

      const employeeMetrics = employees.map(emp => {
        const empAttendance = filteredAttendance.filter(a => a.employeeId === emp.id);
        const present = empAttendance.filter(a => a.status === "Present").length;
        const late = empAttendance.filter(a => a.status === "Late").length;
        const absent = empAttendance.filter(a => a.status === "Absent").length;
        const leave = empAttendance.filter(a => a.status === "Leave").length;
        const total = empAttendance.length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
        return { emp, present, late, absent, leave, rate };
      });

      employeeMetrics.forEach((m, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(15, currentY, 180, 8, "F");
        
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(m.emp.name.slice(0, 20), 18, currentY + 5.5);
        doc.text(`${m.emp.role.slice(0, 15)} (${m.emp.department.slice(0, 4).toUpperCase()})`, 52, currentY + 5.5);
        doc.text(`${m.present} Hari`, 95, currentY + 5.5);
        doc.text(`${m.late} Hari`, 115, currentY + 5.5);
        doc.text(`${m.absent} Hari`, 140, currentY + 5.5);
        doc.text(`${m.leave} Hari`, 160, currentY + 5.5);
        doc.text(`${m.rate}%`, 182, currentY + 5.5);
        
        currentY += 8;

        if (currentY > 260) {
          doc.addPage();
          drawPageDecorations(doc.getNumberOfPages());
          currentY = 25;
          
          doc.setFillColor(5, 150, 105);
          doc.rect(15, currentY, 180, 7, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("Nama Staf", 18, currentY + 5);
          doc.text("Jabatan & Dept", 52, currentY + 5);
          doc.text("Hadir", 95, currentY + 5);
          doc.text("Terlambat", 115, currentY + 5);
          doc.text("Absen", 140, currentY + 5);
          doc.text("Cuti/Izin", 160, currentY + 5);
          doc.text("Rasio", 182, currentY + 5);
          currentY += 7;
        }
      });
      currentY += 8;
    }

    // 5. SECTION 3: REKAPITULASI PAYROLL BULANAN
    if (reportIncludePayroll) {
      if (currentY > 235) {
        doc.addPage();
        drawPageDecorations(doc.getNumberOfPages());
        currentY = 25;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("III. RINCIAN BIAYA & DAFTAR PAYROLL STAF", 15, currentY);
      currentY += 4;

      // Table Header
      doc.setFillColor(15, 118, 110); // teal-700
      doc.rect(15, currentY, 180, 7, "F");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Nama Staf", 18, currentY + 5);
      doc.text("Gaji Pokok Utama", 55, currentY + 5);
      doc.text("Tunjangan (+)", 90, currentY + 5);
      doc.text("Potongan (-)", 122, currentY + 5);
      doc.text("Gaji Bersih (Nett)", 150, currentY + 5);
      doc.text("Status", 180, currentY + 5);
      
      currentY += 7;

      if (filteredPayroll.length === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(15, currentY, 180, 10, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text("Belum ada data slip payroll yang diterbitkan untuk periode ini.", 20, currentY + 6.5);
        currentY += 10;
      } else {
        filteredPayroll.forEach((pay, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(15, currentY, 180, 8, "F");
          
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          doc.text(getEmployeeName(pay.employeeId).slice(0, 20), 18, currentY + 5.5);
          doc.text(`Rp ${pay.basicSalary.toLocaleString("id-ID")}`, 55, currentY + 5.5);
          doc.text(`Rp ${pay.allowance.toLocaleString("id-ID")}`, 90, currentY + 5.5);
          doc.text(`Rp ${pay.deductions.toLocaleString("id-ID")}`, 122, currentY + 5.5);
          
          doc.setFont("helvetica", "bold");
          doc.text(`Rp ${pay.netSalary.toLocaleString("id-ID")}`, 150, currentY + 5.5);
          
          doc.setFontSize(7);
          doc.setTextColor(pay.status === "Paid" ? 16 : 245, pay.status === "Paid" ? 185 : 158, pay.status === "Paid" ? 129 : 11);
          doc.text(pay.status === "Paid" ? "LUNAS" : "PENDING", 180, currentY + 5.5);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          currentY += 8;

          if (currentY > 260) {
            doc.addPage();
            drawPageDecorations(doc.getNumberOfPages());
            currentY = 25;
            
            doc.setFillColor(15, 118, 110);
            doc.rect(15, currentY, 180, 7, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.text("Nama Staf", 18, currentY + 5);
            doc.text("Gaji Pokok Utama", 55, currentY + 5);
            doc.text("Tunjangan (+)", 90, currentY + 5);
            doc.text("Potongan (-)", 122, currentY + 5);
            doc.text("Gaji Bersih (Nett)", 150, currentY + 5);
            doc.text("Status", 180, currentY + 5);
            currentY += 7;
          }
        });
      }
      currentY += 8;
    }

    // 6. SIGN-OFF / PENGESAHAN
    if (currentY > 230) {
      doc.addPage();
      drawPageDecorations(doc.getNumberOfPages());
      currentY = 25;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("PENGESAHAN DOKUMEN REKAPITULASI,", 15, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Disiapkan oleh:", 15, currentY + 16);
    doc.text("Disetujui & Sahkan oleh:", 110, currentY + 16);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Otorisasi HRD Digital", 15, currentY + 28);
    doc.text("Otorisasi Management Digital", 110, currentY + 28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Ismail Marzuki", 15, currentY + 36);
    doc.text("Hary Tanoe", 110, currentY + 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("HR & Operations Specialist", 15, currentY + 40);
    doc.text("Super Admin / VP Operations", 110, currentY + 40);

    doc.save(`Laporan_HR_Rekap_${selectedMonth.replace(/\s+/g, "_")}.pdf`);
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchString = employeeSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(searchString) ||
      emp.role.toLowerCase().includes(searchString) ||
      emp.department.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                HRIS Corporate Pipeline
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sistem Manajemen SDM & Kepegawaian</h2>
            <p className="text-xs md:text-sm text-emerald-100 font-medium">
              Kelola data profil karyawan, absensi harian, rincian slip payroll bulanan, hingga persetujuan cuti formal terpadu.
            </p>
          </div>
          
          <div className="flex gap-2">
            {(currentRole === "HR" || currentRole === "Super Admin") && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition border border-emerald-200 shrink-0"
              >
                <Download className="h-4 w-4" /> Unduh Laporan
              </button>
            )}
            <button
              onClick={openAddEmployee}
              className="bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="h-4 w-4" /> Karyawan Baru
            </button>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="bg-emerald-600/60 hover:bg-emerald-600/80 text-white border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Clock className="h-4 w-4" /> Catat Absen
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Staf</p>
            <h3 className="text-xl font-bold text-slate-800">{totalEmployees} Orang</h3>
            <p className="text-[9px] text-emerald-600 font-semibold">{activeEmployees} Aktif</p>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kehadiran Hari Ini</p>
            <h3 className="text-xl font-bold text-slate-800">{todayPresent + todayLate} Hadir</h3>
            <p className="text-[9px] text-amber-600 font-semibold">{todayLate} Terlambat | {todayAbsent} Absen</p>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Antrean Pengajuan Cuti</p>
            <h3 className="text-xl font-bold text-slate-800">{pendingLeaves} Pengajuan</h3>
            <p className="text-[9px] text-rose-600 font-semibold">Menunggu Review Admin</p>
          </div>
        </div>

        {/* Payroll Summary */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Beban Gaji Dibayar</p>
            <h3 className="text-xl font-bold text-slate-800">Rp {totalPayrollCost.toLocaleString("id-ID")}</h3>
            <p className="text-[9px] text-amber-600 font-semibold">{pendingPayrolls} Slip Menunggu Ditransfer</p>
          </div>
        </div>
      </div>

      {/* MODULE MAIN INTERACTIVE SHEET CONTROL TABS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Navigation Tab Header */}
        <div className="flex border-b overflow-x-auto scrollbar-none bg-slate-50/50">
          <button
            onClick={() => setActiveSubTab("employees")}
            className={`px-5 py-4 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition ${
              activeSubTab === "employees"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <Contact className="h-4 w-4" /> Data Profil Karyawan
          </button>
          <button
            onClick={() => setActiveSubTab("attendance")}
            className={`px-5 py-4 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition ${
              activeSubTab === "attendance"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <Clock className="h-4 w-4" /> Presensi & Absensi
          </button>
          <button
            onClick={() => setActiveSubTab("payroll")}
            className={`px-5 py-4 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition ${
              activeSubTab === "payroll"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="h-4 w-4" /> Rincian Gaji (Payroll)
          </button>
          <button
            onClick={() => setActiveSubTab("leaves")}
            className={`px-5 py-4 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition ${
              activeSubTab === "leaves"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="h-4 w-4" /> Pengajuan Cuti Staf
          </button>
          <button
            onClick={() => setActiveSubTab("shifts")}
            className={`px-5 py-4 text-xs font-bold border-b-2 flex items-center gap-2 shrink-0 transition ${
              activeSubTab === "shifts"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <CalendarDays className="h-4 w-4 text-emerald-600" /> Penjadwalan Shift (Roster)
          </button>
        </div>

        {/* TAB PANELS */}
        <div className="p-6">
          {/* TAB 1: EMPLOYEE PROFILE & CRUD */}
          {activeSubTab === "employees" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, departemen, atau jabatan karyawan..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-semibold">{filteredEmployees.length} Karyawan Cocok</span>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Inisial / ID</th>
                      <th className="py-3.5 px-4 font-bold">Karyawan</th>
                      <th className="py-3.5 px-4 font-bold">Kontak / Email</th>
                      <th className="py-3.5 px-4 font-bold">Jabatan & Dept</th>
                      <th className="py-3.5 px-4 font-bold">Gaji Pokok</th>
                      <th className="py-3.5 px-4 font-bold">Tanggal Gabung</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-slate-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 font-semibold">
                          Tidak ada karyawan yang ditemukan. Silakan tambahkan karyawan baru.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-mono font-semibold text-slate-400">
                            {emp.id.toUpperCase()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-100">
                                {emp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{emp.name}</p>
                                <p className="text-[10px] text-gray-400">{emp.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-slate-700">{emp.phone}</p>
                            <p className="text-[10px] text-gray-400">{emp.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-bold uppercase">
                                {emp.department}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            Rp {emp.salary.toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 px-4 text-gray-500">
                            {emp.joinedDate}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              emp.status === "Active"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : "bg-gray-100 text-gray-500 border border-gray-200"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${emp.status === "Active" ? "bg-emerald-600" : "bg-gray-400"}`} />
                              {emp.status === "Active" ? "Aktif" : "Non-Aktif"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {emp.status === "Active" && (
                                <button
                                  onClick={() => quickCheckIn(emp.id)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Quick Check-In Absensi Hari Ini"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditEmployee(emp)}
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                                title="Edit Profil"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(emp.id, emp.name)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE & PRESENSI */}
          {activeSubTab === "attendance" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Log Presensi Kehadiran Karyawan</h4>
                  <p className="text-[11px] text-gray-400">Daftar rekam log absensi digital harian para staf</p>
                </div>
                
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="h-3.5 w-3.5" /> Absensi Manual
                </button>
              </div>

              {/* HUB PRESENSI QR CODE DIGITAL */}
              <div id="qr-presence-hub" className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Layanan Mandiri: Hub Presensi QR Code</h5>
                    <p className="text-[10px] text-gray-400">Pembangkit kode QR harian dan simulator pemindaian otomatis karyawan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  {/* PANEL 1: GENERATOR (HRD SIDE) */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-md uppercase tracking-wide">
                          Sisi HRD / Layanan Monitor
                        </span>
                      </div>
                      <div>
                        <h6 className="text-[11px] font-bold text-slate-700">Pembangkit QR Code Absensi</h6>
                        <p className="text-[10px] text-slate-400">Setiap hari kerja memiliki token QR unik untuk mencegah pemalsuan lokasi.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Hari Kerja Absensi</label>
                          <input
                            type="date"
                            value={qrWorkDay}
                            onChange={(e) => {
                              setQrWorkDay(e.target.value);
                              setScanSuccessMessage("");
                              setScanErrorMessage("");
                            }}
                            className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 text-slate-700 outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Status Enkripsi QR</label>
                          <div className="w-full bg-emerald-50 text-emerald-700 rounded-lg p-2 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-100">
                            <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-ping" />
                            Token Aktif & Berlaku
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 border border-slate-150 rounded-xl">
                      <div className="relative p-1.5 bg-white border border-gray-205 rounded-lg shadow-sm shrink-0">
                        {/* QR Server API usage with fallback */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`pmspro-attendance-${qrWorkDay}`)}`}
                          alt="QR Absensi Hari Ini"
                          className="w-24 h-24 object-contain"
                          onError={(e) => {
                            (e.target as any).src = "https://via.placeholder.com/130?text=QR+ACTIVE";
                          }}
                        />
                        <div className="absolute inset-0 border border-dashed border-emerald-200 rounded-lg pointer-events-none" />
                      </div>
                      <div className="text-left space-y-1.5">
                        <span className="text-[9px] font-bold py-0.5 px-1.5 bg-slate-100 text-slate-500 rounded font-mono">
                          Token: pmspro-att-{qrWorkDay}
                        </span>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          <p className="text-slate-700 font-bold">Langkah Pemakaian:</p>
                          <p>1. Monitor menampilkan layar QR ini di lobby utama.</p>
                          <p>2. Karyawan mengarahkan kamera App ke QR.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PANEL 2: CAMERA SCANNING SIMULATOR (EMPLOYEE HP SIDE) */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-extrabold rounded-md uppercase tracking-wide">
                        Simulasi Scan Ponsel Karyawan
                      </span>
                      <p className="text-[10px] text-slate-400">Pilih profil karyawan di bawah dan uji coba pemindaian QR absensi.</p>
                    </div>

                    {/* VIRTUAL SMARTPHONE MOCKUP */}
                    <div className="border-[5px] border-slate-800 rounded-2xl bg-slate-900 text-slate-200 p-3 min-h-[190px] flex flex-col justify-between shadow relative overflow-hidden">
                      {/* Scan screen overlay logic */}
                      {isScanningQR ? (
                        <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Memindai Target QR...</p>
                          <div className="absolute w-full h-[2px] bg-red-500 top-1/2 left-0 animate-bounce" />
                        </div>
                      ) : null}

                      {/* Top status header */}
                      <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          LIVE: SCANNER OK
                        </span>
                        <span className="font-mono text-[8px]">PMS Pro Mobile App</span>
                      </div>

                      {/* Main screen area inside phone */}
                      <div className="flex-1 flex flex-col justify-center space-y-2.5">
                        {/* Selector logic */}
                        <div className="space-y-1">
                          <label className="block text-[8px] text-slate-400 font-bold uppercase">Pilih Anggota Karyawan</label>
                          <select
                            value={scannedEmployeeId}
                            onChange={(e) => {
                              setScannedEmployeeId(e.target.value);
                              setScanSuccessMessage("");
                              setScanErrorMessage("");
                            }}
                            className="w-full text-xs bg-slate-800 text-white border border-slate-700 rounded-lg p-1.5 outline-none focus:border-indigo-400 font-semibold"
                          >
                            <option value="">-- Pilih Karyawan --</option>
                            {employees
                              .filter(e => e.status === "Active")
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        {/* Slide Simulation Time */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase">
                            <span>Jam Simulasi Scan</span>
                            <span className="text-indigo-400 font-bold">{scanSimulationTime}</span>
                          </div>
                          <select
                            value={scanSimulationTime}
                            onChange={(e) => setScanSimulationTime(e.target.value)}
                            className="w-full text-xs bg-slate-800 text-white border border-slate-700 rounded-lg p-1.5 outline-none focus:border-indigo-400 font-semibold"
                          >
                            <option value="07:50">07:50 (Tepat Waktu)</option>
                            <option value="08:00">08:00 (Tepat Waktu)</option>
                            <option value="08:14">08:14 (Tepat Waktu)</option>
                            <option value="08:25">08:25 (Terlambat)</option>
                            <option value="09:10">09:10 (Terlambat)</option>
                          </select>
                        </div>
                      </div>

                      {/* Trigger Scan Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleSimulateQRScan}
                          disabled={isScanningQR || !scannedEmployeeId}
                          className={`w-full py-1.5 text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition ${
                            !scannedEmployeeId 
                              ? "bg-slate-800 cursor-not-allowed text-slate-500" 
                              : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-950/40"
                          }`}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          Mulai Pindai QR Absen
                        </button>
                      </div>
                    </div>

                    {/* Scan message outputs */}
                    {scanSuccessMessage && (
                      <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <div>{scanSuccessMessage}</div>
                      </div>
                    )}
                    {scanErrorMessage && (
                      <div className="p-2 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-lg border border-rose-200 flex items-center gap-1.5 animate-fadeIn">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <div>{scanErrorMessage}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Tanggal</th>
                      <th className="py-3.5 px-4 font-bold">Nama Karyawan</th>
                      <th className="py-3.5 px-4 font-bold">Jam Masuk</th>
                      <th className="py-3.5 px-4 font-bold">Jam Pulang</th>
                      <th className="py-3.5 px-4 font-bold">Status Presensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-slate-700">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">
                          Belum ada rekam log absensi tersimpan.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {att.date}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {getEmployeeName(att.employeeId)}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-emerald-650">
                            {att.checkIn || "--:--"}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-slate-500">
                            {att.checkOut || "--:--"}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              att.status === "Present"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : att.status === "Late"
                                ? "bg-amber-50 text-amber-800 border border-amber-100"
                                : att.status === "Leave"
                                ? "bg-indigo-50 text-indigo-800 border border-indigo-100"
                                : "bg-rose-50 text-rose-800 border border-rose-100"
                            }`}>
                              <span className={`h-1.2 w-1.2 rounded-full ${
                                att.status === "Present" ? "bg-emerald-500" :
                                att.status === "Late" ? "bg-amber-500" :
                                att.status === "Leave" ? "bg-indigo-500" : "bg-rose-500"
                              }`} />
                              {att.status === "Present" ? "Tepat Waktu" :
                               att.status === "Late" ? "Terlambat" :
                               att.status === "Leave" ? "Cuti/Izin" : "Mangkir/Absen"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYROLL / RINCIAN GAJI */}
          {activeSubTab === "payroll" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Distribusi & Rincian Gaji Bulanan Staf</h4>
                  <p className="text-[11px] text-gray-400">Data penerbitan slip gaji serta log pembayaran operasional karyawan</p>
                </div>
                
                <button
                  onClick={() => setIsPayrollModalOpen(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="h-3.5 w-3.5" /> Terbitkan Slip Gaji
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Bulan / Periode</th>
                      <th className="py-3.5 px-4 font-bold">Nama Karyawan</th>
                      <th className="py-3.5 px-4 font-bold">Gaji Pokok</th>
                      <th className="py-3.5 px-4 font-bold">Tunjangan (+)</th>
                      <th className="py-3.5 px-4 font-bold">Potongan / BPJS (-)</th>
                      <th className="py-3.5 px-4 font-bold">Total Bersih (Nett)</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Tanggal Kirim</th>
                      <th className="py-3.5 px-4 font-bold text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-slate-700">
                    {payroll.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400 font-semibold">
                          Belum ada penerbitan rincian slip payroll saat ini.
                        </td>
                      </tr>
                    ) : (
                      payroll.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {pay.month}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-850">{getEmployeeName(pay.employeeId)}</p>
                            <p className="text-[9px] text-gray-400">Pegawai PMS Pro</p>
                          </td>
                          <td className="py-4 px-4 font-mono">
                            Rp {pay.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-mono text-emerald-600">
                            +Rp {pay.allowance.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-mono text-rose-600">
                            -Rp {pay.deductions.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-mono font-extrabold text-slate-900 bg-slate-50/50">
                            Rp {pay.netSalary.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              pay.status === "Paid"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                            }`}>
                              {pay.status === "Paid" ? "TERSELESAIKAN" : "PENDING TRANSFER"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-500 font-medium">
                            {pay.paymentDate || "Menunggu Pembayaran"}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {pay.status === "Pending" ? (
                                <button
                                  onClick={() => processPayment(pay)}
                                  className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-lg transition shrink-0 shadow-sm"
                                >
                                  Bayar Gaji
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1 shrink-0">
                                  <CheckCircle className="h-3 w-3" /> Sukses
                                </span>
                              )}
                              <button
                                onClick={() => exportSalarySlipPDF(pay)}
                                className="p-1 px-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold text-[10px] rounded-lg border border-gray-200 hover:border-emerald-200 transition flex items-center gap-1 shrink-0"
                                title="Unduh Slip Gaji PDF"
                              >
                                <Download className="h-3.5 w-3.5" /> Slip
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pusat Notifikasi Email Slip Gaji (Mock) */}
              <div id="payroll-email-notifications-hub" className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pusat Integrasi Notifikasi Email Slip Gaji (Mock)</h4>
                      <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                        Otomasi pengiriman notifikasi email otomatis ke staf jika slip diterbitkan (HR) & disetujui (Finance)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-start sm:self-center">
                    <button
                      onClick={() => {
                        if (window.confirm("Apakah Anda yakin ingin mengosongkan riwayat email terkirim?")) {
                          localStorage.removeItem("pmspro_payroll_emails");
                          window.location.reload();
                        }
                      }}
                      className="px-2.5 py-1 text-[10px] uppercase font-black text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent rounded-lg transition shrink-0"
                    >
                      Hapus Log Notifikasi
                    </button>
                  </div>
                </div>

                {/* Filter and stats sub-bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase">Filter Tipe Email:</span>
                    <div className="flex bg-slate-150 p-0.5 rounded-lg border border-slate-250/20 text-[10px] font-bold">
                      <button
                        onClick={() => setEmailFilter("all")}
                        className={`px-2.5 py-1 rounded-md transition ${emailFilter === "all" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Semua ({payrollEmails.length})
                      </button>
                      <button
                        onClick={() => setEmailFilter("Published")}
                        className={`px-2.5 py-1 rounded-md transition ${emailFilter === "Published" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Diterbitkan HR ({payrollEmails.filter(e => e.type === "Published").length})
                      </button>
                      <button
                        onClick={() => setEmailFilter("Approved")}
                        className={`px-2.5 py-1 rounded-md transition ${emailFilter === "Approved" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Disetujui Finance ({payrollEmails.filter(e => e.type === "Approved").length})
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <strong>Otomasi SMTP Mock:</strong> Status Server Aktif (Simulation Mode)
                  </div>
                </div>

                {/* Grid list or blank representation */}
                {payrollEmails.length === 0 ? (
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl text-center space-y-2">
                    <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Belum ada email notifikasi terkirim.</p>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-sm mx-auto">
                      Cobalah untuk menerbitkan slip gaji baru melalui tombol <strong>Terbitkan Slip Gaji</strong> di atas, atau menyetujui transfer gaji melalui modul <strong>Keuangan & Akuntansi (Finance)</strong> untuk memicu sistem notifikasi email otomatis ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {payrollEmails
                      .filter(e => emailFilter === "all" || e.type === emailFilter)
                      .map((mail: any) => (
                        <div key={mail.id} className="bg-white border border-slate-150 hover:border-emerald-200 rounded-xl p-3.5 shadow-3xs transition relative flex flex-col justify-between gap-3 text-left">
                          <div className="space-y-1.5 text-left">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                mail.type === "Published"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              }`}>
                                {mail.type === "Published" ? "HR: Penerbitan" : "Finance: Pelunasan"}
                              </span>
                              <span className="text-[9px] font-mono font-medium text-slate-400">{mail.sentAt}</span>
                            </div>

                            <p className="text-[11px] font-bold text-slate-800 truncate" title={mail.subject}>
                              {mail.subject}
                            </p>

                            <div className="text-[10px] text-slate-650 leading-relaxed font-semibold">
                              <p><span className="text-slate-400 font-bold uppercase text-[9px]">Kepada:</span> {mail.recipientName} ({mail.recipientEmail})</p>
                              <p className="line-clamp-2 text-[9px] text-slate-400 font-mono mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-150 border-dashed">
                                {mail.body}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 shrink-0">
                            <span className="text-[9px] text-emerald-600 font-black flex items-center gap-1 uppercase">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Delivered
                            </span>
                            
                            <button
                              onClick={() => setSelectedEmail(mail)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-slate-500" /> Lihat Email
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEAVE REQUESTS */}
          {activeSubTab === "leaves" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Permohonan Izin & Cuti Karyawan</h4>
                  <p className="text-[11px] text-gray-400">Review status antrean cuti formal staf di bawah ini</p>
                </div>
                
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajukan Cuti Staf
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Pengaju</th>
                      <th className="py-3.5 px-4 font-bold">Jenis Cuti</th>
                      <th className="py-3.5 px-4 font-bold">Tanggal Mulai</th>
                      <th className="py-3.5 px-4 font-bold">Tanggal Selesai</th>
                      <th className="py-3.5 px-4 font-bold">Alasan Cuti</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-center">Keputusan / Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-slate-700">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">
                          Belum ada laporan pengajuan cuti resmi yang masuk.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {getEmployeeName(leave.employeeId)}
                          </td>
                          <td className="py-4 px-4 font-semibold text-indigo-750">
                            {leave.leaveType === "Annual" ? "Tahunan (Annual)" :
                             leave.leaveType === "Sick" ? "Izin Sakit (Sick)" :
                             leave.leaveType === "Maternity" ? "Melahirkan" : "Tanpa Bayaran (Unpaid)"}
                          </td>
                          <td className="py-4 px-4">
                            {leave.startDate}
                          </td>
                          <td className="py-4 px-4">
                            {leave.endDate}
                          </td>
                          <td className="py-4 px-4 max-w-xs truncate text-gray-500 font-medium" title={leave.reason}>
                            {leave.reason}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              leave.status === "Approved"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : leave.status === "Rejected"
                                ? "bg-rose-50 text-rose-800 border border-rose-100"
                                : "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                            }`}>
                              {leave.status === "Approved" ? "DISETUJUI" :
                               leave.status === "Rejected" ? "DITOLAK" : "MENUNGGU REVIEW"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {leave.status === "Pending" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => updateLeaveStatus(leave, "Approved")}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md transition"
                                  title="Setujui Cuti"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  onClick={() => updateLeaveStatus(leave, "Rejected")}
                                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-md transition"
                                  title="Tolak Cuti"
                                >
                                  <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold uppercase">
                                Closed Decided
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SHIFT SCHEDULER & ROSTER BOARD */}
          {activeSubTab === "shifts" && (() => {
            const daysInMonth = 31;
            const startOffset = 3; // July 1st 2026 is a Wednesday (Sun=0, Mon=1, Tue=2, Wed=3)
            const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            
            // Get active employees list
            const activeEmployees = employees.filter(e => e.status === "Active");
            const filteredEmployees = activeEmployees.filter(e =>
              e.name.toLowerCase().includes(schedulerSearch.toLowerCase()) ||
              e.role.toLowerCase().includes(schedulerSearch.toLowerCase()) ||
              e.department.toLowerCase().includes(schedulerSearch.toLowerCase())
            );

            // Selected profile schedules logic
            const selectedEmployee = employees.find(e => e.id === selectedProfileId) || employees[0];
            const personalSchedules = shiftSchedules.filter(s => s.employeeId === selectedEmployee?.id);
            
            // Personal schedule statistics
            const totalWorkDays = personalSchedules.filter(s => s.shift !== "Off").length;
            const totalHours = totalWorkDays * 8;
            const nightShiftsCount = personalSchedules.filter(s => s.shift === "Night").length;
            const offDaysCount = personalSchedules.filter(s => s.shift === "Off").length + (daysInMonth - personalSchedules.length);

            // Drag actions
            const handleDragStart = (e: React.DragEvent, id: string) => {
              e.dataTransfer.setData("text/plain", id);
              setDraggedEmployeeId(id);
            };

            const assignShift = (employeeId: string, dateStr: string, shiftType: ShiftType) => {
              const emp = employees.find(e => e.id === employeeId);
              if (!emp) return;
              if (emp.status !== "Active") {
                alert(`Karyawan ${emp.name} tidak aktif dan tidak dapat dijadwalkan.`);
                return;
              }

              // Filter out any other shift for this employee on this specific day
              const filtered = shiftSchedules.filter(
                s => !(s.employeeId === employeeId && s.date === dateStr)
              );

              // Add the new assignment
              const newAssignment: ShiftSchedule = {
                id: `shift-${employeeId}-${dateStr}`,
                employeeId,
                date: dateStr,
                shift: shiftType,
                updatedAt: new Date().toISOString()
              };

              setShiftSchedules([...filtered, newAssignment]);
            };

            const handleDropOnShift = (dateStr: string, shiftType: ShiftType) => {
              if (!draggedEmployeeId) return;
              assignShift(draggedEmployeeId, dateStr, shiftType);
              setDraggedEmployeeId(null);
              setDragOverCell(null);
            };

            const removeShiftAssignment = (empId: string, dateStr: string) => {
              setShiftSchedules(shiftSchedules.filter(s => !(s.employeeId === empId && s.date === dateStr)));
            };

            const handleAutoFillRoster = () => {
              if (activeEmployees.length === 0) {
                alert("Tidak ada staf aktif untuk dijadwalkan.");
                return;
              }

              if (window.confirm("Isi otomatis seluruh jadwal bulan Juli 2026? Aksi ini akan menimpa jadwal berjalan dengan pola rotasi teratur.")) {
                const autoSchedules: ShiftSchedule[] = [];
                const patternList: ShiftType[][] = [
                  ["Morning", "Morning", "Afternoon", "Afternoon", "Night", "Night", "Off", "Off"],
                  ["Afternoon", "Afternoon", "Night", "Night", "Off", "Off", "Morning", "Morning"],
                  ["Night", "Night", "Off", "Off", "Morning", "Morning", "Afternoon", "Afternoon"],
                  ["Off", "Off", "Morning", "Morning", "Afternoon", "Afternoon", "Night", "Night"]
                ];

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `2026-07-${day.toString().padStart(2, "0")}`;
                  activeEmployees.forEach((emp, index) => {
                    const empPattern = patternList[index % patternList.length];
                    const shiftVal = empPattern[day % empPattern.length];
                    autoSchedules.push({
                      id: `shift-${emp.id}-${dateStr}`,
                      employeeId: emp.id,
                      date: dateStr,
                      shift: shiftVal,
                      updatedAt: new Date().toISOString()
                    });
                  });
                }
                setShiftSchedules(autoSchedules);
              }
            };

            const handleClearRoster = () => {
              if (window.confirm("Hapus seluruh jadwal kerja bulan Juli 2026 secara permanen?")) {
                setShiftSchedules([]);
              }
            };

            const triggerExportSim = () => {
              setIsExportingShift(true);
              setTimeout(() => {
                setIsExportingShift(false);
                setShowExportSuccess(true);
              }, 1800);
            };

            const getEmployeeInitials = (id: string) => {
              const name = getEmployeeName(id);
              if (!name) return "EM";
              return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            };

            return (
              <div className="space-y-6 animate-fade-in text-xs font-sans">
                {/* INNER NAVIGATION TIMELINE TRACK & MODE CONTROLLER */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="h-4.5 w-4.5 text-emerald-600" />
                      Penjadwalan Shift & Roster Karyawan Pro
                    </h3>
                    <p className="text-xs text-slate-400">Atur kalender kerja staf, distribusikan shift pagi/siang/malam, dan cetak kesimpulan jadwal kerja resmi</p>
                  </div>
                  <div className="flex bg-slate-200/55 p-1 rounded-xl shrink-0 self-end md:self-auto border border-slate-250/50">
                    <button
                      onClick={() => setSchedulerMode("hr-view")}
                      className={`px-4 py-2 font-bold text-[10px] uppercase rounded-lg transition-all ${
                        schedulerMode === "hr-view"
                          ? "bg-white text-emerald-800 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Papan Roster (HR Desk)
                    </button>
                    <button
                      onClick={() => setSchedulerMode("employee-view")}
                      className={`px-4 py-2 font-bold text-[10px] uppercase rounded-lg transition-all ${
                        schedulerMode === "employee-view"
                          ? "bg-white text-emerald-800 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Summary Shift Staff
                    </button>
                  </div>
                </div>

                {/* MODE A: HR PLAN desk WITH DRAG & DROP & SIDEBAR LIST */}
                {schedulerMode === "hr-view" && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    
                    {/* LEFT PANEL: DRAGGABLE EMPLOYEES SIDEBAR */}
                    <div className="space-y-4 bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-600" />
                          Kandidat Karyawan Aktif
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Seret kartu staf, lalu lepas (drop) pada salah satu slot shift di kalender.
                        </p>
                      </div>

                      {/* QUICK AUTO-ROSTER ACTIONS */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleAutoFillRoster}
                          className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 transition"
                          title="Isi Roster Otomatis Juli 2026"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          Auto Fill
                        </button>
                        <button
                          onClick={handleClearRoster}
                          className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 transition"
                          title="Hapus Semua Roster Juli"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          Clear All
                        </button>
                      </div>

                      {/* SEARCH BAR */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari karyawan..."
                          value={schedulerSearch}
                          onChange={(e) => setSchedulerSearch(e.target.value)}
                          className="w-full pl-8.5 pr-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>

                      {/* DRAGGABLE CARDS list */}
                      <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
                        {filteredEmployees.length === 0 ? (
                          <p className="text-center py-6 text-slate-400 font-semibold italic">Staf tidak ditemukan</p>
                        ) : (
                          filteredEmployees.map(emp => (
                            <div
                              key={emp.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, emp.id)}
                              className="p-3 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 active:bg-indigo-100/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-3xs space-y-1 bg-white"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-800 text-[11px] leading-tight block">{emp.name}</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${emp.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                              </div>
                              <span className="text-[10px] text-indigo-805 font-bold block">{emp.role}</span>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold border-t border-slate-50 pt-1">
                                <span>{emp.department}</span>
                                <span className="font-mono text-slate-500 font-bold uppercase">{emp.id}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* RIGHT PANEL: FULL MONTHLY CALENDAR GRID */}
                    <div className="lg:col-span-3 space-y-4">
                      
                      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 bg-slate-50/50 p-4 rounded-2xl">
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans">Kalender Roster Periode Juli 2026</h4>
                            <p className="text-[10px] text-slate-450 mt-0.5">Jadwal operasional aktif. Lepaskan kartu seret di salah satu shift slot.</p>
                          </div>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-100">
                            Upcoming Month
                          </span>
                        </div>

                        {/* WEEK DAY HEADERS */}
                        <div className="grid grid-cols-7 gap-2 border-b pb-2 mb-2 text-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                          {daysOfWeek.map((day, idx) => (
                            <div key={day} className={idx === 0 ? "text-rose-500" : idx === 6 ? "text-amber-500" : "text-slate-500"}>
                              {day.slice(0, 3)}
                            </div>
                          ))}
                        </div>

                        {/* MONTH DAYS GRID */}
                        <div className="grid grid-cols-7 gap-2">
                          {/* PRE-OFFSET CELLS (Empty cells before Wednesday, July 1st 2026) */}
                          {Array.from({ length: startOffset }).map((_, idx) => (
                            <div
                              key={`empty-${idx}`}
                              className="h-28 rounded-2xl border border-slate-100/50 bg-slate-50/30 bg-[linear-gradient(45deg,_#f8fafc_25%,_transparent_25%,_transparent_50%,_#f8fafc_50%,_#f8fafc_75%,_transparent_75%,_transparent)] bg-[size:10px_10px] opacity-40"
                            />
                          ))}

                          {/* JULY 1ST TO 31ST DAYS */}
                          {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                            const dayNum = dayIndex + 1;
                            const colIdx = (dayNum + startOffset - 1) % 7;
                            const isWeekend = colIdx === 0 || colIdx === 6;
                            const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                            
                            // Day schedules
                            const daySchedules = shiftSchedules.filter(s => s.date === dateStr);
                            const morningStaff = daySchedules.filter(s => s.shift === "Morning").map(s => s.employeeId);
                            const afternoonStaff = daySchedules.filter(s => s.shift === "Afternoon").map(s => s.employeeId);
                            const nightStaff = daySchedules.filter(s => s.shift === "Night").map(s => s.employeeId);

                            return (
                              <div
                                key={dateStr}
                                className={`h-28 rounded-2xl border p-2 flex flex-col justify-between transition-all relative ${
                                  isWeekend
                                    ? "bg-amber-50/20 border-amber-200/60 hover:border-amber-300"
                                    : "bg-white border-slate-150 hover:border-indigo-200"
                                }`}
                              >
                                {/* DATE INDICATOR */}
                                <div className="flex justify-between items-center">
                                  <span className={`text-[11px] font-black font-sans ${
                                    isWeekend 
                                      ? colIdx === 0 ? "text-rose-600" : "text-amber-600"
                                      : "text-slate-800"
                                  }`}>
                                    {dayNum}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono scale-90">July</span>
                                </div>

                                {/* SLOTS GRID CONTAINER */}
                                <div className="space-y-1 mt-1 text-[9px] font-bold">
                                  {/* MORNING SHIFT */}
                                  <div
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverCell({ date: dateStr, shift: "Morning" });
                                    }}
                                    onDragLeave={() => setDragOverCell(null)}
                                    onDrop={() => handleDropOnShift(dateStr, "Morning")}
                                    className={`p-1 rounded-md border flex items-center justify-between min-h-6 transition ${
                                      dragOverCell?.date === dateStr && dragOverCell?.shift === "Morning"
                                        ? "bg-emerald-50 border-emerald-400 border-dashed scale-102"
                                        : "bg-amber-50/40 border-amber-100/50 hover:bg-amber-50"
                                    }`}
                                  >
                                    <span className="text-[8px] text-amber-700/80 uppercase font-black tracking-wide flex items-center gap-0.5">
                                      <Sun className="h-2 w-2 text-amber-500 shrink-0" /> P
                                    </span>
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {morningStaff.map(empId => (
                                        <div
                                          key={empId}
                                          title={`${getEmployeeName(empId)} - Klik untuk hapus dari Shift Pagi`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeShiftAssignment(empId, dateStr);
                                          }}
                                          className="h-4.5 w-4.5 rounded-full bg-amber-500 hover:bg-rose-500 text-white font-black text-[7px] flex items-center justify-center border border-white cursor-pointer transition uppercase"
                                        >
                                          {getEmployeeInitials(empId)}
                                        </div>
                                      ))}
                                      {morningStaff.length === 0 && (
                                        <button
                                          onClick={() => setQuickAssignCell({ date: dateStr, shift: "Morning" })}
                                          className="h-4.5 w-4.5 rounded-full border border-dashed border-slate-250 bg-white/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center cursor-pointer transition text-[8px]"
                                          title="Tunjuk Cepat"
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* AFTERNOON SHIFT */}
                                  <div
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverCell({ date: dateStr, shift: "Afternoon" });
                                    }}
                                    onDragLeave={() => setDragOverCell(null)}
                                    onDrop={() => handleDropOnShift(dateStr, "Afternoon")}
                                    className={`p-1 rounded-md border flex items-center justify-between min-h-6 transition ${
                                      dragOverCell?.date === dateStr && dragOverCell?.shift === "Afternoon"
                                        ? "bg-emerald-50 border-emerald-400 border-dashed scale-102"
                                        : "bg-orange-50/40 border-orange-100/50 hover:bg-orange-50"
                                    }`}
                                  >
                                    <span className="text-[8px] text-orange-700/80 uppercase font-black tracking-wide flex items-center gap-0.5">
                                      <Sunset className="h-2 w-2 text-orange-400 shrink-0" /> S
                                    </span>
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {afternoonStaff.map(empId => (
                                        <div
                                          key={empId}
                                          title={`${getEmployeeName(empId)} - Klik untuk hapus dari Shift Siang`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeShiftAssignment(empId, dateStr);
                                          }}
                                          className="h-4.5 w-4.5 rounded-full bg-orange-500 hover:bg-rose-500 text-white font-black text-[7px] flex items-center justify-center border border-white cursor-pointer transition uppercase"
                                        >
                                          {getEmployeeInitials(empId)}
                                        </div>
                                      ))}
                                      {afternoonStaff.length === 0 && (
                                        <button
                                          onClick={() => setQuickAssignCell({ date: dateStr, shift: "Afternoon" })}
                                          className="h-4.5 w-4.5 rounded-full border border-dashed border-slate-250 bg-white/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center cursor-pointer transition text-[8px]"
                                          title="Tunjuk Cepat"
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* NIGHT SHIFT */}
                                  <div
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverCell({ date: dateStr, shift: "Night" });
                                    }}
                                    onDragLeave={() => setDragOverCell(null)}
                                    onDrop={() => handleDropOnShift(dateStr, "Night")}
                                    className={`p-1 rounded-md border flex items-center justify-between min-h-6 transition ${
                                      dragOverCell?.date === dateStr && dragOverCell?.shift === "Night"
                                        ? "bg-emerald-50 border-emerald-400 border-dashed scale-102"
                                        : "bg-indigo-50/40 border-indigo-100/50 hover:bg-indigo-50"
                                    }`}
                                  >
                                    <span className="text-[8px] text-indigo-700/80 uppercase font-black tracking-wide flex items-center gap-0.5">
                                      <Moon className="h-2 w-2 text-indigo-400 shrink-0" /> M
                                    </span>
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {nightStaff.map(empId => (
                                        <div
                                          key={empId}
                                          title={`${getEmployeeName(empId)} - Klik untuk hapus dari Shift Malam`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeShiftAssignment(empId, dateStr);
                                          }}
                                          className="h-4.5 w-4.5 rounded-full bg-indigo-600 hover:bg-rose-500 text-white font-black text-[7px] flex items-center justify-center border border-white cursor-pointer transition uppercase"
                                        >
                                          {getEmployeeInitials(empId)}
                                        </div>
                                      ))}
                                      {nightStaff.length === 0 && (
                                        <button
                                          onClick={() => setQuickAssignCell({ date: dateStr, shift: "Night" })}
                                          className="h-4.5 w-4.5 rounded-full border border-dashed border-slate-250 bg-white/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center cursor-pointer transition text-[8px]"
                                          title="Tunjuk Cepat"
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* MODE B: INDIVIDUAL EMPLOYEE ROSTER SUMMARY VIEW */}
                {schedulerMode === "employee-view" && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Dropdown Profile Selector */}
                      <div className="flex items-center gap-3">
                        <label className="font-extrabold uppercase text-[11px] text-slate-500 shrink-0">Pilih Profil Karyawan:</label>
                        <select
                          value={selectedProfileId}
                          onChange={(e) => setSelectedProfileId(e.target.value)}
                          className="font-black text-slate-800 bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500 flex-1 md:w-60 focus:bg-white"
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Export Button */}
                      <button
                        onClick={triggerExportSim}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md active:scale-95 text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        disabled={isExportingShift}
                      >
                        {isExportingShift ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                            Mengekspor...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export Roster Kerja
                          </>
                        )}
                      </button>
                    </div>

                    {/* STATISTICS KPI GRID FOR SELECTED STAFF */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Hari Bertugas (On Duty)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold text-slate-800">{totalWorkDays}</span>
                          <span className="text-[10px] text-slate-400 font-bold">Hari</span>
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-1">Otorisasi Shift Terpenuhi</span>
                      </div>

                      <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Jam Kerja (Duty Hours)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold text-indigo-700">{totalHours}</span>
                          <span className="text-[10px] text-slate-400 font-bold">Jam</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">Estimasi 8 jam per shift</span>
                      </div>

                      <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Shift Malam (Night Duty)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold text-indigo-900">{nightShiftsCount}</span>
                          <span className="text-[10px] text-slate-400 font-bold">Shift</span>
                        </div>
                        <span className="text-[9px] text-indigo-500 font-bold block mt-1">Tunjangan Uang Lembur Aktif</span>
                      </div>

                      <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Hari Libur (Off Duty)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold text-emerald-600">{offDaysCount}</span>
                          <span className="text-[10px] text-slate-400 font-bold">Hari</span>
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-1">Waktu Rest Mandatori</span>
                      </div>
                    </div>

                    {/* SPLIT TWO COLUMN PANELS FOR EMPLOYEE VIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                      
                      {/* CELL 1: Mini Personal Calendar (Lg 3 cols) */}
                      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs lg:col-span-3 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
                            <CalendarDays className="h-4.5 w-4.5 text-emerald-600" />
                            Visual Kalender: {selectedEmployee?.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">July 2026</span>
                        </div>

                        {/* Calendar Header */}
                        <div className="grid grid-cols-7 gap-1 border-b pb-1.5 text-center text-[10px] text-slate-450 font-bold uppercase">
                          {daysOfWeek.map((day, ix) => (
                            <div key={`c-${day}`} className={ix === 0 ? "text-rose-500" : ix === 6 ? "text-amber-500" : "text-slate-400"}>
                              {day.slice(0, 3)}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Cells */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {Array.from({ length: startOffset }).map((_, idx) => (
                            <div key={`pe-${idx}`} className="h-16 rounded-xl bg-slate-50 border border-transparent" />
                          ))}

                          {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                            const dayNum = dayIndex + 1;
                            const colIdx = (dayNum + startOffset - 1) % 7;
                            const isWeekend = colIdx === 0 || colIdx === 6;
                            const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                            
                            // Find assigned shift
                            const assign = personalSchedules.find(s => s.date === dateStr);
                            const shift = assign ? assign.shift : "Off";

                            // Color map
                            const bgStyle = 
                              shift === "Morning" ? "bg-amber-50 text-amber-900 border-amber-300" :
                              shift === "Afternoon" ? "bg-orange-50 text-orange-950 border-orange-300" :
                              shift === "Night" ? "bg-indigo-50 text-indigo-900 border-indigo-300" :
                              "bg-slate-50 text-slate-400 border-transparent";

                            return (
                              <div
                                key={`cal-p-${dateStr}`}
                                className={`h-16 rounded-xl border p-1.5 flex flex-col justify-between transition ${bgStyle}`}
                              >
                                <span className={`text-[10px] font-bold ${isWeekend && shift === "Off" ? "text-rose-500" : ""}`}>
                                  {dayNum}
                                </span>
                                
                                {shift !== "Off" ? (
                                  <span className="text-[8px] font-black uppercase text-right leading-none flex items-center justify-end gap-0.5">
                                    {shift === "Morning" && <Sun className="h-2 w-2 text-amber-500" />}
                                    {shift === "Afternoon" && <Sunset className="h-2 w-2 text-orange-500" />}
                                    {shift === "Night" && <Moon className="h-2 w-2 text-indigo-500" />}
                                    {shift.slice(0, 4)}
                                  </span>
                                ) : (
                                  <span className="text-[8px] text-slate-350 font-semibold text-right leading-none uppercase">OFF</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* CELL 2: Log Timeline / List (Lg 2 cols) */}
                      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs lg:col-span-2 space-y-4">
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
                            Log Agenda Dinas Juli 2026
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Detail giliran kerja yang diterbitkan oleh HRD</p>
                        </div>

                        {/* TIMELINE DUTY LIST */}
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {personalSchedules.filter(s => s.shift !== "Off").length === 0 ? (
                            <div className="text-center py-10 space-y-2 text-slate-400">
                              <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto" />
                              <p className="font-semibold italic">Belum ada rincian giliran kerja (shift) bulan ini.</p>
                            </div>
                          ) : (
                            personalSchedules
                              .filter(s => s.shift !== "Off")
                              .sort((a,b) => a.date.localeCompare(b.date))
                              .map(s => {
                                const formattedDate = new Date(s.date).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short"
                                });

                                return (
                                  <div key={s.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-205/60 flex items-center justify-between transition text-slate-700">
                                    <div className="space-y-0.5">
                                      <strong className="text-slate-850 font-extrabold block text-[11px] leading-tight capitalize">{formattedDate}</strong>
                                      <span className="text-[9px] text-slate-400 block font-semibold font-mono tracking-wider">TGL: {s.date}</span>
                                    </div>
                                    <div className="text-right space-y-1">
                                      <span className={`inline-flex items-center gap-1 font-black text-[9px] uppercase px-2 py-0.5 rounded-md border font-mono ${
                                        s.shift === "Morning" ? "bg-amber-50 text-amber-800 border-amber-250" :
                                        s.shift === "Afternoon" ? "bg-orange-50 text-orange-850 border-orange-250" :
                                        "bg-indigo-50 text-indigo-850 border-indigo-250"
                                      }`}>
                                        {s.shift === "Morning" && <Sun className="h-2.5 w-2.5 text-amber-500" />}
                                        {s.shift === "Afternoon" && <Sunset className="h-2.5 w-2.5 text-orange-500" />}
                                        {s.shift === "Night" && <Moon className="h-2.5 w-2.5 text-indigo-500" />}
                                        {s.shift === "Morning" ? "Shift Pagi" : s.shift === "Afternoon" ? "Shift Siang" : "Shift Malam"}
                                      </span>
                                      <span className="text-[9px] font-semibold text-slate-400 block text-[8px] uppercase tracking-wide">
                                        {s.shift === "Morning" ? "08:00 - 16:00" : s.shift === "Afternoon" ? "16:00 - 00:00" : "00:00 - 08:00"} ({8} JAM)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* MODAL WINDOWS FOR QUICK-ASSIGN FALLBACK DISPLAY */}
                {quickAssignCell && (
                  <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs font-sans animate-scale-up">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-150">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-1.5 leading-none">
                          <CalendarCheck className="h-4.5 w-4.5 text-emerald-600" />
                          Tunjuk Cepat Karyawan
                        </h4>
                        <button onClick={() => setQuickAssignCell(null)} className="text-slate-400 hover:text-slate-700 font-extrabold text-base">&times;</button>
                      </div>
                      <p className="text-slate-500 leading-normal font-semibold">
                        Pilih karyawan aktif untuk ditugasi pada tanggal <strong>{quickAssignCell.date}</strong> pada <strong>Shift {
                          quickAssignCell.shift === "Morning" ? "Pagi" : quickAssignCell.shift === "Afternoon" ? "Siang" : "Malam"
                        }</strong>:
                      </p>
                      
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 text-slate-700">
                        {activeEmployees.map(emp => {
                          const alreadyOnThisShift = shiftSchedules.some(s => s.employeeId === emp.id && s.date === quickAssignCell.date && s.shift === quickAssignCell.shift);
                          return (
                            <button
                              key={emp.id}
                              onClick={() => {
                                assignShift(emp.id, quickAssignCell.date, quickAssignCell.shift);
                                setQuickAssignCell(null);
                              }}
                              className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${
                                alreadyOnThisShift
                                  ? "bg-slate-50 text-slate-40s italic border-slate-100 cursor-not-allowed text-slate-350"
                                  : "bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 font-bold"
                              }`}
                              disabled={alreadyOnThisShift}
                            >
                              <div className="text-left">
                                <span className="block font-extrabold">{emp.name}</span>
                                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{emp.role} - {emp.department}</span>
                              </div>
                              {!alreadyOnThisShift && <Plus className="h-4 w-4 bg-emerald-50 text-emerald-700 font-black rounded-lg p-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 text-right">
                        <button
                          onClick={() => setQuickAssignCell(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-wider text-[10px]"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL SUCCESS FOR EXPORT SIMULATION */}
                {showExportSuccess && (
                  <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-7 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-scale-up">
                      <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-250 flex items-center justify-center mx-auto text-indigo-600">
                        <CheckCircle className="h-6 w-6" />
                      </div>

                      <div className="space-y-1.5 text-center">
                        <h4 className="text-xs font-black text-slate-850 uppercase tracking-widest pl-1 leading-none">Roster Berhasil Diekspor!</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                          Dokumen jadwal dinas resmi untuk <strong>{selectedEmployee?.name}</strong> per Juli 2026 telah di-generate dalam lembar PDF & terintegrasi dengan portal HRD PMS Pro.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl text-left text-[10px] font-mono leading-relaxed text-slate-600 font-semibold">
                        <p>Format: <strong className="text-slate-800">PDF Roster (July-2026).pdf</strong></p>
                        <p>ID File: <span className="text-indigo-600 font-bold">ROST-JULY-90829-{selectedEmployee?.id?.toUpperCase()}</span></p>
                        <p>Keamanan: <span className="text-emerald-600 font-black">LEGER VERIFIED S3</span></p>
                      </div>

                      <button
                        onClick={() => setShowExportSuccess(false)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px]"
                      >
                        Selesai & Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* -------------------------------------
          MODAL 1: ADD / EDIT EMPLOYEE FORM (CRUD)
          ------------------------------------- */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">
                  {editingEmployee ? "Ubah Profil Karyawan" : "Papan Karyawan Baru"}
                </h4>
                <p className="text-[10px] text-emerald-100">Lengkapi formulir registrasi sdm</p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-white hover:text-emerald-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="e.g. Siti Nurhaliza"
                  className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Utama</label>
                  <input
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="siti@pmspro.com"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Telepon/WA</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jabatan / Role</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    placeholder="e.g. Chief Security, Cleaning"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Departemen</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Front Office">Front Office</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing / Sales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gaji Bulanan Pokok (IDR)</label>
                  <input
                    type="number"
                    required
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                    placeholder="4500000"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Mulai Kontrak</label>
                  <input
                    type="date"
                    required
                    value={employeeForm.joinedDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, joinedDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Staf Keaktifan</label>
                <select
                  value={employeeForm.status}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:outline-none"
                >
                  <option value="Active">Aktif bekerja di properti</option>
                  <option value="Inactive">Nonaktif / resign</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  {editingEmployee ? "Update Data" : "Daftarkan Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------
          MODAL 2: ATTENDANCE CHECK-IN FORM
          ------------------------------------- */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Absensi Manual Staf</h4>
                <p className="text-[10px] text-emerald-100">Pencatatan rekam absen real-time</p>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAttendanceSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Karyawan</label>
                <select
                  required
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Hubungkan Karyawan --</option>
                  {employees.filter(em => em.status === "Active").map(em => (
                    <option key={em.id} value={em.id}>{em.name} ({em.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Log Absen</label>
                <input
                  type="date"
                  required
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jam Masuk</label>
                  <input
                    type="text"
                    required
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    placeholder="08:00"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jam Pulang</label>
                  <input
                    type="text"
                    required
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    placeholder="17:00"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Kehadiran</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                >
                  <option value="Present">Tepat Waktu (Present)</option>
                  <option value="Late">Terlambat (Late)</option>
                  <option value="Absent">Mangkir (Absent)</option>
                  <option value="Leave">Izin/Cuti Resmi (Leave)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Simpan Absen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------
          MODAL 3: PAYROLL SLIP CREATION FORM
          ------------------------------------- */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Penerbitan Slip Gaji Pegawai</h4>
                <p className="text-[10px] text-emerald-100">Terbitkan kalkulasi gaji serta bonus bulanan</p>
              </div>
              <button onClick={() => setIsPayrollModalOpen(false)} className="text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePayrollSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Pegawai Penerima</label>
                <select
                  required
                  value={payrollForm.employeeId}
                  onChange={(e) => {
                    const empVal = e.target.value;
                    const empObj = employees.find(ep => ep.id === empVal);
                    setPayrollForm({
                      ...payrollForm,
                      employeeId: empVal,
                      basicSalary: empObj ? empObj.salary : 4000000
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                >
                  <option value="">-- Pilih Staf --</option>
                  {employees.map(em => (
                    <option key={em.id} value={em.id}>{em.name} (Gaji: Rp {em.salary.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bulan / Periode Gaji</label>
                <input
                  type="text"
                  required
                  value={payrollForm.month}
                  onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                  placeholder="e.g. Juni 2026"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Gaji Pokok Utama (IDR)</label>
                <input
                  type="number"
                  required
                  value={payrollForm.basicSalary}
                  onChange={(e) => setPayrollForm({ ...payrollForm, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tambahan / Bonus Tunjangan</label>
                  <input
                    type="number"
                    value={payrollForm.allowance}
                    onChange={(e) => setPayrollForm({ ...payrollForm, allowance: Number(e.target.value) })}
                    placeholder="Bonus"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Potongan Gaji / BPJS</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                    placeholder="Potongan"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-[11px] text-gray-500 uppercase">Estimasi Gaji Bersih (Net Slip):</span>
                <span className="font-extrabold text-[#0d9488] font-mono">
                  Rp {(payrollForm.basicSalary + payrollForm.allowance - payrollForm.deductions).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Terbitkan Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------
          MODAL 4: LEAVE REQUEST FORM
          ------------------------------------- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Formulir Pengajuan Cuti Staf</h4>
                <p className="text-[10px] text-emerald-100">Buat permohonan istirahat/izin resmi pegawai</p>
              </div>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Pemohon Cuti</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                >
                  <option value="">-- Cari Nama Karyawan --</option>
                  {employees.filter(em => em.status === "Active").map(em => (
                    <option key={em.id} value={em.id}>{em.name} ({em.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jenis Cuti / Izin</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                >
                  <option value="Annual">Cuti Tahunan Pribadi (Annual Leave)</option>
                  <option value="Sick">Izin Sakit Dengan Surat Dokter (Sick Leave)</option>
                  <option value="Maternity">Cuti Melahirkan (Maternity)</option>
                  <option value="Unpaid">Cuti Tanpa Bayaran (Unpaid Leave)</option>
                  <option value="Other">Lain-lain / Keperluan Urgent</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Alasan Mengajukan Cuti</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Deskripsikan alasan cuti atau izin dinas secara jelas kepada dewan direksi..."
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------
          MODAL 5: MOCK EMAIL PREVIEW CLIENT
          ------------------------------------- */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header / AppBar of the email client */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 text-left">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-800 rounded text-slate-100">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs tracking-wide uppercase">PMS Email Transporter Simulator</h4>
                  <p className="text-[9px] text-slate-400 font-mono font-medium">Mail Delivery Receipt ID: {selectedEmail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Simulated Email Frame */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50 text-xs">
              {/* Envelope Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-3xs space-y-2 text-left">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Envelope Info</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Delivered (MOCK)
                  </span>
                </div>
                <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1.5 text-slate-700 leading-normal font-semibold">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Pengirim:</span>
                  <span>PMS Pro AutoMailer &lt;noreply@pmsproperties.co.id&gt;</span>
                  
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Penerima:</span>
                  <span>{selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;</span>
                  
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Waktu:</span>
                  <span className="font-mono">{selectedEmail.sentAt}</span>
                  
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Subjek:</span>
                  <span className="text-slate-900 font-bold">{selectedEmail.subject}</span>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-3xs overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">
                  HTML PREVIEW CONTAINER
                </div>
                <div className="p-6 text-slate-700 text-xs leading-relaxed text-left whitespace-pre-wrap font-sans bg-white">
                  {/* Visual Header Inside Email */}
                  <div className="border-b-2 border-emerald-700 pb-4 mb-4 select-none">
                    <h2 className="text-emerald-800 font-black text-sm uppercase tracking-wider">PMS PRO PROPERTIES</h2>
                    <p className="text-[8px] text-slate-400 leading-none tracking-widest font-mono uppercase mt-1">Automated payroll notifications-carrier-v2</p>
                  </div>

                  <p className="font-semibold text-slate-800">{selectedEmail.body}</p>

                  <div className="mt-8 border-t border-slate-100 pt-4 text-[9px] text-slate-400 space-y-1 select-none font-medium text-left leading-relaxed">
                    <p className="font-bold uppercase text-[8px] text-slate-500">Pemberitahuan Keamanan:</p>
                    <p>Ini adalah email otomatis yang dikirim langsung melalui trigger SMTP dari Server PMS Pro. Jangan membalas email ini secara langsung karena alamat pengirim tidak dipantau.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer containing action button */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Kembali ke Portal HRIS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------
          MODAL 6: REPORT DOWNLOAD OPTIONS
          ------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 text-left relative">
              <h3 className="text-lg font-bold">Generate Laporan Rekapitulasi SDM & Payroll</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Pilih periode bulanan dan bagian laporan yang ingin di-generate ke dalam file PDF profesional.
              </p>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-emerald-200 text-xl font-bold transition focus:outline-none"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateMonthlyReportPDF(reportSelectedMonth);
                setIsReportModalOpen(false);
              }}
              className="p-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Pilih Periode Laporan Bulanan
                </label>
                <select
                  value={reportSelectedMonth}
                  onChange={(e) => setReportSelectedMonth(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-gray-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {uniqueMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Bagian Laporan yang Disertakan
                </label>
                
                <label className="flex items-center gap-3 bg-slate-50 border border-gray-150 p-3 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={reportIncludeAttendance}
                    onChange={(e) => setReportIncludeAttendance(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Rekapitulasi Absensi Bulanan</span>
                    <span className="text-[10px] text-slate-500 block">Daftar rasio kehadiran, jumlah terlambat, mangkir, dan cuti karyawan.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-slate-50 border border-gray-150 p-3 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={reportIncludePayroll}
                    onChange={(e) => setReportIncludePayroll(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Rincian Slip Payroll & Gaji Bersih</span>
                    <span className="text-[10px] text-slate-500 block">Daftar gaji pokok, tunjangan, potongan absensi, dan total gaji bersih karyawan.</span>
                  </div>
                </label>
              </div>

              {!reportIncludeAttendance && !reportIncludePayroll && (
                <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg">
                  * Peringatan: Anda harus memilih setidaknya satu bagian laporan untuk disertakan.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!reportIncludeAttendance && !reportIncludePayroll}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center gap-1.5 text-xs"
                >
                  <Download className="h-4 w-4" /> Unduh Laporan PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
