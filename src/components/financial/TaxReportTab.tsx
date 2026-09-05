import React from "react";
import { Receipt, FileCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Calculator } from "lucide-react";
import { Invoice, Expense } from "../../types";

interface TaxReportTabProps {
  invoices: Invoice[];
  expenses: Expense[];
  periodLabel: string;
}

export default function TaxReportTab({
  invoices,
  expenses,
  periodLabel
}: TaxReportTabProps) {
  // Total Penjualan (DPP Sewa)
  const totalSalesDPP = invoices.reduce((sum, inv) => sum + (inv.subtotal || inv.totalAmount), 0);
  // PPN Keluaran (11%)
  const totalOutputVAT = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);

  // Total Pembelian Operasional (DPP Pengeluaran)
  const totalPurchaseDPP = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  // PPN Masukan (Asumsi 11% untuk pengeluaran berfaktur pajak)
  const totalInputVAT = Math.round(totalPurchaseDPP * 0.11 * 0.4); // 40% pembelian kena PPN

  // Net PPN Kurang/Lebih Bayar
  const netVATOwed = totalOutputVAT - totalInputVAT;

  // PPh Final Pasal 4 Ayat 2 (10% atas Sewa Tanah dan/atau Bangunan)
  const pphFinalSewa = Math.round(totalSalesDPP * 0.1);

  return (
    <div className="space-y-6">
      {/* TAX METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            PPN Keluaran (Output VAT)
          </span>
          <span className="text-xl font-black font-mono text-emerald-800 block mt-1">
            Rp {totalOutputVAT.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">Dipungut dari Faktur Sewa Tamu</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            PPN Masukan (Input VAT)
          </span>
          <span className="text-xl font-black font-mono text-blue-800 block mt-1">
            Rp {totalInputVAT.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">Kredit Pajak dari Pembelian</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            PPN Kurang / (Lebih) Bayar
          </span>
          <span className={`text-xl font-black font-mono block mt-1 ${netVATOwed >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
            Rp {netVATOwed.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">SPT Masa PPN 1111</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            PPh Final Sewa Ps. 4 (2)
          </span>
          <span className="text-xl font-black font-mono text-purple-900 block mt-1">
            Rp {pphFinalSewa.toLocaleString("id-ID")}
          </span>
          <span className="text-[11px] text-slate-400">Tarif 10% atas Penghasilan Sewa</span>
        </div>
      </div>

      {/* DETAILED TAX SCHEDULE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-extrabold text-slate-800">
              Rekapitulasi Pajak Penghasilan & Pertambahan Nilai
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Kompilasi pelaporan kewajiban perpajakan Direktorat Jenderal Pajak (DJP) • Periode {periodLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Faktur Elektronik Terintegrasi</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Jenis Pajak & Dasar Pengenaan (DPP)</th>
                <th className="py-3 px-6 text-center">Tarif</th>
                <th className="py-3 px-6 text-right">Dasar Pengenaan Pajak (DPP)</th>
                <th className="py-3 px-6 text-right">Nilai Pajak Terutang (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {/* PPN Keluaran */}
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-6 font-bold text-slate-900">
                  PPN Keluaran atas Penyerahan Jasa Sewa Kamar & Amenitas
                  <span className="block text-[11px] font-normal text-slate-500">
                    Berdasarkan {invoices.length} faktur penagihan tamu periode berjalan
                  </span>
                </td>
                <td className="py-3 px-6 text-center font-mono font-bold text-slate-750">11%</td>
                <td className="py-3 px-6 text-right font-mono text-slate-850">
                  Rp {totalSalesDPP.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-6 text-right font-mono font-bold text-emerald-800">
                  Rp {totalOutputVAT.toLocaleString("id-ID")}
                </td>
              </tr>

              {/* PPN Masukan */}
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-6 font-bold text-slate-900">
                  PPN Masukan yang Dapat Dikreditkan (Pembelian Vendor & Amenitas)
                  <span className="block text-[11px] font-normal text-slate-500">
                    Faktur pajak masukan dari pengadaan perlengkapan dan operasional
                  </span>
                </td>
                <td className="py-3 px-6 text-center font-mono font-bold text-slate-750">11%</td>
                <td className="py-3 px-6 text-right font-mono text-slate-850">
                  Rp {Math.round(totalPurchaseDPP * 0.4).toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-6 text-right font-mono font-bold text-blue-800">
                  (Rp {totalInputVAT.toLocaleString("id-ID")})
                </td>
              </tr>

              {/* Total PPN */}
              <tr className="bg-slate-50 font-bold border-t border-b border-slate-200">
                <td colSpan={3} className="py-3 px-6 uppercase text-slate-800">
                  Total PPN Kurang / (Lebih) Bayar yang Harus Disetor ke Kas Negara
                </td>
                <td className={`py-3 px-6 text-right font-mono font-black ${netVATOwed >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  Rp {netVATOwed.toLocaleString("id-ID")}
                </td>
              </tr>

              {/* PPh Final Pasal 4 Ayat 2 */}
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-6 font-bold text-slate-900">
                  PPh Final Pasal 4 Ayat (2) atas Persewaan Tanah dan/atau Bangunan
                  <span className="block text-[11px] font-normal text-slate-500">
                    Kewajiban setor PPh final bruto atas penghasilan sewa properti
                  </span>
                </td>
                <td className="py-3 px-6 text-center font-mono font-bold text-slate-750">10%</td>
                <td className="py-3 px-6 text-right font-mono text-slate-850">
                  Rp {totalSalesDPP.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-6 text-right font-mono font-black text-purple-900">
                  Rp {pphFinalSewa.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-100 font-extrabold text-xs">
              <tr>
                <td colSpan={3} className="py-4 px-6 uppercase text-slate-900 font-display">
                  TOTAL ESTIMASI KEWAJIBAN SETOR PAJAK BULAN INI (PPN + PPH)
                </td>
                <td className="py-4 px-6 text-right font-mono text-sm font-black text-rose-800">
                  Rp {(Math.max(0, netVATOwed) + pphFinalSewa).toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
