import React, { useState } from "react";
import { BookOpen, Search, Filter, Calendar } from "lucide-react";
import { ChartOfAccount, JournalEntry } from "../../types";

interface GeneralLedgerTabProps {
  coaList: ChartOfAccount[];
  journalEntries: JournalEntry[];
}

export default function GeneralLedgerTab({
  coaList,
  journalEntries
}: GeneralLedgerTabProps) {
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>("1-102"); // default Bank BCA
  const [searchTerm, setSearchTerm] = useState("");

  const activeAccount = coaList.find((a) => a.code === selectedAccountCode) || coaList[0];

  // Extract ledger lines for the selected account from all journal entries
  interface LedgerRow {
    date: string;
    journalNumber: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }

  const ledgerRows: LedgerRow[] = [];
  let runningBalance = activeAccount?.initialBalance || 0;

  // Filter and sort ascending for chronologically accurate running balance
  const sortedEntries = [...journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      if (line.accountCode === activeAccount?.code) {
        if (activeAccount.normalBalance === "Debit") {
          runningBalance += line.debit - line.credit;
        } else {
          runningBalance += line.credit - line.debit;
        }

        ledgerRows.push({
          date: entry.date,
          journalNumber: entry.journalNumber,
          description: entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: runningBalance
        });
      }
    });
  });

  const totalDebit = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = ledgerRows.reduce((sum, r) => sum + r.credit, 0);

  const filteredCOA = coaList.filter((a) =>
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* COA SELECTOR (SIDEBAR) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3 h-[600px] flex flex-col">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Daftar Akun (COA)
          </h3>
          <p className="text-[11px] text-slate-400">Pilih akun untuk melihat rincian buku besar</p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode / nama akun..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* List of Accounts */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
          {filteredCOA.map((acc) => (
            <button
              key={acc.code}
              onClick={() => setSelectedAccountCode(acc.code)}
              className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-0.5 ${
                selectedAccountCode === acc.code
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "hover:bg-slate-50 border border-transparent text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="font-mono text-emerald-700">{acc.code}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {acc.normalBalance}
                </span>
              </div>
              <span className="text-xs font-medium truncate">{acc.name}</span>
              <span className="text-[10px] text-slate-400">{acc.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LEDGER DETAILS TABLE (MAIN) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        {/* HEADER BAR */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-mono font-black rounded-lg">
                {activeAccount?.code}
              </span>
              <h2 className="text-base font-display font-extrabold text-slate-900">
                {activeAccount?.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Kategori: <strong className="text-slate-700">{activeAccount?.category}</strong> • Saldo Normal:{" "}
              <strong className="text-slate-700">{activeAccount?.normalBalance}</strong>
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Saldo Akhir Berjalan</span>
            <span className="text-sm font-black font-mono text-emerald-900">
              Rp {runningBalance.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Jurnal / Ref</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-4 text-right">Debit (IDR)</th>
                <th className="py-3 px-4 text-right">Kredit (IDR)</th>
                <th className="py-3 px-4 text-right">Saldo Berjalan (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {/* Row Saldo Awal */}
              <tr className="bg-slate-50/60 font-semibold text-slate-600">
                <td className="py-2.5 px-4 font-mono">-</td>
                <td className="py-2.5 px-4 font-mono">SALDO-AWAL</td>
                <td className="py-2.5 px-4 font-bold text-slate-800">Saldo Awal Periode</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                  Rp {(activeAccount?.initialBalance || 0).toLocaleString("id-ID")}
                </td>
              </tr>

              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Belum ada mutasi jurnal untuk akun ini pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-600">{row.date}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{row.journalNumber}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{row.description}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-850">
                      {row.debit > 0 ? `Rp ${row.debit.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-850">
                      {row.credit > 0 ? `Rp ${row.credit.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      Rp {row.balance.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* TOTAL FOOTER */}
            <tfoot className="bg-slate-100/80 border-t-2 border-slate-200 text-xs font-bold">
              <tr>
                <td colSpan={3} className="py-3 px-4 uppercase text-slate-800">
                  Total Mutasi & Saldo Akhir
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 font-black">
                  Rp {totalDebit.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-800 font-black">
                  Rp {totalCredit.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-950 font-black">
                  Rp {runningBalance.toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
