import React, { useState } from "react";
import { TrendingUp, Users, Building, Layers, PieChart as PieIcon, BarChart2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Invoice, Tenant, Property, Unit } from "../../types";

interface RevenueReportTabProps {
  invoices: Invoice[];
  tenants: Tenant[];
  properties: Property[];
  units: Unit[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function RevenueReportTab({
  invoices,
  tenants,
  properties,
  units
}: RevenueReportTabProps) {
  const [activeView, setActiveView] = useState<"product" | "tenant" | "property">("product");

  // 1. REVENUE PER PRODUK / LAYANAN
  const productRevenueMap: Record<string, number> = {
    "Sewa Kamar Pokok": 0,
    "Layanan Laundry": 0,
    "Utilitas / Listrik": 0,
    "Denda Keterlambatan": 0,
    "Lain-lain": 0
  };

  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const desc = item.description.toLowerCase();
      if (desc.includes("laundry") || desc.includes("cuci")) {
        productRevenueMap["Layanan Laundry"] += item.amount;
      } else if (desc.includes("listrik") || desc.includes("air")) {
        productRevenueMap["Utilitas / Listrik"] += item.amount;
      } else if (desc.includes("denda") || desc.includes("late")) {
        productRevenueMap["Denda Keterlambatan"] += item.amount;
      } else if (desc.includes("sewa") || desc.includes("kamar") || desc.includes("rent")) {
        productRevenueMap["Sewa Kamar Pokok"] += item.amount;
      } else {
        productRevenueMap["Lain-lain"] += item.amount;
      }
    });

    if (!inv.items || inv.items.length === 0) {
      productRevenueMap["Sewa Kamar Pokok"] += inv.totalAmount;
    }
  });

  const productData = Object.entries(productRevenueMap).map(([name, value]) => ({ name, value }));

  // 2. REVENUE PER TENANT / PELANGGAN
  const tenantRevenueMap: Record<string, { name: string; amount: number; invoiceCount: number }> = {};
  invoices.forEach((inv) => {
    const tenant = tenants.find((t) => t.id === inv.tenantId);
    const tenantName = tenant ? tenant.name : `Penyewa (${inv.tenantId.slice(0, 5)})`;
    if (!tenantRevenueMap[inv.tenantId]) {
      tenantRevenueMap[inv.tenantId] = { name: tenantName, amount: 0, invoiceCount: 0 };
    }
    tenantRevenueMap[inv.tenantId].amount += inv.totalAmount;
    tenantRevenueMap[inv.tenantId].invoiceCount += 1;
  });
  const tenantData = Object.values(tenantRevenueMap).sort((a, b) => b.amount - a.amount);

  // 3. REVENUE PER PROPERTI / CABANG
  const propertyRevenueMap: Record<string, { name: string; amount: number }> = {};
  properties.forEach((p) => {
    propertyRevenueMap[p.id] = { name: p.name, amount: 0 };
  });

  invoices.forEach((inv) => {
    const unit = units.find((u) => u.id === inv.unitId);
    if (unit && propertyRevenueMap[unit.propertyId]) {
      propertyRevenueMap[unit.propertyId].amount += inv.totalAmount;
    } else if (properties.length > 0) {
      propertyRevenueMap[properties[0].id].amount += inv.totalAmount;
    }
  });
  const propertyData = Object.values(propertyRevenueMap).sort((a, b) => b.amount - a.amount);

  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* VIEW TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <button
          onClick={() => setActiveView("product")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "product"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Per Produk / Layanan</span>
        </button>
        <button
          onClick={() => setActiveView("tenant")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "tenant"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Per Pelanggan / Tenant</span>
        </button>
        <button
          onClick={() => setActiveView("property")}
          className={`flex-1 py-2.5 rounded-xl font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeView === "property"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Per Cabang / Properti</span>
        </button>
      </div>

      {/* VIEW 1: PER PRODUK / LAYANAN */}
      {activeView === "product" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Distribusi Pendapatan per Kategori Layanan
            </h3>
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {productData.map((_, index) => (
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
              Tabel Rincian Kontribusi Produk
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {productData.map((item, idx) => {
                const percentage = totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(1) : "0.0";
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

      {/* VIEW 2: PER TENANT */}
      {activeView === "tenant" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Peringkat Kontribusi Pendapatan per Penyewa (Top Contributing Tenants)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Peringkat & Nama Penyewa</th>
                  <th className="py-3 px-6 text-center">Jumlah Faktur</th>
                  <th className="py-3 px-6 text-right">Total Pendapatan (IDR)</th>
                  <th className="py-3 px-6 text-right">Porsi Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {tenantData.map((t, idx) => {
                  const porsi = totalRevenue > 0 ? ((t.amount / totalRevenue) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {t.name}
                      </td>
                      <td className="py-3 px-6 text-center font-mono">{t.invoiceCount} Invoice</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-emerald-800">
                        Rp {t.amount.toLocaleString("id-ID")}
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

      {/* VIEW 3: PER PROPERTI / CABANG */}
      {activeView === "property" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-display font-extrabold text-slate-800 text-sm">
              Pendapatan Berdasarkan Unit Cabang / Properti
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Nama Properti / Cabang</th>
                  <th className="py-3 px-6 text-right">Total Pendapatan (IDR)</th>
                  <th className="py-3 px-6 text-right">Porsi Cabang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {propertyData.map((p, idx) => {
                  const porsi = totalRevenue > 0 ? ((p.amount / totalRevenue) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-600" />
                        {p.name}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-emerald-800">
                        Rp {p.amount.toLocaleString("id-ID")}
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
