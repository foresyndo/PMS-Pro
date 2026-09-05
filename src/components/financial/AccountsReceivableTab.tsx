import React, { useState } from "react";
import { Clock, AlertCircle, CheckCircle2, MessageSquare, Search, Filter } from "lucide-react";
import { Invoice, Tenant, Unit } from "../../types";

interface AccountsReceivableTabProps {
  invoices: Invoice[];
  tenants: Tenant[];
  units: Unit[];
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
}

export default function AccountsReceivableTab({
  invoices,
  tenants,
  units,
  onRecordPayment,
  onSendReminder
}: AccountsReceivableTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [agingFilter, setAgingFilter] = useState<string>("ALL");

  const today = new Date();

  // Helper for Aging category
  const getAgingInfo = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { category: "Current (Belum Jatuh Tempo)", days: 0, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (diffDays <= 30) return { category: "1 - 30 Hari", days: diffDays, color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (diffDays <= 60) return { category: "31 - 60 Hari", days: diffDays, color: "text-orange-700 bg-orange-50 border-orange-200" };
    if (diffDays <= 90) return { category: "61 - 90 Hari", days: diffDays, color: "text-rose-700 bg-rose-50 border-rose-200" };
    return { category: "> 90 Hari (Macet)", days: diffDays, color: "text-red-900 bg-red-100 border-red-300" };
  };

  // Only unpaid / overdue invoices
  const unpaidInvoices = invoices.filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue");

  // Aging totals
  let bucketCurrent = 0;
  let bucket1_30 = 0;
  let bucket31_60 = 0;
  let bucket61_90 = 0;
  let bucketOver90 = 0;

  unpaidInvoices.forEach((inv) => {
    const aging = getAgingInfo(inv.dueDate);
    if (aging.category.startsWith("Current")) bucketCurrent += inv.totalAmount;
    else if (aging.category === "1 - 30 Hari") bucket1_30 += inv.totalAmount;
    else if (aging.category === "31 - 60 Hari") bucket31_60 += inv.totalAmount;
    else if (aging.category === "61 - 90 Hari") bucket61_90 += inv.totalAmount;
    else bucketOver90 += inv.totalAmount;
  });

  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const filteredInvoices = unpaidInvoices.filter((inv) => {
    const tenant = tenants.find((t) => t.id === inv.tenantId);
    const unit = units.find((u) => u.id === inv.unitId);
    const aging = getAgingInfo(inv.dueDate);

    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant && tenant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (unit && unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAging =
      agingFilter === "ALL" ||
      (agingFilter === "current" && aging.category.startsWith("Current")) ||
      (agingFilter === "1-30" && aging.category === "1 - 30 Hari") ||
      (agingFilter === "31-60" && aging.category === "31 - 60 Hari") ||
      (agingFilter === "61-90" && aging.category === "61 - 90 Hari") ||
      (agingFilter === "over90" && aging.category.startsWith("> 90"));

    return matchSearch && matchAging;
  });

  return (
    <div className="space-y-6">
      {/* AGING SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Piutang (AR)</span>
          <span className="text-base font-black font-mono text-slate-900 block mt-1">
            Rp {totalOutstanding.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-500">{unpaidInvoices.length} Faktur Tertunggak</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 block uppercase">Current (&lt; Jatuh Tempo)</span>
          <span className="text-sm font-black font-mono text-emerald-800 block mt-1">
            Rp {bucketCurrent.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400">Jatuh tempo mendatang</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 block uppercase">1 - 30 Hari</span>
          <span className="text-sm font-black font-mono text-amber-800 block mt-1">
            Rp {bucket1_30.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400">Terlambat awal</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-orange-600 block uppercase">31 - 60 Hari</span>
          <span className="text-sm font-black font-mono text-orange-800 block mt-1">
            Rp {bucket31_60.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400">Peringatan ke-2</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 block uppercase">61 - 90 Hari</span>
          <span className="text-sm font-black font-mono text-rose-800 block mt-1">
            Rp {bucket61_90.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400">Surat Peringatan 3</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-red-700 block uppercase">&gt; 90 Hari (Macet)</span>
          <span className="text-sm font-black font-mono text-red-900 block mt-1">
            Rp {bucketOver90.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-red-600 font-bold">Potensi Bad Debt</span>
        </div>
      </div>

      {/* AR TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-extrabold text-slate-800">
              Daftar Piutang Sewa & Umur Piutang (AR Aging Schedule)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Monitoring jatuh tempo dan penagihan kas masuk dari penyewa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tenant / faktur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
              />
            </div>

            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Umur Piutang</option>
              <option value="current">Current (&lt; Jatuh Tempo)</option>
              <option value="1-30">1 - 30 Hari</option>
              <option value="31-60">31 - 60 Hari</option>
              <option value="61-90">61 - 90 Hari</option>
              <option value="over90">&gt; 90 Hari (Macet)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Nama Penyewa / Tenant</th>
                <th className="py-3 px-4">Unit / Kamar</th>
                <th className="py-3 px-4">Tgl Jatuh Tempo</th>
                <th className="py-3 px-4 text-center">Umur Piutang</th>
                <th className="py-3 px-4 text-right">Nilai Tagihan (IDR)</th>
                <th className="py-3 px-4 text-center">Aksi Penagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada piutang atau faktur belum lunas pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const tenant = tenants.find((t) => t.id === inv.tenantId);
                  const unit = units.find((u) => u.id === inv.unitId);
                  const aging = getAgingInfo(inv.dueDate);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{tenant?.name || "Penyewa"}</td>
                      <td className="py-3 px-4 text-slate-600">Unit {unit?.unitNumber || "-"}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${aging.color}`}>
                          {aging.category} {aging.days > 0 ? `(+${aging.days} hr)` : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-800">
                        Rp {inv.totalAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSendReminder(inv)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer"
                            title="Kirim Reminder WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Pelunasan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
