import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Scale,
  DollarSign,
  BookOpen,
  FileText,
  Clock,
  CreditCard,
  Wallet,
  Receipt,
  Layers,
  PieChart,
  Target,
  Lock,
  Download,
  Printer
} from "lucide-react";
import {
  Invoice,
  PaymentLog,
  Expense,
  Payroll,
  Tenant,
  Property,
  Unit,
  ChartOfAccount,
  BankAccount,
  BankMutation,
  VendorPayable,
  FinancialBudget,
  FinancialClosingPeriod,
  FinancialAuditLog,
  JournalEntry
} from "../types";
import {
  INITIAL_COA,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_MUTATIONS,
  INITIAL_VENDOR_PAYABLES,
  INITIAL_BUDGETS,
  INITIAL_CLOSING_PERIODS,
  INITIAL_FINANCIAL_AUDIT_LOGS,
  generateAutoJournalEntries
} from "../dataFinancialReports";
import FinancialHeader from "./financial/FinancialHeader";
import FinancialDashboardTab from "./financial/FinancialDashboardTab";
import IncomeStatementTab from "./financial/IncomeStatementTab";
import BalanceSheetTab from "./financial/BalanceSheetTab";
import CashFlowTab from "./financial/CashFlowTab";
import GeneralLedgerTab from "./financial/GeneralLedgerTab";
import GeneralJournalTab from "./financial/GeneralJournalTab";
import AccountsReceivableTab from "./financial/AccountsReceivableTab";
import AccountsPayableTab from "./financial/AccountsPayableTab";
import CashAndBankTab from "./financial/CashAndBankTab";
import TaxReportTab from "./financial/TaxReportTab";
import RevenueReportTab from "./financial/RevenueReportTab";
import ExpenseReportTab from "./financial/ExpenseReportTab";
import BudgetingTab from "./financial/BudgetingTab";
import ClosingPeriodTab from "./financial/ClosingPeriodTab";

interface FinancialReportsModuleProps {
  invoices: Invoice[];
  payments: PaymentLog[];
  expenses: Expense[];
  payrollList: Payroll[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  currentUser?: { name: string; role: string; email: string };
  onRecordPayment?: (invoice: Invoice) => void;
  onSendReminder?: (invoice: Invoice) => void;
}

export type FinancialSubTab =
  | "dashboard"
  | "laba-rugi"
  | "neraca"
  | "arus-kas"
  | "buku-besar"
  | "jurnal-umum"
  | "piutang"
  | "hutang"
  | "kas-bank"
  | "pajak"
  | "pendapatan"
  | "pengeluaran"
  | "budget"
  | "closing";

export default function FinancialReportsModule({
  invoices,
  payments,
  expenses,
  payrollList,
  tenants,
  properties,
  units,
  currentUser,
  onRecordPayment,
  onSendReminder
}: FinancialReportsModuleProps) {
  // State
  const [activeTab, setActiveTab] = useState<FinancialSubTab>("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-09");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");

  // Local accounting state
  const [coaList, setCoaList] = useState<ChartOfAccount[]>(INITIAL_COA);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [bankMutations, setBankMutations] = useState<BankMutation[]>(INITIAL_BANK_MUTATIONS);
  const [vendorPayables, setVendorPayables] = useState<VendorPayable[]>(INITIAL_VENDOR_PAYABLES);
  const [budgets, setBudgets] = useState<FinancialBudget[]>(INITIAL_BUDGETS);
  const [closingPeriods, setClosingPeriods] = useState<FinancialClosingPeriod[]>(INITIAL_CLOSING_PERIODS);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>(INITIAL_FINANCIAL_AUDIT_LOGS);
  const [manualJournals, setManualJournals] = useState<JournalEntry[]>([]);

  // Check if active period is locked
  const activeClosingPeriod = closingPeriods.find((p) => p.periodKey === selectedPeriod);
  const isPeriodLocked = activeClosingPeriod ? activeClosingPeriod.isLocked : false;

  // Filtered dataset according to property selection
  const filteredInvoices = useMemo(() => {
    if (selectedPropertyId === "ALL") return invoices;
    const propertyUnitIds = units.filter((u) => u.propertyId === selectedPropertyId).map((u) => u.id);
    return invoices.filter((inv) => propertyUnitIds.includes(inv.unitId));
  }, [invoices, units, selectedPropertyId]);

  const filteredExpenses = useMemo(() => {
    if (selectedPropertyId === "ALL") return expenses;
    return expenses.filter((e) => !e.propertyId || e.propertyId === selectedPropertyId);
  }, [expenses, selectedPropertyId]);

  // Combined Journal Entries (Auto-generated from PMS + Manual adjustments)
  const allJournalEntries = useMemo(() => {
    const autoEntries = generateAutoJournalEntries(
      filteredInvoices,
      payments,
      filteredExpenses,
      payrollList
    );
    return [...manualJournals, ...autoEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredInvoices, payments, filteredExpenses, payrollList, manualJournals]);

  // Financial aggregates
  const totalIncome = useMemo(
    () => filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
    [filteredInvoices]
  );
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const netProfit = totalIncome - totalExpense;

  const totalCashAndBank = useMemo(
    () => bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0),
    [bankAccounts]
  );

  const totalReceivables = useMemo(
    () =>
      filteredInvoices
        .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    [filteredInvoices]
  );

  const totalPayables = useMemo(
    () => vendorPayables.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0),
    [vendorPayables]
  );

