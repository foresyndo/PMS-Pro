import React, { useState } from "react";
import { Plus, CreditCard, Search, CheckCircle2, AlertTriangle, Clock, ChevronDown } from "lucide-react";
import { VendorPayable } from "../../types";

interface AccountsPayableTabProps {
  vendorPayables: VendorPayable[];
  onAddPayable: (payable: VendorPayable) => void;
  onPayVendor: (payableId: string, amount: number, method: string, refNumber: string) => void;
  isPeriodLocked: boolean;
}

export default function AccountsPayableTab({
  vendorPayables,
  onAddPayable,
  onPayVendor,
  isPeriodLocked
}: AccountsPayableTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingPayable, setPayingPayable] = useState<VendorPayable | null>(null);

  // Add Payable Form
  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [amount, setAmount] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Transfer BCA");
  const [payRef, setPayRef] = useState("");

  const totalOutstanding = vendorPayables.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const totalPaid = vendorPayables.reduce((sum, p) => sum + p.paidAmount, 0);

  const handleSavePayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !invoiceNumber || amount <= 0) return;

    const newPayable: VendorPayable = {
      id: `ap-${Date.now()}`,
      vendorName,
      invoiceNumber,
      category,
      amount: Number(amount),
      paidAmount: 0,
      invoiceDate,
      dueDate: dueDate || invoiceDate,
      status: "Unpaid",
      notes,
      paymentHistory: []
    };

    onAddPayable(newPayable);
    setIsAddModalOpen(false);
    setVendorName("");
    setInvoiceNumber("");
    setAmount(0);
    setNotes("");
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayable || payAmount <= 0) return;
    onPayVendor(payingPayable.id, Number(payAmount), payMethod, payRef || `TRX-${Date.now().toString().slice(-4)}`);
    setPayingPayable(null);
    setPayAmount(0);
  };

  const filtered = vendorPayables.filter((p) => {
    const matchSearch =
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Sisa Hutang Vendor (Outstanding)
          </span>
          <span className="text-xl font-black font-mono text-purple-900 block mt-1">
            Rp {totalOutstanding.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-purple-600 font-semibold">Kewajiban Tempo Berjalan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Hutang Terbayar Periode Ini
          </span>
          <span className="text-xl font-black font-mono text-emerald-800 block mt-1">
            Rp {totalPaid.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">Realisasi Pengeluaran Kas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Daftar Faktur Hutang
            </span>
            <span className="text-xl font-black font-mono text-slate-900 block mt-1">
              {vendorPayables.length} Tagihan
            </span>
            <span className="text-[11px] text-slate-500">Vendor & Kontraktor Aktif</span>
          </div>
          <button
            disabled={isPeriodLocked}
            onClick={() => setIsAddModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPeriodLocked
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Catat Tagihan Vendor</span>
          </button>
        </div>
      </div>

      {/* AP TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-extrabold text-slate-800">
              Buku Hutang Usaha Vendor (Accounts Payable Ledger)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Pengelolaan tagihan supplier, jatuh tempo, dan historis pembayaran
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari vendor / invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Unpaid">Belum Lunas</option>
              <option value="Partial">Dicicil Sebagian</option>
              <option value="Overdue">Jatuh Tempo</option>
              <option value="Paid">Lunas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Nama Vendor / Supplier</th>
                <th className="py-3 px-4">No. Invoice & Kategori</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Hutang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data hutang vendor yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const outstanding = p.amount - p.paidAmount;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.vendorName}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 block">{p.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">{p.category}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.dueDate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        Rp {p.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        Rp {p.paidAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-purple-900">
                        Rp {outstanding.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "Partial"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : p.status === "Overdue"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {outstanding > 0 ? (
                          <button
                            disabled={isPeriodLocked}
                            onClick={() => {
                              setPayingPayable(p);
                              setPayAmount(outstanding);
                            }}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                              isPeriodLocked
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                            }`}
                          >
                            Bayar
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT HUTANG BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-base">
                Catat Tagihan Vendor / Supplier Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayable} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Vendor / Supplier</label>
                <input
                  type="text"
                  placeholder="Contoh: PT Sejuk Abadi Mandiri"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. Invoice Vendor</label>
                  <input
                    type="text"
                    placeholder="INV-VENDOR-01"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-medium"
                  >
                    <option value="Maintenance">Maintenance & AC</option>
                    <option value="Operasional">Operasional Properti</option>
                    <option value="Housekeeping">Housekeeping & Linen</option>
                    <option value="Renovasi">Renovasi Bangunan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nilai Tagihan (IDR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tgl Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Keterangan / Deskripsi Pekerjaan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan barang/jasa yang dikerjakan vendor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Faktur Hutang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAYAR HUTANG */}
      {payingPayable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-slate-800 text-base">
                  Pembayaran Hutang Vendor
                </h3>
                <p className="text-xs text-slate-500 font-medium">{payingPayable.vendorName}</p>
              </div>
              <button
                onClick={() => setPayingPayable(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>No. Faktur:</span>
                  <strong className="font-mono text-purple-900">{payingPayable.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Sisa Tagihan:</span>
                  <strong className="font-mono text-purple-900">
                    Rp {(payingPayable.amount - payingPayable.paidAmount).toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nominal yang Dibayarkan (IDR)</label>
                <input
                  type="number"
                  max={payingPayable.amount - payingPayable.paidAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium"
                  >
                    <option value="Transfer BCA">Transfer BCA (024-889123)</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="Kas Kecil">Kas Kecil (Petty Cash)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. Ref Bukti Transfer</label>
                  <input
                    type="text"
                    placeholder="TRX-BCA-..."
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingPayable(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
