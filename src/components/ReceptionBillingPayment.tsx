import React, { useState, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Printer,
  Download,
  Share2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Building,
  User,
  BedDouble,
  Calendar,
  Percent,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Phone,
  ExternalLink,
  Check,
  DollarSign,
  Wallet,
  X,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Search
} from "lucide-react";
import {
  Reservation,
  Tenant,
  Unit,
  Property,
  Invoice,
  PaymentLog,
  PaymentMethod,
  PaymentStatus,
  InvoiceItem
} from "../types";

interface ReceptionBillingPaymentProps {
  reservations: Reservation[];
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  invoices: Invoice[];
  payments: PaymentLog[];
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice?: (inv: Invoice) => void;
  onAddPayment: (pay: PaymentLog) => void;
  onUpdateReservation: (res: Reservation) => void;
  onUpdateInvoiceStatus?: (id: string, status: PaymentStatus) => void;
  onNavigateToFinance?: () => void;
  preselectedReservationId?: string | null;
  onClosePreselect?: () => void;
}

interface ExtraChargePreset {
  id: string;
  name: string;
  amount: number;
  category: string;
  icon: string;
}

const EXTRA_CHARGE_PRESETS: ExtraChargePreset[] = [
  { id: "bf", name: "Sarapan Tambahan (Breakfast Pax)", amount: 75000, category: "F&B", icon: "🍳" },
  { id: "laundry", name: "Laundry Kilat Resepsionis (Paket)", amount: 50000, category: "Service", icon: "🧺" },
  { id: "shuttle", name: "Antar-Jemput Bandara / Shuttle", amount: 250000, category: "Transport", icon: "🚗" },
  { id: "extrabed", name: "Kasur Tambahan (Extra Bed)", amount: 200000, category: "Room", icon: "🛏️" },
  { id: "latecheckout", name: "Late Check-Out (s/d 16:00 WIB)", amount: 150000, category: "Room", icon: "⏰" },
  { id: "minibar", name: "Minibar & Minuman Ringan", amount: 45000, category: "F&B", icon: "🍫" },
  { id: "damage", name: "Denda / Ganti Kerusakan Fasilitas", amount: 300000, category: "Penalty", icon: "🧹" }
];

