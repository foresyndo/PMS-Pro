import {
  ChartOfAccount,
  BankAccount,
  BankMutation,
  VendorPayable,
  FinancialBudget,
  FinancialClosingPeriod,
  FinancialAuditLog,
  JournalEntry,
  Invoice,
  PaymentLog,
  Expense,
  Payroll
} from "./types";

export const INITIAL_COA: ChartOfAccount[] = [
  // Aset Lancar (1-1xx)
  { code: "1-101", name: "Kas Kecil (Petty Cash)", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 15000000, currentBalance: 15000000, description: "Kas fisik di meja resepsionis" },
  { code: "1-102", name: "Bank BCA Operasional (024-889123)", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 145000000, currentBalance: 145000000, description: "Rekening operasional utama" },
  { code: "1-103", name: "Bank Mandiri Payroll (137-009122)", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 68500000, currentBalance: 68500000, description: "Rekening penampung penggajian" },
  { code: "1-104", name: "Bank BNI Penerimaan QRIS", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 32000000, currentBalance: 32000000, description: "Rekening merchant QRIS & EDC" },
  { code: "1-105", name: "Piutang Usaha (AR Sewa)", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Faktur tagihan sewa belum lunas" },
  { code: "1-106", name: "Perlengkapan & Amenitas", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 12500000, currentBalance: 12500000, description: "Stok linen, sabun, amenities kamar" },
  { code: "1-107", name: "Pajak Masukan (PPN Dibayar)", category: "Aset Lancar", normalBalance: "Debit", initialBalance: 2450000, currentBalance: 2450000, description: "PPN masukan pembelian inventaris" },

  // Aset Tetap (1-2xx)
  { code: "1-201", name: "Tanah & Bangunan Properti", category: "Aset Tetap", normalBalance: "Debit", initialBalance: 3850000000, currentBalance: 3850000000, description: "Nilai perolehan gedung properti" },
  { code: "1-202", name: "Akumulasi Penyusutan Bangunan", category: "Aset Tetap", normalBalance: "Kredit", initialBalance: 185000000, currentBalance: 185000000, description: "Akumulasi depresiasi gedung" },
  { code: "1-203", name: "Furnitur & Perlengkapan Kamar", category: "Aset Tetap", normalBalance: "Debit", initialBalance: 340000000, currentBalance: 340000000, description: "Springbed, lemari, meja unit" },
  { code: "1-204", name: "Peralatan Elektronik & AC", category: "Aset Tetap", normalBalance: "Debit", initialBalance: 180000000, currentBalance: 180000000, description: "AC inverter, smart TV, kulkas" },
  { code: "1-205", name: "Akumulasi Penyusutan Peralatan", category: "Aset Tetap", normalBalance: "Kredit", initialBalance: 42000000, currentBalance: 42000000, description: "Depresiasi perlengkapan & AC" },

  // Liabilitas (2-xxx)
  { code: "2-101", name: "Hutang Usaha (Vendor / Supplier)", category: "Liabilitas Jangka Pendek", normalBalance: "Kredit", initialBalance: 18500000, currentBalance: 18500000, description: "Tagihan supplier belum dibayar" },
  { code: "2-102", name: "Hutang Gaji Karyawan", category: "Liabilitas Jangka Pendek", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Akrual beban gaji bulan berjalan" },
  { code: "2-103", name: "Deposit Jaminan Tenant (Security)", category: "Liabilitas Jangka Pendek", normalBalance: "Kredit", initialBalance: 46000000, currentBalance: 46000000, description: "Titipan deposit sewa penyewa" },
  { code: "2-104", name: "Hutang Pajak (PPN Keluaran & PPh)", category: "Liabilitas Jangka Pendek", normalBalance: "Kredit", initialBalance: 5800000, currentBalance: 5800000, description: "Kewajiban pajak belum disetor" },
  { code: "2-201", name: "Hutang Bank Jangka Panjang (KPR)", category: "Liabilitas Jangka Panjang", normalBalance: "Kredit", initialBalance: 1250000000, currentBalance: 1250000000, description: "Fasilitas pinjaman perbankan" },

  // Ekuitas (3-xxx)
  { code: "3-101", name: "Modal Pemilik (Owner Capital)", category: "Ekuitas", normalBalance: "Kredit", initialBalance: 2500000000, currentBalance: 2500000000, description: "Modal awal investasi properti" },
  { code: "3-102", name: "Laba Ditahan (Retained Earnings)", category: "Ekuitas", normalBalance: "Kredit", initialBalance: 512950000, currentBalance: 512950000, description: "Akumulasi laba tahun-tahun sebelumnya" },
  { code: "3-103", name: "Laba / Rugi Periode Berjalan", category: "Ekuitas", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Hasil kinerja laba rugi tahun ini" },

  // Pendapatan (4-xxx)
  { code: "4-101", name: "Pendapatan Sewa Kamar & Unit", category: "Pendapatan", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Penerimaan sewa bulanan & harian" },
  { code: "4-102", name: "Pendapatan Layanan & Laundry", category: "Pendapatan", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Layanan cuci, setrika & dry clean" },
  { code: "4-103", name: "Pendapatan Denda Keterlambatan", category: "Pendapatan", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Biaya late payment invoice" },
  { code: "4-104", name: "Pendapatan Operasional Lain", category: "Pendapatan", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Parkir, vending machine, meeting room" },

  // HPP / Beban Pokok (5-xxx)
  { code: "5-101", name: "HPP Perlengkapan & Linen Tamu", category: "HPP", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Biaya konsumsi amenities & laundry" },

  // Beban Operasional (6-xxx)
  { code: "6-101", name: "Beban Gaji & Upah Karyawan", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Gaji staf front office, hk, security" },
  { code: "6-102", name: "Beban Listrik & PLN", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Tagihan listrik PLN gedung" },
  { code: "6-103", name: "Beban Air & PDAM", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Tagihan air bersih PDAM" },
  { code: "6-104", name: "Beban Internet & TV Kabel", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Langganan internet fiber optik" },
  { code: "6-105", name: "Beban Pemeliharaan & AC", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Servis AC rutin, plumbing, perbaikan" },
  { code: "6-106", name: "Beban Housekeeping & Kebersihan", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Bahan kimia pembersih, desinfektan" },
  { code: "6-107", name: "Beban Pemasaran & Komisi OTA", category: "Beban Operasional", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Iklan medsos, fee portal booking" },

  // Beban Lainnya (7-xxx)
  { code: "7-101", name: "Beban Administrasi Bank", category: "Beban Lainnya", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Biaya transfer, MDR EDC, QRIS" },
  { code: "7-102", name: "Beban Bunga Pinjaman Bank", category: "Beban Lainnya", normalBalance: "Debit", initialBalance: 0, currentBalance: 0, description: "Bunga angsuran KPR bulanan" },
  { code: "7-201", name: "Pendapatan Bunga Bank", category: "Beban Lainnya", normalBalance: "Kredit", initialBalance: 0, currentBalance: 0, description: "Jasa giro & bunga rekening bank" }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "bank-1",
    bankName: "BCA Giro Operasional",
    accountNumber: "024-88912300",
    accountHolder: "PT Properti Manajemen Mandiri",
    currentBalance: 145000000,
    reconciledBalance: 145000000,
    lastReconciledAt: "2026-09-01T09:00:00Z",
    type: "Bank"
  },
  {
    id: "bank-2",
    bankName: "Mandiri Escrow & Payroll",
    accountNumber: "137-00912234",
    accountHolder: "PT Properti Manajemen Mandiri",
    currentBalance: 68500000,
    reconciledBalance: 68500000,
    lastReconciledAt: "2026-09-01T09:00:00Z",
    type: "Bank"
  },
  {
    id: "bank-3",
    bankName: "BNI Merchant QRIS & EDC",
    accountNumber: "088-23490011",
    accountHolder: "PMS Properti Reception",
    currentBalance: 32000000,
    reconciledBalance: 31850000,
    lastReconciledAt: "2026-08-31T17:00:00Z",
    type: "Bank"
  },
  {
    id: "bank-4",
    bankName: "Kas Kecil Resepsionis (Petty Cash)",
    accountNumber: "CASH-FRONT-01",
    accountHolder: "Kasir Front Office",
    currentBalance: 15000000,
    reconciledBalance: 15000000,
    lastReconciledAt: "2026-09-04T08:00:00Z",
    type: "Kas"
  }
];

export const INITIAL_BANK_MUTATIONS: BankMutation[] = [
  {
    id: "mut-101",
    accountId: "bank-1",
    date: "2026-09-01T10:00:00Z",
    description: "Penerimaan Sewa Tenant Kamar 201 via Transfer BCA",
    type: "In",
    amount: 4500000,
    balanceAfter: 145000000,
    reconciled: true,
    reference: "TRX-BCA-9921"
  },
  {
    id: "mut-102",
    accountId: "bank-1",
    date: "2026-09-02T14:30:00Z",
    description: "Pembayaran Tagihan Listrik PLN Pasca Bayar",
    type: "Out",
    amount: 3200000,
    balanceAfter: 141800000,
    reconciled: true,
    reference: "PLN-SEPT-2026"
  },
  {
    id: "mut-103",
    accountId: "bank-3",
    date: "2026-09-03T11:15:00Z",
    description: "Settlement QRIS Kasir Resepsionis Booking Kamar",
    type: "In",
    amount: 2100000,
    balanceAfter: 32000000,
    reconciled: false,
    reference: "QRIS-BATCH-03"
  },
  {
    id: "mut-104",
    accountId: "bank-4",
    date: "2026-09-03T16:00:00Z",
    description: "Beli Alat Tulis Kantor & Kertas Struk Kasir",
    type: "Out",
    amount: 350000,
    balanceAfter: 14650000,
    reconciled: true,
    reference: "KAS-REC-001"
  }
];

export const INITIAL_VENDOR_PAYABLES: VendorPayable[] = [
  {
    id: "ap-01",
    vendorName: "PT Sejuk Abadi Mandiri (HVAC & AC)",
    invoiceNumber: "INV-SAM-8891",
    category: "Maintenance",
    amount: 6800000,
    paidAmount: 3000000,
    invoiceDate: "2026-08-20",
    dueDate: "2026-09-10",
    status: "Partial",
    notes: "Kontrak pembersihan & penggantian freon 12 unit AC",
    paymentHistory: [
      { date: "2026-08-25", amount: 3000000, method: "Transfer BCA", refNumber: "TRX-BCA-771" }
    ]
  },
  {
    id: "ap-02",
    vendorName: "CV Tirta Berkah Jaya (Supplier Air Galon & Gas)",
    invoiceNumber: "INV-TBJ-2026",
    category: "Operasional",
    amount: 2450000,
    paidAmount: 0,
    invoiceDate: "2026-08-28",
    dueDate: "2026-09-12",
    status: "Unpaid",
    notes: "Pasokan air minum galon pantry dan gas water heater",
    paymentHistory: []
  },
  {
    id: "ap-03",
    vendorName: "PT Kilau Prima Linen (Laundry & Dry Clean)",
    invoiceNumber: "INV-KPL-0941",
    category: "Housekeeping",
    amount: 4200000,
    paidAmount: 4200000,
    invoiceDate: "2026-08-15",
    dueDate: "2026-08-30",
    status: "Paid",
    notes: "Laundry sprei, duvet cover, dan handuk kamar hotel",
    paymentHistory: [
      { date: "2026-08-29", amount: 4200000, method: "Transfer Mandiri", refNumber: "TRX-MND-442" }
    ]
  },
  {
    id: "ap-04",
    vendorName: "CV Mitra Baja Konstruksi (Perbaikan Atap)",
    invoiceNumber: "INV-MBK-110",
    category: "Maintenance",
    amount: 7500000,
    paidAmount: 0,
    invoiceDate: "2026-07-25",
    dueDate: "2026-08-15",
    status: "Overdue",
    notes: "Renovasi kanopi lobby & talang air",
    paymentHistory: []
  }
];

export const INITIAL_BUDGETS: FinancialBudget[] = [
  { id: "bg-1", category: "Maintenance", department: "Maintenance", period: "2026-09", budgetedAmount: 12000000 },
  { id: "bg-2", category: "Salary", department: "HR & Payroll", period: "2026-09", budgetedAmount: 45000000 },
  { id: "bg-3", category: "Electricity", department: "Engineering", period: "2026-09", budgetedAmount: 18000000 },
  { id: "bg-4", category: "Water", department: "Engineering", period: "2026-09", budgetedAmount: 4500000 },
  { id: "bg-5", category: "Internet", department: "IT / Resepsionis", period: "2026-09", budgetedAmount: 3500000 },
  { id: "bg-6", category: "Operasional", department: "Front Office", period: "2026-09", budgetedAmount: 8000000 },
  { id: "bg-7", category: "Housekeeping", department: "Housekeeping", period: "2026-09", budgetedAmount: 6500000 }
];

export const INITIAL_CLOSING_PERIODS: FinancialClosingPeriod[] = [
  {
    periodKey: "2026-07",
    type: "Monthly",
    isLocked: true,
    closedAt: "2026-08-05T10:00:00Z",
    closedBy: "Budi Santoso (Finance)",
    netIncomeCalculated: 48900000,
    notes: "Tutup buku bulan Juli 2026 tervalidasi tuntas."
  },
  {
    periodKey: "2026-08",
    type: "Monthly",
    isLocked: true,
    closedAt: "2026-09-02T11:30:00Z",
    closedBy: "Budi Santoso (Finance)",
    netIncomeCalculated: 54300000,
    notes: "Tutup buku bulan Agustus 2026 tervalidasi tuntas."
  },
  {
    periodKey: "2026-09",
    type: "Monthly",
    isLocked: false,
    netIncomeCalculated: 0,
    notes: "Periode aktif berjalan."
  }
];

export const INITIAL_FINANCIAL_AUDIT_LOGS: FinancialAuditLog[] = [
  {
    id: "aud-01",
    timestamp: "2026-09-04 14:10:22",
    user: "Sahrul Viona",
    role: "Owner",
    action: "Review Laporan Keuangan",
    details: "Membuka modul Laporan Keuangan & analisis Neraca kuartal 3"
  },
  {
    id: "aud-02",
    timestamp: "2026-09-03 16:45:10",
    user: "Budi Santoso",
    role: "Finance",
    action: "Rekonsiliasi Bank BCA",
    details: "Mencocokkan saldo buku besar Bank BCA dengan e-statement mutasi bank"
  },
  {
    id: "aud-03",
    timestamp: "2026-09-02 11:30:00",
    user: "Budi Santoso",
    role: "Finance",
    action: "Tutup Buku Bulanan (Closing)",
    details: "Melakukan lock transaksi periode Agustus 2026 (Net Profit Rp 54.300.000)"
  },
  {
    id: "aud-04",
    timestamp: "2026-09-01 09:15:40",
    user: "Siti Rahma",
    role: "Receptionist",
    action: "Posting Faktur Sewa",
    details: "Menerbitkan invoice billing tamu dan auto-generate jurnal pendapatan sewa"
  }
];

// Helper to synthesize automatic journal entries from system data
export function generateAutoJournalEntries(
  invoices: Invoice[],
  payments: PaymentLog[],
  expenses: Expense[],
  payrollList: Payroll[]
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // 1. Invoices -> Piutang (Debit) vs Pendapatan Sewa (Kredit) + Hutang PPN (Kredit)
  invoices.forEach((inv, idx) => {
    const taxAmt = inv.tax || 0;
    const subtotal = inv.subtotal || (inv.totalAmount - taxAmt);
    
    entries.push({
      id: `jrn-inv-${inv.id}`,
      journalNumber: `JU/INV/${inv.createdAt.slice(0, 10).replace(/-/g, "")}/${String(idx + 1).padStart(3, "0")}`,
      date: inv.createdAt.slice(0, 10),
      description: `Pengakuan Piutang Sewa atas ${inv.invoiceNumber}`,
      referenceType: "Invoice",
      referenceId: inv.id,
      createdBy: "Auto System (PMS)",
      lines: [
        {
          accountCode: "1-105",
          accountName: "Piutang Usaha (AR Sewa)",
          debit: inv.totalAmount,
          credit: 0
        },
        {
          accountCode: "4-101",
          accountName: "Pendapatan Sewa Kamar & Unit",
          debit: 0,
          credit: subtotal
        },
        ...(taxAmt > 0 ? [{
          accountCode: "2-104",
          accountName: "Hutang Pajak (PPN Keluaran)",
          debit: 0,
          credit: taxAmt
        }] : [])
      ]
    });
  });

  // 2. Payments -> Kas/Bank (Debit) vs Piutang Usaha (Kredit)
  payments.forEach((pay, idx) => {
    let bankCode = "1-102"; // default Bank BCA
    let bankName = "Bank BCA Operasional (024-889123)";
    if (pay.method === "Cash") {
      bankCode = "1-101";
      bankName = "Kas Kecil (Petty Cash)";
    } else if (pay.method === "QRIS" || pay.method === "EDC") {
      bankCode = "1-104";
      bankName = "Bank BNI Penerimaan QRIS";
    }

    entries.push({
      id: `jrn-pay-${pay.id}`,
      journalNumber: `JU/PAY/${pay.paymentDate.slice(0, 10).replace(/-/g, "")}/${String(idx + 1).padStart(3, "0")}`,
      date: pay.paymentDate.slice(0, 10),
      description: `Penerimaan Pembayaran Sewa No. Ref ${pay.transactionNumber} (${pay.method})`,
      referenceType: "Payment",
      referenceId: pay.id,
      createdBy: "Auto System (Kasir)",
      lines: [
        {
          accountCode: bankCode,
          accountName: bankName,
          debit: pay.amount,
          credit: 0
        },
        {
          accountCode: "1-105",
          accountName: "Piutang Usaha (AR Sewa)",
          debit: 0,
          credit: pay.amount
        }
      ]
    });
  });

  // 3. Expenses -> Beban Operasional (Debit) vs Kas/Bank (Kredit)
  expenses.forEach((exp, idx) => {
    let expCode = "6-105";
    let expName = "Beban Pemeliharaan & AC";
    if (exp.category === "Electricity") {
      expCode = "6-102";
      expName = "Beban Listrik & PLN";
    } else if (exp.category === "Water") {
      expCode = "6-103";
      expName = "Beban Air & PDAM";
    } else if (exp.category === "Internet") {
      expCode = "6-104";
      expName = "Beban Internet & TV Kabel";
    } else if (exp.category === "Salary") {
      expCode = "6-101";
      expName = "Beban Gaji & Upah Karyawan";
    } else {
      expCode = "6-106";
      expName = "Beban Housekeeping & Kebersihan";
    }

    entries.push({
      id: `jrn-exp-${exp.id}`,
      journalNumber: `JU/EXP/${exp.expenseDate.slice(0, 10).replace(/-/g, "")}/${String(idx + 1).padStart(3, "0")}`,
      date: exp.expenseDate.slice(0, 10),
      description: `Beban ${exp.category}: ${exp.description}`,
      referenceType: "Expense",
      referenceId: exp.id,
      createdBy: exp.createdBy || "Finance",
      lines: [
        {
          accountCode: expCode,
          accountName: expName,
          debit: exp.amount,
          credit: 0
        },
        {
          accountCode: "1-102",
          accountName: "Bank BCA Operasional (024-889123)",
          debit: 0,
          credit: exp.amount
        }
      ]
    });
  });

  // 4. Payroll Records -> Beban Gaji (Debit) vs Bank Mandiri Payroll (Kredit)
  payrollList.filter(p => p.status === "Paid").forEach((pay, idx) => {
    entries.push({
      id: `jrn-prl-${pay.id}`,
      journalNumber: `JU/PRL/202609/${String(idx + 1).padStart(3, "0")}`,
      date: pay.paymentDate ? pay.paymentDate.slice(0, 10) : "2026-09-01",
      description: `Pembayaran Payroll Gaji Pegawai ID ${pay.employeeId} (${pay.month})`,
      referenceType: "Payroll",
      referenceId: pay.id,
      createdBy: "HR / Finance",
      lines: [
        {
          accountCode: "6-101",
          accountName: "Beban Gaji & Upah Karyawan",
          debit: pay.netSalary,
          credit: 0
        },
        {
          accountCode: "1-103",
          accountName: "Bank Mandiri Payroll (137-009122)",
          debit: 0,
          credit: pay.netSalary
        }
      ]
    });
  });

  // Sort descending by date
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