  // Income Statement items
  const revenueItems = useMemo(() => [
    { name: "Pendapatan Sewa Kamar & Unit", current: Math.round(totalIncome * 0.85), previous: 66000000 },
    { name: "Pendapatan Layanan Laundry & Cuci", current: Math.round(totalIncome * 0.08), previous: 5500000 },
    { name: "Pendapatan Denda Keterlambatan", current: Math.round(totalIncome * 0.03), previous: 2200000 },
    { name: "Pendapatan Lain-lain (Parkir, Meeting)", current: Math.round(totalIncome * 0.04), previous: 4300000 }
  ], [totalIncome]);

  const cogsItems = useMemo(() => [
    { name: "HPP Perlengkapan & Amenitas Tamu", current: 3500000, previous: 3200000 },
    { name: "HPP Bahan Kimia Laundry Tamu", current: 1800000, previous: 1600000 }
  ], []);

  const totalCogs = useMemo(() => {
    return cogsItems.reduce((sum, item) => sum + item.current, 0);
  }, [cogsItems]);

  const grossProfit = totalIncome - totalCogs;

  const opexItems = useMemo(() => [
    { name: "Beban Gaji & Upah Karyawan", current: 28500000, previous: 28500000 },
    { name: "Beban Listrik PLN Gedung", current: 5200000, previous: 4900000 },
    { name: "Beban Air PDAM", current: 1800000, previous: 1750000 },
    { name: "Beban Internet & TV Kabel", current: 2200000, previous: 2200000 },
    { name: "Beban Pemeliharaan Rutin & Servis AC", current: 3400000, previous: 3100000 },
    { name: "Beban Housekeeping & Kebersihan", current: 1500000, previous: 1400000 }
  ], []);

  const otherExpenseItems = useMemo(() => [
    { name: "Beban Administrasi Bank & QRIS MDR", current: 650000, previous: 580000 },
    { name: "Beban Bunga Pinjaman Bank", current: 3500000, previous: 3500000 }
  ], []);

  // Cash Flow items
  const operatingInflows = useMemo(() => [
    { name: "Penerimaan Kas Sewa Kamar & Deposit", amount: totalIncome },
    { name: "Penerimaan Layanan & Denda Keterlambatan", amount: 4500000 }
  ], [totalIncome]);

  const operatingOutflows = useMemo(() => [
    { name: "Pembayaran Beban Operasional & Utilitas", amount: totalExpense },
    { name: "Pembayaran Gaji Pegawai & Staf", amount: 28500000 }
  ], [totalExpense]);

  const investingInflows: { name: string; amount: number }[] = [];
  const investingOutflows = useMemo(() => [
    { name: "Pengadaan AC Inverter & Smart TV Baru", amount: 8500000 }
  ], []);