export default function ReceptionBillingPayment({
  reservations,
  tenants,
  units,
  properties,
  invoices,
  payments,
  onAddInvoice,
  onUpdateInvoice,
  onAddPayment,
  onUpdateReservation,
  onUpdateInvoiceStatus,
  onNavigateToFinance,
  preselectedReservationId,
  onClosePreselect
}: ReceptionBillingPaymentProps) {
  // Active selected reservation for billing
  const [selectedResId, setSelectedResId] = useState<string>(() => {
    if (preselectedReservationId) return preselectedReservationId;
    const firstUnpaid = reservations.find((r) => r.paymentStatus !== "Paid" && r.status !== "Cancelled");
    return firstUnpaid?.id || reservations[0]?.id || "";
  });

  // Keep synced if prop changes
  useEffect(() => {
    if (preselectedReservationId) {
      setSelectedResId(preselectedReservationId);
    }
  }, [preselectedReservationId]);

  // Reservation list filter & search
  const [guestSearch, setGuestSearch] = useState<string>("");
  const [resStatusFilter, setResStatusFilter] = useState<"ALL" | "UNPAID" | "CHECKED_IN" | "CONFIRMED">("ALL");

  // Selected reservation details
  const currentReservation = useMemo(() => {
    return reservations.find((r) => r.id === selectedResId) || null;
  }, [reservations, selectedResId]);

  const currentTenant = useMemo(() => {
    if (!currentReservation) return null;
    return tenants.find((t) => t.id === currentReservation.tenantId) || null;
  }, [currentReservation, tenants]);

  const currentUnit = useMemo(() => {
    if (!currentReservation) return null;
    return units.find((u) => u.id === currentReservation.unitId) || null;
  }, [currentReservation, units]);

  const currentProperty = useMemo(() => {
    if (!currentReservation) return null;
    return properties.find((p) => p.id === currentReservation.propertyId) || null;
  }, [currentReservation, properties]);

  // Calculate stay duration (nights)
  const stayNights = useMemo(() => {
    if (!currentReservation) return 1;
    const start = new Date(currentReservation.checkInDate);
    const end = new Date(currentReservation.checkOutDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [currentReservation]);

  // Billing items state (extra charges & custom items)
  const [extraItems, setExtraItems] = useState<InvoiceItem[]>([]);
  const [customItemDesc, setCustomItemDesc] = useState<string>("");
  const [customItemAmount, setCustomItemAmount] = useState<number>(50000);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0); // 0% or 10% PB1

  // Payment processing state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [cardLastDigits, setCardLastDigits] = useState<string>("");
  const [cardBank, setCardBank] = useState<string>("BCA");
  const [edcApprovalCode, setEdcApprovalCode] = useState<string>("");
  const [transferRefNumber, setTransferRefNumber] = useState<string>("");
  const [autoCheckInGuest, setAutoCheckInGuest] = useState<boolean>(true);

  // QRIS state
  const [qrisDataUrl, setQrisDataUrl] = useState<string>("");
  const [qrisSimulatedPaid, setQrisSimulatedPaid] = useState<boolean>(false);

  // Success Modal & Receipt
  const [completedTransaction, setCompletedTransaction] = useState<{
    invoice: Invoice;
    payment: PaymentLog;
    tenantName: string;
    unitNumber: string;
    propertyName: string;
    changeAmount: number;
  } | null>(null);

  // Filtered reservations for selection
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const t = tenants.find((item) => item.id === r.tenantId);
      const u = units.find((item) => item.id === r.unitId);

      // Search match
      const query = guestSearch.toLowerCase();
      const matchSearch =
        !query ||
        t?.name.toLowerCase().includes(query) ||
        u?.unitNumber.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        t?.phone.includes(query);

      if (!matchSearch) return false;

      // Status filter
      if (resStatusFilter === "UNPAID") return r.paymentStatus !== "Paid";
      if (resStatusFilter === "CHECKED_IN") return r.status === "Checked In";
      if (resStatusFilter === "CONFIRMED") return r.status === "Confirmed";

      return true;
    });
  }, [reservations, tenants, units, guestSearch, resStatusFilter]);

  // Calculate Base Room Rate
  const baseRoomRate = useMemo(() => {
    if (!currentReservation) return 0;
    // If totalPrice is available, check if it matches price * nights, otherwise use totalPrice
    return currentReservation.totalPrice || (currentUnit ? currentUnit.price * stayNights : 0);
  }, [currentReservation, currentUnit, stayNights]);

  // Folio Calculations
  const folioSubtotal = useMemo(() => {
    const extraTotal = extraItems.reduce((acc, item) => acc + item.amount, 0);
    return baseRoomRate + extraTotal;
  }, [baseRoomRate, extraItems]);

  const folioTaxAmount = useMemo(() => {
    const afterDiscount = Math.max(0, folioSubtotal - discountAmount);
    return Math.round((afterDiscount * taxPercent) / 100);
  }, [folioSubtotal, discountAmount, taxPercent]);

  const folioGrandTotal = useMemo(() => {
    return Math.max(0, folioSubtotal - discountAmount + folioTaxAmount);
  }, [folioSubtotal, discountAmount, folioTaxAmount]);

  // Cash change calculation
  const cashChange = useMemo(() => {
    if (paymentMethod !== "Cash") return 0;
    return Math.max(0, cashGiven - folioGrandTotal);
  }, [paymentMethod, cashGiven, folioGrandTotal]);

  // Reset cash given when total changes
  useEffect(() => {
    if (paymentMethod === "Cash" && cashGiven === 0) {
      setCashGiven(folioGrandTotal);
    }
  }, [folioGrandTotal, paymentMethod]);

  // Generate QRIS code dynamically when method is QRIS
  useEffect(() => {
    if (paymentMethod === "QRIS" && folioGrandTotal > 0) {
      const qrisPayload = `00020101021226680016ID.CO.FORSDIG.PMS01189360099901827462820215ID1020029384729520458125303360540${folioGrandTotal}5802ID5918GRAND FORSDIG PMS6007JAKARTA62190115INV-REC-${Date.now().toString().slice(-6)}6304ABCD`;
      QRCode.toDataURL(qrisPayload, {
        width: 260,
        margin: 1,
        color: {
          dark: "#064e3b",
          light: "#ffffff"
        }
      })
        .then((url) => setQrisDataUrl(url))
        .catch((err) => console.error("QRIS generation error:", err));
    }
  }, [paymentMethod, folioGrandTotal]);

  // Format IDR currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Add extra charge preset
  const handleAddPreset = (preset: ExtraChargePreset) => {
    const newItem: InvoiceItem = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: preset.name,
      amount: preset.amount
    };
    setExtraItems((prev) => [...prev, newItem]);
  };

  // Add custom extra charge
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemDesc.trim() || customItemAmount <= 0) return;
    const newItem: InvoiceItem = {
      id: `cust-${Date.now()}`,
      description: customItemDesc.trim(),
      amount: customItemAmount
    };
    setExtraItems((prev) => [...prev, newItem]);
    setCustomItemDesc("");
    setCustomItemAmount(50000);
  };

  // Remove extra item
  const handleRemoveExtraItem = (id: string) => {
    setExtraItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Receptionist payment submission -> Direct Sync to Finance!
  const handleProcessPayment = () => {
    if (!currentReservation || !currentTenant || !currentUnit || !currentProperty) {
      alert("Pilih tamu dan reservasi yang valid terlebih dahulu!");
      return;
    }

    if (paymentMethod === "Cash" && cashGiven < folioGrandTotal) {
      alert(`Uang tunai diterima (${formatIDR(cashGiven)}) kurang dari total tagihan (${formatIDR(folioGrandTotal)})!`);
      return;
    }

    const now = new Date();
    const timestampStr = now.toISOString();
    const dateFormatted = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    // Build Invoice Items List
    const allInvoiceItems: InvoiceItem[] = [
      {
        id: `room-${Date.now()}`,
        description: `Sewa Kamar ${currentUnit.unitNumber} (${stayNights} Malam x ${formatIDR(currentUnit.price)})`,
        amount: baseRoomRate
      },
      ...extraItems
    ];

    if (discountAmount > 0) {
      allInvoiceItems.push({
        id: `disc-${Date.now()}`,
        description: "Diskon Promosi / Voucher Resepsionis",
        amount: -discountAmount
      });
    }

    const newInvoiceId = `inv-rec-${Date.now()}`;
    const newInvoiceNumber = `INV/REC/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}-${randomSuffix}`;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      tenantId: currentTenant.id,
      propertyId: currentProperty.id,
      unitId: currentUnit.id,
      invoiceNumber: newInvoiceNumber,
      items: allInvoiceItems,
      subtotal: folioSubtotal,
      tax: folioTaxAmount,
      totalAmount: folioGrandTotal,
      dueDate: currentReservation.checkOutDate,
      status: "Paid",
      whatsappStatus: "Belum Terkirim",
      createdAt: timestampStr
    };

    const newPaymentId = `pay-rec-${Date.now()}`;
    const newTransactionNumber = `TRX/REC/${dateFormatted}-${randomSuffix}`;

    const newPaymentLog: PaymentLog & { _invoice?: Invoice } = {
      id: newPaymentId,
      invoiceId: newInvoiceId,
      amount: folioGrandTotal,
      paymentDate: timestampStr,
      method: paymentMethod,
      transactionNumber: newTransactionNumber,
      proofUrl: paymentMethod === "QRIS" ? "qris-verified-system" : undefined,
      _invoice: newInvoice
    };

    // 1. Send Invoice to Global State & Finance
    onAddInvoice(newInvoice);

    // 2. Send Payment to Global State & Finance
    onAddPayment(newPaymentLog);

    // 3. Update Reservation to Paid and Checked In (if toggled)
    const updatedReservation: Reservation = {
      ...currentReservation,
      paymentStatus: "Paid",
      status: autoCheckInGuest && currentReservation.status === "Confirmed" ? "Checked In" : currentReservation.status
    };
    onUpdateReservation(updatedReservation);

    // 4. Set completed transaction for receipt presentation
    setCompletedTransaction({
      invoice: newInvoice,
      payment: newPaymentLog,
      tenantName: currentTenant.name,
      unitNumber: currentUnit.unitNumber,
      propertyName: currentProperty.name,
      changeAmount: cashChange
    });

    // Reset extras
    setExtraItems([]);
    setDiscountAmount(0);
  };

  // Generate PDF Receipt using jsPDF
  const handleDownloadPDFReceipt = () => {
    if (!completedTransaction) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    const { invoice, payment, tenantName, unitNumber, propertyName } = completedTransaction;

    // Header & Brand
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.rect(0, 0, 148, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(propertyName.toUpperCase(), 14, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(209, 250, 229);
    doc.text("KASIR RESEPSIONIS & FRONT DESK BILLING SYSTEM", 14, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("KUITANSI LUNAS", 134, 11, { align: "right" });
    doc.setFontSize(7);
    doc.text(`Tersinkron ke Finance: ${payment.transactionNumber}`, 134, 18, { align: "right" });

    // Meta details
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(`No. Invoice : ${invoice.invoiceNumber}`, 14, 34);
    doc.text(`No. Transaksi : ${payment.transactionNumber}`, 14, 39);
    doc.text(`Waktu Bayar : ${new Date(payment.paymentDate).toLocaleString("id-ID")}`, 14, 44);

    doc.text(`Nama Tamu : ${tenantName}`, 85, 34);
    doc.text(`Kamar / Unit : Kamar ${unitNumber}`, 85, 39);
    doc.text(`Metode Bayar : ${payment.method.toUpperCase()}`, 85, 44);

    // Line divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 48, 134, 48);

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Rincian Tagihan & Fasilitas", 14, 54);
    doc.text("Jumlah (IDR)", 134, 54, { align: "right" });

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 56, 134, 56);

    // Items list
    let yPos = 62;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    invoice.items.forEach((item) => {
      doc.setTextColor(71, 85, 105);
      doc.text(item.description, 14, yPos);
      doc.setTextColor(15, 23, 42);
      doc.text(formatIDR(item.amount), 134, yPos, { align: "right" });
      yPos += 6;
    });

    if (invoice.tax > 0) {
      doc.setTextColor(71, 85, 105);
      doc.text("Pajak Daerah / PB1 Hotel (10%)", 14, yPos);
      doc.setTextColor(15, 23, 42);
      doc.text(formatIDR(invoice.tax), 134, yPos, { align: "right" });
      yPos += 6;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, yPos, 134, yPos);
    yPos += 5;

    // Total Amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text("TOTAL LUNAS", 14, yPos);
    doc.text(formatIDR(invoice.totalAmount), 134, yPos, { align: "right" });

    yPos += 14;

    // Paid Stamp box
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, yPos, 45, 18, 2, 2, "FD");

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PAID / LUNAS", 36.5, yPos + 7, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("FRONT DESK VERIFIED", 36.5, yPos + 12, { align: "center" });

    // Cashier signature
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text("Petugas Kasir Resepsionis", 134, yPos + 4, { align: "right" });
    doc.text("Tersinkronisasi ke Cloud Finance", 134, yPos + 14, { align: "right" });

    // Footer note
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Bukti pembayaran sah yang diterbitkan oleh sistem manajemen properti terpusat PMS Pro.", 74, 195, {
      align: "center"
    });

    doc.save(`Kuitansi_${invoice.invoiceNumber.replace(/[\/\\]/g, "_")}.pdf`);
  };

  // WhatsApp receipt link
  const getWhatsAppReceiptLink = () => {
    if (!completedTransaction) return "#";
    const { invoice, payment, tenantName, unitNumber, propertyName } = completedTransaction;
    const phone = currentTenant?.phone || "";
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(
      `Halo Kak *${tenantName}* 👋,\nTerima kasih telah melakukan pembayaran di Front Desk *${propertyName}*.\n\n📄 *KUITANSI PEMBAYARAN RESEPSIONIS (LUNAS)*\n• No. Invoice: *${invoice.invoiceNumber}*\n• No. Referensi: *${payment.transactionNumber}*\n• Unit Kamar: *Kamar ${unitNumber}*\n• Metode Bayar: *${payment.method.toUpperCase()}*\n• Total Dibayar: *${formatIDR(invoice.totalAmount)}*\n• Status: *LUNAS (Verified by Front Desk & Finance)*\n\nStruk pembayaran digital ini sah dan tersinkronisasi langsung ke sistem keuangan kami. Selamat menikmati waktu Anda bersama kami! 🙏`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  // Compute stats for reception billing
  const receptionBillingStats = useMemo(() => {
    const recInvoices = invoices.filter((inv) => inv.invoiceNumber.startsWith("INV/REC"));
    const recPayments = payments.filter((p) => p.transactionNumber.startsWith("TRX/REC"));
    const totalCollected = recPayments.reduce((acc, p) => acc + p.amount, 0);

    const unpaidCount = reservations.filter((r) => r.paymentStatus !== "Paid" && r.status !== "Cancelled").length;
    const inHouseCount = reservations.filter((r) => r.status === "Checked In").length;

    return {
      totalRecInvoicesCount: recInvoices.length,
      totalRecPaymentsCount: recPayments.length,
      totalCollectedAmount: totalCollected,
      unpaidCount,
      inHouseCount
    };
  }, [invoices, payments, reservations]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* HEADER BANNER WITH REAL-TIME FINANCE SYNC STATUS */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 to-transparent" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Front Desk POS & Cashier Terminal
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync ke Departemen Keuangan
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-emerald-400" />
              Kasir & Billing Resepsionis
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Penerbitan tagihan kamar (folio), penambahan biaya fasilitas (laundry, F&B, airport shuttle), kasir tunai / QRIS / EDC, serta pencatatan otomatis ke pembukuan Keuangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateToFinance && (
              <button
                onClick={onNavigateToFinance}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/20 shadow-xs cursor-pointer"
                title="Buka modul Keuangan untuk melihat posting jurnal"
              >
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <span>Buka Modul Keuangan</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )}
          </div>
        </div>

        {/* 4 QUICK METRICS FOR RECEPTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-emerald-800/60">
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Kas Masuk Hari Ini</span>
            <div className="text-lg md:text-xl font-black text-emerald-300 mt-0.5">
              {formatIDR(receptionBillingStats.totalCollectedAmount)}
            </div>
            <span className="text-[9px] text-emerald-200/60 mt-0.5 block">Dari {receptionBillingStats.totalRecPaymentsCount} transaksi kasir</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Faktur Resepsionis</span>
            <div className="text-lg md:text-xl font-black text-white mt-0.5">
              {receptionBillingStats.totalRecInvoicesCount} <span className="text-xs font-normal text-emerald-200/70">Invoice</span>
            </div>
            <span className="text-[9px] text-emerald-200/60 mt-0.5 block">Tersinkron ke Buku Besar</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold text-amber-300/90 block">Menunggu Bayar</span>
            <div className="text-lg md:text-xl font-black text-amber-400 mt-0.5">
              {receptionBillingStats.unpaidCount} <span className="text-xs font-normal text-amber-200/70">Reservasi</span>
            </div>
            <span className="text-[9px] text-amber-200/60 mt-0.5 block">Belum lunas di front desk</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold text-teal-300/80 block">Tamu In-House</span>
            <div className="text-lg md:text-xl font-black text-teal-300 mt-0.5">
              {receptionBillingStats.inHouseCount} <span className="text-xs font-normal text-teal-200/70">Kamar</span>
            </div>
            <span className="text-[9px] text-teal-200/60 mt-0.5 block">Sedang menginap aktif</span>
          </div>
        </div>
      </div>

      {/* MAIN DUAL COLUMN: LEFT GUEST FOLIO & BILLING, RIGHT CASHIER TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: SELECT GUEST + ROOM FOLIO ITEMS (COL-SPAN-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: GUEST / RESERVATION SELECTOR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Pilih Tamu & Reservasi Kamar
                </h3>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <button
                  onClick={() => setResStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    resStatusFilter === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua ({reservations.length})
                </button>
                <button
                  onClick={() => setResStatusFilter("UNPAID")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    resStatusFilter === "UNPAID" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  Belum Lunas ({reservations.filter((r) => r.paymentStatus !== "Paid").length})
                </button>
                <button
                  onClick={() => setResStatusFilter("CHECKED_IN")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    resStatusFilter === "CHECKED_IN" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  In-House ({reservations.filter((r) => r.status === "Checked In").length})
                </button>
              </div>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama tamu, nomor kamar, atau nomor HP..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Dropdown Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">
                Pilih Dari Daftar Reservasi Aktif:
              </label>
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-slate-800"
              >
                {filteredReservations.map((res) => {
                  const t = tenants.find((item) => item.id === res.tenantId);
                  const u = units.find((item) => item.id === res.unitId);
                  const p = properties.find((item) => item.id === res.propertyId);
                  return (
                    <option key={res.id} value={res.id}>
                      {t?.name || "Tamu"} | Kamar {u?.unitNumber || "-"} ({p?.name.slice(0, 18)}) | {res.checkInDate} s/d {res.checkOutDate} | Status: {res.paymentStatus}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Guest Card Preview */}
            {currentReservation && currentTenant && currentUnit && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Identitas Tamu</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{currentTenant.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{currentTenant.phone}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">KTP: {currentTenant.ktpNumber}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit & Properti</span>
                  <p className="font-extrabold text-emerald-800 text-sm mt-0.5">
                    Kamar {currentUnit.unitNumber}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">{currentProperty?.name}</p>
                  <p className="text-[10px] text-slate-400">{currentUnit.type} • Lt.{currentUnit.floor}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Durasi & Status</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {stayNights} Malam ({currentReservation.checkInDate.slice(5)} s/d {currentReservation.checkOutDate.slice(5)})
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        currentReservation.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {currentReservation.paymentStatus === "Paid" ? "LUNAS" : "BELUM LUNAS"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      {currentReservation.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: ROOM FOLIO & CHARGES */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Rincian Folio Tagihan (Billing Items)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Ref: {currentReservation?.id || "N/A"}
              </span>
            </div>

            {/* Base Room Charge Row */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-emerald-950">
                    Sewa Kamar {currentUnit?.unitNumber} ({stayNights} Malam)
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Tarif {formatIDR(currentUnit?.price || 0)} / malam • Check-in s/d Check-out
                  </p>
                </div>
              </div>
              <span className="font-black text-emerald-950 text-sm">{formatIDR(baseRoomRate)}</span>
            </div>

            {/* Extra items list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Item Tambahan & Fasilitas (Extra Charges):
                </span>
                {extraItems.length > 0 && (
                  <button
                    onClick={() => setExtraItems([])}
                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Hapus Semua Extra
                  </button>
                )}
              </div>

              {extraItems.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Belum ada item tambahan. Tambahkan dari preset di bawah atau input manual.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {extraItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition"
                    >
                      <span className="font-bold text-slate-800">{item.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900">{formatIDR(item.amount)}</span>
                        <button
                          onClick={() => handleRemoveExtraItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                          title="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PRESET EXTRA CHARGES BUTTONS */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                + Tambah Biaya Cepat (Klik untuk menambahkan ke tagihan):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXTRA_CHARGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name.split("(")[0]}</span>
                    <span className="text-emerald-600 font-mono">+{preset.amount / 1000}k</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM EXTRA CHARGE INPUT FORM */}
            <form onSubmit={handleAddCustomItem} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Atau Tambah Item Khusus / Biaya Manual:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Keterangan item (cth: Parkir Valet 2 Hari)..."
                  value={customItemDesc}
                  onChange={(e) => setCustomItemDesc(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                />
                <input
                  type="number"
                  placeholder="Nominal (Rp)"
                  value={customItemAmount || ""}
                  onChange={(e) => setCustomItemAmount(Number(e.target.value))}
                  className="w-28 p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  min="1000"
                  step="5000"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </form>

            {/* DISCOUNTS & TAX ADJUSTMENTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Potongan Diskon / Voucher (Rp):
                </label>
                <input
                  type="number"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Pajak Daerah / PB1 Hotel:
                </label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value={0}>Tanpa Pajak (0%)</option>
                  <option value={10}>PB1 Pajak Hotel Standar (10%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PAYMENT TERMINAL & CASHIER ACTIONS (COL-SPAN-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Terminal Kasir & Pembayaran
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Auto-Finance Sync
              </span>
            </div>

            {/* GRAND TOTAL SUMMARY DISPLAY */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white space-y-2 shadow-inner">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subtotal Item Folio</span>
                <span className="font-mono">{formatIDR(folioSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Potongan Diskon</span>
                  <span className="font-mono">-{formatIDR(discountAmount)}</span>
                </div>
              )}

              {folioTaxAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Pajak Daerah (10%)</span>
                  <span className="font-mono">+{formatIDR(folioTaxAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-700/80 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Total Tagihan Akhir
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {formatIDR(folioGrandTotal)}
                </span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">
                Pilih Metode Pembayaran:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Cash")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                    paymentMethod === "Cash"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                    paymentMethod === "QRIS"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>QRIS Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Payment Gateway")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                    paymentMethod === "Payment Gateway"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mesin EDC / Kartu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Transfer")}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                    paymentMethod === "Transfer"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Transfer Bank</span>
                </button>
              </div>
            </div>

            {/* DYNAMIC PAYMENT METHOD DETAILS */}
            {paymentMethod === "Cash" && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Nominal Uang Tunai Diterima (Rp):
                  </label>
                  <input
                    type="number"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-black text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                    placeholder="Masukkan uang yang diberikan tamu..."
                  />
                </div>

                {/* Quick cash denomination buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCashGiven(folioGrandTotal)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-emerald-50"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(Math.ceil(folioGrandTotal / 100000) * 100000)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-emerald-50"
                  >
                    Bulat 100rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(folioGrandTotal + 50000)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-emerald-50"
                  >
                    +50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(folioGrandTotal + 100000)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-emerald-50"
                  >
                    +100rb
                  </button>
                </div>

                {/* Change amount preview */}
                <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-500 text-[11px]">Uang Kembalian Tamu:</span>
                  <span className={`text-sm ${cashChange > 0 ? "text-emerald-700 font-black" : "text-slate-400"}`}>
                    {formatIDR(cashChange)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === "QRIS" && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Scan QRIS Resmi Bank Indonesia</span>
                </div>

                {qrisDataUrl ? (
                  <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img
                      src={qrisDataUrl}
                      alt="QRIS Resepsionis"
                      className="w-44 h-44 mx-auto object-contain"
                    />
                    <div className="text-[10px] font-mono font-bold text-emerald-800 mt-1.5">
                      {formatIDR(folioGrandTotal)}
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 mx-auto bg-slate-200 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                    Membuat QRIS...
                  </div>
                )}

                <p className="text-[10px] text-slate-500">
                  Arahkan tamu untuk memindai dengan BCA Mobile, GoPay, OVO, Dana, atau Livin Mandiri.
                </p>

                <button
                  type="button"
                  onClick={() => setQrisSimulatedPaid(true)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    qrisSimulatedPaid
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-200 hover:bg-emerald-100 text-slate-700"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{qrisSimulatedPaid ? "QRIS Terverifikasi Masuk!" : "Simulasi Tamu Scan Berhasil"}</span>
                </button>
              </div>
            )}

            {paymentMethod === "Payment Gateway" && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mesin EDC Bank</label>
                    <select
                      value={cardBank}
                      onChange={(e) => setCardBank(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                    >
                      <option value="BCA">EDC BCA</option>
                      <option value="Mandiri">EDC Mandiri</option>
                      <option value="BRI">EDC BRI</option>
                      <option value="BNI">EDC BNI</option>
                      <option value="CIMB">EDC CIMB Niaga</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">4 Digit Kartu</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="cth: 4892"
                      value={cardLastDigits}
                      onChange={(e) => setCardLastDigits(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Approval / Trace ID</label>
                  <input
                    type="text"
                    placeholder="cth: APP-982734"
                    value={edcApprovalCode}
                    onChange={(e) => setEdcApprovalCode(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "Transfer" && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Rekening Resmi Operasional:</span>
                  <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                    <span>BCA: 8820-192-384</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">a/n Forsdig PMS</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">No. Referensi / Ref Transfer</label>
                  <input
                    type="text"
                    placeholder="cth: TRF-BCA-98213"
                    value={transferRefNumber}
                    onChange={(e) => setTransferRefNumber(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            )}

            {/* Auto Check-in Toggle */}
            {currentReservation && currentReservation.status === "Confirmed" && (
              <label className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoCheckInGuest}
                  onChange={(e) => setAutoCheckInGuest(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-emerald-950">
                  Otomatis ubah status tamu menjadi "Checked In" setelah lunas
                </span>
              </label>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={!currentReservation || folioGrandTotal <= 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-200/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Proses Pembayaran & Sinkronkan ke Finance</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Faktur akan langsung tercatat pada modul <strong className="text-slate-600">Billing & Keuangan</strong> dan penerimaan kas akan membukukan arus kas secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY COMPONENT: FRONT DESK TRANSACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Riwayat Transaksi Kasir Resepsionis (Tersambung ke Finance)
            </h3>
            <p className="text-[11px] text-slate-400">
              Daftar seluruh invoice dan pembayaran yang diproses langsung oleh staf front desk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {invoices.filter((i) => i.invoiceNumber.startsWith("INV/REC")).length} Transaksi Resepsionis
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-3.5 font-bold">No. Invoice & Waktu</th>
                <th className="p-3.5 font-bold">Nama Tamu & Unit</th>
                <th className="p-3.5 font-bold">Rincian Item</th>
                <th className="p-3.5 font-bold">Total Tagihan</th>
                <th className="p-3.5 font-bold">Status Sinkronisasi</th>
                <th className="p-3.5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices
                .filter((inv) => inv.invoiceNumber.startsWith("INV/REC") || inv.status === "Paid")
                .slice(0, 10)
                .map((inv) => {
                  const t = tenants.find((item) => item.id === inv.tenantId);
                  const u = units.find((item) => item.id === inv.unitId);
                  const p = properties.find((item) => item.id === inv.propertyId);
                  const pay = payments.find((item) => item.invoiceId === inv.id);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(inv.createdAt).toLocaleString("id-ID")}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{t?.name || "Tamu"}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Kamar {u?.unitNumber || "-"} • {p?.name}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[11px] text-slate-600 block truncate max-w-xs">
                          {inv.items.map((it) => it.description).join(", ")}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {inv.items.length} Item Folio
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-black text-slate-900 text-sm">{formatIDR(inv.totalAmount)}</span>
                        {pay && (
                          <span className="text-[10px] text-emerald-600 block font-bold">
                            via {pay.method.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Tersambung ke Finance
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setCompletedTransaction({
                              invoice: inv,
                              payment: pay || {
                                id: `pay-${inv.id}`,
                                invoiceId: inv.id,
                                amount: inv.totalAmount,
                                paymentDate: inv.createdAt,
                                method: "Cash",
                                transactionNumber: `TRX-${inv.invoiceNumber}`
                              },
                              tenantName: t?.name || "Tamu",
                              unitNumber: u?.unitNumber || "-",
                              propertyName: p?.name || "Hotel PMS Pro",
                              changeAmount: 0
                            });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          Lihat Kuitansi
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETED TRANSACTION MODAL & OFFICIAL RECEIPT */}
      {completedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 text-center relative">
              <button
                onClick={() => setCompletedTransaction(null)}
                className="absolute right-4 top-4 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <h3 className="text-base font-black tracking-tight">
                Pembayaran Berhasil Dikonfirmasi!
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Data otomatis diposting ke Departemen Keuangan & Buku Kas Masuk
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">No. Faktur Kasir</span>
                  <span className="font-mono font-bold text-slate-800">
                    {completedTransaction.invoice.invoiceNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">Tamu & Kamar</span>
                  <span className="font-bold text-slate-900">
                    {completedTransaction.tenantName} (Kamar {completedTransaction.unitNumber})
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">Metode Pembayaran</span>
                  <span className="font-bold text-emerald-700">
                    {completedTransaction.payment.method.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">Waktu Transaksi</span>
                  <span className="font-mono text-slate-600">
                    {new Date(completedTransaction.payment.paymentDate).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-black">
                  <span className="text-slate-800">Total Dibayar</span>
                  <span className="text-emerald-700 font-mono">
                    {formatIDR(completedTransaction.invoice.totalAmount)}
                  </span>
                </div>

                {completedTransaction.changeAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 pt-1">
                    <span>Uang Kembalian</span>
                    <span className="font-mono text-emerald-600">
                      {formatIDR(completedTransaction.changeAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Verification Badge */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-black block">Status Terhubung: Keuangan & Akuntansi</span>
                  Transaksi ini telah dicatat di Buku Kas Masuk dan status reservasi tamu otomatis berstatus <strong>LUNAS (Paid)</strong>.
                </div>
              </div>

              {/* Action Buttons: PDF, WhatsApp, Close */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDFReceipt}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Kuitansi PDF</span>
                </button>

                {currentTenant?.phone && (
                  <a
                    href={getWhatsAppReceiptLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Kirim ke WhatsApp</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCompletedTransaction(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Tutup Jendela Kasir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
