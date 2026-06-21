import React, { useState } from "react";
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
  FileText
} from "lucide-react";
import { Invoice, PaymentLog, Expense, Tenant, Property, Unit, PaymentMethod, PaymentStatus, ExpenseCategory } from "../types";

interface FinanceModuleProps {
  invoices: Invoice[];
  payments: PaymentLog[];
  expenses: Expense[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
  onAddInvoice: (inv: Invoice) => void;
  onAddPayment: (pay: PaymentLog) => void;
  onAddExpense: (exp: Expense) => void;
  onUpdateInvoiceStatus: (id: string, status: PaymentStatus) => void;
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
  onAddInvoice,
  onAddPayment,
  onAddExpense,
  onUpdateInvoiceStatus,
  prefilledUnitId,
  onClearPrefill
}: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "reports">("invoices");
  
  // Modals state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

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
    alert("Invoice bulanan berhasil di-generate secara otomatis.");
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
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Indonesian Profit & Loss Statement (Laporan Laba Rugi)</h3>
              <p className="text-xs text-gray-400">Pernyataan pembukuan konsolidasi PMS Pro Periode Berjalan</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-3 py-1 font-extrabold rounded-full uppercase">Standard IFRS</span>
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
    </div>
  );
}
