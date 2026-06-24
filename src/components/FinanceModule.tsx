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
  Loader2
} from "lucide-react";
import { Invoice, PaymentLog, Expense, Tenant, Property, Unit, PaymentMethod, PaymentStatus, ExpenseCategory, MaintenanceTicket, Payroll, Employee } from "../types";

interface FinanceModuleProps {
  invoices: Invoice[];
  payments: PaymentLog[];
  expenses: Expense[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  maintenance?: MaintenanceTicket[];
  payroll?: Payroll[];
  employees?: Employee[];
  onAddInvoice: (inv: Invoice) => void;
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
  maintenance = [],
  payroll = [],
  employees = [],
  onAddInvoice,
  onAddPayment,
  onAddExpense,
  onUpdateInvoiceStatus,
  onUpdatePayroll,
  prefilledUnitId,
  onClearPrefill
}: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "reports" | "approvals">("invoices");
  
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

  const currentPropertyUnits = units.filter(u => u.propertyId === propId);

  // Trigger Excel/CSV Download
  const downloadInvoicesCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nomor Invoice,Penyewa,Unit,Total Tagihan,Tanggal Jatuh Tempo,Status\n";
    
    invoices.forEach((inv) => {
      const tenantName = tenants.find(t => t.id === inv.tenantId)?.name || "N/A";
      const unitNumber = units.find(u => u.id === inv.unitId)?.unitNumber || "N/A";
      csvContent += `"${inv.invoiceNumber}","${tenantName}","Room ${unitNumber}",${inv.totalAmount},"${inv.dueDate}","${inv.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Invoice_PMS_Pro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const newPay: PaymentLog = {
      id: "pay-" + Date.now().toString(),
      invoiceId: payingInvoice.id,
      amount: Number(paymentAmount),
      paymentDate: new Date().toISOString(),
      method: paymentMethod,
      transactionNumber: paymentTx || `TX-manual-${Date.now().toString().slice(-4)}`
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
      </div>

      {/* INVOICES SECTION */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Tagihan Penyewa</h3>
            <div className="flex gap-2">
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
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Generate Tagihan
              </button>
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

          {/* TABLE LOG LIST */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-gray-550 border-b">
                    <th className="p-4">No. Invoice</th>
                    <th className="p-4">Penyewa & Kamar</th>
                    <th className="p-4">Rincian Item</th>
                    <th className="p-4">Total Tagihan</th>
                    <th className="p-4">Batas Akhir</th>
                    <th className="p-4">Metode Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800 font-medium font-sans">
                  {invoices.map((inv) => {
                    const ten = tenants.find(t => t.id === inv.tenantId);
                    const unt = units.find(u => u.id === inv.unitId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="p-4 whitespace-nowrap font-mono font-bold text-emerald-800">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-extrabold text-slate-800 block text-sm">{ten?.name || "N/A"}</span>
                            <span className="block text-gray-500 font-bold">Kamar No: {unt?.unitNumber || "N/A"}</span>
                          </div>
                        </td>
                        <td className="p-4 max-w-[200px]">
                          <div className="space-y-0.5">
                            {inv.items.map((it) => (
                              <div key={it.id} className="flex justify-between text-[11px] text-gray-500">
                                <span className="truncate max-w-[120px]">- {it.description}</span>
                                <span className="font-semibold">{formatIDR(it.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800 text-sm">
                          {formatIDR(inv.totalAmount)}
                        </td>
                        <td className="p-4 text-red-500 font-bold whitespace-nowrap">
                          {inv.dueDate}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                                inv.status === "Paid"
                                  ? "bg-green-100 text-green-800 border-green-250"
                                  : inv.status === "Unpaid"
                                  ? "bg-yellow-105 text-yellow-850"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {inv.status}
                            </span>
                            
                            {inv.status !== "Paid" && (
                              <button
                                onClick={() => loadPayModal(inv)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-sm select-all cursor-pointer"
                              >
                                Lunasi
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPrintingInvoice(inv);
                              }}
                              className="p-1 px-1.5 border hover:bg-gray-100 text-slate-600 rounded"
                              title="Cetak Receipt/PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
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

            <div className="pt-4 flex justify-end gap-2 border-t print:hidden">
              <button
                onClick={() => setPrintingInvoice(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Cetak / Konversi PDF
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
    </div>
  );
}
