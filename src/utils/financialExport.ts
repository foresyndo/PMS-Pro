// Utility for Professional Financial Reports Export (Excel .xls, CSV, and Printable PDF)

export interface CompanyInfo {
  name: string;
  subTitle: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "PT MANAJEMEN PROPERTI NUSANTARA",
  subTitle: "Divisi Keuangan & Akuntansi — ERP PMS Pro",
  address: "Gedung Pusat Bisnis Properti Lt. 8, Jl. Jend. Sudirman Kav. 24, Jakarta Selatan 12920",
  phone: "(021) 555-8899",
  email: "finance@propertimanajemen.co.id",
  npwp: "01.345.678.9-012.000"
};

// Helper to trigger file download in browser
export function downloadBlobFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate an XML-compliant HTML spreadsheet (.xls)
export function createExcelWorkbookHtml(params: {
  title: string;
  period: string;
  property: string;
  printedBy: string;
  company?: CompanyInfo;
  tableHtml: string;
}): string {
  const company = params.company || DEFAULT_COMPANY_INFO;
  const now = new Date();
  const printDate = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${params.title.slice(0, 30)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        .company-title { font-size: 16pt; font-weight: bold; color: #047857; }
        .company-sub { font-size: 9pt; color: #64748b; margin-bottom: 8px; }
        .report-title { font-size: 14pt; font-weight: bold; color: #0f172a; text-decoration: underline; }
        .meta-table { font-size: 10pt; margin-bottom: 15px; }
        .meta-label { font-weight: bold; color: #475569; width: 140px; }
        .meta-val { color: #0f172a; }
        table.data-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        table.data-table th { background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #065f46; padding: 8px 10px; text-align: left; }
        table.data-table th.right { text-align: right; }
        table.data-table td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: middle; }
        table.data-table td.right { text-align: right; font-family: 'Consolas', 'Courier New', monospace; }
        table.data-table tr:nth-child(even) td { background-color: #f8fafc; }
        .section-header { background-color: #f1f5f9; font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 10.5pt; }
        .subtotal-row { background-color: #e2e8f0; font-weight: bold; border-top: 1px solid #94a3b8; }
        .grandtotal-row { background-color: #d1fae5; font-weight: bold; border-top: 2px solid #059669; border-bottom: 3px double #059669; color: #064e3b; font-size: 11.5pt; }
        .signature-table { margin-top: 40px; width: 100%; border-collapse: collapse; }
        .signature-table td { text-align: center; vertical-align: top; padding: 10px; border: none; font-size: 10pt; }
        .sign-space { height: 60px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="4" class="company-title">${company.name}</td>
        </tr>
        <tr>
          <td colspan="4" class="company-sub">${company.address} • Telp: ${company.phone} • Email: ${company.email} • NPWP: ${company.npwp}</td>
        </tr>
        <tr><td colspan="4">&nbsp;</td></tr>
        <tr>
          <td colspan="4" class="report-title">${params.title.toUpperCase()}</td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Periode Laporan:</td>
          <td class="meta-val">${params.period}</td>
          <td class="meta-label">Mata Uang:</td>
          <td class="meta-val">IDR (Rupiah Indonesia)</td>
        </tr>
        <tr>
          <td class="meta-label">Cabang / Properti:</td>
          <td class="meta-val">${params.property}</td>
          <td class="meta-label">Tanggal Cetak:</td>
          <td class="meta-val">${printDate} WIB</td>
        </tr>
        <tr>
          <td class="meta-label">Otorisasi Cetak:</td>
          <td class="meta-val">${params.printedBy}</td>
          <td class="meta-label">Standar Akuntansi:</td>
          <td class="meta-val">PSAK Properti & SAK ETAP</td>
        </tr>
      </table>

      ${params.tableHtml}

      <table class="signature-table">
        <tr>
          <td width="33%">
            <strong>Dibuat Oleh,</strong><br>
            <span style="font-size:9pt;color:#64748b;">Staff Akuntansi & Finance</span>
            <div class="sign-space"></div>
            <strong>( ${params.printedBy} )</strong><br>
            <span>Finance Specialist</span>
          </td>
          <td width="33%">
            <strong>Diperiksa Oleh,</strong><br>
            <span style="font-size:9pt;color:#64748b;">Accounting Supervisor</span>
            <div class="sign-space"></div>
            <strong>( Denny Prasetyo, S.E., Ak. )</strong><br>
            <span>Head of Accounting</span>
          </td>
          <td width="34%">
            <strong>Disetujui Oleh,</strong><br>
            <span style="font-size:9pt;color:#64748b;">Direktur Utama / Owner</span>
            <div class="sign-space"></div>
            <strong>( Sahrul Viona )</strong><br>
            <span>Managing Director</span>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// -------------------------------------------------------------
// EXPORT SPECIFIC FORMATTERS
// -------------------------------------------------------------

// 1. LABA RUGI (INCOME STATEMENT) EXCEL GENERATOR
export function generateIncomeStatementExcel(data: {
  revenueItems: { name: string; current: number; previous: number }[];
  cogsItems: { name: string; current: number; previous: number }[];
  opexItems: { name: string; current: number; previous: number }[];
  otherExpenseItems: { name: string; current: number; previous: number }[];
  period: string;
  previousPeriod: string;
  property: string;
  printedBy: string;
}): string {
  const totalRevenue = data.revenueItems.reduce((s, i) => s + i.current, 0);
  const prevRevenue = data.revenueItems.reduce((s, i) => s + i.previous, 0);

  const totalCogs = data.cogsItems.reduce((s, i) => s + i.current, 0);
  const prevCogs = data.cogsItems.reduce((s, i) => s + i.previous, 0);

  const grossProfit = totalRevenue - totalCogs;
  const prevGrossProfit = prevRevenue - prevCogs;

  const totalOpex = data.opexItems.reduce((s, i) => s + i.current, 0);
  const prevOpex = data.opexItems.reduce((s, i) => s + i.previous, 0);

  const operatingProfit = grossProfit - totalOpex;
  const prevOperatingProfit = prevGrossProfit - prevOpex;

  const totalOther = data.otherExpenseItems.reduce((s, i) => s + i.current, 0);
  const prevOther = data.otherExpenseItems.reduce((s, i) => s + i.previous, 0);

  const netProfit = operatingProfit - totalOther;
  const prevNetProfit = prevOperatingProfit - prevOther;

  const formatRp = (num: number) => `Rp ${num.toLocaleString("id-ID")}`;
  const formatPct = (curr: number, prev: number) => {
    if (prev === 0) return "0.0%";
    const p = ((curr - prev) / prev) * 100;
    return `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;
  };

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 45%;">Pos Akun / Uraian Keuangan</th>
          <th class="right" style="width: 20%;">${data.period}</th>
          <th class="right" style="width: 20%;">${data.previousPeriod}</th>
          <th class="right" style="width: 15%;">Pertumbuhan (%)</th>
        </tr>
      </thead>
      <tbody>
        <!-- I. PENDAPATAN USAHA -->
        <tr class="section-header">
          <td colspan="4">I. PENDAPATAN USAHA (REVENUE)</td>
        </tr>
        ${data.revenueItems
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${formatRp(item.current)}</td>
            <td class="right">${formatRp(item.previous)}</td>
            <td class="right">${formatPct(item.current, item.previous)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>TOTAL PENDAPATAN USAHA</td>
          <td class="right">${formatRp(totalRevenue)}</td>
          <td class="right">${formatRp(prevRevenue)}</td>
          <td class="right">${formatPct(totalRevenue, prevRevenue)}</td>
        </tr>

        <!-- II. HPP -->
        <tr class="section-header">
          <td colspan="4">II. HARGA POKOK PENDAPATAN (COGS)</td>
        </tr>
        ${data.cogsItems
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">(${formatRp(item.current)})</td>
            <td class="right">(${formatRp(item.previous)})</td>
            <td class="right">${formatPct(item.current, item.previous)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>TOTAL HARGA POKOK PENDAPATAN</td>
          <td class="right">(${formatRp(totalCogs)})</td>
          <td class="right">(${formatRp(prevCogs)})</td>
          <td class="right">${formatPct(totalCogs, prevCogs)}</td>
        </tr>

        <!-- LABA KOTOR -->
        <tr class="grandtotal-row">
          <td>LABA KOTOR (GROSS PROFIT)</td>
          <td class="right">${formatRp(grossProfit)}</td>
          <td class="right">${formatRp(prevGrossProfit)}</td>
          <td class="right">${formatPct(grossProfit, prevGrossProfit)}</td>
        </tr>

        <!-- III. BEBAN OPERASIONAL -->
        <tr class="section-header">
          <td colspan="4">III. BEBAN OPERASIONAL (OPERATING EXPENSES)</td>
        </tr>
        ${data.opexItems
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">(${formatRp(item.current)})</td>
            <td class="right">(${formatRp(item.previous)})</td>
            <td class="right">${formatPct(item.current, item.previous)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>TOTAL BEBAN OPERASIONAL</td>
          <td class="right">(${formatRp(totalOpex)})</td>
          <td class="right">(${formatRp(prevOpex)})</td>
          <td class="right">${formatPct(totalOpex, prevOpex)}</td>
        </tr>

        <!-- LABA OPERASIONAL -->
        <tr class="subtotal-row" style="background-color: #e0f2fe; color: #0369a1;">
          <td>LABA OPERASIONAL (EBIT)</td>
          <td class="right">${formatRp(operatingProfit)}</td>
          <td class="right">${formatRp(prevOperatingProfit)}</td>
          <td class="right">${formatPct(operatingProfit, prevOperatingProfit)}</td>
        </tr>

        <!-- IV. BEBAN LAIN-LAIN -->
        <tr class="section-header">
          <td colspan="4">IV. PENDAPATAN / (BEBAN) LAIN-LAIN</td>
        </tr>
        ${data.otherExpenseItems
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">(${formatRp(item.current)})</td>
            <td class="right">(${formatRp(item.previous)})</td>
            <td class="right">${formatPct(item.current, item.previous)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>TOTAL BEBAN LAIN-LAIN</td>
          <td class="right">(${formatRp(totalOther)})</td>
          <td class="right">(${formatRp(prevOther)})</td>
          <td class="right">${formatPct(totalOther, prevOther)}</td>
        </tr>

        <!-- LABA BERSIH -->
        <tr class="grandtotal-row" style="font-size: 12pt;">
          <td>LABA BERSIH TAHUN BERJALAN (NET PROFIT)</td>
          <td class="right">${formatRp(netProfit)}</td>
          <td class="right">${formatRp(prevNetProfit)}</td>
          <td class="right">${formatPct(netProfit, prevNetProfit)}</td>
        </tr>
      </tbody>
    </table>
  `;

  return createExcelWorkbookHtml({
    title: "Laporan Laba Rugi Komprehensif (Income Statement)",
    period: data.period,
    property: data.property,
    printedBy: data.printedBy,
    tableHtml
  });
}

// 2. NERACA KEUANGAN (BALANCE SHEET) EXCEL GENERATOR
export function generateBalanceSheetExcel(data: {
  currentAssets: { name: string; amount: number }[];
  fixedAssets: { name: string; amount: number; isContra?: boolean }[];
  currentLiabilities: { name: string; amount: number }[];
  longTermLiabilities: { name: string; amount: number }[];
  equityItems: { name: string; amount: number }[];
  netIncomeCurrentYear: number;
  period: string;
  property: string;
  printedBy: string;
}): string {
  const formatRp = (num: number) => `Rp ${num.toLocaleString("id-ID")}`;

  const totalCurrentAssets = data.currentAssets.reduce((s, i) => s + i.amount, 0);
  const totalFixedAssets = data.fixedAssets.reduce((s, i) => (i.isContra ? s - i.amount : s + i.amount), 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = data.currentLiabilities.reduce((s, i) => s + i.amount, 0);
  const totalLongTermLiabilities = data.longTermLiabilities.reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalBaseEquity = data.equityItems.reduce((s, i) => s + i.amount, 0);
  const totalEquity = totalBaseEquity + data.netIncomeCurrentYear;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const balanceStatus = variance < 1000 ? "SEIMBANG (VALID)" : `SELISIH: ${formatRp(variance)}`;

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 50%; background-color: #0369a1;">SISI AKTIVA / ASET</th>
          <th class="right" style="width: 50%; background-color: #0369a1;">NOMINAL (IDR)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="section-header">
          <td colspan="2">1. ASET LANCAR (CURRENT ASSETS)</td>
        </tr>
        ${data.currentAssets
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${formatRp(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>Total Aset Lancar</td>
          <td class="right">${formatRp(totalCurrentAssets)}</td>
        </tr>

        <tr class="section-header">
          <td colspan="2">2. ASET TETAP (FIXED ASSETS)</td>
        </tr>
        ${data.fixedAssets
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${item.isContra ? `(${formatRp(item.amount)})` : formatRp(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>Total Nilai Buku Aset Tetap</td>
          <td class="right">${formatRp(totalFixedAssets)}</td>
        </tr>

        <tr class="grandtotal-row">
          <td>TOTAL AKTIVA / ASET</td>
          <td class="right">${formatRp(totalAssets)}</td>
        </tr>

        <tr><td colspan="2" style="height: 16px; border: none;">&nbsp;</td></tr>

        <!-- PASIVA -->
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="background-color: #0f766e;">SISI PASIVA / KEWAJIBAN & EKUITAS</th>
          <th class="right" style="background-color: #0f766e;">NOMINAL (IDR)</th>
        </tr>

        <tr class="section-header">
          <td colspan="2">3. KEWAJIBAN LANCAR (CURRENT LIABILITIES)</td>
        </tr>
        ${data.currentLiabilities
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${formatRp(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>Total Kewajiban Lancar</td>
          <td class="right">${formatRp(totalCurrentLiabilities)}</td>
        </tr>

        <tr class="section-header">
          <td colspan="2">4. KEWAJIBAN JANGKA PANJANG (LONG-TERM LIABILITIES)</td>
        </tr>
        ${data.longTermLiabilities
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${formatRp(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="subtotal-row">
          <td>Total Kewajiban Jangka Panjang</td>
          <td class="right">${formatRp(totalLongTermLiabilities)}</td>
        </tr>
        <tr class="subtotal-row" style="background-color: #f8fafc;">
          <td>TOTAL KEWAJIBAN / LIABILITAS</td>
          <td class="right">${formatRp(totalLiabilities)}</td>
        </tr>

        <tr class="section-header">
          <td colspan="2">5. EKUITAS / MODAL PEMILIK (EQUITY)</td>
        </tr>
        ${data.equityItems
          .map(
            (item) => `
          <tr>
            <td style="padding-left: 20px;">${item.name}</td>
            <td class="right">${formatRp(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
        <tr>
          <td style="padding-left: 20px;">Laba Bersih Tahun Berjalan</td>
          <td class="right">${formatRp(data.netIncomeCurrentYear)}</td>
        </tr>
        <tr class="subtotal-row">
          <td>Total Ekuitas</td>
          <td class="right">${formatRp(totalEquity)}</td>
        </tr>

        <tr class="grandtotal-row">
          <td>TOTAL KEWAJIBAN & EKUITAS</td>
          <td class="right">${formatRp(totalLiabilitiesAndEquity)}</td>
        </tr>

        <tr style="background-color: #fef3c7; font-weight: bold;">
          <td>STATUS KESEIMBANGAN PERSAMAAN AKUNTANSI</td>
          <td class="right" style="color: #92400e;">${balanceStatus}</td>
        </tr>
      </tbody>
    </table>
  `;

  return createExcelWorkbookHtml({
    title: "Laporan Posisi Keuangan (Neraca)",
    period: data.period,
    property: data.property,
    printedBy: data.printedBy,
    tableHtml
  });
}

// 3. ARUS KAS (CASH FLOW STATEMENT) EXCEL GENERATOR
export function generateCashFlowExcel(data: {
  operatingInflows: { name: string; amount: number }[];
  operatingOutflows: { name: string; amount: number }[];
  investingInflows: { name: string; amount: number }[];
  investingOutflows: { name: string; amount: number }[];
  financingInflows: { name: string; amount: number }[];
  financingOutflows: { name: string; amount: number }[];
  initialCashBalance: number;
  period: string;
  property: string;
  printedBy: string;
}): string {
  const formatRp = (num: number) => `Rp ${num.toLocaleString("id-ID")}`;

  const opIn = data.operatingInflows.reduce((s, i) => s + i.amount, 0);
  const opOut = data.operatingOutflows.reduce((s, i) => s + i.amount, 0);
  const netOp = opIn - opOut;

  const invIn = data.investingInflows.reduce((s, i) => s + i.amount, 0);
  const invOut = data.investingOutflows.reduce((s, i) => s + i.amount, 0);
  const netInv = invIn - invOut;

  const finIn = data.financingInflows.reduce((s, i) => s + i.amount, 0);
  const finOut = data.financingOutflows.reduce((s, i) => s + i.amount, 0);
  const netFin = finIn - finOut;

  const netCashChange = netOp + netInv + netFin;
  const finalCash = data.initialCashBalance + netCashChange;

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 70%;">Aktivitas Aliran Kas</th>
          <th class="right" style="width: 30%;">Nominal (IDR)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="section-header"><td colspan="2">I. ARUS KAS DARI AKTIVITAS OPERASIONAL</td></tr>
        ${data.operatingInflows
          .map((i) => `<tr><td style="padding-left:20px;">${i.name}</td><td class="right">${formatRp(i.amount)}</td></tr>`)
          .join("")}
        ${data.operatingOutflows
          .map((i) => `<tr><td style="padding-left:20px;">${i.name}</td><td class="right">(${formatRp(i.amount)})</td></tr>`)
          .join("")}
        <tr class="subtotal-row"><td>Arus Kas Bersih dari Aktivitas Operasi</td><td class="right">${formatRp(netOp)}</td></tr>

        <tr class="section-header"><td colspan="2">II. ARUS KAS DARI AKTIVITAS INVESTASI</td></tr>
        ${data.investingInflows.length === 0 ? `<tr><td style="padding-left:20px;font-style:italic;color:#64748b;">(Tidak ada penerimaan investasi)</td><td class="right">Rp 0</td></tr>` : ""}
        ${data.investingOutflows
          .map((i) => `<tr><td style="padding-left:20px;">${i.name}</td><td class="right">(${formatRp(i.amount)})</td></tr>`)
          .join("")}
        <tr class="subtotal-row"><td>Arus Kas Bersih dari Aktivitas Investasi</td><td class="right">${formatRp(netInv)}</td></tr>

        <tr class="section-header"><td colspan="2">III. ARUS KAS DARI AKTIVITAS PENDANAAN</td></tr>
        ${data.financingInflows.length === 0 ? `<tr><td style="padding-left:20px;font-style:italic;color:#64748b;">(Tidak ada penerimaan modal/pinjaman baru)</td><td class="right">Rp 0</td></tr>` : ""}
        ${data.financingOutflows
          .map((i) => `<tr><td style="padding-left:20px;">${i.name}</td><td class="right">(${formatRp(i.amount)})</td></tr>`)
          .join("")}
        <tr class="subtotal-row"><td>Arus Kas Bersih dari Aktivitas Pendanaan</td><td class="right">${formatRp(netFin)}</td></tr>

        <tr class="grandtotal-row"><td>KENAIKAN / (PENURUNAN) BERSIH KAS</td><td class="right">${formatRp(netCashChange)}</td></tr>
        <tr><td>Saldo Kas & Setara Kas Awal Periode</td><td class="right font-bold">${formatRp(data.initialCashBalance)}</td></tr>
        <tr class="grandtotal-row" style="font-size:12pt;background-color:#ccfbf1;">
          <td>SALDO KAS & SETARA KAS AKHIR PERIODE</td>
          <td class="right">${formatRp(finalCash)}</td>
        </tr>
      </tbody>
    </table>
  `;

  return createExcelWorkbookHtml({
    title: "Laporan Arus Kas (Cash Flow Statement)",
    period: data.period,
    property: data.property,
    printedBy: data.printedBy,
    tableHtml
  });
}

// 4. GENERIC TABULAR EXCEL GENERATOR (For GL, Journal, AR, AP, Bank, Tax, Revenue, Expense, Budget, Closing)
export function generateTabularExcel(data: {
  title: string;
  period: string;
  property: string;
  printedBy: string;
  columns: { header: string; align?: "left" | "right" | "center" }[];
  rows: (string | number)[][];
  summaryRows?: { label: string; value: string | number; colSpan?: number }[];
}): string {
  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          ${data.columns
            .map((c) => `<th class="${c.align === "right" ? "right" : ""}">${c.header}</th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${data.rows
          .map(
            (row) => `
          <tr>
            ${row
              .map((cell, idx) => {
                const colAlign = data.columns[idx]?.align || "left";
                const isNum = typeof cell === "number";
                const display = isNum ? `Rp ${cell.toLocaleString("id-ID")}` : cell;
                return `<td class="${colAlign === "right" ? "right" : ""}">${display}</td>`;
              })
              .join("")}
          </tr>
        `
          )
          .join("")}
        ${
          data.summaryRows
            ? data.summaryRows
                .map(
                  (sum) => `
          <tr class="grandtotal-row">
            <td colspan="${sum.colSpan || data.columns.length - 1}">${sum.label}</td>
            <td class="right">${typeof sum.value === "number" ? `Rp ${sum.value.toLocaleString("id-ID")}` : sum.value}</td>
          </tr>
        `
                )
                .join("")
            : ""
        }
      </tbody>
    </table>
  `;

  return createExcelWorkbookHtml({
    title: data.title,
    period: data.period,
    property: data.property,
    printedBy: data.printedBy,
    tableHtml
  });
}
