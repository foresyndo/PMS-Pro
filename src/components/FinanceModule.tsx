import React, { useState } from "react";
import { jsPDF } from "jspdf";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Calendar,
  Layers,
  CheckCircle,
  FileText,
  CreditCard,
  AlertCircle,
  Mail,
  Send,
  Loader2,
  MessageCircle,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Bell,
  Zap,
  CheckCircle2,
  ListChecks,
  History,
  Sparkles,
  CalendarClock,
  Copy,
  Info,
  SendHorizontal,
  ShieldCheck,
  X,
  Building,
  BedDouble
} from "lucide-react";
import { Invoice, PaymentLog, Expense, Tenant, Property, Unit, PaymentMethod, PaymentStatus, WhatsAppStatus, WhatsAppSchedulerConfig, WhatsAppSchedulerLog, ExpenseCategory, MaintenanceTicket, Payroll, Employee, Reservation } from "../types";
import { INITIAL_SCHEDULER_LOGS, INITIAL_RESERVATIONS } from "../data";

interface FinanceModuleProps {
  invoices: Invoice[];
  payments: PaymentLog[];
  expenses: Expense[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  reservations?: Reservation[];
  bookings?: Reservation[];
  maintenance?: MaintenanceTicket[];
  payroll?: Payroll[];
  employees?: Employee[];
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice?: (inv: Invoice) => void;
  onAddPayment: (pay: PaymentLog) => void;
  onAddExpense: (exp: Expense) => void;
  onUpdateInvoiceStatus: (id: string, status: PaymentStatus) => void;
  onUpdatePayroll?: (pay: Payroll) => void;
  prefilledUnitId?: string | null;
  onClearPrefill?: () => void;
}

export default function FinanceModule({
  invoices,
  payments,
  expenses,
  tenants,
  properties,
  units,
  reservations,
  bookings,
  maintenance = [],
  payroll = [],
  employees = [],
  onAddInvoice,
  onUpdateInvoice,
  onAddPayment,
  onAddExpense,
  onUpdateInvoiceStatus,
  onUpdatePayroll,
  prefilledUnitId,
  onClearPrefill
}: FinanceModuleProps) {
  // Consolidated list of reservations / bookings
  const allReservations: Reservation[] = (reservations && reservations.length > 0)
    ? reservations
    : ((bookings && bookings.length > 0) ? bookings : INITIAL_RESERVATIONS);

  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "reports" | "approvals" | "payments">("invoices");
  
  // WhatsApp Status Filter & Search States
  const [waStatusFilter, setWaStatusFilter] = useState<"ALL" | WhatsAppStatus>("ALL");
  const [invoiceSearch, setInvoiceSearch] = useState<string>("");
  const [dueFilter, setDueFilter] = useState<"ALL" | "H3" | "APPROACHING" | "OVERDUE">("ALL");
  const [selectedWaModalInvoice, setSelectedWaModalInvoice] = useState<Invoice | null>(null);
  const [customWaPhone, setCustomWaPhone] = useState<string>("");
  const [customWaNote, setCustomWaNote] = useState<string>("");
  const [waToast, setWaToast] = useState<{ show: boolean; message: string; type: "success" | "info" } | null>(null);

  // WhatsApp H-3 Automated Scheduler Config & States
  const [schedulerConfig, setSchedulerConfig] = useState<WhatsAppSchedulerConfig>({
    isEnabled: true,
    daysBeforeDue: 3, // H-3
    scheduledTime: "09:00",
    targetStatus: ["Unpaid", "Overdue"],
    autoMarkSent: true,
    customTemplate: `Halo Kak *{tenantName}* 👋\n\nKami menginformasikan bahwa tagihan sewa properti *{propertyName}* - *Kamar {unitNumber}* akan jatuh tempo dalam *{daysLeftText}* (pada *{dueDate}*).\n\n📄 *No. Invoice:* {invoiceNumber}\n💰 *Total Tagihan:* *{totalAmount}*\n\n*Rincian Tagihan:*\n{itemsList}\n\nMohon lakukan pembayaran sebelum tanggal jatuh tempo. Jika sudah melakukan pembayaran, konfirmasi bukti transfer dapat dikirimkan ke nomor ini. Terima kasih! 🙏`
  });

  const [schedulerLogs, setSchedulerLogs] = useState<WhatsAppSchedulerLog[]>(INITIAL_SCHEDULER_LOGS);
  const [showSchedulerConfigModal, setShowSchedulerConfigModal] = useState<boolean>(false);
  const [showSchedulerLogsModal, setShowSchedulerLogsModal] = useState<boolean>(false);
  const [showBatchExecuteModal, setShowBatchExecuteModal] = useState<boolean>(false);
  const [isExecutingScheduler, setIsExecutingScheduler] = useState<boolean>(false);
  const [schedulerProgress, setSchedulerProgress] = useState<{ step: number; total: number; currentName: string } | null>(null);
  const [schedulerBatchResults, setSchedulerBatchResults] = useState<{ processed: WhatsAppSchedulerLog[]; timestamp: string } | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  
  // Dispatched email states for automated invoice trigger
  const [dispatchedEmails, setDispatchedEmails] = useState<any[]>([
    {
      id: "mail-1",
      invoiceNumber: "INV/PRO3/2026/07-285",
      tenantName: "Rian Aditya",
      tenantEmail: "rian.aditya@gmail.com",
      subject: "[PMS PRO] Tagihan Pembayaran Baru - INV/PRO3/2026/07-285",
      bodySummary: "Halo Rian Aditya, tagihan pembayaran baru Anda untuk unit Margahayu - Kamar 102 telah diterbitkan...",
      sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      pdfAttachedName: "INV_PRO3_2026_07_285.pdf",
      status: "Delivered"
    }
  ]);

  const [sendingEmailProgress, setSendingEmailProgress] = useState<{
    show: boolean;
    stage: "pdf" | "smtp" | "sending" | "success";
    email: string;
    invoiceNumber: string;
    tenantName: string;
  } | null>(null);

  // Modals state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [payrollToConfirm, setPayrollToConfirm] = useState<Payroll | null>(null);
  const [showPayrollSuccessModal, setShowPayrollSuccessModal] = useState<boolean>(false);
  const [lastTransferredPayroll, setLastTransferredPayroll] = useState<{ empName: string; amount: number; month: string } | null>(null);

  // Booking Invoice PDF Generator States
  const [showBookingInvoiceModal, setShowBookingInvoiceModal] = useState<boolean>(false);
  const [selectedBookingTenantId, setSelectedBookingTenantId] = useState<string>(tenants[0]?.id || "");
  const [selectedBookingReservationId, setSelectedBookingReservationId] = useState<string>("");
  const [bookingInvoiceIncludeDeposit, setBookingInvoiceIncludeDeposit] = useState<boolean>(true);
  const [bookingInvoiceTaxPercent, setBookingInvoiceTaxPercent] = useState<number>(1);
  const [bookingInvoiceCustomNotes, setBookingInvoiceCustomNotes] = useState<string>("");
  const [isGeneratingBookingPdf, setIsGeneratingBookingPdf] = useState<boolean>(false);

  // Payments Ledger Tab States
  const [paymentSearch, setPaymentSearch] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");

  // Auto-sync reservation selection when tenant changes
  React.useEffect(() => {
    if (selectedBookingTenantId) {
      const tenantRes = allReservations.find(r => r.tenantId === selectedBookingTenantId);
      if (tenantRes) {
        setSelectedBookingReservationId(tenantRes.id);
      } else {
        setSelectedBookingReservationId(allReservations[0]?.id || "");
      }
    }
  }, [selectedBookingTenantId, allReservations]);

  // New Invoice Input States
  const [tenantId, setTenantId] = useState(tenants[0]?.id || "");
  const [propId, setPropId] = useState(properties[0]?.id || "");
  const [unitId, setUnitId] = useState("");

  React.useEffect(() => {
    if (prefilledUnitId) {
      // Find an unpaid or overdue invoice for this unit ID
      const foundUnpaidInv = invoices.find(inv => inv.unitId === prefilledUnitId && (inv.status === "Unpaid" || inv.status === "Overdue"));
      if (foundUnpaidInv) {
        // Open the payment modal
        loadPayModal(foundUnpaidInv);
      } else {
        // Or open invoice creation for this unit
        const unitObj = units.find(u => u.id === prefilledUnitId);
        if (unitObj) {
          setPropId(unitObj.propertyId);
          setUnitId(unitObj.id);
          setShowInvoiceForm(true);
        }
      }
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefilledUnitId, invoices, units, onClearPrefill]);
  const [rentAmount, setRentAmount] = useState(2500000);
  const [extraAmount, setExtraAmount] = useState(0);
  const [extraDesc, setExtraDesc] = useState("Surcharge Utilitas");
  const [dueDate, setDueDate] = useState("2026-07-05");

  // New Expense Input States
  const [expensePropId, setExpensePropId] = useState(properties[0]?.id || "");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("Electricity");
  const [expenseAmount, setExpenseAmount] = useState(150000);
  const [expenseDesc, setExpenseDesc] = useState("Pembelian token listrik PLN");
  const [expenseDate, setExpenseDate] = useState("2026-06-21");

  // Payment Log Input States
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transfer");
  const [paymentTx, setPaymentTx] = useState("");

  // Financial summaries
  const totalRevenue = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalReceivables = invoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const netIncome = totalRevenue - totalExpense;

  // Format money
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Format timestamp for WhatsApp delivery history
  const formatWhatsAppTimestamp = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  // WhatsApp send handler
  const handleSendWhatsApp = (inv: Invoice, overridePhone?: string, overrideNote?: string) => {
    const tenant = tenants.find(t => t.id === inv.tenantId);
    const property = properties.find(p => p.id === inv.propertyId);
    const unit = units.find(u => u.id === inv.unitId);
    
    let rawPhone = overridePhone || inv.whatsappPhone || tenant?.phone || "";
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) {
      cleanPhone = "62" + cleanPhone;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      alert(`Nomor WhatsApp untuk tenant "${tenant?.name || 'ini'}" belum valid. Silakan masukkan nomor WhatsApp yang benar.`);
      return;
    }

    const itemsText = inv.items.map(it => `• ${it.description}: ${formatIDR(it.amount)}`).join("\n");
    const text = `Halo Kak *${tenant?.name || 'Penyewa'}* 👋\n\nBerikut kami sampaikan rincian tagihan sewa properti *${property?.name || 'Properti'}* - *Kamar ${unit?.unitNumber || '-'}*:\n\n📄 *No. Invoice:* ${inv.invoiceNumber}\n📅 *Jatuh Tempo:* ${inv.dueDate}\n💰 *Total Tagihan:* *${formatIDR(inv.totalAmount)}*\n\n*Rincian Tagihan:*\n${itemsText}\n\n${overrideNote ? `${overrideNote}\n\n` : ''}Mohon lakukan pembayaran sebelum tanggal jatuh tempo. Konfirmasi bukti pembayaran dapat dikirimkan ke nomor ini. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");

    const nowIso = new Date().toISOString();
    const updatedInv: Invoice = {
      ...inv,
      whatsappStatus: "Terkirim",
      whatsappSentAt: nowIso,
      whatsappPhone: cleanPhone
    };

    if (onUpdateInvoice) {
      onUpdateInvoice(updatedInv);
    }

    setWaToast({
      show: true,
      message: `Pesan WhatsApp dibuka & status tagihan ${inv.invoiceNumber} diubah ke 'Terkirim'`,
      type: "success"
    });
    setTimeout(() => setWaToast(null), 3500);

    if (selectedWaModalInvoice?.id === inv.id) {
      setSelectedWaModalInvoice(null);
    }
  };

  // Manual WhatsApp Status updater
  const handleUpdateWhatsAppStatus = (inv: Invoice, newStatus: WhatsAppStatus) => {
    const updatedInv: Invoice = {
      ...inv,
      whatsappStatus: newStatus,
      whatsappSentAt: newStatus === "Belum Terkirim" ? undefined : (inv.whatsappSentAt || new Date().toISOString())
    };

    if (onUpdateInvoice) {
      onUpdateInvoice(updatedInv);
    }

    setWaToast({
      show: true,
      message: `Status WhatsApp ${inv.invoiceNumber} diperbarui menjadi '${newStatus}'`,
      type: "info"
    });
    setTimeout(() => setWaToast(null), 3000);
  };

  // Calculate relative days until due date (relative to anchor date 2026-09-02 or local date)
  const getDaysUntilDue = (dueDateStr: string): number => {
    if (!dueDateStr) return 999;
    try {
      const refDate = new Date("2026-09-02T00:00:00Z");
      const due = new Date(dueDateStr + "T00:00:00Z");
      const diffTime = due.getTime() - refDate.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  // Get due badge information
  const getDueBadge = (dueDateStr: string, status: PaymentStatus) => {
    if (status === "Paid") return null;
    const days = getDaysUntilDue(dueDateStr);
    if (days < 0) {
      return {
        label: `Terlambat ${Math.abs(days)} Hari`,
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        isH3: false,
        isOverdue: true
      };
    }
    if (days === 0) {
      return {
        label: "Hari H Jatuh Tempo",
        bg: "bg-red-100 text-red-800 border-red-300 font-extrabold",
        isH3: false,
        isOverdue: false
      };
    }
    if (days === 3) {
      return {
        label: "🚨 H-3 Pengingat",
        bg: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-xs",
        isH3: true,
        isOverdue: false
      };
    }
    if (days === 1) {
      return {
        label: "⚠️ H-1 Besok",
        bg: "bg-orange-100 text-orange-900 border-orange-300 font-bold",
        isH3: false,
        isOverdue: false
      };
    }
    if (days === 2) {
      return {
        label: "⏳ H-2 Lusa",
        bg: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
        isH3: false,
        isOverdue: false
      };
    }
    if (days <= 7) {
      return {
        label: `H-${days}`,
        bg: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
        isH3: false,
        isOverdue: false
      };
    }
    return {
      label: `H-${days}`,
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      isH3: false,
      isOverdue: false
    };
  };

  // Format WhatsApp reminder template text
  const buildWhatsAppReminderText = (inv: Invoice, customNote?: string) => {
    const tenant = tenants.find(t => t.id === inv.tenantId);
    const property = properties.find(p => p.id === inv.propertyId);
    const unit = units.find(u => u.id === inv.unitId);
    const days = getDaysUntilDue(inv.dueDate);
    const daysText = days === 0 ? "Hari Ini" : days > 0 ? `${days} hari lagi (H-${days})` : `sudah lewat ${Math.abs(days)} hari`;
    
    const itemsText = inv.items.map(it => `• ${it.description}: ${formatIDR(it.amount)}`).join("\n");
    
    let msg = (schedulerConfig.customTemplate || "")
      .replace(/{tenantName}/g, tenant?.name || "Penyewa")
      .replace(/{propertyName}/g, property?.name || "Properti")
      .replace(/{unitNumber}/g, unit?.unitNumber || "-")
      .replace(/{invoiceNumber}/g, inv.invoiceNumber)
      .replace(/{totalAmount}/g, formatIDR(inv.totalAmount))
      .replace(/{dueDate}/g, inv.dueDate)
      .replace(/{daysLeftText}/g, daysText)
      .replace(/{itemsList}/g, itemsText);

    if (customNote) {
      msg += `\n\n📌 *Catatan Khusus:*\n${customNote}`;
    }
    return msg;
  };

  // Automated Batch Execution Method
  const handleExecuteSchedulerBatch = async (targetInvoices?: Invoice[]) => {
    const targets = targetInvoices || invoices.filter(inv => {
      if (inv.status !== "Unpaid" && inv.status !== "Overdue") return false;
      const days = getDaysUntilDue(inv.dueDate);
      return days <= schedulerConfig.daysBeforeDue && days >= 0;
    });

    if (targets.length === 0) {
      setWaToast({
        show: true,
        message: `Tidak ada tagihan belum lunas dalam rentang H-${schedulerConfig.daysBeforeDue} saat ini.`,
        type: "info"
      });
      setTimeout(() => setWaToast(null), 3000);
      return;
    }

    setIsExecutingScheduler(true);
    setShowBatchExecuteModal(true);
    setSchedulerProgress({ step: 0, total: targets.length, currentName: "Memulai scheduler..." });

    const newLogs: WhatsAppSchedulerLog[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < targets.length; i++) {
      const inv = targets[i];
      const tenant = tenants.find(t => t.id === inv.tenantId);
      const unit = units.find(u => u.id === inv.unitId);
      const days = getDaysUntilDue(inv.dueDate);
      const trigType: WhatsAppSchedulerLog["triggerType"] = days === 3 ? "H-3 Reminder" : days === 1 ? "H-1 Reminder" : days === 7 ? "H-7 Reminder" : "Manual Batch";
      
      let rawPhone = inv.whatsappPhone || tenant?.phone || "";
      let cleanPhone = rawPhone.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
      else if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) cleanPhone = "62" + cleanPhone;

      const msg = buildWhatsAppReminderText(inv);

      const logEntry: WhatsAppSchedulerLog = {
        id: `sch-log-${Date.now()}-${i}`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tenantName: tenant?.name || "Penyewa",
        tenantPhone: cleanPhone || tenant?.phone || "-",
        unitName: `Kamar ${unit?.unitNumber || "-"}`,
        amount: inv.totalAmount,
        dueDate: inv.dueDate,
        triggerType: trigType,
        executedAt: nowIso,
        status: cleanPhone.length >= 8 ? "Success" : "Failed",
        messagePreview: msg
      };

      newLogs.unshift(logEntry);

      if (schedulerConfig.autoMarkSent) {
        const updatedInv: Invoice = {
          ...inv,
          whatsappStatus: cleanPhone.length >= 8 ? "Terkirim" : "Gagal",
          whatsappSentAt: nowIso,
          whatsappPhone: cleanPhone || inv.whatsappPhone
        };
        if (onUpdateInvoice) {
          onUpdateInvoice(updatedInv);
        }
      }

      setSchedulerProgress({ step: i + 1, total: targets.length, currentName: `${tenant?.name || 'Tenant'} (${inv.invoiceNumber})` });
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    setSchedulerLogs(prev => [...newLogs, ...prev]);
    setIsExecutingScheduler(false);
    setSchedulerBatchResults({ processed: newLogs, timestamp: nowIso });

    setWaToast({
      show: true,
      message: `Berhasil mengeksekusi scheduler pengingat WhatsApp H-${schedulerConfig.daysBeforeDue} untuk ${targets.length} tagihan!`,
      type: "success"
    });
    setTimeout(() => setWaToast(null), 4000);
  };

  const currentPropertyUnits = units.filter(u => u.propertyId === propId);

  // Trigger Excel/CSV Download
  const downloadInvoicesCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nomor Invoice,Penyewa,Unit,Total Tagihan,Tanggal Jatuh Tempo,Status Pembayaran,Status WhatsApp,Waktu Kirim WA\n";
    
    invoices.forEach((inv) => {
      const tenantName = tenants.find(t => t.id === inv.tenantId)?.name || "N/A";
      const unitNumber = units.find(u => u.id === inv.unitId)?.unitNumber || "N/A";
      const waStatus = inv.whatsappStatus || "Belum Terkirim";
      const waSent = inv.whatsappSentAt ? formatWhatsAppTimestamp(inv.whatsappSentAt) : "-";
      csvContent += `"${inv.invoiceNumber}","${tenantName}","Room ${unitNumber}",${inv.totalAmount},"${inv.dueDate}","${inv.status}","${waStatus}","${waSent}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Invoice_PMS_Pro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Generates and downloads a formatted PDF invoice for a selected tenant based on their booking details.
   */
  const generateAndDownloadBookingInvoicePDF = (
    optionsOrTenantId: {
      tenantId: string;
      reservationId?: string;
      invoiceNumber?: string;
      dueDate?: string;
      customNotes?: string;
      taxPercentage?: number;
      includeDeposit?: boolean;
      customItems?: { description: string; amount: number }[];
      paymentStatus?: PaymentStatus;
    } | string,
    optionalReservationId?: string
  ) => {
    // 1. Resolve arguments
    let targetTenantId: string;
    let targetReservationId: string | undefined;
    let customInvoiceNumber: string | undefined;
    let customDueDate: string | undefined;
    let customNotes: string | undefined;
    let taxPercentage = 1;
    let includeDeposit = true;
    let customItems: { description: string; amount: number }[] | undefined;
    let explicitStatus: PaymentStatus | undefined;

    if (typeof optionsOrTenantId === "string") {
      targetTenantId = optionsOrTenantId;
      targetReservationId = optionalReservationId;
    } else {
      targetTenantId = optionsOrTenantId.tenantId;
      targetReservationId = optionsOrTenantId.reservationId;
      customInvoiceNumber = optionsOrTenantId.invoiceNumber;
      customDueDate = optionsOrTenantId.dueDate;
      customNotes = optionsOrTenantId.customNotes;
      taxPercentage = optionsOrTenantId.taxPercentage ?? 1;
      includeDeposit = optionsOrTenantId.includeDeposit ?? true;
      customItems = optionsOrTenantId.customItems;
      explicitStatus = optionsOrTenantId.paymentStatus;
    }

    // 2. Lookup Tenant
    const tenant = tenants.find(t => t.id === targetTenantId) || tenants[0];
    if (!tenant) {
      alert("Data tenant tidak ditemukan.");
      return;
    }

    // 3. Lookup Reservation / Booking
    let reservation = targetReservationId
      ? allReservations.find(r => r.id === targetReservationId)
      : allReservations.find(r => r.tenantId === tenant.id);

    if (!reservation) {
      reservation = allReservations.find(r => r.tenantId === tenant.id) || allReservations[0];
    }

    // 4. Lookup Property & Unit
    const unit = units.find(u => u.id === reservation?.unitId) || units[0];
    const property = properties.find(p => p.id === (reservation?.propertyId || unit?.propertyId)) || properties[0];

    // 5. Calculate Dates & Stay Duration
    const checkIn = reservation?.checkInDate || "2026-06-01";
    const checkOut = reservation?.checkOutDate || "2026-12-31";
    const checkInD = new Date(checkIn);
    const checkOutD = new Date(checkOut);
    const diffTime = Math.abs(checkOutD.getTime() - checkInD.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let stayDurationLabel = `${diffDays} Hari`;
    if (diffDays >= 28) {
      const approxMonths = Math.round(diffDays / 30);
      stayDurationLabel = `${approxMonths} Bulan (${diffDays} Hari)`;
    }

    // 6. Build Financial Lines
    const baseRentAmount = reservation?.totalPrice 
      ? Math.max(0, reservation.totalPrice - (includeDeposit ? (reservation.deposit || 0) : 0))
      : (unit?.price || 2500000);
    const depositAmount = includeDeposit ? (reservation?.deposit || 1000000) : 0;

    let itemsToBill: { description: string; qty: string; rate: number; total: number }[] = [];

    if (customItems && customItems.length > 0) {
      itemsToBill = customItems.map(ci => ({
        description: ci.description,
        qty: "1 Paket",
        rate: ci.amount,
        total: ci.amount
      }));
    } else {
      itemsToBill.push({
        description: `Biaya Sewa Kamar: ${unit?.type || "Unit"} (Room ${unit?.unitNumber || "N/A"})`,
        qty: stayDurationLabel,
        rate: baseRentAmount,
        total: baseRentAmount
      });

      if (depositAmount > 0) {
        itemsToBill.push({
          description: "Uang Jaminan / Security Deposit (Dapat dikembalikan saat check-out)",
          qty: "1 Kali",
          rate: depositAmount,
          total: depositAmount
        });
      }

      if (property?.type === "Kost" || property?.type === "Hotel") {
        itemsToBill.push({
          description: "Iuran Pemeliharaan, Sampah, Utilitas Air & Akses Fasilitas Bersama",
          qty: "Include",
          rate: 0,
          total: 0
        });
      }
    }

    const subtotal = itemsToBill.reduce((sum, it) => sum + it.total, 0);
    const taxAmount = Math.round((subtotal - depositAmount) * (taxPercentage / 100));
    const totalAmount = subtotal + taxAmount;

    const paymentStatus: PaymentStatus = explicitStatus || reservation?.paymentStatus || "Paid";
    const invoiceNumber = customInvoiceNumber || `INV/BK/${property?.type?.substring(0, 3).toUpperCase() || "PMS"}/${new Date().getFullYear()}/${(reservation?.id || "RES101").toUpperCase().replace(/\D/g, "") || "901"}-${Math.floor(Math.random() * 899 + 100)}`;
    const issueDate = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    const dueDateText = customDueDate || reservation?.checkInDate || new Date().toISOString().split("T")[0];

    // 7. Create jsPDF Document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Outer Decorative Border
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    // Header Background Card (Dark Slate Blue)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(10, 10, 190, 32, 3, 3, "F");

    // Emerald Top Accent Stripe
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(10, 10, 190, 2, "F");

    // Brand Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("FORSDIG PMS PRO", 16, 22);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("PROPERTY MANAGEMENT & HOSPITALITY SYSTEM", 16, 27);
    doc.text(`${property?.name || "Forsdig Residence Group"} • ${property?.address || "Indonesia"}`, 16, 31);
    doc.text("Kontak Pengelola: +62 812-9988-7711 | finance@forsdigpms.pro", 16, 35);

    // Invoice Header Right Side
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text("BOOKING INVOICE", 194, 21, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`No: ${invoiceNumber}`, 194, 27, { align: "right" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Tgl Terbit: ${issueDate}`, 194, 32, { align: "right" });
    doc.text(`Batas Tempo: ${dueDateText}`, 194, 36, { align: "right" });

    // Status Banner / Ribbon
    const bannerY = 46;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(10, bannerY, 190, 10, 2, 2, "FD");

    // Status Pill
    if (paymentStatus === "Paid") {
      doc.setFillColor(209, 250, 229); // emerald-100
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(14, bannerY + 2, 28, 6, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(4, 120, 87);
      doc.text("STATUS: LUNAS", 28, bannerY + 6.2, { align: "center" });
    } else if (paymentStatus === "Overdue") {
      doc.setFillColor(254, 226, 226); // rose-100
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(14, bannerY + 2, 34, 6, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(185, 28, 28);
      doc.text("STATUS: OVERDUE", 31, bannerY + 6.2, { align: "center" });
    } else {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(14, bannerY + 2, 36, 6, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      doc.text("STATUS: BELUM LUNAS", 32, bannerY + 6.2, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`ID Reservasi: ${reservation?.id || "RES-101"}`, 56, bannerY + 6.2);
    doc.text(`Metode Bayar: ${paymentStatus === "Paid" ? "Bank Transfer (BCA) / Terverifikasi" : "Menunggu Pembayaran Transfer"}`, 100, bannerY + 6.2);

    // Two Metadata Cards (Tenant & Booking Details)
    const cardY = 59;
    const cardH = 43;

    // Card 1: Tenant Information
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, cardY, 92, cardH, 2, 2, "FD");

    // Tenant Header
    doc.setFillColor(241, 245, 249);
    doc.rect(10, cardY, 92, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("I. INFORMASI PENYEWA / TAMU (BILLED TO)", 14, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(tenant.name, 14, cardY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`No. KTP/Paspor : ${tenant.ktpNumber || "32731102940001"}`, 14, cardY + 17);
    doc.text(`WhatsApp / Telp : ${tenant.phone || "-"}`, 14, cardY + 22);
    doc.text(`Email           : ${tenant.email || `${tenant.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`}`, 14, cardY + 27);
    doc.text(`Pekerjaan / Inst: ${tenant.jobTitle || "Profesional"}`, 14, cardY + 32);

    const contactName = tenant.emergencyContact?.name || "-";
    const contactRel = tenant.emergencyContact?.relation ? ` (${tenant.emergencyContact.relation})` : "";
    doc.text(`Kontak Darurat  : ${contactName}${contactRel}`, 14, cardY + 37);

    // Card 2: Property & Booking Details
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(108, cardY, 92, cardH, 2, 2, "FD");

    // Booking Header
    doc.setFillColor(241, 245, 249);
    doc.rect(108, cardY, 92, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("II. DETAIL PROPERTI & RESERVASI KAMAR", 112, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${property?.name || "Properti"} (${property?.type || "Kost"})`, 112, cardY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Alamat Properti : ${property?.address ? property.address.substring(0, 40) : "-"}`, 112, cardY + 17);
    doc.text(`Nomor Kamar     : Room ${unit?.unitNumber || "N/A"} - Lantai ${unit?.floor || 1}`, 112, cardY + 22);
    doc.text(`Tipe Kamar      : ${unit?.type || "Standard Room"} (${unit?.size || 24} m2)`, 112, cardY + 27);
    doc.text(`Periode Menginap: ${checkIn} s/d ${checkOut}`, 112, cardY + 32);
    doc.text(`Durasi & Status : ${stayDurationLabel} • ${reservation?.status || "Checked In"}`, 112, cardY + 37);

    // Table of Items
    const tableHeaderY = 107;
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(10, tableHeaderY, 190, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("NO", 14, tableHeaderY + 4.8);
    doc.text("DESKRIPSI RINCIAN RESERVASI & LAYANAN", 25, tableHeaderY + 4.8);
    doc.text("PERIODE / QTY", 120, tableHeaderY + 4.8);
    doc.text("TARIF (IDR)", 155, tableHeaderY + 4.8, { align: "right" });
    doc.text("TOTAL (IDR)", 194, tableHeaderY + 4.8, { align: "right" });

    let currentY = tableHeaderY + 7;
    doc.setFontSize(7.5);

    itemsToBill.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY, 190, 8, "F");
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(10, currentY + 8, 200, currentY + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(String(index + 1), 14, currentY + 5.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(item.description, 25, currentY + 5.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(item.qty, 120, currentY + 5.2);

      doc.text(formatIDR(item.rate), 155, currentY + 5.2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(formatIDR(item.total), 194, currentY + 5.2, { align: "right" });

      currentY += 8;
    });

    // Summary Box
    currentY += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(10, currentY, 200, currentY);
    currentY += 4;

    const summaryLeftX = 125;
    const summaryRightX = 194;

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal Tagihan :", summaryLeftX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatIDR(subtotal), summaryRightX, currentY, { align: "right" });

    currentY += 5;
    // Pajak
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Pajak / Biaya Administrasi (${taxPercentage}%) :`, summaryLeftX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatIDR(taxAmount), summaryRightX, currentY, { align: "right" });

    currentY += 6;
    // Total Box
    doc.setFillColor(240, 253, 250); // emerald-50
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(summaryLeftX - 5, currentY - 4, 80, 10, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text("TOTAL DITAGIHKAN :", summaryLeftX, currentY + 2.5);
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.text(formatIDR(totalAmount), summaryRightX, currentY + 2.5, { align: "right" });

    currentY += 12;

    // Payment Info & Bank Account Instructions (Left Box)
    const infoBoxY = currentY;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, infoBoxY, 110, 36, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("INSTRUKSI PEMBAYARAN RESMI (BANK TRANSFER):", 14, infoBoxY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Bank BCA No. Rek: 822-091-8899 a/n PT Forsdig Properti Indonesia", 14, infoBoxY + 10);
    doc.text("2. Bank Mandiri No. Rek: 131-00-8822-9900 a/n PT Forsdig Properti", 14, infoBoxY + 14);
    doc.text("3. QRIS / E-Wallet: Tersedia di Portal Penyewa Aplikasi PMS Pro", 14, infoBoxY + 18);
    doc.text("* Wajib mencantumkan Berita Transfer: Nomor Invoice & Nama Penyewa.", 14, infoBoxY + 23);
    doc.text("* Bukti transfer harap diunggah ke menu Pembayaran atau kirim ke WA Pengelola.", 14, infoBoxY + 27);
    if (customNotes) {
      doc.text(`* Catatan: ${customNotes.substring(0, 58)}`, 14, infoBoxY + 32);
    } else {
      doc.text("* Uang jaminan deposit bersifat refundable setelah inspeksi check-out selesai.", 14, infoBoxY + 32);
    }

    // Payment Confirmation Status (Right Box)
    doc.setFillColor(paymentStatus === "Paid" ? 240 : 255, paymentStatus === "Paid" ? 253 : 251, paymentStatus === "Paid" ? 244 : 235);
    doc.setDrawColor(paymentStatus === "Paid" ? 16 : 245, paymentStatus === "Paid" ? 185 : 158, paymentStatus === "Paid" ? 129 : 11);
    doc.roundedRect(125, infoBoxY, 75, 36, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(paymentStatus === "Paid" ? 4 : 180, paymentStatus === "Paid" ? 120 : 83, paymentStatus === "Paid" ? 87 : 9);
    doc.text("RINGKASAN STATUS REKENING:", 129, infoBoxY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Tagihan : ${formatIDR(totalAmount)}`, 129, infoBoxY + 11);
    doc.text(`Telah Dibayar : ${paymentStatus === "Paid" ? formatIDR(totalAmount) : "Rp 0"}`, 129, infoBoxY + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    if (paymentStatus === "Paid") {
      doc.setTextColor(4, 120, 87);
      doc.text("SISA TAGIHAN: RP 0 (LUNAS)", 129, infoBoxY + 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Terima kasih, pembayaran Anda telah sah terverifikasi!", 129, infoBoxY + 28);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text(`SISA HARUS DIBAYAR: ${formatIDR(totalAmount)}`, 129, infoBoxY + 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`Harap lunasi sebelum tanggal ${dueDateText}`, 129, infoBoxY + 28);
    }

    // Signatures Section
    const signY = 224;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(10, signY, 200, signY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Penyewa / Penerima Faktur:", 20, signY + 6);
    doc.text("Bagian Keuangan & Pengelola Properti:", 135, signY + 6);

    // Digital signatures names
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(tenant.name, 20, signY + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Tanda Tangan / Persetujuan Digital", 20, signY + 28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Budi Santoso, S.E.", 135, signY + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Finance & Property Manager", 135, signY + 28);
    doc.setTextColor(16, 185, 129);
    doc.text("[Verified Digital Stamp - PMS PRO]", 135, signY + 32);

    // Footer Watermark / Disclaimer
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 275, 190, 12, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Faktur/Invoice ini diterbitkan secara otomatis dan sah oleh sistem Forsdig PMS Pro Enterprise.", 14, 279);
    doc.text("Keaslian dokumen dapat diverifikasi dengan mencocokkan ID Reservasi dan Nomor Invoice di database sistem manajemen properti.", 14, 283);

    // Clean filename
    const cleanTenantName = tenant.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Invoice_Booking_${reservation?.id || "RES"}_${cleanTenantName}.pdf`;
    doc.save(filename);

    // Provide feedback toast
    setWaToast({
      show: true,
      message: `Invoice PDF Booking untuk "${tenant.name}" (${filename}) berhasil di-generate dan diunduh!`,
      type: "success"
    });
    setTimeout(() => setWaToast(null), 4500);
  };

  const exportFinancialStatementPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Page styling/borders
    doc.setFillColor(248, 250, 252); // soft slate background
    doc.rect(5, 5, 200, 287, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281, "S");

    // Corporate Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("LAPORAN KEUANGAN KONSOLIDASI", 15, 25);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("PMS Pro - Consolidated Profit & Loss Statement", 15, 30);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Periode: Juni 2026`, 15, 36);
    doc.text(`Dicetak Oleh: Budi Santoso (Finance)`, 15, 40);
    doc.text(`Tanggal Laporan: ${new Date().toLocaleDateString("id-ID")}`, 15, 44);

    // Green/cyan accent bar
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(1.5);
    doc.line(15, 48, 195, 48);

    // Section 1: Executive Summary Metrics
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("I. IKHTISAR KEUANGAN (EXECUTIVE SUMMARY)", 15, 57);

    // Highlight Box 1: Pemasukan Kotor
    doc.setFillColor(240, 253, 250); // emerald-50
    doc.rect(15, 62, 55, 22, "F");
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.rect(15, 62, 55, 22, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text("TOTAL REVENUE", 19, 67);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(4, 120, 87);
    doc.text(formatIDR(totalRevenue), 19, 76);

    // Highlight Box 2: Pengeluaran
    doc.setFillColor(254, 242, 242); // red-50
    doc.rect(75, 62, 55, 22, "F");
    doc.setDrawColor(239, 68, 68);
    doc.rect(75, 62, 55, 22, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text("TOTAL EXPENSES", 79, 67);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text(formatIDR(totalExpense), 79, 76);

    // Highlight Box 3: Pendapatan Bersih
    doc.setFillColor(243, 244, 246); // gray-50
    doc.rect(135, 62, 60, 22, "F");
    doc.setDrawColor(100, 116, 139);
    doc.rect(135, 62, 60, 22, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("NET INCOME (EBITDA)", 139, 67);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formatIDR(netIncome), 139, 76);

    // Section 2: Profit & Loss Statement Detail
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("II. DETAIL LABA / RUGI (PROFIT & LOSS BREAKDOWN)", 15, 96);

    // Table Header
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(15, 101, 180, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Uraian Akun Akuntansi / Deskripsi Pos", 18, 106);
    doc.text("Jumlah (Rupiah)", 155, 106);

    // 1. Revenue lines
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("A. LAPORAN PENDAPATAN (REVENUES)", 15, 114);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Penerimaan Sewa Pokok (Terbayar/Paid Invoices)", 20, 120);
    doc.text(formatIDR(totalRevenue), 155, 120);

    doc.text("Denda Keterlambatan / Surcharges", 20, 125);
    doc.text(formatIDR(0), 155, 125);

    doc.setFont("helvetica", "bold");
    doc.text("Subtotal Pendapatan Kotor (Gross)", 20, 131);
    doc.text(formatIDR(totalRevenue), 155, 131);
    // line under revenue subtotal
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, 133, 195, 133);

    // 2. Expense lines
    doc.setFont("helvetica", "bold");
    doc.text("B. BEBAN OPERASIONAL (OPERATING EXPENSES)", 15, 140);

    const categories: { label: string; cat: ExpenseCategory }[] = [
      { label: "Beban Gaji Karyawan (Salaries)", cat: "Salary" },
      { label: "Beban Utilitas Listrik & Energi (Electricity)", cat: "Electricity" },
      { label: "Beban Utilitas Air Bersih (Water)", cat: "Water" },
      { label: "Beban Langganan Internet & Wifi (Internet)", cat: "Internet" },
      { label: "Beban Pemeliharaan & Renovasi (Maintenance)", cat: "Maintenance" },
      { label: "Beban Administrasi Umum (Operasional)", cat: "Operasional" },
    ];

    let currentY = 146;
    categories.forEach((item) => {
      const amt = expenses.filter(e => e.category === item.cat).reduce((sum, e) => sum + e.amount, 0);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, 20, currentY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(`(${formatIDR(amt)})`, 155, currentY);
      doc.setTextColor(51, 65, 85);
      currentY += 5.5;
    });

    // Subtotal Expense line
    doc.setLineWidth(0.3);
    doc.line(15, currentY, 195, currentY);
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal Beban Operasional (OPEX)", 20, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`(${formatIDR(totalExpense)})`, 155, currentY);

    currentY += 7;
    // Highlight Result
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("C. PENDAPATAN OPERASIONAL BERSIH (EBITDA)", 18, currentY + 6.5);
    if (netIncome >= 0) {
      doc.setTextColor(4, 120, 87);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(formatIDR(netIncome), 155, currentY + 6.5);

    // Section 3: Receivables & Active Invoices Log
    currentY += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("III. INFORMASI PIUTANG KOS (RECEIVABLE INSIGHTS)", 15, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Piutang Berjalan (Unpaid / Overdue Invoices):`, 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text(formatIDR(totalReceivables), 95, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const collectionRate = totalRevenue + totalReceivables > 0 
      ? Math.round((totalRevenue / (totalRevenue + totalReceivables)) * 100)
      : 0;
    doc.text(`Tingkat Pengumpulan Piutang Sewa (Collection Rate):`, 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(`${collectionRate}%`, 95, currentY);

    // Signatures / Footers
    const currentYFooter = 242;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentYFooter, 195, currentYFooter);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Dipersiapkan Oleh:", 20, currentYFooter + 8);
    doc.text("Budi Santoso", 20, currentYFooter + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Staf Keuangan Utama", 20, currentYFooter + 26);

    doc.setFont("helvetica", "bold");
    doc.text("Disetujui Oleh:", 145, currentYFooter + 8);
    doc.text("Sahrul Viona", 145, currentYFooter + 22);
    doc.setFont("helvetica", "normal");
    doc.text("Pemilik Properti PMS Pro", 145, currentYFooter + 26);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan Keuangan PMS Pro ini disusun secara otomatis secara real-time berdasarkan data akuntansi properti yang sah.", 15, 276);

    doc.save(`LAPORAN_KEUANGAN_PMS_PRO_${new Date().getFullYear()}.pdf`);
  };

  const exportMaintenanceReportPDF = () => {
    if (!maintenance || maintenance.length === 0) {
      alert("Belum ada data tiket pemeliharaan properti untuk di-generate.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Page styling/borders
    doc.setFillColor(255, 255, 255);
    doc.rect(5, 5, 200, 287, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281, "S");

    // Corporate Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("LAPORAN AKTIVITAS PEMELIHARAAN UNIT", 15, 25);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text("PMS Pro - Property Maintenance & Workload Activity Report", 15, 30);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Periode Laporan: Real-time Berjalan`, 15, 36);
    doc.text(`Dicetak Oleh: Kepala Operasional & Maintenance`, 15, 40);
    doc.text(`Tanggal Laporan: ${new Date().toLocaleDateString("id-ID")}`, 15, 44);

    // Blue/teal accent line
    doc.setDrawColor(20, 184, 166); // teal-500
    doc.setLineWidth(1.5);
    doc.line(15, 48, 195, 48);

    // Section 1: Maintenance Status Metrics
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("I. INFORMASI SEBARAN BEBAN TIKET PEMELIHARAAN", 15, 57);

    const openCount = maintenance.filter(t => t.status === "Open").length;
    const processCount = maintenance.filter(t => t.status === "Process").length;
    const completedCount = maintenance.filter(t => t.status === "Completed").length;
    const totalCount = maintenance.length;

    // Grid Status
    doc.setFillColor(254, 242, 242); // red-50
    doc.rect(15, 62, 42, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text("TIKET OPEN", 18, 67);
    doc.setFontSize(12);
    doc.text(`${openCount}`, 18, 75);

    doc.setFillColor(254, 243, 199); // amber-50
    doc.rect(60, 62, 42, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text("TIKET PROCESS", 63, 67);
    doc.setFontSize(12);
    doc.text(`${processCount}`, 63, 75);

    doc.setFillColor(236, 253, 245); // emerald-50
    doc.rect(105, 62, 42, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(4, 120, 87);
    doc.text("TIKET COMPLETE", 108, 67);
    doc.setFontSize(12);
    doc.text(`${completedCount}`, 108, 75);

    doc.setFillColor(243, 244, 246); // gray-50
    doc.rect(150, 62, 45, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL LAPORAN", 153, 67);
    doc.setFontSize(12);
    doc.text(`${totalCount}`, 153, 75);

    // Section 2: Detailed Maintenance List Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("II. DAFTAR TIKET WORKLOAD PEMELIHARAAN REAL-TIME", 15, 89);

    doc.setFillColor(241, 245, 249);
    doc.rect(15, 94, 180, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("ID", 18, 99);
    doc.text("Subjek / Masalah Laporan", 36, 99);
    doc.text("Kamar", 110, 99);
    doc.text("Biaya Est.", 130, 99);
    doc.text("Status", 160, 99);
    doc.text("Prioritas", 178, 99);

    let currentY = 106;
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    maintenance.slice(0, 20).forEach((t) => {
      const unitNumber = units.find(u => u.id === t.unitId)?.unitNumber || "N/A";
      doc.setFont("helvetica", "bold");
      doc.text(t.id.slice(-4).toUpperCase(), 18, currentY);
      doc.setFont("helvetica", "normal");
      
      const subjectTruncated = t.description.length > 38 ? t.description.slice(0, 36) + "..." : t.description;
      doc.text(subjectTruncated, 36, currentY);
      doc.text(`Room ${unitNumber}`, 110, currentY);
      doc.text(`${t.cost ? formatIDR(t.cost) : 'Rp 0'}`, 130, currentY);
      
      doc.setFont("helvetica", "bold");
      if (t.status === "Completed") {
        doc.setTextColor(16, 185, 129); // green
      } else if (t.status === "Process") {
        doc.setTextColor(245, 158, 11); // amber
      } else {
        doc.setTextColor(239, 68, 68); // red
      }
      doc.text(t.status, 160, currentY);

      if (t.priority === "High") {
        doc.setTextColor(220, 38, 38);
      } else if (t.priority === "Medium") {
        doc.setTextColor(245, 158, 11);
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.text(t.priority, 178, currentY);
      doc.setTextColor(51, 65, 85);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(15, currentY + 1.5, 195, currentY + 1.5);

      currentY += 5.5;
    });

    // Subtotal Costs Spending Maintenance
    const totalRepairCost = maintenance.reduce((sum, t) => sum + (t.cost || 0), 0);
    const pendingRepairCost = maintenance.filter(t => t.status !== "Completed").reduce((sum, t) => sum + (t.cost || 0), 0);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("III. TINJAUAN BIAYA PEMELIHARAAN (MAINTENANCE COST OVERVIEW)", 15, currentY);

    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Total Biaya Pengeluaran Perbaikan Terbayar & Direncanakan :", 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(formatIDR(totalRepairCost), 115, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Estimasi Biaya Status Tertunda (Pending Costs) :", 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text(formatIDR(pendingRepairCost), 115, currentY);

    // Signatures / Footers
    const currentYFooter = 242;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentYFooter, 195, currentYFooter);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Dibuat Oleh:", 20, currentYFooter + 8);
    doc.text("Agus Riyadi", 20, currentYFooter + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Kepala Maintenance & Sarana", 20, currentYFooter + 26);

    doc.setFont("helvetica", "bold");
    doc.text("Mengetahui,", 145, currentYFooter + 8);
    doc.text("Sahrul Viona", 145, currentYFooter + 22);
    doc.setFont("helvetica", "normal");
    doc.text("Kepala Admin PMS Pro", 145, currentYFooter + 26);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan Pemeliharaan Properti PMS Pro disusun sah sebagai wujud transparansi workload operasional harian kost.", 15, 276);

    doc.save(`LAPORAN_MAINTENANCE_PMS_PRO_${new Date().getFullYear()}.pdf`);
  };

  const handleInvoiceCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !unitId) return alert("Penyewa, properti induk dan Nomor unit ketersediaan wajib ditentukan!");

    const subtotal = Number(rentAmount) + Number(extraAmount);
    const tax = Math.round(subtotal * 0.01); // 1% simulated Indonesian tax
    const totalAmount = subtotal + tax;

    const items = [
      { id: "itm-a", description: `Biaya Sewa Pokok Unit`, amount: Number(rentAmount) }
    ];
    if (extraAmount > 0) {
      items.push({ id: "itm-b", description: extraDesc, amount: Number(extraAmount) });
    }

    const newInv: Invoice = {
      id: "inv-" + Date.now().toString(),
      tenantId,
      propertyId: propId,
      unitId,
      invoiceNumber: `INV/PRO3/2026/07-${Math.floor(Math.random() * 900 + 100)}`,
      items,
      subtotal,
      tax,
      totalAmount,
      dueDate,
      status: "Unpaid",
      whatsappStatus: "Belum Terkirim",
      createdAt: new Date().toISOString()
    };

    onAddInvoice(newInv);
    setShowInvoiceForm(false);

    // Automated email trigger simulation
    const tenantObj = tenants.find(t => t.id === tenantId);
    const tenantName = tenantObj?.name || "Penyewa";
    const tenantEmail = tenantObj?.email || `${tenantName.toLowerCase().replace(/\s+/g, "")}@example.com`;
    const propertyName = properties.find(p => p.id === propId)?.name || "Properti";
    const unitObj = units.find(u => u.id === unitId);
    const unitNumber = unitObj ? unitObj.unitNumber : "N/A";

    const emailSubject = `[PMS PRO] Tagihan Pembayaran Baru - ${newInv.invoiceNumber}`;
    const emailBody = `Halo ${tenantName},\n\nBerikut rincian tagihan baru Anda untuk unit ${propertyName} - Kamar ${unitNumber}:\n- No. Invoice: ${newInv.invoiceNumber}\n- Total Tagihan: ${formatIDR(newInv.totalAmount)}\n- Batas Jatuh Tempo: ${newInv.dueDate}\n\nSilakan lakukan pembayaran secepatnya. Terima kasih.`;

    // Start sending animation progress cascade
    setSendingEmailProgress({
      show: true,
      stage: "pdf",
      email: tenantEmail,
      invoiceNumber: newInv.invoiceNumber,
      tenantName: tenantName
    });

    setTimeout(() => {
      setSendingEmailProgress(prev => prev ? { ...prev, stage: "smtp" } : null);
      setTimeout(() => {
        setSendingEmailProgress(prev => prev ? { ...prev, stage: "sending" } : null);
        setTimeout(() => {
          setSendingEmailProgress(prev => prev ? { ...prev, stage: "success" } : null);
          
          // Log to dispatched emails
          const newMailLog = {
            id: "mail-" + Date.now(),
            invoiceNumber: newInv.invoiceNumber,
            tenantName,
            tenantEmail,
            subject: emailSubject,
            bodySummary: emailBody,
            sentAt: new Date().toISOString(),
            pdfAttachedName: `${newInv.invoiceNumber.replace(/\//g, "_")}.pdf`,
            status: "Delivered"
          };
          setDispatchedEmails(prev => [newMailLog, ...prev]);

          setTimeout(() => {
            setSendingEmailProgress(null);
          }, 1500);
        }, 1000);
      }, 1000);
    }, 1000);

    alert(`Invoice bulanan ${newInv.invoiceNumber} berhasil di-generate secara otomatis dan sistem telah memicu pengiriman email tagihan ke ${tenantEmail}.`);
  };

  const handleExpenseCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return alert("Jumlah pengeluaran wajib diisi!");

    const newExp: Expense = {
      id: "exp-" + Date.now().toString(),
      propertyId: expensePropId,
      category: expenseCategory,
      amount: Number(expenseAmount),
      expenseDate,
      description: expenseDesc,
      createdBy: "Budi Santoso (Finance)"
    };

    onAddExpense(newExp);
    setShowExpenseForm(false);
    alert("Pengeluaran operasional baru dicatat ke buku besar keuangan.");
  };

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    // Log the transaction payment
    const newPay: PaymentLog & { _invoice?: Invoice } = {
      id: "pay-" + Date.now().toString(),
      invoiceId: payingInvoice.id,
      amount: Number(paymentAmount),
      paymentDate: new Date().toISOString(),
      method: paymentMethod,
      transactionNumber: paymentTx || `TX-manual-${Date.now().toString().slice(-4)}`,
      _invoice: payingInvoice
    };

    onAddPayment(newPay);
    onUpdateInvoiceStatus(payingInvoice.id, "Paid");
    setPayingInvoice(null);
    alert("Bukti pelunasan invoice berhasil dicatat. Status tagihan diperbarui menjadi lunas.");
  };

  const handleApproveAndTransferPayroll = (pay: Payroll) => {
    setPayrollToConfirm(pay);
  };

  const executePayrollTransfer = (pay: Payroll) => {
    const emp = employees.find(e => e.id === pay.employeeId);
    const empName = emp ? emp.name : "Karyawan";
    
    if (onUpdatePayroll) {
      onUpdatePayroll({
        ...pay,
        status: "Paid",
        paymentDate: new Date().toISOString().split("T")[0]
      });
    }
    
    // Auto-log to Finance Expenses
    onAddExpense({
      id: `exp-salary-${Date.now()}`,
      propertyId: properties[0]?.id || "prop-1",
      category: "Salary",
      amount: pay.netSalary,
      expenseDate: new Date().toISOString().split("T")[0],
      description: `Gaji Staf: ${empName} (${pay.month}) - Ditransfer via Finance`,
      createdBy: "Finance System Automatic"
    });

    setLastTransferredPayroll({
      empName,
      amount: pay.netSalary,
      month: pay.month
    });
    setPayrollToConfirm(null);
    setShowPayrollSuccessModal(true);
  };

  const loadPayModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.totalAmount);
    setPaymentTx(`TRF/BCA/${Math.floor(Math.random() * 900000 + 100000)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with quick stats counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Pemasukan kotor</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatIDR(totalRevenue)}</p>
          </div>
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="h-5 w-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Pengeluaran Operasional</span>
            <p className="text-xl font-bold text-red-600 mt-1">{formatIDR(totalExpense)}</p>
          </div>
          <span className="p-2.5 bg-red-50 text-red-650 rounded-xl"><ArrowDownRight className="h-5 w-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Arus Kas bersih (Profit)</span>
            <p className="text-xl font-bold text-indigo-900 mt-1">{formatIDR(netIncome)}</p>
          </div>
          <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl"><Calculator className="h-5 w-5" /></span>
        </div>
      </div>

      {/* PERSETUJUAN GAJI & TRANSFER NOTIFIKASI */}
      {payroll.filter(p => p.status === "Pending").length > 0 && (
        <div id="pending-payroll-approvals" className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2.5 text-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Permintaan Transfer Gaji Tertunda</h4>
                <p className="text-[10px] text-amber-600 font-semibold">HR baru saja menerbitkan slip gaji. Bagian Keuangan wajib menyetujui & memproses dana transfer bank.</p>
              </div>
            </div>
            <span className="bg-amber-150 text-amber-900 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              {payroll.filter(p => p.status === "Pending").length} Tertunda
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payroll.filter(p => p.status === "Pending").map((pay) => {
              const emp = employees.find(e => e.id === pay.employeeId);
              return (
                <div key={pay.id} className="bg-white border border-amber-100 p-4 rounded-xl shadow-xs hover:border-amber-300 transition flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-slate-800">{emp ? emp.name : "Karyawan Tidak Dikenal"}</p>
                    <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 font-semibold">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase">{emp?.role || "Staf"}</span>
                      <span>• {pay.month}</span>
                    </div>
                    <div className="pt-1 select-none font-mono">
                      <span className="text-[10px] text-slate-400">Pokok: </span>
                      <span className="text-[10px] text-slate-600 font-bold">{formatIDR(pay.basicSalary)}</span>
                      {pay.allowance > 0 && (
                        <>
                          <span className="text-[10px] text-slate-400"> | Bonus: </span>
                          <span className="text-[10px] text-emerald-600 font-bold">+{formatIDR(pay.allowance)}</span>
                        </>
                      )}
                      {pay.deductions > 0 && (
                        <>
                          <span className="text-[10px] text-slate-400"> | Pot.: </span>
                          <span className="text-[10px] text-rose-600 font-bold">-{formatIDR(pay.deductions)}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-bold text-indigo-900 pt-0.5">
                      Gaji Bersih: <span className="underline">{formatIDR(pay.netSalary)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveAndTransferPayroll(pay)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[10px] rounded-xl flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Approve & Transfer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-100 gap-2">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`pb-3 px-4 font-extrabold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === "invoices" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500 hover:text-slate-800"
          }`}
        >
          Tagihan & Invoice
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 px-4 font-extrabold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === "expenses" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500 hover:text-slate-800"
          }`}
        >
          Operasional pengeluaran
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-4 font-extrabold text-xs tracking-wider uppercase border-b-2 transition ${
            activeTab === "reports" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500 hover:text-slate-800"
          }`}
        >
          Profit & Loss (Akuntansi)
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`pb-3 px-4 font-extrabold text-xs tracking-wider uppercase border-b-2 transition flex items-center gap-2 ${
            activeTab === "approvals" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500 hover:text-slate-800"
          }`}
        >
          <span>Approval Inbox</span>
          {payroll.filter(p => p.status === "Pending").length > 0 && (
            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
              {payroll.filter(p => p.status === "Pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-3 px-4 font-extrabold text-xs tracking-wider uppercase border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === "payments" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500 hover:text-slate-800"
          }`}
        >
          <span>Penerimaan Kas &amp; Bayar</span>
          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
            {payments.length}
          </span>
        </button>
      </div>

      {/* INVOICES SECTION */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Tagihan Penyewa</h3>
              <p className="text-xs text-gray-500">Kelola tagihan sewa, pengingat WhatsApp H-3 otomatis, dan status pembayaran</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowBookingInvoiceModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Generate dan unduh formatted PDF invoice untuk penyewa berdasarkan reservasi/booking"
              >
                <FileText className="h-4 w-4" />
                Invoice PDF Booking
              </button>
              <button
                onClick={downloadInvoicesCSV}
                className="p-2 bg-gray-150 hover:bg-gray-200 text-slate-700 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer"
                title="Unduh file xlsx"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export Excel
              </button>
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Generate Tagihan
              </button>
            </div>
          </div>

          {/* WHATSAPP AUTO-SCHEDULER DASHBOARD BANNER */}
          <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800/40 shadow-md relative overflow-hidden">
            {/* Background glowing element */}
            <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    schedulerConfig.isEnabled 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${schedulerConfig.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    {schedulerConfig.isEnabled ? `Auto-Scheduler Aktif: Pengingat H-${schedulerConfig.daysBeforeDue} (${schedulerConfig.scheduledTime} WIB)` : "Scheduler Dinonaktifkan"}
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-[11px] text-emerald-200/80 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Otomatis mengirim pengingat WhatsApp H-3 ke penyewa belum lunas
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                  WhatsApp Auto-Reminder Scheduler (Pengingat Tagihan H-3)
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistem otomatis mendeteksi tagihan berstatus <strong className="text-amber-300">Belum Lunas</strong> pada <strong className="text-emerald-300">H-{schedulerConfig.daysBeforeDue} sebelum jatuh tempo</strong> dan menyiapkan pengiriman template pesan tagihan resmi ke nomor kontak WhatsApp tenant.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
                <button
                  onClick={() => handleExecuteSchedulerBatch()}
                  disabled={isExecutingScheduler}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                  title="Jalankan pemindaian dan eksekusi pengiriman batch pengingat sekarang"
                >
                  {isExecutingScheduler ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Memproses Scheduler...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current text-slate-950" />
                      <span>Jalankan Scheduler H-{schedulerConfig.daysBeforeDue} Sekarang</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowSchedulerConfigModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Konfigurasi jadwal H-3 dan template WhatsApp"
                >
                  <Settings className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Atur Aturan &amp; Template</span>
                </button>

                <button
                  onClick={() => setShowSchedulerLogsModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Lihat riwayat log pengiriman otomatis"
                >
                  <History className="h-3.5 w-3.5 text-sky-400" />
                  <span>Log Scheduler ({schedulerLogs.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Target H-3 Hari Ini</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-amber-400">
                    {invoices.filter(i => (i.status === "Unpaid" || i.status === "Overdue") && getDaysUntilDue(i.dueDate) === 3).length}
                  </span>
                  <span className="text-[10px] text-slate-400">Tagihan Siap</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Mendekati H-{schedulerConfig.daysBeforeDue}</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-emerald-400">
                    {invoices.filter(i => (i.status === "Unpaid" || i.status === "Overdue") && getDaysUntilDue(i.dueDate) <= schedulerConfig.daysBeforeDue && getDaysUntilDue(i.dueDate) >= 0).length}
                  </span>
                  <span className="text-[10px] text-slate-400">Tagihan</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Terkirim / Dibaca WA</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-sky-400">
                    {invoices.filter(i => i.whatsappStatus === "Terkirim" || i.whatsappStatus === "Dibaca").length}
                  </span>
                  <span className="text-[10px] text-slate-400">Invoice</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Jadwal Harian Otomatis</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-extrabold text-slate-200">
                    Setiap hari pukul {schedulerConfig.scheduledTime} WIB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form window - Generate Invoice */}
          {showInvoiceForm && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-slide-up">
              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Generate Invoice Bulanan Baru
              </h4>
              <form onSubmit={handleInvoiceCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Pilih Penyewa *</label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                      required
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Pilih Properti Induk *</label>
                    <select
                      value={propId}
                      onChange={(e) => {
                        setPropId(e.target.value);
                        setUnitId("");
                      }}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                      required
                    >
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Pilih Unit Kamar *</label>
                    <select
                      value={unitId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setUnitId(uid);
                        const targetUnit = units.find(u => u.id === uid);
                        if (targetUnit) {
                          setRentAmount(targetUnit.price); // Set auto rental default price
                        }
                      }}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                      required
                    >
                      <option value="">-- Pilih Kamar --</option>
                      {currentPropertyUnits.map(u => (
                        <option key={u.id} value={u.id}>Kamar {u.unitNumber} ({formatIDR(u.price)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Biaya Sewa Pokok (IDR)</label>
                    <input
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value))}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Surcharge / Penyesuaian Biaya</label>
                    <input
                      type="number"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(Number(e.target.value))}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Keterangan Biaya Penyesuaian</label>
                    <input
                      type="text"
                      value={extraDesc}
                      onChange={(e) => setExtraDesc(e.target.value)}
                      placeholder="Air, Listrik tambahan, Denda..."
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Batas Jatuh Tempo *</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Generate Tagihan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
              <span className="text-[11px] font-bold text-gray-500 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-emerald-600" /> Filter:
              </span>
              <button
                onClick={() => { setWaStatusFilter("ALL"); setDueFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  waStatusFilter === "ALL" && dueFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua ({invoices.length})
              </button>
              <button
                onClick={() => { setWaStatusFilter("Terkirim"); setDueFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  waStatusFilter === "Terkirim" && dueFilter === "ALL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                <Check className="h-3 w-3" />
                Terkirim ({invoices.filter(i => i.whatsappStatus === "Terkirim").length})
              </button>
              <button
                onClick={() => { setWaStatusFilter("Dibaca"); setDueFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  waStatusFilter === "Dibaca" && dueFilter === "ALL"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60"
                }`}
              >
                <CheckCheck className="h-3 w-3" />
                Dibaca ({invoices.filter(i => i.whatsappStatus === "Dibaca").length})
              </button>
              <button
                onClick={() => { setWaStatusFilter("Belum Terkirim"); setDueFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  waStatusFilter === "Belum Terkirim" && dueFilter === "ALL"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Clock className="h-3 w-3" />
                Belum Terkirim ({invoices.filter(i => !i.whatsappStatus || i.whatsappStatus === "Belum Terkirim").length})
              </button>
              <button
                onClick={() => { setWaStatusFilter("Gagal"); setDueFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  waStatusFilter === "Gagal" && dueFilter === "ALL"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                Gagal ({invoices.filter(i => i.whatsappStatus === "Gagal").length})
              </button>

              {/* Due Date Shortcut Filters */}
              <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />
              <button
                onClick={() => { setDueFilter(dueFilter === "H3" ? "ALL" : "H3"); setWaStatusFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  dueFilter === "H3"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 font-extrabold"
                }`}
                title="Filter hanya invoice belum lunas tepat H-3 sebelum jatuh tempo"
              >
                <Zap className="h-3 w-3 text-amber-600 fill-current" />
                🚨 Target H-3 ({invoices.filter(i => (i.status === "Unpaid" || i.status === "Overdue") && getDaysUntilDue(i.dueDate) === 3).length})
              </button>
              <button
                onClick={() => { setDueFilter(dueFilter === "APPROACHING" ? "ALL" : "APPROACHING"); setWaStatusFilter("ALL"); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  dueFilter === "APPROACHING"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-medium"
                }`}
                title="Filter tagihan belum lunas dalam rentang H-3 ke bawah"
              >
                <CalendarClock className="h-3 w-3 text-emerald-600" />
                Mendekati Jatuh Tempo ({invoices.filter(i => (i.status === "Unpaid" || i.status === "Overdue") && getDaysUntilDue(i.dueDate) <= schedulerConfig.daysBeforeDue && getDaysUntilDue(i.dueDate) >= 0).length})
              </button>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no. invoice, tenant, kamar..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* TABLE LOG LIST */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[880px]">
                <thead>
                  <tr className="bg-slate-50 text-gray-550 border-b">
                    <th className="p-4 font-bold text-slate-700">No. Invoice</th>
                    <th className="p-4 font-bold text-slate-700">Penyewa & Kamar</th>
                    <th className="p-4 font-bold text-slate-700">Rincian Item</th>
                    <th className="p-4 font-bold text-slate-700">Total Tagihan</th>
                    <th className="p-4 font-bold text-slate-700">Batas Akhir / Jatuh Tempo</th>
                    <th className="p-4 font-bold text-slate-700">Status Tagihan</th>
                    <th className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Status WhatsApp</span>
                      </div>
                    </th>
                    <th className="p-4 font-bold text-slate-700 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800 font-medium font-sans">
                  {invoices
                    .filter((inv) => {
                      // WhatsApp status filter
                      if (waStatusFilter !== "ALL") {
                        const curWa = inv.whatsappStatus || "Belum Terkirim";
                        if (curWa !== waStatusFilter) return false;
                      }
                      // Due date filter
                      if (dueFilter === "H3") {
                        if (inv.status === "Paid") return false;
                        if (getDaysUntilDue(inv.dueDate) !== 3) return false;
                      } else if (dueFilter === "APPROACHING") {
                        if (inv.status === "Paid") return false;
                        const d = getDaysUntilDue(inv.dueDate);
                        if (d > schedulerConfig.daysBeforeDue || d < 0) return false;
                      } else if (dueFilter === "OVERDUE") {
                        if (inv.status === "Paid") return false;
                        if (getDaysUntilDue(inv.dueDate) >= 0) return false;
                      }
                      // Search keyword filter
                      if (invoiceSearch.trim()) {
                        const q = invoiceSearch.toLowerCase().trim();
                        const ten = tenants.find(t => t.id === inv.tenantId);
                        const unt = units.find(u => u.id === inv.unitId);
                        const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
                        const matchTen = ten?.name.toLowerCase().includes(q);
                        const matchUnt = unt?.unitNumber.toLowerCase().includes(q);
                        if (!matchInv && !matchTen && !matchUnt) return false;
                      }
                      return true;
                    })
                    .map((inv) => {
                    const ten = tenants.find(t => t.id === inv.tenantId);
                    const unt = units.find(u => u.id === inv.unitId);
                    const curWaStatus = inv.whatsappStatus || "Belum Terkirim";
                    const dueBadge = getDueBadge(inv.dueDate, inv.status);
                    const isH3 = inv.status !== "Paid" && getDaysUntilDue(inv.dueDate) === 3;

                    return (
                      <tr key={inv.id} className={`hover:bg-slate-50/50 transition ${isH3 ? "bg-amber-50/30" : ""}`}>
                        <td className="p-4 whitespace-nowrap font-mono font-bold text-emerald-800">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {inv.invoiceNumber}
                              {isH3 && (
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" title="Target H-3 Pengingat Hari Ini" />
                              )}
                            </div>
                            {inv.invoiceNumber.startsWith("INV/REC") && (
                              <span className="w-fit px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                                🏨 Kasir Resepsionis
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 block text-sm">{ten?.name || "N/A"}</span>
                            <div className="flex items-center gap-2 text-gray-500 font-medium text-[11px]">
                              <span>Kamar: <strong className="text-slate-700">{unt?.unitNumber || "N/A"}</strong></span>
                              {ten?.phone && (
                                <span className="font-mono text-[10px] text-gray-400">({ten.phone})</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 max-w-[180px]">
                          <div className="space-y-0.5">
                            {inv.items.map((it) => (
                              <div key={it.id} className="flex justify-between text-[11px] text-gray-500">
                                <span className="truncate max-w-[110px]">- {it.description}</span>
                                <span className="font-semibold">{formatIDR(it.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800 text-sm whitespace-nowrap">
                          {formatIDR(inv.totalAmount)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`font-bold block ${inv.status === "Paid" ? "text-slate-700" : "text-red-500"}`}>
                              {inv.dueDate}
                            </span>
                            {dueBadge && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${dueBadge.bg}`}>
                                {dueBadge.isH3 && <Zap className="h-2.5 w-2.5 fill-current text-amber-600" />}
                                {dueBadge.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm inline-block ${
                              inv.status === "Paid"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : inv.status === "Unpaid"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        {/* WhatsApp Delivery Status & Timestamp Column */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {curWaStatus === "Terkirim" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="h-3 w-3" />
                                  Terkirim
                                </span>
                              )}
                              {curWaStatus === "Dibaca" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  <CheckCheck className="h-3 w-3 text-sky-600" />
                                  Dibaca
                                </span>
                              )}
                              {curWaStatus === "Gagal" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="h-3 w-3" />
                                  Gagal
                                </span>
                              )}
                              {curWaStatus === "Belum Terkirim" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  Belum Terkirim
                                </span>
                              )}

                              <button
                                onClick={() => handleSendWhatsApp(inv)}
                                className={`p-1 px-2 rounded text-[10px] font-bold inline-flex items-center gap-1 shadow-sm transition ${
                                  isH3
                                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                                title={isH3 ? "Kirim Pengingat WhatsApp H-3 Sekarang" : "Kirim Tagihan via WhatsApp"}
                              >
                                <MessageCircle className="h-3 w-3" />
                                {isH3 ? "Kirim H-3" : curWaStatus === "Terkirim" || curWaStatus === "Dibaca" ? "Kirim Ulang" : "Kirim WA"}
                              </button>
                            </div>

                            {/* Timestamp & Quick Status Modifier */}
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                              <span className="font-mono">
                                {inv.whatsappSentAt ? (
                                  <span title={inv.whatsappSentAt}>
                                    Terakhir: <strong className="text-slate-700 font-semibold">{formatWhatsAppTimestamp(inv.whatsappSentAt)}</strong>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Belum ada riwayat kirim</span>
                                )}
                              </span>
                              
                              <select
                                value={curWaStatus}
                                onChange={(e) => handleUpdateWhatsAppStatus(inv, e.target.value as WhatsAppStatus)}
                                className="text-[9px] bg-slate-50 border border-gray-200 rounded px-1 py-0.5 text-gray-600 font-semibold focus:outline-none hover:bg-slate-100 cursor-pointer ml-2"
                                title="Ubah status WhatsApp secara manual"
                              >
                                <option value="Belum Terkirim">Set: Belum Terkirim</option>
                                <option value="Terkirim">Set: Terkirim</option>
                                <option value="Dibaca">Set: Dibaca</option>
                                <option value="Gagal">Set: Gagal</option>
                              </select>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.status !== "Paid" && (
                              <button
                                onClick={() => loadPayModal(inv)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-sm select-all cursor-pointer transition"
                              >
                                Lunasi
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPrintingInvoice(inv);
                              }}
                              className="p-1 px-1.5 border hover:bg-gray-100 text-slate-600 rounded transition cursor-pointer"
                              title="Cetak Receipt/PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                generateAndDownloadBookingInvoicePDF({
                                  tenantId: inv.tenantId,
                                  invoiceNumber: inv.invoiceNumber,
                                  dueDate: inv.dueDate,
                                  paymentStatus: inv.status,
                                  customItems: inv.items
                                });
                              }}
                              className="p-1 px-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                              title="Generate & Unduh Formatted PDF Invoice dari Detail Booking"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedWaModalInvoice(inv);
                                const t = tenants.find(tn => tn.id === inv.tenantId);
                                setCustomWaPhone(inv.whatsappPhone || t?.phone || "");
                                setCustomWaNote("");
                              }}
                              className="p-1 px-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded transition"
                              title="Review / Kustomisasi WhatsApp Invoice"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
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

          {/* Modal Kustomisasi / Preview Pengiriman WhatsApp */}
          {selectedWaModalInvoice && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-gray-200 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Kirim Tagihan via WhatsApp</h3>
                      <p className="text-[11px] text-gray-500">Invoice: {selectedWaModalInvoice.invoiceNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedWaModalInvoice(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Penerima</label>
                    <input
                      type="text"
                      value={customWaPhone}
                      onChange={(e) => setCustomWaPhone(e.target.value)}
                      placeholder="Contoh: 08123456789 atau 628123456789"
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                    <textarea
                      value={customWaNote}
                      onChange={(e) => setCustomWaNote(e.target.value)}
                      rows={2}
                      placeholder="Contoh: Promo diskon lunas sebelum tgl 3, info rekening BCA 123-456 a/n PT Properti..."
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Ringkasan Tagihan:</span>
                    <div className="flex justify-between text-gray-600">
                      <span>Total Biaya:</span>
                      <strong className="text-slate-800">{formatIDR(selectedWaModalInvoice.totalAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Jatuh Tempo:</span>
                      <strong className="text-red-600">{selectedWaModalInvoice.dueDate}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Status WhatsApp Saat Ini:</span>
                      <strong className="text-emerald-700 font-semibold">{selectedWaModalInvoice.whatsappStatus || "Belum Terkirim"}</strong>
                    </div>
                    {selectedWaModalInvoice.whatsappSentAt && (
                      <div className="flex justify-between text-gray-600">
                        <span>Pengiriman Terakhir:</span>
                        <span className="font-mono text-[10px]">{formatWhatsAppTimestamp(selectedWaModalInvoice.whatsappSentAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedWaModalInvoice(null)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedWaModalInvoice, customWaPhone, customWaNote)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Kirim Pesan WhatsApp Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: PENGATURAN WHATSAPP SCHEDULER */}
          {showSchedulerConfigModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-100 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Konfigurasi Pengingat WhatsApp Otomatis</h3>
                      <p className="text-xs text-slate-300">Atur jadwal pengingat jatuh tempo H-3 dan template pesan tagihan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSchedulerConfigModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl transition hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                  {/* Toggle Active */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <label className="font-extrabold text-sm text-slate-800 block">Status Pengingat Otomatis</label>
                      <p className="text-[11px] text-gray-500 mt-0.5">Aktifkan sistem otomatis scanning dan pengiriman WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedulerConfig.isEnabled}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Trigger Day & Execution Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4 text-emerald-600" />
                        Jadwal Peringatan (Hari Sebelum Jatuh Tempo)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400">H-</span>
                        <select
                          value={schedulerConfig.daysBeforeDue}
                          onChange={(e) => setSchedulerConfig(prev => ({ ...prev, daysBeforeDue: Number(e.target.value) }))}
                          className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none"
                        >
                          <option value={1}>1 Hari Sebelum (H-1)</option>
                          <option value={2}>2 Hari Sebelum (H-2)</option>
                          <option value={3}>3 Hari Sebelum (H-3 - Rekomendasi)</option>
                          <option value={5}>5 Hari Sebelum (H-5)</option>
                          <option value={7}>7 Hari Sebelum (H-7)</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-gray-500">Standar operasional kos biasanya menggunakan H-3 sebelum jatuh tempo.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        Waktu Eksekusi Harian
                      </label>
                      <input
                        type="time"
                        value={schedulerConfig.scheduledTime}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                      <p className="text-[10px] text-gray-500">Waktu pengingat dikirimkan ke tenant (Zona WIB).</p>
                    </div>
                  </div>

                  {/* Auto Mark as Sent */}
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-gray-200">
                      <input
                        type="checkbox"
                        checked={schedulerConfig.autoMarkSent}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, autoMarkSent: e.target.checked }))}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Otomatis Update Status WhatsApp jadi 'Terkirim'</span>
                        <span className="text-[11px] text-gray-500">Tandai status invoice dengan status Terkirim dan simpan timestamp saat batch diproses.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-gray-200">
                      <input
                        type="checkbox"
                        checked={schedulerConfig.includePaymentInstructions}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, includePaymentInstructions: e.target.checked }))}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Sertakan Instruksi Rekening Pembayaran</span>
                        <span className="text-[11px] text-gray-500">Lampirkan otomatis nomor rekening BCA &amp; Bank Mandiri manajemen kos.</span>
                      </div>
                    </label>
                  </div>

                  {/* Custom Message Template */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-800">Template Pesan Pengingat H-3</label>
                      <button
                        type="button"
                        onClick={() => setSchedulerConfig(prev => ({
                          ...prev,
                          messageTemplate: `Halo Kak {tenant_name}, mohon izin mengingatkan tagihan sewa kamar {unit_number} ({invoice_no}) sebesar {total_amount} akan jatuh tempo pada {due_date} (H-{days_left}). Mohon lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih!`
                        }))}
                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                      >
                        Reset ke Default
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={schedulerConfig.messageTemplate}
                      onChange={(e) => setSchedulerConfig(prev => ({ ...prev, messageTemplate: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1 text-[10px] text-gray-500">
                      <span className="font-semibold text-gray-600">Variabel:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{tenant_name}"}</code>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{unit_number}"}</code>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{invoice_no}"}</code>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{total_amount}"}</code>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{due_date}"}</code>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-slate-700">{"{days_left}"}</code>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Pengaturan tersimpan otomatis
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSchedulerConfigModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Selesai &amp; Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: RIWAYAT LOG SCHEDULER */}
          {showSchedulerLogsModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-100 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Riwayat Eksekusi WhatsApp Scheduler</h3>
                      <p className="text-xs text-slate-300">Catatan riwayat scanning dan pengiriman pengingat tagihan otomatis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSchedulerLogsModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl transition hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                {/* Log List */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  {schedulerLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 space-y-2">
                      <Clock className="h-8 w-8 mx-auto text-gray-300" />
                      <p className="font-bold">Belum ada riwayat eksekusi scheduler</p>
                      <p className="text-[11px]">Jalankan batch scheduler atau tunggu jadwal otomatis harian.</p>
                    </div>
                  ) : (
                    schedulerLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 hover:border-gray-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              log.status === "Success"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : log.status === "Partial"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}>
                              {log.status === "Success" ? "Sukses Sempurna" : log.status === "Partial" ? "Terkirim Sebagian" : "Gagal"}
                            </span>

                            <span className="font-mono text-xs font-bold text-slate-800">
                              {log.executedAt.replace("T", " ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                            <span>Target: <strong className="text-slate-800">{log.invoicesTargetedCount} Invoice</strong></span>
                            <span>•</span>
                            <span>Berhasil: <strong className="text-emerald-700 font-bold">{log.invoicesProcessedCount} Terkirim</strong></span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-slate-700 font-medium leading-relaxed">{log.summary}</p>
                          
                          {/* Target Details preview */}
                          {log.details && log.details.length > 0 && (
                            <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5 mt-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Daftar Tagihan yang Diproses:</span>
                              <div className="divide-y divide-gray-100">
                                {log.details.map((d, idx) => (
                                  <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-emerald-800">{d.invoiceNumber}</span>
                                      <span className="text-slate-700 font-semibold">{d.tenantName}</span>
                                      <span className="text-gray-400 font-mono text-[10px]">({d.phone})</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {d.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total {schedulerLogs.length} riwayat log tersimpan</span>
                  <button
                    onClick={() => setShowSchedulerLogsModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXECUTION PROGRESS OVERLAY */}
          {isExecutingScheduler && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-slate-950 border border-emerald-500/30 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-5 animate-scale-up">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <Zap className="h-8 w-8 text-emerald-400 fill-current animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">Memproses Pengingat WhatsApp H-{schedulerConfig.daysBeforeDue}</h3>
                  <p className="text-xs text-slate-300">Memindai tagihan belum lunas dan mengirimkan template resmi...</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: schedulerProgress.total > 0 
                          ? `${(schedulerProgress.current / schedulerProgress.total) * 100}%` 
                          : '100%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Sedang memproses...</span>
                    <span>{schedulerProgress.current} / {schedulerProgress.total}</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-300 font-medium">
                  {schedulerProgress.statusText || "Mengirimkan notifikasi WhatsApp secara berurutan..."}
                </p>
              </div>
            </div>
          )}

          {/* Floating Toast Notification */}
          {waToast && (
            <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Check className="h-4 w-4" />
              </div>
              <span className="font-medium">{waToast.message}</span>
              <button
                onClick={() => setWaToast(null)}
                className="text-slate-400 hover:text-white ml-2 text-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* RIWAYAT OTOMATIS EMAIL INVOICE LOG */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Riwayat Pengiriman Email Otomatis (SMTP)</h4>
                  <p className="text-[10px] text-gray-500 font-medium">Log aktivitas email tagihan terintegrasi yang terkirim saat invoice digenerate</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 py-1 px-2.5 rounded-full font-bold text-slate-600 font-mono">
                {dispatchedEmails.length} Email Sent
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {dispatchedEmails.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">
                  Belum ada pengiriman email otomatis yang terpicu.
                </div>
              ) : (
                dispatchedEmails.map((mail) => (
                  <div key={mail.id} className="p-3 bg-slate-50 border border-gray-150 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-xs">{mail.tenantName}</span>
                          <span className="text-gray-400 font-bold">•</span>
                          <span className="text-slate-500 font-mono text-[10px]">{mail.tenantEmail}</span>
                        </div>
                        <p className="font-bold text-emerald-800 font-mono text-[10px] flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {mail.invoiceNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(mail.sentAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="h-2.5 w-2.5" /> {mail.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 space-y-1 font-mono text-[11px] leading-relaxed text-slate-650 whitespace-pre-line">
                      <p className="font-extrabold text-slate-700 font-sans text-xs border-b pb-1 mb-1 flex items-center gap-1.5">
                        <Send className="h-3 w-3 text-emerald-600" /> Subyek: {mail.subject}
                      </p>
                      {mail.bodySummary}
                      <p className="mt-2 text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1.5 border-t border-dashed">
                        📎 Terlampir: <span className="underline italic cursor-pointer" onClick={() => {
                          const targetInv = invoices.find(inv => inv.invoiceNumber === mail.invoiceNumber);
                          if (targetInv) {
                            setPrintingInvoice(targetInv);
                          } else {
                            alert("Dokumen PDF sedang dimuat...");
                          }
                        }}>{mail.pdfAttachedName}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS & CASH INFLOW SECTION */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Real-Time Cash Inflow
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Total: {payments.length} Transaksi Terverifikasi
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Buku Kas Masuk &amp; Realisasi Pembayaran
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan kas masuk terintegrasi langsung dari Kasir Resepsionis (Tunai, QRIS, EDC) dan Transfer Pembayaran Sewa
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tersambung ke Kasir Resepsionis
              </span>
            </div>
          </div>

          {/* Metric KPIs */}
          {(() => {
            const totalCashInflow = payments.reduce((sum, p) => sum + p.amount, 0);
            const receptionistPayments = payments.filter((p) => {
              const inv = invoices.find((i) => i.id === p.invoiceId);
              return inv?.invoiceNumber.startsWith("INV/REC") || p.transactionNumber.startsWith("REC-");
            });
            const receptionistAmount = receptionistPayments.reduce((sum, p) => sum + p.amount, 0);
            const cashQrisAmount = payments
              .filter((p) => p.method === "Cash" || p.method === "QRIS")
              .reduce((sum, p) => sum + p.amount, 0);
            const bankEdcAmount = payments
              .filter((p) => p.method === "Transfer" || p.method === "EDC" || p.method === "Credit Card")
              .reduce((sum, p) => sum + p.amount, 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Total Kas Masuk
                  </span>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatIDR(totalCashInflow)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Semua transaksi lunas &amp; tervalidasi
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400">
                      Kasir Resepsionis
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {receptionistPayments.length} Transaksi
                    </span>
                  </div>
                  <div className="text-2xl font-black text-teal-700">
                    {formatIDR(receptionistAmount)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Penerimaan dari front desk hotel/kos
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Tunai &amp; QRIS (Front Desk)
                  </span>
                  <div className="text-2xl font-black text-slate-800">
                    {formatIDR(cashQrisAmount)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Kas tunai di laci &amp; QRIS instan
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Transfer Bank &amp; EDC
                  </span>
                  <div className="text-2xl font-black text-slate-800">
                    {formatIDR(bankEdcAmount)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Masuk langsung rekening bank
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Cari No. Transaksi, Faktur, Tamu..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Metode:</span>
              {["ALL", "Cash", "QRIS", "Transfer", "EDC"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    paymentMethodFilter === m
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m === "ALL" ? "Semua" : m === "Cash" ? "Tunai" : m}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="p-3.5">Waktu Transaksi</th>
                    <th className="p-3.5">No. Transaksi</th>
                    <th className="p-3.5">Faktur / Invoice</th>
                    <th className="p-3.5">Nama Tamu &amp; Kamar</th>
                    <th className="p-3.5">Asal Transaksi</th>
                    <th className="p-3.5">Metode Bayar</th>
                    <th className="p-3.5 text-right">Nominal Diterima</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(() => {
                    const filtered = payments.filter((pay) => {
                      const inv = invoices.find((i) => i.id === pay.invoiceId);
                      const ten = tenants.find((t) => t.id === inv?.tenantId);
                      const q = paymentSearch.toLowerCase();
                      const matchSearch =
                        !q ||
                        pay.transactionNumber.toLowerCase().includes(q) ||
                        (inv?.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
                        (ten?.name && ten.name.toLowerCase().includes(q));

                      const matchMethod =
                        paymentMethodFilter === "ALL" || pay.method === paymentMethodFilter;

                      return matchSearch && matchMethod;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            Tidak ada data penerimaan kas yang cocok.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((pay) => {
                      const inv = invoices.find((i) => i.id === pay.invoiceId);
                      const ten = tenants.find((t) => t.id === inv?.tenantId);
                      const unt = units.find((u) => u.id === inv?.unitId);
                      const isReception =
                        inv?.invoiceNumber.startsWith("INV/REC") ||
                        pay.transactionNumber.startsWith("REC-");

                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {pay.paymentDate
                              ? new Date(pay.paymentDate).toLocaleString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : "-"}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-700">
                            {pay.transactionNumber}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono font-extrabold text-emerald-800 block">
                              {inv?.invoiceNumber || "Tagihan Bebas"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ID: {pay.invoiceId}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-800 block">
                              {ten?.name || "Tamu/Penyewa"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Kamar {unt?.unitNumber || "-"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isReception ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
                                🏨 Kasir Resepsionis
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                                🏢 Back Office Keuangan
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                pay.method === "Cash"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : pay.method === "QRIS"
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : pay.method === "EDC"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              {pay.method === "Cash" ? "💵 Tunai (Kas)" : pay.method}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-black text-emerald-700 font-mono text-sm whitespace-nowrap">
                            {formatIDR(pay.amount)}
                          </td>
                          <td className="p-3.5 text-right">
                            {inv ? (
                              <button
                                onClick={() => setPrintingInvoice(inv)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3 text-slate-500" />
                                <span>Cetak Kuitansi</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">Lunas</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES OPERATIONS SECTION */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Pencatatan Biaya Pengeluaran</h3>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Catat Pengeluaran
            </button>
          </div>

          {/* New Expense form entry */}
          {showExpenseForm && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-slide-up">
              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-red-500" />
                Tambah Baris Pengeluaran Baru
              </h4>
              <form onSubmit={handleExpenseCreate} className="space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Lokasi Properti *</label>
                    <select
                      value={expensePropId}
                      onChange={(e) => setExpensePropId(e.target.value)}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                      required
                    >
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Kategori Tagihan *</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                      required
                    >
                      <option value="Electricity">Listrik (PLN)</option>
                      <option value="Water">Air Pam / Air Sumur</option>
                      <option value="Internet">Internet Wi-Fi Bulanan</option>
                      <option value="Maintenance">Pemeliharaan & Renovasi</option>
                      <option value="Salary">Gaji Security / Housekeeping</option>
                      <option value="Operasional">Operasional Administratif</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Jumlah Biaya Keluar (IDR) *</label>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(Number(e.target.value))}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Deskripsi Kegunaan Dana *</label>
                    <input
                      type="text"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Pembelian token PLN senilai Rp... untuk kost"
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Tanggal Transaksi Keluar *</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full text-slate-800 p-2.5 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                  >
                    Catat Pengeluaran
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SPREADSHEET DETAIL BIAYA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-gray-550 border-b">
                  <th className="p-4">Tanggal Pengeluaran</th>
                  <th className="p-4">Properti Area</th>
                  <th className="p-4">Kategori Pengorbanan</th>
                  <th className="p-4">Deskripsi Rincian</th>
                  <th className="p-4">Total Biaya</th>
                  <th className="p-4">Validator</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-800 font-mono">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="p-4 whitespace-nowrap text-gray-500 font-sans">{exp.expenseDate}</td>
                    <td className="p-4 font-sans">{properties.find(p=>p.id===exp.propertyId)?.name || "N/A"}</td>
                    <td className="p-4">
                      <span className="bg-red-50 text-red-700 py-0.5 px-2.5 border border-red-200 rounded-lg text-[10px] font-sans font-bold uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-slate-700 max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                    <td className="p-4 text-red-600 font-bold whitespace-nowrap">{formatIDR(exp.amount)}</td>
                    <td className="p-4 text-gray-400 font-sans text-[10px]">{exp.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROFIT & LOSS SHEETS */}
      {activeTab === "reports" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Indonesian Profit & Loss Statement (Laporan Laba Rugi)</h3>
              <p className="text-xs text-gray-400">Pernyataan pembukuan konsolidasi PMS Pro Periode Berjalan</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportFinancialStatementPDF}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                title="Unduh Laporan Laba Rugi PDF"
              >
                <Download className="h-3.5 w-3.5" /> Unduh Laporan Keuangan (PDF)
              </button>
              <button
                onClick={exportMaintenanceReportPDF}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                title="Unduh Laporan Pemeliharaan Properti PDF"
              >
                <Download className="h-3.5 w-3.5" /> Unduh Laporan Pemeliharaan (PDF)
              </button>
              <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 font-extrabold rounded-lg uppercase">Standard IFRS</span>
            </div>
          </div>

          <div className="space-y-4 text-slate-800 text-sm">
            {/* Top Revenue Lines */}
            <div className="space-y-2">
              <span className="text-xs text-gray-400 uppercase font-extrabold tracking-wider">A. Pendapatan Operasi (Revenues)</span>
              <div className="flex justify-between pl-4 text-xs font-semibold">
                <span>Penerimaan Sewa Pokok (Boarding/Rent Invoices)</span>
                <span className="font-mono text-emerald-600">{formatIDR(totalRevenue)}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs font-semibold">
                <span>Jaminan / Kompensasi Lainnya (Surcharges)</span>
                <span className="font-mono text-emerald-600">{formatIDR(0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Total Pendapatan Kotor (Gross Revenue)</span>
                <span className="font-mono">{formatIDR(totalRevenue)}</span>
              </div>
            </div>

            {/* Expenses Cost Categories Lines */}
            <div className="space-y-2 pt-2">
              <span className="text-xs text-gray-400 uppercase font-extrabold tracking-wider">B. Beban Eksploitasi & Operasional (Operating Expenses)</span>
              
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Gaji Karyawan (Salaries)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Salary').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Utilitas Listrik & Energi (Electricity)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Electricity').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Utilitas Air Bersih (Water)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Water').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Langganan Telekomunikasi & Internet (Internet)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Internet').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Pemeliharaan & Tiket Inventaris (Maintenance)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Maintenance').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span>Beban Administrasi Umum (Operasional)</span>
                <span className="font-mono text-red-500">{formatIDR(expenses.filter(e=>e.category==='Operasional').reduce((sum, e)=>sum+e.amount,0))}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Total Biaya Operasional (OPEX)</span>
                <span className="font-mono text-red-600">({formatIDR(totalExpense)})</span>
              </div>
            </div>

            {/* Net Profits line */}
            <div className="bg-slate-50 p-4 rounded-xl border-t leading-relaxed flex justify-between items-center text-slate-900 font-extrabold text-base">
              <span>Pendapatan Operasi Bersih (EBITDA / Net Income)</span>
              <span className={`font-mono ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-650'}`}>
                {formatIDR(netIncome)}
              </span>
            </div>
          </div>

          {/* BEP / ROI Interactive Calculator */}
          <div className="pt-6 border-t font-sans">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-indigo-600" />
              PMS Pro Return-on-Investment (ROI) / Break-Even-Point Estimator
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl text-xs">
              <div className="space-y-2">
                <span className="block font-bold text-gray-600 uppercase text-[10px]">Analisis Investasi Bulanan</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Akumulasi Nilai Aset Properti</span>
                  <span className="font-bold text-slate-700">Rp 4.500.000.000 - Est.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pendapatan Tahunan Bersih Diproyeksikan</span>
                  <span className="font-bold text-slate-700">{formatIDR(netIncome * 12)} / Th</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span className="text-emerald-700">ROI Proyektif Stabil</span>
                  <span className="text-emerald-700">~ {totalRevenue > 0 ? Math.round(((netIncome * 12) / 4500000000) * 100) : 0}% Per Tahun</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-650 flex flex-col justify-between">
                <div>
                  <span className="block font-bold text-gray-600 uppercase text-[10px] mb-1">Rasio Titik Impas (BEP)</span>
                  <p className="leading-relaxed">
                    Dengan tingkat okupansi sebesar **{Math.round((units.filter(u=>u.status==='Occupied').length / units.length)*100)}%**, 
                    aliran kas operasional Anda diprediksi mencapai tingkat *Break-Even* hanya dalam waktu operasi **36 Bulan**.
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold italic">*Estimasi dihitung berdasarkan rasio sewa rata-rata Juni 2026.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL INBOX SECTION */}
      {activeTab === "approvals" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
                Approval Inbox & Disbursing Engine
              </h3>
              <p className="text-xs text-slate-400">Otorisasi transfer bank dan validasi pencairan slip gaji karyawan PMS Pro Properties</p>
            </div>
            <div className="flex gap-2 text-[10px] font-extrabold uppercase">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                Sovereign Finance Ledger Verified
              </span>
            </div>
          </div>

          {/* Aggregated KPI Cards for Payroll Approvals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Antrean Transfer</span>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {payroll.filter(p => p.status === "Pending").length} Karyawan
                </p>
              </div>
              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle className="h-5 w-5" />
              </span>
            </div>

            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Nominal Outflow Gaji</span>
                <p className="text-lg font-bold text-indigo-900 mt-1">
                  {formatIDR(payroll.filter(p => p.status === "Pending").reduce((sum, p) => sum + p.netSalary, 0))}
                </p>
              </div>
              <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <Layers className="h-5 w-5" />
              </span>
            </div>

            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">Gaji Berhasil Dicairkan</span>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {formatIDR(payroll.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.netSalary, 0))}
                </p>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Dokumen Persetujuan Gaji Menunggu Kirim (Pending Disbursements)
            </h4>

            {payroll.filter(p => p.status === "Pending").length === 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h5 className="font-extrabold text-xs text-emerald-900 uppercase">Semua Selesai! Inbox Bersih</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tidak ada pencairan gaji terbengkalai. Semua slip gaji yang telah diterbitkan HRD untuk periode aktif berjalan telah berhasil disetujui & ditransfer.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {payroll.filter(p => p.status === "Pending").map((pay) => {
                  const emp = employees.find(e => e.id === pay.employeeId);
                  const subAccountNum = (emp?.id ? emp.id.replace(/\D/g, "") : "") || "9021";
                  
                  return (
                    <div key={pay.id} className="bg-white border border-slate-200 hover:border-emerald-250 rounded-2xl p-5 shadow-xs transition grid grid-cols-1 lg:grid-cols-4 gap-5 items-center">
                      
                      {/* Column 1: Profil & Meta */}
                      <div className="lg:border-r border-slate-100 pr-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center text-xs font-black text-slate-700 capitalize">
                            {emp ? emp.name.split(" ").map(w => w[0]).join("").slice(0, 2) : "EM"}
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-slate-800 leading-tight">{emp ? emp.name : "Karyawan"}</h5>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                              {emp?.role || "Staf Utama"}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 space-y-0.5 font-semibold">
                          <p>Departemen: <span className="text-slate-600 font-bold">{emp?.department || "Operasional"}</span></p>
                          <p>Email: <span className="text-slate-600 font-bold">{emp?.email || "-"}</span></p>
                          <p>ID Staf: <span className="text-slate-600 font-mono font-bold uppercase">{emp?.id}</span></p>
                        </div>
                      </div>

                      {/* Column 2: Rincian Anggaran */}
                      <div className="lg:border-r border-slate-100 pr-3 space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">STRUKTUR PAYROLL ({pay.month})</span>
                        <div className="space-y-1 select-none font-mono text-[10px] text-slate-600 font-semibold grid grid-cols-2 lg:block">
                          <div className="flex justify-between">
                            <span>Gaji Pokok:</span>
                            <span className="font-bold text-slate-800">{formatIDR(pay.basicSalary)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bonus/Tunjangan:</span>
                            <span className="font-bold text-emerald-600">+{formatIDR(pay.allowance)}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed pt-1">
                            <span>Potongan Absensi:</span>
                            <span className="font-bold text-rose-500">-{formatIDR(pay.deductions)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Verifikasi Rekening Bank */}
                      <div className="lg:border-r border-slate-100 pr-3 space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider font-mono">TUJUAN TRANSFER MANDIRI</span>
                        <div className="space-y-0.5 text-[10px] text-slate-600 font-semibold">
                          <p className="text-slate-800 font-extrabold flex items-center gap-1">
                            Bank Mandiri KCP Kemang
                          </p>
                          <p className="font-mono text-[11px] font-bold text-slate-900 tracking-wider">121-00-9882910-{subAccountNum}</p>
                          <p className="text-slate-500 text-[9px] truncate">Pemilik: <span className="font-bold text-slate-700">{emp?.name}</span></p>
                        </div>
                      </div>

                      {/* Column 4: Tombol Aksi Persetujuan */}
                      <div className="space-y-3 pl-0 lg:pl-3 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold leading-none">Net Take Home Pay:</span>
                          <span className="text-base font-black text-rose-600 font-mono tracking-tight block mt-1">
                            {formatIDR(pay.netSalary)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleApproveAndTransferPayroll(pay)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 hover:shadow-lg transition cursor-pointer"
                        >
                          <CreditCard className="h-4 w-4" />
                          Confirm Transfer
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HISTORIK DISBURSEMENT ARCHIVE */}
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Arsip Pengeluaran & Riwayat Pencarian Sukses (Disbursed Ledger Logs)
            </h4>

            {payroll.filter(p => p.status === "Paid").length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic pl-1">Belum ada riwayat gaji yang ditransfer lunas bulan ini.</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-gray-550 border-b">
                      <th className="p-4">Tanggal Transfer</th>
                      <th className="p-4">Staf Penerima</th>
                      <th className="p-4">No. Rekening</th>
                      <th className="p-4">Periode</th>
                      <th className="p-4">Jumlah Transfer</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800 font-mono">
                    {payroll.filter(p => p.status === "Paid").map((pay) => {
                      const emp = employees.find(e => e.id === pay.employeeId);
                      const subAccountNum = (emp?.id ? emp.id.replace(/\D/g, "") : "") || "9021";
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-gray-550 font-sans">{pay.paymentDate || "2026-06-22"}</td>
                          <td className="p-4 font-sans text-slate-900 font-extrabold">{emp ? emp.name : "Karyawan"}</td>
                          <td className="p-4 text-slate-500 font-mono">121-...-{subAccountNum}</td>
                          <td className="p-4 font-sans text-slate-500">{pay.month}</td>
                          <td className="p-4 text-slate-900 font-extrabold">{formatIDR(pay.netSalary)}</td>
                          <td className="p-4">
                            <span className="mx-auto bg-emerald-50 text-emerald-800 py-0.5 px-2 bg-white border border-emerald-250 rounded-lg text-[9px] font-sans font-extrabold uppercase flex items-center justify-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              TERKIRIM LUNAS
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL WINDOW LUNASI INVOICE */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b">
              <h4 className="font-bold text-slate-800 text-sm">Input Pembayaran Manual</h4>
              <button onClick={() => setPayingInvoice(null)} className="text-gray-400 hover:text-slate-700">×</button>
            </div>
            
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl">
              <p className="text-gray-550">No. Tagihan: <strong className="text-slate-800">{payingInvoice.invoiceNumber}</strong></p>
              <p className="text-gray-550">Jumlah Wajib Lunasi: <strong className="text-emerald-600 text-sm">{formatIDR(payingInvoice.totalAmount)}</strong></p>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="Transfer">Bank Transfer (BCA/Mandiri)</option>
                  <option value="Cash">Tunai / Cash</option>
                  <option value="QRIS">QRIS E-Wallet</option>
                  <option value="Payment Gateway">Auto Payment Gateway</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Nomor Transaksi/Referensi</label>
                <input
                  type="text"
                  value={paymentTx}
                  onChange={(e) => setPaymentTx(e.target.value)}
                  className="w-full text-slate-800 p-2 border border-gray-200 rounded-lg font-mono font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg leading-none mt-2 transition"
              >
                Konfirmasi Pelunasan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT PREVIEW MODAL */}
      {printingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 my-8 print:my-0 h-fit">
            <div className="flex justify-between items-center border-b pb-4 print:hidden">
              <div className="flex items-center gap-1 text-emerald-600">
                <Printer className="h-5 w-5" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Cetak Preview Invoice</span>
              </div>
              <button
                onClick={() => setPrintingInvoice(null)}
                className="p-1 text-gray-500 hover:text-black font-semibold text-sm"
              >
                Tutup [X]
              </button>
            </div>

            {/* PRINT AREA TARGETED */}
            <div className="space-y-6 print:p-4 text-xs font-sans">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">PMS PRO SAAS</h1>
                  <p className="text-gray-450 text-[10px]">Property Management System Enterprise Group</p>
                  <p className="text-gray-450 text-[10px]">Jakarta - Bandung - Kuta Bali</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold tracking-widest text-emerald-800 uppercase bg-emerald-50 px-3 py-1 rounded-full">INVOICE</span>
                  <p className="font-mono mt-1 font-bold text-slate-600 text-[10px]">{printingInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">DITAGIHKAN KEPADA:</span>
                  <strong className="text-slate-800 text-sm block">{tenants.find(t=>t.id===printingInvoice.tenantId)?.name || "Penyewa"}</strong>
                  <span className="text-slate-500 block">Nomor HP: {tenants.find(t=>t.id===printingInvoice.tenantId)?.phone || "N/A"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">DETAIL UNIT AREA:</span>
                  <strong className="text-slate-800 block">{properties.find(p=>p.id===printingInvoice.propertyId)?.name || "Properti"}</strong>
                  <span className="text-slate-500 block">Kamar Unit No: Room {units.find(u=>u.id===printingInvoice.unitId)?.unitNumber || "N/A"}</span>
                </div>
              </div>

              {/* Items lists */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">RINCIAN STRUKUR TAGIHAN:</span>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 grid grid-cols-3 p-2.5 font-bold uppercase tracking-wider text-[10px] text-gray-400 border-b">
                    <span className="col-span-2">Deskripsi Desk Penyesuaian</span>
                    <span className="text-right">Jumlah Biaya</span>
                  </div>
                  {printingInvoice.items.map((it, index) => (
                    <div key={it.id || index} className="grid grid-cols-3 p-2.5 border-b last:border-b-0 text-slate-700">
                      <span className="col-span-2 font-semibold">- {it.description}</span>
                      <span className="text-right font-mono font-bold">{formatIDR(it.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices totals lists */}
              <div className="space-y-1 text-right max-w-xs ml-auto text-xs font-semibold">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal Tagihan:</span>
                  <span className="font-mono">{formatIDR(printingInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Pajak Daerah (1%):</span>
                  <span className="font-mono">{formatIDR(printingInvoice.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-sm font-extrabold text-slate-900 bg-slate-50 p-2 rounded-lg">
                  <span>DITOTAlKAN:</span>
                  <span className="font-mono text-emerald-700">{formatIDR(printingInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-6 text-center text-gray-400 border-t text-[10px] leading-relaxed">
                <p>Terima kasih atas pembayaran tepat waktu. Bukti pelunasan digital ini sah dikeluarkan oleh Sistem PMS Pro Sahrul Viona.</p>
                <p className="font-mono text-[9px] text-gray-350 mt-1">Sistem ID: {printingInvoice.id}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t print:hidden flex-wrap">
              <button
                onClick={() => setPrintingInvoice(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  generateAndDownloadBookingInvoicePDF({
                    tenantId: printingInvoice.tenantId,
                    invoiceNumber: printingInvoice.invoiceNumber,
                    dueDate: printingInvoice.dueDate,
                    paymentStatus: printingInvoice.status,
                    customItems: printingInvoice.items
                  });
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Download Formatted PDF Invoice Berdasarkan Detail Booking"
              >
                <Download className="h-4 w-4" />
                Unduh PDF Invoice Booking
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Cetak / Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PAYROLL TRANSFER MODAL */}
      {payrollToConfirm && (() => {
        const emp = employees.find(e => e.id === payrollToConfirm.employeeId);
        const subAccountNum = (emp?.id ? emp.id.replace(/\D/g, "") : "") || "9021";
        return (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up text-xs font-sans">
              <div className="flex justify-between items-center pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2 text-rose-600 font-extrabold pb-0.5">
                  <CreditCard className="h-4.5 w-4.5" />
                  <span className="uppercase tracking-wider text-[11px]">Konfirmasi Pengiriman Dana</span>
                </div>
                <button onClick={() => setPayrollToConfirm(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
              </div>

              <div className="space-y-3.5">
                <div className="text-center p-4 bg-rose-50/75 border border-rose-100 rounded-2xl">
                  <span className="text-[10px] text-rose-700 uppercase font-black block tracking-widest font-mono">Net Take Home Pay</span>
                  <span className="text-2xl font-black text-rose-600 font-mono tracking-tight block mt-1">
                    {formatIDR(payrollToConfirm.netSalary)}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 border border-slate-250/20 rounded-2xl leading-relaxed text-slate-705">
                  <p className="flex justify-between border-b pb-1.5 border-dashed">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Penerima Gaji:</span>
                    <strong className="text-slate-800">{emp ? emp.name : "Karyawan"}</strong>
                  </p>
                  <p className="flex justify-between border-b pb-1.5 border-dashed">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Role / Dept:</span>
                    <span className="text-slate-600 font-semibold">{emp?.role || "Staf"} / {emp?.department || "Operasional"}</span>
                  </p>
                  <p className="flex justify-between border-b pb-1.5 border-dashed font-mono">
                    <span className="text-slate-400 font-sans font-bold uppercase text-[9px]">Rekening Bank:</span>
                    <span className="text-slate-800 font-bold">121-00-9882910-{subAccountNum} (Mandiri)</span>
                  </p>
                  <p className="flex justify-between font-mono">
                    <span className="text-slate-400 font-sans font-bold uppercase text-[9px]">Periode Kerja:</span>
                    <span className="text-slate-800 font-bold">{payrollToConfirm.month}</span>
                  </p>
                </div>

                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h6 className="font-extrabold text-[11px] uppercase tracking-wide">Pencatatan Ledger Otomatis</h6>
                    <p className="text-[10px] leading-relaxed mt-0.5 font-medium text-emerald-700/90">
                      Menyetujui aksi ini akan memperbarui status slip gaji menjadi <strong className="font-extrabold text-emerald-800">PAID</strong> di modul HRD, dan mencatat pengeluaran pos <strong>"Salary"</strong> di Buku Besar Akuntansi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setPayrollToConfirm(null)}
                  className="py-2.5 font-extrabold text-gray-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition uppercase tracking-wider text-[10px]"
                >
                  Batal / Periksa
                </button>
                <button
                  onClick={() => executePayrollTransfer(payrollToConfirm)}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-950/20 active:scale-95 transition text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="h-4 w-4" />
                  Konfirmasi Kirim
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PAYROLL SUCCESS TRANSFER MODAL */}
      {showPayrollSuccessModal && lastTransferredPayroll && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-7 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-scale-up text-xs font-sans">
            <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Pencairan Berhasil!</h4>
              <p className="text-[11px] text-slate-400">Gaji untuk staf telah berhasil diotorisasi dan ditransfer lunas oleh divisi keuangan.</p>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-2xl space-y-2 text-left font-semibold text-slate-700 leading-relaxed font-mono">
              <div className="flex justify-between border-b pb-1.5 border-dashed">
                <span className="text-slate-400 font-sans font-bold text-[9px] uppercase">Staf Penerima:</span>
                <span className="text-slate-900 font-sans font-extrabold">{lastTransferredPayroll.empName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-dashed">
                <span className="text-slate-400 font-sans font-bold text-[9px] uppercase">Jumlah Ditransfer:</span>
                <span className="text-emerald-600 font-bold">{formatIDR(lastTransferredPayroll.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans font-bold text-[9px] uppercase">Periode Slip:</span>
                <span className="text-slate-800 font-bold">{lastTransferredPayroll.month}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPayrollSuccessModal(false);
                setLastTransferredPayroll(null);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition uppercase tracking-wider text-[10px] cursor-pointer"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

      {/* AUTOMATED EMAIL DISPATCH TRIGGER PROGRESS OVERLAY */}
      {sendingEmailProgress && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white p-7 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 space-y-6 text-center animate-scale-up">
            <div className="relative mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-500/25 text-emerald-600">
              {sendingEmailProgress.stage !== "success" ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <CheckCircle className="h-8 w-8 text-emerald-500 animate-bounce" />
              )}
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-1 border-2 border-white shadow-sm">
                <Mail className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 font-mono block">Automated Email Trigger Engine</span>
              <h4 className="text-base font-extrabold text-slate-800 leading-tight">
                {sendingEmailProgress.stage === "pdf" && "Mempersiapkan Lampiran Invoice PDF..."}
                {sendingEmailProgress.stage === "smtp" && "Menghubungkan ke SMTP Server Terenkripsi..."}
                {sendingEmailProgress.stage === "sending" && "Mengirimkan Ringkasan Tagihan..."}
                {sendingEmailProgress.stage === "success" && "Laporan Tagihan Berhasil Terkirim!"}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {sendingEmailProgress.stage === "pdf" && `Mempersiapkan dokumen digital untuk ${sendingEmailProgress.invoiceNumber}.`}
                {sendingEmailProgress.stage === "smtp" && "Melakukan otentikasi pengiriman aman ssl-smtp.pmspro.net."}
                {sendingEmailProgress.stage === "sending" && `Mengirimkan ringkasan tagihan & file PDF langsung ke ${sendingEmailProgress.email}.`}
                {sendingEmailProgress.stage === "success" && `Laporan sewa kost otomatis telah terkirim secara real-time ke email ${sendingEmailProgress.email}.`}
              </p>
            </div>

            {/* Step indicators */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-[9px] font-bold text-gray-400 font-mono uppercase">
              <div className="space-y-1.5">
                <div className={`h-1.5 rounded-full ${sendingEmailProgress.stage === "pdf" ? "bg-emerald-500 animate-pulse" : ["smtp", "sending", "success"].includes(sendingEmailProgress.stage) ? "bg-emerald-600" : "bg-slate-100"}`} />
                <span className={sendingEmailProgress.stage === "pdf" ? "text-emerald-600 font-extrabold" : ["smtp", "sending", "success"].includes(sendingEmailProgress.stage) ? "text-slate-700" : ""}>Generate PDF</span>
              </div>
              <div className="space-y-1.5">
                <div className={`h-1.5 rounded-full ${sendingEmailProgress.stage === "smtp" ? "bg-emerald-500 animate-pulse" : ["sending", "success"].includes(sendingEmailProgress.stage) ? "bg-emerald-600" : "bg-slate-100"}`} />
                <span className={sendingEmailProgress.stage === "smtp" ? "text-emerald-600 font-extrabold" : ["sending", "success"].includes(sendingEmailProgress.stage) ? "text-slate-700" : ""}>SMTP Connect</span>
              </div>
              <div className="space-y-1.5">
                <div className={`h-1.5 rounded-full ${sendingEmailProgress.stage === "sending" ? "bg-emerald-500 animate-pulse" : ["success"].includes(sendingEmailProgress.stage) ? "bg-emerald-600" : "bg-slate-100"}`} />
                <span className={sendingEmailProgress.stage === "sending" ? "text-emerald-600 font-extrabold" : ["success"].includes(sendingEmailProgress.stage) ? "text-slate-700" : ""}>Sending Mail</span>
              </div>
              <div className="space-y-1.5">
                <div className={`h-1.5 rounded-full ${sendingEmailProgress.stage === "success" ? "bg-emerald-600" : "bg-slate-100"}`} />
                <span className={sendingEmailProgress.stage === "success" ? "text-emerald-600 font-extrabold" : ""}>Success</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL GENERATE & UNDUH PDF INVOICE BOOKING */}
      {showBookingInvoiceModal && (() => {
        const curTenant = tenants.find(t => t.id === selectedBookingTenantId) || tenants[0];
        const tenantReservations = curTenant ? allReservations.filter(r => r.tenantId === curTenant.id) : [];
        const curReservation = selectedBookingReservationId
          ? allReservations.find(r => r.id === selectedBookingReservationId)
          : (tenantReservations[0] || allReservations[0]);

        const curUnit = units.find(u => u.id === curReservation?.unitId) || units[0];
        const curProperty = properties.find(p => p.id === (curReservation?.propertyId || curUnit?.propertyId)) || properties[0];

        // Rent calculations
        const rawRent = curReservation?.totalPrice
          ? Math.max(0, curReservation.totalPrice - (bookingInvoiceIncludeDeposit ? (curReservation.deposit || 0) : 0))
          : (curUnit?.price || 2500000);
        const deposit = bookingInvoiceIncludeDeposit ? (curReservation?.deposit || 1000000) : 0;
        const subtotal = rawRent + deposit;
        const taxAmount = Math.round(rawRent * (bookingInvoiceTaxPercent / 100));
        const totalEstimate = subtotal + taxAmount;

        const checkIn = curReservation?.checkInDate || "2026-06-01";
        const checkOut = curReservation?.checkOutDate || "2026-12-31";
        const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up text-xs font-sans max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Generate & Unduh Formatted PDF Invoice</h3>
                    <p className="text-[11px] text-slate-300">Buat faktur penagihan resmi berbasis detail reservasi kamar penyewa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingInvoiceModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-700/50 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content / Form */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* 1. Tenant Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    Pilih Penyewa (Tenant):
                  </label>
                  <select
                    value={selectedBookingTenantId}
                    onChange={(e) => setSelectedBookingTenantId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition cursor-pointer"
                  >
                    {tenants.map((t) => {
                      const tRes = allReservations.find(r => r.tenantId === t.id);
                      const tUnit = units.find(u => u.id === tRes?.unitId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} • {tUnit ? `Kamar ${tUnit.unitNumber}` : "Semua Kamar"} ({t.phone || "No HP"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Reservation Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    Pilih Reservasi / Booking:
                  </label>
                  {tenantReservations.length > 0 ? (
                    <select
                      value={selectedBookingReservationId || tenantReservations[0].id}
                      onChange={(e) => setSelectedBookingReservationId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition cursor-pointer"
                    >
                      {tenantReservations.map((r) => {
                        const u = units.find(unit => unit.id === r.unitId);
                        const p = properties.find(prop => prop.id === r.propertyId);
                        return (
                          <option key={r.id} value={r.id}>
                            ID: {r.id} • {p?.name || "Properti"} - Room {u?.unitNumber || "N/A"} ({r.checkInDate} s/d {r.checkOutDate}) - Status: {r.status}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      Penyewa ini belum memiliki riwayat reservasi tersimpan. Sistem akan menggunakan data reservasi default untuk membuat faktur.
                    </div>
                  )}
                </div>

                {/* 3. Booking Details Preview Card */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rincian Data Booking</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      curReservation?.paymentStatus === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      Status Pembayaran: {curReservation?.paymentStatus || "Paid"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Properti & Unit</span>
                      <strong className="text-slate-800 block text-xs">{curProperty?.name}</strong>
                      <span className="text-[11px] text-slate-500">Room {curUnit?.unitNumber} ({curUnit?.type}, Lantai {curUnit?.floor})</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Periode Sewa / Durasi</span>
                      <strong className="text-slate-800 block text-xs">{checkIn} s/d {checkOut}</strong>
                      <span className="text-[11px] text-slate-500">{diffDays} Hari ({Math.round(diffDays / 30)} Bulan)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Tarif Sewa Kamar</span>
                      <strong className="text-slate-800 text-xs">{formatIDR(rawRent)}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Uang Jaminan (Deposit)</span>
                      <strong className="text-slate-800 text-xs">{formatIDR(curReservation?.deposit || 1000000)}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Invoice Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      Pajak / Biaya Administrasi:
                    </label>
                    <select
                      value={bookingInvoiceTaxPercent}
                      onChange={(e) => setBookingInvoiceTaxPercent(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value={0}>0% - Tanpa Pajak</option>
                      <option value={1}>1% - Pajak Daerah / PPh Standar</option>
                      <option value={11}>11% - PPN Standar Nasional</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="inc-deposit-check"
                      checked={bookingInvoiceIncludeDeposit}
                      onChange={(e) => setBookingInvoiceIncludeDeposit(e.target.checked)}
                      className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="inc-deposit-check" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Sertakan Uang Jaminan / Deposit
                    </label>
                  </div>
                </div>

                {/* 5. Custom Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    Catatan Khusus di Faktur (Opsional):
                  </label>
                  <input
                    type="text"
                    value={bookingInvoiceCustomNotes}
                    onChange={(e) => setBookingInvoiceCustomNotes(e.target.value)}
                    placeholder="Contoh: Termasuk biaya listrik AC & akses wifi 100 Mbps..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* 6. Total Calculation Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 block">Total Ditagihkan (Invoice Total)</span>
                    <span className="text-lg font-black text-emerald-700">{formatIDR(totalEstimate)}</span>
                  </div>
                  <div className="text-right text-[10px] text-emerald-800">
                    <span>Sewa: {formatIDR(rawRent)}</span>
                    {deposit > 0 && <span> + Dep: {formatIDR(deposit)}</span>}
                    {taxAmount > 0 && <span> + Pjk: {formatIDR(taxAmount)}</span>}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowBookingInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  onClick={() => {
                    setIsGeneratingBookingPdf(true);
                    setTimeout(() => {
                      generateAndDownloadBookingInvoicePDF({
                        tenantId: curTenant.id,
                        reservationId: curReservation?.id,
                        customNotes: bookingInvoiceCustomNotes || undefined,
                        taxPercentage: bookingInvoiceTaxPercent,
                        includeDeposit: bookingInvoiceIncludeDeposit,
                        paymentStatus: curReservation?.paymentStatus || "Paid"
                      });
                      setIsGeneratingBookingPdf(false);
                      setShowBookingInvoiceModal(false);
                    }, 400);
                  }}
                  disabled={isGeneratingBookingPdf}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingBookingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF Invoice Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
