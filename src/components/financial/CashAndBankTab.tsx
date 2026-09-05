import React, { useState } from "react";
import { Wallet, ArrowRightLeft, CheckCircle2, AlertCircle, Plus, RefreshCw, Landmark } from "lucide-react";
import { BankAccount, BankMutation } from "../../types";

interface CashAndBankTabProps {
  bankAccounts: BankAccount[];
  bankMutations: BankMutation[];
  onTransferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes: string
  ) => void;
  onToggleReconcile: (mutationId: string) => void;
  isPeriodLocked: boolean;
}

export default function CashAndBankTab({
  bankAccounts,
  bankMutations,
  onTransferBetweenAccounts,
  onToggleReconcile,
  isPeriodLocked
}: CashAndBankTabProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer Form State
  const [fromAccount, setFromAccount] = useState(bankAccounts[0]?.id || "");
  const [toAccount, setToAccount] = useState(bankAccounts[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState("");

  const totalBankBalance = bankAccounts
    .filter((a) => a.type === "Bank")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalCashBalance = bankAccounts
    .filter((a) => a.type === "Kas")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount || transferAmount <= 0) {
      alert("Rekening asal dan tujuan harus berbeda serta nominal transfer lebih dari 0.");
      return;
    }

    const sourceAcc = bankAccounts.find((a) => a.id === fromAccount);
    if (sourceAcc && sourceAcc.currentBalance < transferAmount) {
      alert("Saldo rekening asal tidak mencukupi untuk transfer ini.");
      return;
    }

    onTransferBetweenAccounts(fromAccount, toAccount, Number(transferAmount), transferNotes);
    setIsTransferModalOpen(false);
    setTransferAmount(0);
    setTransferNotes("");
  };

  const filteredMutations = bankMutations.filter((m) => {
    if (selectedAccountId === "ALL") return true;
    return m.accountId === selectedAccountId;
  });

  return (
    <div className="space-y-6">
      {/* BANK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((acc) => {
          const isReconciled = acc.currentBalance === acc.reconciledBalance;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? "ALL" : acc.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                selectedAccountId === acc.id
                  ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                  {acc.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isReconciled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isReconciled ? "Reconciled" : "Unreconciled"}
                </span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-extrabold text-slate-800 truncate">{acc.bankName}</h4>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{acc.accountNumber}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Saldo Riil</span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    Rp {acc.currentBalance.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MUTATION & RECONCILIATION TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-extrabold text-slate-800">
              Mutasi Rekening & Rekonsiliasi Bank
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Verifikasi mutasi rekening koran dengan pencatatan buku besar kas & bank
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Rekening & Kas</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName}
                </option>
              ))}
            </select>

            <button
              disabled={isPeriodLocked}
              onClick={() => setIsTransferModalOpen(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isPeriodLocked
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Antar Rekening</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Tanggal & Ref</th>
                <th className="py-3 px-4">Akun Bank / Kas</th>
                <th className="py-3 px-4">Keterangan Mutasi</th>
                <th className="py-3 px-4 text-center">Tipe</th>
                <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3 px-4 text-center">Status Rekonsiliasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada mutasi transaksi untuk rekening terpilih.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => {
                  const account = bankAccounts.find((a) => a.id === m.accountId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800 block">{m.date.slice(0, 10)}</span>
                        <span className="text-[10px] text-slate-400">{m.reference || "-"}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{account?.bankName || m.accountId}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{m.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === "In" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {m.type === "In" ? "Kas Masuk" : "Kas Keluar"}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          m.type === "In" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {m.type === "In" ? "+" : "-"} Rp {m.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={isPeriodLocked}
                          onClick={() => onToggleReconcile(m.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                            m.reconciled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          {m.reconciled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cocok (Reconciled)</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 text-amber-600" />
                              <span>Belum Cocok</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TRANSFER ANTAR REKENING */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-base">
                Transfer Dana Antar Kas & Bank
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dari Rekening (Sumber)</label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} (Saldo: Rp {a.currentBalance.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ke Rekening (Tujuan)</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} (Saldo: Rp {a.currentBalance.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nominal Transfer (IDR)</label>
                <input
                  type="number"
                  value={transferAmount || ""}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  required
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Alasan Transfer</label>
                <input
                  type="text"
                  placeholder="Contoh: Isi ulang kas kecil resepsionis"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Eksekusi Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