  const financingInflows: { name: string; amount: number }[] = [];
  const financingOutflows = useMemo(() => [
    { name: "Pembayaran Pokok Angsuran KPR Bank", amount: 12000000 }
  ], []);

  const runningCashIn = useMemo(() => {
    return operatingInflows.reduce((sum, item) => sum + item.amount, 0);
  }, [operatingInflows]);

  const runningCashOut = useMemo(() => {
    const opOut = operatingOutflows.reduce((sum, item) => sum + item.amount, 0);
    const invOut = investingOutflows.reduce((sum, item) => sum + item.amount, 0);
    const finOut = financingOutflows.reduce((sum, item) => sum + item.amount, 0);
    return opOut + invOut + finOut;
  }, [operatingOutflows, investingOutflows, financingOutflows]);

  const runningNetCashFlow = runningCashIn - runningCashOut;

  // Monthly trends for graphs (enriched with labaKotor, labaBersih, and netCashFlow)
  const monthlyTrends = useMemo(() => {
    return [
      {
        month: "Mei",
        pendapatan: 54000000,
        cogs: 3800000,
        labaKotor: 50200000,
        pengeluaran: 28000000,
        labaBersih: 26000000,
        cashIn: 52000000,
        cashOut: 26000000,
        netCashFlow: 26000000
      },
      {
        month: "Jun",
        pendapatan: 62000000,
        cogs: 4200000,
        labaKotor: 57800000,
        pengeluaran: 31000000,
        labaBersih: 31000000,
        cashIn: 60000000,
        cashOut: 29000000,
        netCashFlow: 31000000
      },
      {
        month: "Jul",
        pendapatan: 71000000,
        cogs: 4700000,
        labaKotor: 66300000,
        pengeluaran: 34000000,
        labaBersih: 37000000,
        cashIn: 68000000,
        cashOut: 32000000,
        netCashFlow: 36000000
      },
      {
        month: "Agu",
        pendapatan: 78000000,
        cogs: 5000000,
        labaKotor: 73000000,
        pengeluaran: 37500000,
        labaBersih: 40500000,
        cashIn: 74000000,
        cashOut: 36000000,
        netCashFlow: 38000000
      },
      {
        month: "Sep",
        pendapatan: totalIncome || 82000000,
        cogs: totalCogs,
        labaKotor: grossProfit,
        pengeluaran: totalExpense || 39000000,
        labaBersih: netProfit || 43000000,
        cashIn: runningCashIn,
        cashOut: runningCashOut,
        netCashFlow: runningNetCashFlow
      }
    ];
  }, [totalIncome, totalExpense, netProfit, totalCogs, grossProfit, runningCashIn, runningCashOut, runningNetCashFlow]);

  // Balance Sheet items
  const currentAssets = [
    { name: "Kas Kecil (Petty Cash)", amount: bankAccounts.find((b) => b.type === "Kas")?.currentBalance || 15000000 },
    { name: "Bank BCA Operasional (024-889123)", amount: bankAccounts.find((b) => b.id === "bank-1")?.currentBalance || 145000000 },
    { name: "Bank Mandiri Payroll (137-009122)", amount: bankAccounts.find((b) => b.id === "bank-2")?.currentBalance || 68500000 },
    { name: "Bank BNI Penerimaan QRIS", amount: bankAccounts.find((b) => b.id === "bank-3")?.currentBalance || 32000000 },
    { name: "Piutang Usaha (AR Sewa Tamu)", amount: totalReceivables },
    { name: "Perlengkapan & Amenitas Kamar", amount: 12500000 },
    { name: "Pajak Masukan (PPN Dibayar Dimuka)", amount: 2450000 }
  ];

  const fixedAssets = [
    { name: "Tanah & Bangunan Properti", amount: 3850000000 },
    { name: "Akumulasi Penyusutan Bangunan", amount: 185000000, isContra: true },
    { name: "Furnitur & Perlengkapan Kamar", amount: 340000000 },
    { name: "Peralatan Elektronik & AC Kamar", amount: 180000000 },
    { name: "Akumulasi Penyusutan Peralatan", amount: 42000000, isContra: true }
  ];

