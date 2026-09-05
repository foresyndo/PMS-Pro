import React, { useState } from "react";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Edit2 } from "lucide-react";
import { FinancialBudget, Expense } from "../../types";

interface BudgetingTabProps {
  budgets: FinancialBudget[];
  expenses: Expense[];
  onUpdateBudget: (budgetId: string, newAmount: number) => void;
  isPeriodLocked: boolean;
}

export default function BudgetingTab({
  budgets,
  expenses,
  onUpdateBudget,
  isPeriodLocked
}: BudgetingTabProps) {
  const [editingBudget, setEditingBudget] = useState<{ id: string; amount: number } | null>(null);

  // Map expenses to categories
  const actualExpenseMap: Record<string, number> = {};
  expenses.forEach((e) => {
    actualExpenseMap[e.category] = (actualExpenseMap[e.category] || 0) + e.amount;
  });

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0);
  const totalActual = budgets.reduce((sum, b) => sum + (actualExpenseMap[b.category] || 0), 0);
  const totalVariance = totalBudget - totalActual;
  const overallUsagePct = totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : "0.0";

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    onUpdateBudget(editingBudget.id, Number(editingBudget.amount));
    setEditingBudget(null);
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Pagu Anggaran (Budget)
          </span>
          <span className="text-xl font-black font-mono text-slate-900 block mt-1">
            Rp {totalBudget.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">Plafon Pengeluaran Operasional</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Realisasi Pengeluaran (Actual)
          </span>
          <span className="text-xl font-black font-mono text-rose-800 block mt-1">
            Rp {totalActual.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">Total Biaya Tercatat</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Sisa Anggaran (Variance)
          </span>
          <span className={`text-xl font-black font-mono block mt-1 ${totalVariance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            Rp {totalVariance.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">
            {totalVariance >= 0 ? "Masih dalam batas aman" : "Over budget!"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            % Serapan Anggaran
          </span>
          <span className="text-xl font-black font-mono text-blue-900 block mt-1">
            {overallUsagePct}%
          </span>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${Number(overallUsagePct) > 100 ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, Number(overallUsagePct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* BUDGET COMPARISON TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-display font-extrabold text-slate-800">
              Perbandingan Anggaran vs Realisasi (Budget vs Actual)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Analisis efisiensi biaya per kategori dan departemen operasional
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Kategori & Departemen</th>
                <th className="py-3 px-6 text-right">Anggaran (Budget)</th>
                <th className="py-3 px-6 text-right">Realisasi (Actual)</th>
                <th className="py-3 px-6 text-right">Selisih (Variance)</th>
                <th className="py-3 px-6 text-center">% Serapan</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {budgets.map((b) => {
                const actual = actualExpenseMap[b.category] || 0;
                const variance = b.budgetedAmount - actual;
                const pct = b.budgetedAmount > 0 ? ((actual / b.budgetedAmount) * 100).toFixed(1) : "0.0";
                const isOver = Number(pct) > 100;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-6 font-bold text-slate-900">
                      {b.category}
                      <span className="block text-[10px] font-normal text-slate-500">Divisi: {b.department}</span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-slate-800">
                      Rp {b.budgetedAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-semibold text-rose-800">
                      Rp {actual.toLocaleString("id-ID")}
                    </td>
                    <td className={`py-3 px-6 text-right font-mono font-bold ${variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {variance >= 0 ? "+" : ""} Rp {variance.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className="font-mono font-bold text-slate-800 mr-2">{pct}%</span>
                      <div className="w-20 inline-block bg-slate-100 rounded-full h-1.5 overflow-hidden align-middle">
                        <div
                          className={`h-full rounded-full ${isOver ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOver ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isOver ? "Over Budget" : "Aman"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        disabled={isPeriodLocked}
                        onClick={() => setEditingBudget({ id: b.id, amount: b.budgetedAmount })}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isPeriodLocked
                            ? "text-slate-300 border-slate-200 cursor-not-allowed"
                            : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
                        }`}
                        title="Ubah Anggaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT BUDGET MODAL */}
      {editingBudget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-sm">
                Perbarui Pagu Anggaran
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nominal Anggaran Baru (IDR)</label>
                <input
                  type="number"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget({ ...editingBudget, amount: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
