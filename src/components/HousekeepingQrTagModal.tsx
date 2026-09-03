import React, { useState, useEffect } from "react";
import {
  QrCode,
  X,
  Printer,
  Download,
  Check,
  MapPin,
  Tag,
  Sparkles,
  Camera
} from "lucide-react";
import QRCode from "qrcode";
import { InventoryItemWithAsset } from "./HousekeepingQrScannerModal";

interface QrTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemWithAsset | null;
  propertyName?: string;
  onTestScan?: (code: string) => void;
}

export default function HousekeepingQrTagModal({
  isOpen,
  onClose,
  item,
  propertyName = "Forsdig Properti & Residence",
  onTestScan
}: QrTagModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item) return;

    // Use assetCode or JSON payload
    const payload = item.assetCode || item.id;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Generation failed:", err));
  }, [item]);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Harap izinkan popup browser untuk mencetak tag QR.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label QR Aset - ${item.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; text-align: center; }
            .card { border: 2px dashed #0f172a; padding: 16px; width: 260px; margin: 0 auto; border-radius: 12px; }
            .prop { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; }
            .room { font-size: 14px; font-weight: 900; color: #047857; margin: 4px 0; }
            .name { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
            img { width: 180px; height: 180px; }
            .code { font-family: monospace; font-size: 12px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin-top: 6px; }
            .footer { font-size: 9px; color: #64748b; margin-top: 6px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <div class="prop">${propertyName}</div>
            <div class="room">LOKASI: ${item.assignedRoom || "GUDANG UTAMA"}</div>
            <div class="name">${item.name}</div>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="code">${item.assetCode || item.id}</div>
            <div class="footer">PMS PRO HOUSEKEEPING ASSET TAG</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR-${item.assetCode || item.id}-${item.name.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-left">
            <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-xl">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide text-emerald-400">Tag Kode QR Aset Kamar</h3>
              <p className="text-[10px] text-slate-300">Siap dicetak atau ditempelkan pada fisik perlengkapan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4 bg-slate-50 text-center">
          
          <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-slate-300 shadow-md w-full max-w-[280px] space-y-2 relative">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                {propertyName}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-black rounded-md text-[10px] uppercase inline-block">
                📍 {item.assignedRoom || "Gudang Utama"}
              </span>
              <h4 className="font-black text-slate-900 text-xs mt-1 leading-snug">
                {item.name}
              </h4>
            </div>

            {/* QR Image */}
            <div className="p-2 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center my-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${item.name}`}
                  className="w-44 h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-300">
                  Membuat QR...
                </div>
              )}
            </div>

            <div className="space-y-0.5 pt-1 border-t border-slate-150">
              <span className="font-mono font-black text-slate-850 text-xs tracking-wider block">
                {item.assetCode || item.id}
              </span>
              <span className="text-[8px] font-black text-emerald-700 uppercase block tracking-wider">
                PMS PRO HOUSEKEEPING ASSET
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 font-medium max-w-xs">
            Tempelkan stiker/label QR ini pada unit AC, TV, lemari, dispenser, atau rak linen kamar untuk kemudahan inspeksi mobile.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
          {onTestScan && (
            <button
              onClick={() => {
                onClose();
                onTestScan(item.assetCode || item.id);
              }}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1 border border-emerald-200"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-600" /> Buka di Scanner
            </button>
          )}

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" /> Unduh .PNG
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak Label
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
