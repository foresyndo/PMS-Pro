import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  QrCode,
  X,
  Zap,
  ZapOff,
  RefreshCw,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  MapPin,
  Clock,
  Plus,
  Minus,
  Save,
  Tag,
  Check,
  Search,
  Maximize2
} from "lucide-react";
import jsQR from "jsqr";

export interface InventoryItemWithAsset {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  category: "Consumables" | "Linens" | "Amenities" | "Tools" | "Room Assets";
  assetCode: string;
  assignedRoom?: string;
  conditionStatus?: "Good" | "Needs Maintenance" | "Damaged" | "In Laundry" | "Missing";
  lastUpdated?: string;
  lastCheckedBy?: string;
  notes?: string;
}

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItemWithAsset[];
  onUpdateItem: (updatedItem: InventoryItemWithAsset, auditLogText: string) => void;
  staffList?: string[];
  roomList?: string[];
}

export default function HousekeepingQrScannerModal({
  isOpen,
  onClose,
  inventory,
  onUpdateItem,
  staffList = ["Budi Santoso", "Siti Aminah", "Rian Hidayat", "Agus Supriatna", "Dewi Lestari", "Rani Wijaya"],
  roomList = ["Kamar 101", "Kamar 102", "Kamar 103", "Kamar 104", "Kamar 105", "Kamar 201", "Kamar 202", "Gudang Logistik"]
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "simulate">("camera");
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Scanned item state
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItemWithAsset | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState("");

  // Edit / Quick update state inside modal
  const [editQty, setEditQty] = useState<number>(1);
  const [editStatus, setEditStatus] = useState<InventoryItemWithAsset["conditionStatus"]>("Good");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editInspector, setEditInspector] = useState<string>(staffList[0] || "Agus Prasetyo");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio beep feedback
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  // Trigger haptic vibration if supported
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("API Kamera tidak didukung pada browser ini atau frame saat ini.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS Safari
        await videoRef.current.play();
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities && "torch" in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      setIsScanning(true);
      scanLoop();
    } catch (err: any) {
      console.warn("Camera access failed or blocked:", err);
      let message = "Kamera tidak dapat diakses.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Izin kamera ditolak oleh browser/pengguna. Aktifkan izin kamera di bilah alamat browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Tidak ada perangkat kamera yang terdeteksi.";
      } else {
        message = `Akses kamera dibatasi: ${err.message || "Gunakan opsi Upload Foto QR atau Simulasi 1-Klik di bawah."}`;
      }
      setCameraError(message);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn("Torch failed:", err);
      }
    }
  };

  // Scan Video Frame Loop with jsQR
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code && code.data) {
        handleDetectedQr(code.data);
        return; // stop loop while processing
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Handle QR Code Detected
  const handleDetectedQr = (rawContent: string) => {
    setIsScanning(false);
    playBeep();
    triggerHaptic();

    setScannedCode(rawContent);

    // Try parsing if JSON payload
    let targetCode = rawContent.trim();
    let targetId: string | null = null;

    try {
      if (rawContent.startsWith("{") && rawContent.endsWith("}")) {
        const parsed = JSON.parse(rawContent);
        if (parsed.code) targetCode = String(parsed.code);
        if (parsed.assetCode) targetCode = String(parsed.assetCode);
        if (parsed.id) targetId = String(parsed.id);
      }
    } catch {
      // not json, use raw string
    }

    // Match in inventory
    const found = inventory.find(
      (item) =>
        (targetId && item.id === targetId) ||
        item.assetCode?.toLowerCase() === targetCode.toLowerCase() ||
        item.id.toLowerCase() === targetCode.toLowerCase() ||
        item.name.toLowerCase().includes(targetCode.toLowerCase())
    );

    if (found) {
      setMatchedItem(found);
      setEditQty(found.quantity);
      setEditStatus(found.conditionStatus || "Good");
      setEditNotes(found.notes || "");
    } else {
      setMatchedItem(null);
    }
  };

  // Handle image upload scanning
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Format berkas harus berupa gambar!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });
        if (code && code.data) {
          handleDetectedQr(code.data);
        } else {
          alert("Kode QR tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak blur.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lifecycle for camera starting / stopping
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !matchedItem && isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, matchedItem, isScanning]);

  // Handle Save Quick Update
  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem) return;

    const nowStr = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    }) + " WIB";

    const updated: InventoryItemWithAsset = {
      ...matchedItem,
      quantity: editQty,
      conditionStatus: editStatus,
      lastUpdated: nowStr,
      lastCheckedBy: editInspector,
      notes: editNotes
    };

    const statusLabelMap: Record<string, string> = {
      Good: "Baik / Berfungsi Normal",
      "Needs Maintenance": "Perlu Pemeliharaan",
      Damaged: "Rusak / Butuh Servis",
      "In Laundry": "Dalam Pencucian (Laundry)",
      Missing: "Hilang / Ganti Rugi"
    };

    const auditText = `Pemindaian QR Aset [${matchedItem.assetCode || matchedItem.id} - ${matchedItem.name}]: Status diubah ke '${statusLabelMap[editStatus || "Good"]}' (Stok: ${editQty} unit). Diinspeksi oleh ${editInspector}.`;

    onUpdateItem(updated, auditText);
    setSaveSuccessMessage(`Status inventaris "${updated.name}" berhasil diperbarui!`);

    setTimeout(() => {
      setSaveSuccessMessage(null);
      // Reset for next scan
      setMatchedItem(null);
      setScannedCode(null);
      setIsScanning(true);
    }, 1400);
  };

  // Quick Action Buttons
  const applyQuickAction = (action: "consume1" | "restock10" | "markLaundry" | "markReady" | "markDamaged") => {
    if (!matchedItem) return;
    if (action === "consume1") {
      setEditQty(Math.max(0, editQty - 1));
      setEditNotes((prev) => (prev ? prev + " | " : "") + "Konsumsi 1 unit untuk kamar");
    } else if (action === "restock10") {
      setEditQty(editQty + 10);
      setEditNotes((prev) => (prev ? prev + " | " : "") + "Restock pasokan +10 unit dari supplier");
    } else if (action === "markLaundry") {
      setEditStatus("In Laundry");
      setEditNotes((prev) => (prev ? prev + " | " : "") + "Dikirim ke binatu / laundry");
    } else if (action === "markReady") {
      setEditStatus("Good");
      setEditNotes((prev) => (prev ? prev + " | " : "") + "Inspeksi fisik lolos, kondisi prima");
    } else if (action === "markDamaged") {
      setEditStatus("Damaged");
      setEditNotes((prev) => (prev ? prev + " | " : "") + "Ditemukan kerusakan, butuh teknisi");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans text-xs">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                  Pemindai Kamera QR Aset & Perlengkapan
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-black uppercase">
                  Fast Update
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Pindai barcode/QR pada pintu kamar, linen, atau peralatan hotel untuk memperbarui status dan stok seketika.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tutup Pemindai"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SUB TABS NAVIGATION */}
        {!matchedItem && (
          <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setActiveTab("camera");
                  setIsScanning(true);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "camera"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Camera className="h-3.5 w-3.5" /> Kamera Langsung
              </button>
              <button
                onClick={() => {
                  setActiveTab("upload");
                  stopCamera();
                }}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> Unggah Foto QR
              </button>
              <button
                onClick={() => {
                  setActiveTab("simulate");
                  stopCamera();
                }}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "simulate"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" /> Simulasi Scan 1-Klik
              </button>
            </div>

            {activeTab === "camera" && (
              <div className="flex items-center gap-1">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      torchOn
                        ? "bg-amber-400 text-slate-950 border-amber-500"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                    title={torchOn ? "Matikan Lampu Senter" : "Nyalakan Lampu Senter"}
                  >
                    {torchOn ? <Zap className="h-3.5 w-3.5 fill-current" /> : <ZapOff className="h-3.5 w-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => {
                    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
                  }}
                  className="p-1.5 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-left">
          
          {/* SUCCESS NOTIFICATION TOAST */}
          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-900 font-bold animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* VIEW 1: SCANNED ITEM CARD & QUICK UPDATE FORM */}
          {matchedItem ? (
            <div className="space-y-4">
              {/* Matched Asset Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 font-black rounded-md text-[9px] font-mono uppercase">
                          {matchedItem.assetCode || matchedItem.id}
                        </span>
                        <span className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-md text-[9px] uppercase">
                          {matchedItem.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {matchedItem.name}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMatchedItem(null);
                      setScannedCode(null);
                      setIsScanning(true);
                      setActiveTab("camera");
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="h-3 w-3" /> Pindai Item Lain
                  </button>
                </div>

                {/* Grid info badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 text-[10px]">
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block">Lokasi Aset</span>
                    <strong className="text-slate-800 font-black flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-emerald-600" />
                      {matchedItem.assignedRoom || "Gudang Utama"}
                    </strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block">Stok Saat Ini</span>
                    <strong className="text-slate-800 font-black text-xs mt-0.5 block font-mono">
                      {matchedItem.quantity} Unit
                    </strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block">Status Saat Ini</span>
                    <span className="inline-block mt-0.5 font-bold text-slate-700">
                      {matchedItem.conditionStatus || "Good"}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block">Update Terakhir</span>
                    <span className="text-[9px] text-gray-500 font-medium truncate block mt-0.5">
                      {matchedItem.lastUpdated || "Belum terekam"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK UPDATE FORM */}
              <form onSubmit={handleSaveUpdate} className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Formulir Pembaruan Cepat
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Tersinkronisasi otomatis ke inventaris</span>
                </div>

                {/* 1-Click Fast Action Shortcuts */}
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase block mb-1.5">
                    Aksi Instan Cepat (1-Klik)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyQuickAction("consume1")}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-3xs"
                    >
                      <Minus className="h-3 w-3 text-rose-500" /> Konsumsi Kamar (-1)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickAction("restock10")}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-3xs"
                    >
                      <Plus className="h-3 w-3 text-emerald-600" /> Restock Gudang (+10)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickAction("markReady")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Tandai Normal/Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickAction("markLaundry")}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      🧺 Kirim ke Laundry
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickAction("markDamaged")}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" /> Rusak / Servis
                    </button>
                  </div>
                </div>

                {/* Status Condition Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">
                    Kondisi & Kelayakan Perlengkapan *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: "Good", label: "Baik / Normal", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
                      { id: "Needs Maintenance", label: "Perlu Servis", color: "border-amber-500 bg-amber-50 text-amber-900" },
                      { id: "In Laundry", label: "Dalam Laundry", color: "border-sky-500 bg-sky-50 text-sky-900" },
                      { id: "Damaged", label: "Rusak Berat", color: "border-rose-500 bg-rose-50 text-rose-900" },
                      { id: "Missing", label: "Hilang / Ganti", color: "border-purple-500 bg-purple-50 text-purple-900" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setEditStatus(st.id as any)}
                        className={`p-2 rounded-xl text-[10px] font-bold border transition text-center cursor-pointer ${
                          editStatus === st.id
                            ? `${st.color} ring-2 ring-emerald-500/20 shadow-xs font-black`
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Controls and Inspector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
                    <label className="text-[9px] font-black text-gray-500 uppercase block">Jumlah Stok Fisik (Unit)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditQty(Math.max(0, editQty - 1))}
                        className="p-2 bg-slate-150 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        required
                        value={editQty}
                        onChange={(e) => setEditQty(Number(e.target.value))}
                        className="flex-1 text-center font-mono font-black text-sm p-1.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setEditQty(editQty + 1)}
                        className="p-2 bg-slate-150 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
                    <label className="text-[9px] font-black text-gray-500 uppercase block">Staf Pemeriksa (Inspector)</label>
                    <select
                      value={editInspector}
                      onChange={(e) => setEditInspector(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      {staffList.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inspection Notes */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase block">
                    Catatan Inspeksi / Keterangan Kondisi
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Contoh: AC berfungsi dingin maksimal, filter sudah disedot debu, remote baru diganti baterai..."
                    className="w-full p-2.5 border border-slate-300 rounded-2xl bg-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMatchedItem(null);
                      setScannedCode(null);
                      setIsScanning(true);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase text-[10px] rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" /> Simpan & Perbarui Status Inventaris
                  </button>
                </div>
              </form>
            </div>
          ) : scannedCode && !matchedItem ? (
            /* VIEW 2: SCANNED CODE NOT IN INVENTORY */
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
              <h4 className="text-sm font-black text-amber-950">Kode QR Tidak Terdaftar di Database</h4>
              <p className="text-xs text-amber-800 font-mono bg-white/80 p-2 rounded-xl border border-amber-200 inline-block max-w-full truncate">
                {scannedCode}
              </p>
              <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                Barang atau aset kamar dengan kode ini belum ada di inventaris aktif. Silakan cari manual atau coba scan item lain.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setScannedCode(null);
                    setIsScanning(true);
                    setActiveTab("camera");
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Pindai Ulang
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 3: SCANNER INTERFACE (Camera / Upload / Simulate) */
            <div className="space-y-4">
              
              {/* TAB CAMERA LANGSUNG */}
              {activeTab === "camera" && (
                <div className="space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video max-h-[340px] flex items-center justify-center border-2 border-slate-800 shadow-inner">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Reticle Scanner Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/60 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        {/* 4 Corner Markers */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />

                        {/* Moving Laser Beam Animation */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute animate-[pulse_1.5s_ease-in-out_infinite] top-1/2 -translate-y-1/2 shadow-[0_0_12px_#10b981]" />
                      </div>
                      <span className="mt-3 px-3 py-1 bg-slate-900/80 backdrop-blur-sm text-white font-bold text-[10px] rounded-full uppercase tracking-wider border border-white/10">
                        Arahkan kamera ke Kode QR Aset
                      </span>
                    </div>

                    {/* Camera Error Fallback */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-2.5">
                        <AlertTriangle className="h-10 w-10 text-amber-400" />
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">Akses Kamera Terkendala</h4>
                        <p className="text-[11px] text-slate-300 max-w-sm">{cameraError}</p>
                        <div className="flex flex-wrap gap-2 justify-center pt-2">
                          <button
                            onClick={startCamera}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-[10px] uppercase border border-slate-700 transition cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" /> Coba Lagi
                          </button>
                          <button
                            onClick={() => setActiveTab("simulate")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" /> Gunakan Simulasi 1-Klik
                          </button>
                          <button
                            onClick={() => setActiveTab("upload")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" /> Unggah Gambar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB UNGGAH FOTO QR */}
              {activeTab === "upload" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file);
                      };
                      input.click();
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 p-8 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center"
                  >
                    <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200">
                      <Upload className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <strong className="text-slate-800 text-xs block">Klik atau Seret Berkas Gambar QR di Sini</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">Mendukung format JPG, PNG, WEBP, atau screenshot QR aset</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB SIMULASI 1-KLIK (INSTANT TEST) */}
              {activeTab === "simulate" && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 font-medium leading-relaxed">
                    💡 <strong>Uji Cepat Tanpa Kamera Fisik:</strong> Klik salah satu sampel perlengkapan atau aset kamar di bawah untuk mensimulasikan hasil pemindaian kode QR seketika.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {inventory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleDetectedQr(item.assetCode || item.id)}
                        className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition flex items-center justify-between text-left group cursor-pointer shadow-3xs"
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 bg-slate-100 group-hover:bg-emerald-100 text-slate-800 group-hover:text-emerald-900 font-mono font-black rounded text-[8px]">
                              {item.assetCode || item.id}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{item.category}</span>
                          </div>
                          <strong className="text-slate-900 text-xs block truncate">{item.name}</strong>
                          <span className="text-[9px] text-gray-500 flex items-center gap-1 font-semibold">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" /> {item.assignedRoom || "Gudang Logistik"} • Stok: {item.quantity}
                          </span>
                        </div>
                        <span className="p-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition text-slate-600 shrink-0">
                          <QrCode className="h-4 w-4" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SEARCH MANUAL ACCORDION / QUICK SELECT */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Atau Ketik Kode Aset Secara Manual
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ketik kode (misal: AST-RM102-AC atau nama barang)..."
                      value={manualSearchQuery}
                      onChange={(e) => setManualSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && manualSearchQuery.trim()) {
                          e.preventDefault();
                          handleDetectedQr(manualSearchQuery.trim());
                        }
                      }}
                      className="w-full bg-slate-50 pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualSearchQuery.trim()) {
                        handleDetectedQr(manualSearchQuery.trim());
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] rounded-xl transition cursor-pointer"
                  >
                    Buka Aset
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Kamera otomatis mendeteksi kode QR & Barcode format standar</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