  const currentLiabilities = [
    { name: "Hutang Usaha (Vendor / Supplier)", amount: totalPayables },
    { name: "Hutang Gaji Karyawan", amount: 0 },
    { name: "Titipan Deposit Jaminan Tenant", amount: 46000000 },
    { name: "Hutang Pajak (PPN & PPh Final Sewa)", amount: 5800000 }
  ];

  const longTermLiabilities = [
    { name: "Hutang Bank Jangka Panjang (KPR Gedung)", amount: 1250000000 }
  ];

  // Adjust Owner Capital dynamically so Neraca is balanced to the exact rupiah
  const sumCurrAssets = currentAssets.reduce((s, i) => s + i.amount, 0);
  const sumFixAssets = fixedAssets.reduce((s, i) => i.isContra ? s - i.amount : s + i.amount, 0);
  const targetTotalAssets = sumCurrAssets + sumFixAssets;

  const sumCurrLiab = currentLiabilities.reduce((s, i) => s + i.amount, 0);
  const sumLongLiab = longTermLiabilities.reduce((s, i) => s + i.amount, 0);
  const totalLiab = sumCurrLiab + sumLongLiab;

  const retainedEarnings = 512950000;
  const balancingEquity = targetTotalAssets - totalLiab - retainedEarnings - netProfit;

  const equityItems = [
    { name: "Modal Pemilik (Owner Capital)", amount: balancingEquity },
    { name: "Laba Ditahan (Retained Earnings)", amount: retainedEarnings }
  ];

