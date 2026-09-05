import React, { useState } from "react";
import { Plus, Search, Filter, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { JournalEntry, ChartOfAccount } from "../../types";

interface GeneralJournalTabProps {
  journalEntries: JournalEntry[];
  coaList: ChartOfAccount[];
  onAddManualJournal: (entry: JournalEntry) => void;
  isPeriodLocked: boolean;
}

export default function GeneralJournalTab({
  journalEntries,
  coaList,
  onAddManualJournal,
  isPeriodLocked
}: GeneralJournalTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRefType, setFilterRefType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manual Journal Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<
    { accountCode: string; accountName: string; debit: number; credit: number }[]
  >([
    { accountCode: coaList[0]?.code || "1-102", accountName: coaList[0]?.name || "Bank BCA", debit: 0, credit: 0 },
    { accountCode: coaList[1]?.code || "4-101", accountName: coaList[1]?.name || "Pendapatan Sewa", debit: 0, credit: 0 }
  ]);

  const totalDebitForm = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCreditForm = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isFormBalanced = totalDebitForm > 0 && totalDebitForm === totalCreditForm;

  const handleAddLine = () => {
    setLines([
      ...lines,
      { accountCode: coaList[0]?.code || "1-101", accountName: coaList[0]?.name || "Kas Kecil", debit: 0, credit: 0 }
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    if (field === "accountCode") {
      const coa = coaList.find((c) => c.code === value);
      updated[index] = {
        ...updated[index],
        accountCode: value,
        accountName: coa ? coa.name : ""
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value)
      };
    }
    setLines(updated);
  };

  const handleSaveManualJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced || !description.trim()) {
      alert("Jurnal harus memiliki debit dan kredit seimbang serta keterangan jelas.");
      return;
    }

    const newJournal: JournalEntry = {
      id: `jrn-man-${Date.now()}`,
      journalNumber: `JU/MAN/${date.replace(/-/g, "")}/${Math.floor(100 + Math.random() * 900)}`,
      date,
      description,
      referenceType: "Manual",
      createdBy: "Akuntan / Finance",
      lines: lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0)
      }))
    };

    onAddManualJournal(newJournal);
    setIsModalOpen(false);
    setDescription("");
    setLines([
      { accountCode: coaList[0]?.code || "1-102", accountName: coaList[0]?.name || "Bank BCA", debit: 0, credit: 0 },
      { accountCode: coaList[1]?.code || "4-101", accountName: coaList[1]?.name || "Pendapatan Sewa", debit: 0, credit: 0 }
    ]);
  };

  const filteredEntries = journalEntries.filter((entry) => {
    const matchSearch =
      entry.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.lines.some((l) => l.accountName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterRefType === "ALL" || entry.referenceType === filterRefType;
    return matchSearch && matchType;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* HEADER & ACTIONS */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-extrabold text-slate-800">
            Jurnal Umum Akuntansi (General Journal)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Pencatatan Berpasangan (Double-Entry Bookkeeping) Otomatis & Manual
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no jurnal / akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
            />
          </div>

          {/* Filter Ref Type */}
          <select
            value={filterRefType}
            onChange={(e) => setFilterRefType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Jenis Jurnal</option>
            <option value="Invoice">Otomatis Faktur</option>
            <option value="Payment">Otomatis Pembayaran</option>
            <option value="Expense">Otomatis Biaya/OPEX</option>
            <option value="Payroll">Otomatis Payroll Gaji</option>
            <option value="Manual">Jurnal Penyesuaian Manual</option>
          </select>

          {/* New Manual Journal Button */}
          <button
            disabled={isPeriodLocked}
            onClick={() => setIsModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPeriodLocked
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Jurnal Baru</span>
          </button>
        </div>
      </div>

      {/* JOURNAL ENTRIES TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Tanggal & No. Jurnal</th>
              <th className="py-3 px-4">Keterangan / Deskripsi</th>
              <th className="py-3 px-4">Kode Akun</th>
              <th className="py-3 px-4">Nama Akun</th>
              <th className="py-3 px-4 text-right">Debit (IDR)</th>
              <th className="py-3 px-4 text-right">Kredit (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Tidak ada data jurnal yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  {entry.lines.map((line, idx) => (
                    <tr
                      key={`${entry.id}-${idx}`}
                      className={`hover:bg-slate-50/60 transition ${
                        idx === 0 ? "border-t border-slate-200" : ""
                      }`}
                    >
                      {idx === 0 ? (
                        <td
                          rowSpan={entry.lines.length}
                          className="py-3 px-4 align-top font-mono bg-slate-50/40 border-r border-slate-100"
                        >
                          <span className="block font-bold text-slate-800">{entry.date}</span>
                          <span className="block text-[11px] text-emerald-700">{entry.journalNumber}</span>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                            {entry.referenceType}
                          </span>
                        </td>
                      ) : null}

                      {idx === 0 ? (
                        <td
                          rowSpan={entry.lines.length}
                          className="py-3 px-4 align-top font-medium text-slate-800 border-r border-slate-100"
                        >
                          {entry.description}
                          <span className="block text-[10px] text-slate-400 mt-1">Oleh: {entry.createdBy}</span>
                        </td>
                      ) : null}

                      <td className="py-2 px-4 font-mono text-emerald-700 font-semibold">{line.accountCode}</td>
                      <td className={`py-2 px-4 ${line.credit > 0 ? "pl-8 text-slate-600" : "font-semibold text-slate-800"}`}>
                        {line.accountName}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-850">
                        {line.debit > 0 ? `Rp ${line.debit.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-850">
                        {line.credit > 0 ? `Rp ${line.credit.toLocaleString("id-ID")}` : "-"}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL INPUT JURNAL MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-base">
                Input Jurnal Penyesuaian Manual
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualJournal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Keterangan / Memo</label>
                  <input
                    type="text"
                    placeholder="Contoh: Penyesuaian amortisasi asuransi gedung"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>
              </div>

              {/* LINES TABLE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Rincian Akun (Debit & Kredit)</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={l.accountCode}
                        onChange={(e) => handleLineChange(idx, "accountCode", e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-medium focus:bg-white"
                      >
                        {coaList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Debit"
                        value={l.debit || ""}
                        onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                        className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-right font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Kredit"
                        value={l.credit || ""}
                        onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                        className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-right font-mono"
                      />
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Balance validation alert */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span>Total Debit: Rp {totalDebitForm.toLocaleString("id-ID")}</span>
                  <span>Total Kredit: Rp {totalCreditForm.toLocaleString("id-ID")}</span>
                  <span className={isFormBalanced ? "text-emerald-700" : "text-rose-600"}>
                    {isFormBalanced ? "✓ Seimbang (Balance)" : "✕ Belum Seimbang"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isFormBalanced}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isFormBalanced
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Posting Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
