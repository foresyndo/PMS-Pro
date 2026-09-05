import React, { useState } from "react";
import { TrendingDown, Tag, Building2, Briefcase, DollarSign } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Expense, VendorPayable } from "../../types";

interface ExpenseReportTabProps {
  expenses: Expense[];
  vendorPayables: VendorPayable[];
}

const COLORS = ["#f43f5e", "#8b5cf6", "#f59e0b", "#3b82f6", "#10b981", "#06b6d4"];

export default function ExpenseReportTab({
  expenses,
  vendorPayables
}: ExpenseReportTabProps) {
  const [activeView, setActiveView] = useState<"category" | "vendor" | "department">("category");

  // 1. EXPENSE PER KATEGORI
  const categoryMap: Record<string, number> = {};
  expenses.forEach((exp) => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 2. EXPENSE PER VENDOR
  const vendorMap: Record<string, number> = {};
  vendorPayables.forEach((vp) => {
    vendorMap[vp.vendorName] = (vendorMap[vp.vendorName] || 0) + vp.paidAmount;
  });
  const vendorData = Object.entries(vendorMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. EXPENSE PER DEPARTEMEN
  const deptMap: Record<string, number> = {
    "Engineering & Maintenance": 0,
    "Front Office & Operasional": 0,
    "Housekeeping": 0,
    "HR & Payroll": 0,
    "IT & Utilitas": 0
  };

  expenses.forEach((exp) => {
    if (exp.category === "Maintenance") {
      deptMap["Engineering & Maintenance"] += exp.amount;
    } else if (exp.category === "Salary") {
      deptMap["HR & Payroll"] += exp.amount;
    } else if (exp.category === "Electricity" || exp.category === "Water" || exp.category === "Internet") {
      deptMap["IT & Utilitas"] += exp.amount;
    } else {
      deptMap["Front Office & Operasional"] += exp.amount;
    }
  });
  const deptData = Object.entries(deptMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* VIEW TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <button
          onClick={() => setActiveView("category")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "category"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Per Kategori Biaya</span>
        </button>
        <button
          onClick={() => setActiveView("vendor")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "vendor"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Per Supplier / Vendor</span>
        </button>
        <button
          onClick={() => setActiveView("department")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "department"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Per Departemen</span>
        </button>
      </div>

      {/* CONTENT BASED ON SELECTED TAB */}
      {activeView === "category" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Proporsi Pengeluaran per Kategori
            </h3>
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`Rp ${Number(v).toLocaleString("id-ID")}`, "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Rincian Kategori Biaya Operasional
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {categoryData.map((item, idx) => {
                const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : "0.0";
                return (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        Rp {item.value.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{percentage}% dari total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeView === "vendor" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Realisasi Pembayaran ke Rekanan Vendor & Kontraktor
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Nama Rekanan / Supplier</th>
                  <th className="py-3 px-6 text-right">Total Pembayaran Kas (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {vendorData.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-6 font-bold text-slate-900">{v.name}</td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-rose-800">
                      Rp {v.value.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === "department" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Alokasi Beban Biaya per Departemen / Divisi
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Departemen / Divisi</th>
                  <th className="py-3 px-6 text-right">Alokasi Beban Biaya (IDR)</th>
                  <th className="py-3 px-6 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {deptData.map((d, idx) => {
                  const porsi = totalExpense > 0 ? ((d.value / totalExpense) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-6 font-bold text-slate-900">{d.name}</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-rose-800">
                        Rp {d.value.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-slate-600">{porsi}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