  // Action Handlers
  const handleAddManualJournal = (entry: JournalEntry) => {
    setManualJournals((prev) => [entry, ...prev]);
    // Log to audit
    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance Staff",
      role: currentUser?.role || "Finance",
      action: "Input Jurnal Manual",
      details: `Menambahkan jurnal ${entry.journalNumber} (${entry.description})`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleAddPayable = (payable: VendorPayable) => {
    setVendorPayables((prev) => [payable, ...prev]);
    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance",
      role: currentUser?.role || "Finance",
      action: "Input Faktur Hutang",
      details: `Faktur ${payable.invoiceNumber} dari ${payable.vendorName} sebesar Rp ${payable.amount.toLocaleString("id-ID")}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handlePayVendor = (payableId: string, amount: number, method: string, refNumber: string) => {
    setVendorPayables((prev) =>
      prev.map((p) => {
        if (p.id === payableId) {
          const newPaid = p.paidAmount + amount;
          const newStatus = newPaid >= p.amount ? "Paid" : "Partial";
          return {
            ...p,
            paidAmount: newPaid,
            status: newStatus,
            paymentHistory: [
              ...p.paymentHistory,
              { date: new Date().toISOString().slice(0, 10), amount, method, refNumber }
            ]
          };
        }
        return p;
      })
    );

    // Also deduct bank balance
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (method.includes("BCA") && b.id === "bank-1") {
          return { ...b, currentBalance: b.currentBalance - amount };
        }
        if (method.includes("Mandiri") && b.id === "bank-2") {
          return { ...b, currentBalance: b.currentBalance - amount };
        }
        if (method.includes("Kas") && b.id === "bank-4") {
          return { ...b, currentBalance: b.currentBalance - amount };
        }
        return b;
      })
    );

    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance",
      role: currentUser?.role || "Finance",
      action: "Pembayaran Hutang Vendor",
      details: `Membayar hutang Rp ${amount.toLocaleString("id-ID")} via ${method} (Ref: ${refNumber})`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleTransferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number,
    notes: string
  ) => {
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === fromId) return { ...b, currentBalance: b.currentBalance - amount };
        if (b.id === toId) return { ...b, currentBalance: b.currentBalance + amount };
        return b;
      })
    );

    const fromAcc = bankAccounts.find((a) => a.id === fromId);
    const toAcc = bankAccounts.find((a) => a.id === toId);

    const newMutOut: BankMutation = {
      id: `mut-${Date.now()}-out`,
      accountId: fromId,
      date: new Date().toISOString(),
      description: `Transfer keluar ke ${toAcc?.bankName}: ${notes}`,
      type: "Out",
      amount,
      balanceAfter: (fromAcc?.currentBalance || 0) - amount,
      reconciled: true,
      reference: `TRF-${Date.now().toString().slice(-4)}`
    };

    const newMutIn: BankMutation = {
      id: `mut-${Date.now()}-in`,
      accountId: toId,
      date: new Date().toISOString(),
      description: `Transfer masuk dari ${fromAcc?.bankName}: ${notes}`,
      type: "In",
      amount,
      balanceAfter: (toAcc?.currentBalance || 0) + amount,
      reconciled: true,
      reference: `TRF-${Date.now().toString().slice(-4)}`
    };

    setBankMutations((prev) => [newMutOut, newMutIn, ...prev]);

    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance",
      role: currentUser?.role || "Finance",
      action: "Transfer Kas & Bank",
      details: `Transfer Rp ${amount.toLocaleString("id-ID")} dari ${fromAcc?.bankName} ke ${toAcc?.bankName}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleToggleReconcile = (mutationId: string) => {
    setBankMutations((prev) =>
      prev.map((m) => (m.id === mutationId ? { ...m, reconciled: !m.reconciled } : m))
    );
  };

  const handleUpdateBudget = (budgetId: string, newAmount: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, budgetedAmount: newAmount } : b))
    );
    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance",
      role: currentUser?.role || "Finance",
      action: "Update Anggaran",
      details: `Mengubah pagu anggaran ID ${budgetId} menjadi Rp ${newAmount.toLocaleString("id-ID")}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleTogglePeriodLock = (periodKey: string, lock: boolean, notes: string) => {
    setClosingPeriods((prev) =>
      prev.map((cp) => {
        if (cp.periodKey === periodKey) {
          return {
            ...cp,
            isLocked: lock,
            closedAt: lock ? new Date().toISOString() : undefined,
            closedBy: lock ? currentUser?.name || "Finance Head" : undefined,
            netIncomeCalculated: netProfit,
            notes
          };
        }
        return cp;
      })
    );

    const newLog: FinancialAuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      user: currentUser?.name || "Finance Head",
      role: currentUser?.role || "Finance",
      action: lock ? "Tutup Buku (Lock)" : "Buka Kunci Periode",
      details: `${lock ? "Mengunci" : "Membuka kunci"} periode ${periodKey} (${notes})`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = "No,Uraian,Debet,Kredit\n";
    const rows = allJournalEntries
      .flatMap((entry) =>
        entry.lines.map((l) => `${entry.journalNumber},"${entry.description} - ${l.accountName}",${l.debit},${l.credit}`)
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan-Keuangan-${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // Generate simple spreadsheet CSV format with Excel MIME
    const headers = "Periode,Kode Akun,Nama Akun,Saldo Normal,Saldo Berjalan\n";
    const rows = coaList.map((c) => `${selectedPeriod},${c.code},"${c.name}",${c.normalBalance},${c.currentBalance}`).join("\n");
    const blob = new Blob([headers + rows], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Neraca-Saldo-${selectedPeriod}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  // Sub-tab definitions
  const NAV_TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "laba-rugi", label: "Laba Rugi", icon: TrendingUp },
    { id: "neraca", label: "Neraca", icon: Scale },
    { id: "arus-kas", label: "Arus Kas", icon: DollarSign },
    { id: "buku-besar", label: "Buku Besar", icon: BookOpen },
    { id: "jurnal-umum", label: "Jurnal Umum", icon: FileText },
    { id: "piutang", label: "Piutang (AR)", icon: Clock },
    { id: "hutang", label: "Hutang (AP)", icon: CreditCard },
    { id: "kas-bank", label: "Kas & Bank", icon: Wallet },
    { id: "pajak", label: "Laporan Pajak", icon: Receipt },
    { id: "pendapatan", label: "Pendapatan", icon: Layers },
    { id: "pengeluaran", label: "Pengeluaran", icon: PieChart },
    { id: "budget", label: "Budgeting", icon: Target },
    { id: "closing", label: "Tutup Buku", icon: Lock }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 space-y-6">
      {/* 1. FINANCIAL MODULE TOP HEADER */}
      <FinancialHeader
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        properties={properties}
        isPeriodLocked={isPeriodLocked}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
        onRefresh={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* 2. SUB-NAVIGATION TABS (HORIZONTAL SCROLLABLE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FinancialSubTab)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ACTIVE SUB-TAB CONTENT VIEW */}
        <div>
          {activeTab === "dashboard" && (
            <FinancialDashboardTab
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              grossProfit={grossProfit}
              netProfit={netProfit}
              totalCogs={totalCogs}
              runningCashIn={runningCashIn}
              runningCashOut={runningCashOut}
              runningNetCashFlow={runningNetCashFlow}
              totalCashAndBank={totalCashAndBank}
              totalReceivables={totalReceivables}
              totalPayables={totalPayables}
              monthlyTrends={monthlyTrends}
              onNavigateToTab={(tabId) => setActiveTab(tabId as FinancialSubTab)}
            />
          )}

          {activeTab === "laba-rugi" && (
            <IncomeStatementTab
              revenueItems={revenueItems}
              cogsItems={cogsItems}
              opexItems={opexItems}
              otherExpenseItems={otherExpenseItems}
              periodLabel={selectedPeriod}
              previousPeriodLabel="2026-08 (Bulan Lalu)"
            />
          )}

          {activeTab === "neraca" && (
            <BalanceSheetTab
              currentAssets={currentAssets}
              fixedAssets={fixedAssets}
              currentLiabilities={currentLiabilities}
              longTermLiabilities={longTermLiabilities}
              equityItems={equityItems}
              netIncomeCurrentYear={netProfit}
            />
          )}

          {activeTab === "arus-kas" && (
            <CashFlowTab
              operatingInflows={operatingInflows}
              operatingOutflows={operatingOutflows}
              investingInflows={investingInflows}
              investingOutflows={investingOutflows}
              financingInflows={financingInflows}
              financingOutflows={financingOutflows}
              initialCashBalance={225000000}
            />
          )}

          {activeTab === "buku-besar" && (
            <GeneralLedgerTab coaList={coaList} journalEntries={allJournalEntries} />
          )}

          {activeTab === "jurnal-umum" && (
            <GeneralJournalTab
              journalEntries={allJournalEntries}
              coaList={coaList}
              onAddManualJournal={handleAddManualJournal}
              isPeriodLocked={isPeriodLocked}
            />
          )}

          {activeTab === "piutang" && (
            <AccountsReceivableTab
              invoices={filteredInvoices}
              tenants={tenants}
              units={units}
              onRecordPayment={onRecordPayment || (() => {})}
              onSendReminder={onSendReminder || (() => {})}
            />
          )}

          {activeTab === "hutang" && (
            <AccountsPayableTab
              vendorPayables={vendorPayables}
              onAddPayable={handleAddPayable}
              onPayVendor={handlePayVendor}
              isPeriodLocked={isPeriodLocked}
            />
          )}

          {activeTab === "kas-bank" && (
            <CashAndBankTab
              bankAccounts={bankAccounts}
              bankMutations={bankMutations}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onToggleReconcile={handleToggleReconcile}
              isPeriodLocked={isPeriodLocked}
            />
          )}

          {activeTab === "pajak" && (
            <TaxReportTab
              invoices={filteredInvoices}
              expenses={filteredExpenses}
              periodLabel={selectedPeriod}
            />
          )}

          {activeTab === "pendapatan" && (
            <RevenueReportTab
              invoices={filteredInvoices}
              tenants={tenants}
              properties={properties}
              units={units}
            />
          )}

          {activeTab === "pengeluaran" && (
            <ExpenseReportTab expenses={filteredExpenses} vendorPayables={vendorPayables} />
          )}

          {activeTab === "budget" && (
            <BudgetingTab
              budgets={budgets}
              expenses={filteredExpenses}
              onUpdateBudget={handleUpdateBudget}
              isPeriodLocked={isPeriodLocked}
            />
          )}

          {activeTab === "closing" && (
            <ClosingPeriodTab
              closingPeriods={closingPeriods}
              auditLogs={auditLogs}
              currentPeriod={selectedPeriod}
              netIncomeCurrent={netProfit}
              onTogglePeriodLock={handleTogglePeriodLock}
              userRole={currentUser?.role || "Finance"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
