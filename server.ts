import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing
app.use(express.json({ limit: "5mb" }));

// Lazy initializer for Gemini client to prevent crashing if the key is not defined at boot
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiInstance = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("Gemini SDK initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return aiInstance;
}

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "PMS Pro Server",
    time: new Date().toISOString(),
    aiEnabled: !!process.env.GEMINI_API_KEY,
  });
});

// Mock/cached storage for public.work_chats
let workChatsDb = [
  {
    id: "a0000001-0000-4000-8000-000000000001",
    sender_name: "Budi Santoso",
    sender_role: "Owner",
    channel: "#umum",
    message: "Selamat pagi semua. Kanal chat kerja real-time sekarang sudah aktif untuk koordinasi kerja harian kita!",
    user_id: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "a0000001-0000-4000-8000-000000000002",
    sender_name: "Dewi Lestari",
    sender_role: "Manager",
    channel: "#umum",
    message: "Terima kasih Pak Budi. Teman-teman staf lainnya, mohon lapor setiap perkembangan di lapangan melalui grup chat di bawah ini ya.",
    user_id: null,
    created_at: new Date(Date.now() - 3600000 * 47).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 47).toISOString()
  },
  {
    id: "a0000001-0000-4000-8000-000000000003",
    sender_name: "Rudi Tabuti",
    sender_role: "Staff Maintenance",
    channel: "#perbaikan-teknis",
    message: "Laporan: AC bocor di kamar 102 lantai 1 sudah selesai diperbaiki dan di-service freon-nya. Status kamar aman untuk disewakan kembali.",
    user_id: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "a0000001-0000-4000-8000-000000000004",
    sender_name: "Siti Rahma",
    sender_role: "Finance",
    channel: "#keuangan-admin",
    message: "Tagihan sewa bulanan untuk Bapak Rian Hidayat (kamar 101) sudah lunas terkonfirmasi hari ini. Data billing di sistem sudah saya update.",
    user_id: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "a0000001-0000-4000-8000-000000000005",
    sender_name: "Anton Hartono",
    sender_role: "Receptionist",
    channel: "#penyewa-bantuan",
    message: "Tamu kamar 204 menanyakan tentang password wifi yang baru berjalan lambat. Apakah ada gangguan ISP?",
    user_id: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "a0000001-0000-4000-8000-000000000006",
    sender_name: "Dewi Lestari",
    sender_role: "Manager",
    channel: "#penyewa-bantuan",
    message: "Tadi server pusat ISP menginfokan perbaikan link kabel utama. Estimasi bandwith kembali normal 10 menit lagi ya Anton.",
    user_id: null,
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString()
  }
];

// Supabase REST work_chats endpoints (supporting GET, POST, DELETE)
app.get("/rest/v1/work_chats", async (req, res) => {
  let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  if (supabaseUrl.startsWith("//")) supabaseUrl = "https:" + supabaseUrl;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey && !supabaseUrl.includes("MY_SUPABASE")) {
    try {
      const targetUrl = new URL(`/rest/v1/work_chats${req.url.replace(/^\/rest\/v1\/work_chats/, "")}`, supabaseUrl).toString();
      const remoteRes = await fetch(targetUrl, {
        headers: {
          apikey: anonKey,
          Authorization: req.headers.authorization || `Bearer ${anonKey}`,
          Accept: req.headers.accept || "application/json"
        }
      });
      if (remoteRes.ok) {
        const data = await remoteRes.json();
        res.setHeader("content-type", "application/json; charset=utf-8");
        return res.status(200).json(data);
      }
    } catch (e) {
      console.warn("Could not proxy to Supabase work_chats:", e);
    }
  }

  let results = [...workChatsDb];
  const channelQuery = req.query.channel as string;
  if (channelQuery && channelQuery.startsWith("eq.")) {
    const targetChannel = channelQuery.slice(3);
    results = results.filter((m) => m.channel === targetChannel);
  }

  res.setHeader("content-type", "application/json; charset=utf-8");
  return res.status(200).json(results);
});

app.post("/rest/v1/work_chats", async (req, res) => {
  const body = Array.isArray(req.body) ? req.body : [req.body];
  let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  if (supabaseUrl.startsWith("//")) supabaseUrl = "https:" + supabaseUrl;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey && !supabaseUrl.includes("MY_SUPABASE")) {
    try {
      const targetUrl = new URL("/rest/v1/work_chats", supabaseUrl).toString();
      const remoteRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: req.headers.authorization || `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: (req.headers.prefer as string) || "return=representation"
        },
        body: JSON.stringify(body)
      });
      if (remoteRes.ok) {
        const data = await remoteRes.json().catch(() => body);
        return res.status(201).json(data);
      }
    } catch (e) {
      console.warn("Could not proxy POST to Supabase work_chats:", e);
    }
  }

  for (const item of body) {
    const newRecord = {
      id: item.id || (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : "a0000000-0000-4000-8000-" + Date.now().toString().padStart(12, "0")),
      sender_name: item.sender_name || item.senderName || "User",
      sender_role: item.sender_role || item.senderRole || "Staff",
      channel: item.channel || "#umum",
      message: item.message || "",
      user_id: item.user_id || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
    workChatsDb.push(newRecord);
  }

  res.setHeader("content-type", "application/json; charset=utf-8");
  return res.status(201).json(body);
});

app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { reportData, promptType } = req.body;
    
    // Construct robust context-aware prompt depending on requested task
    let promptSubject = "Property Performance & Occupancy Analysis";
    let instructions = "Provide strategic insight for a property owner managing rental properties.";
    
    if (promptType === "occupancy") {
      promptSubject = "Detailed Occupancy & Rent Optimization";
      instructions = "Analyze occupancy levels, find vacant segments, identify patterns, and suggest competitive pricing modifications to boost booking conversion.";
    } else if (promptType === "finance") {
      promptSubject = "Financial Cashflow & Profit/Loss Strategy";
      instructions = "Analyze the ratio of revenues to expenses, look for operational overhead leaks (electric, water, wifi, maintenance), project monthly EBITDA, and calculate approximate ROI.";
    } else if (promptType === "maintenance") {
      promptSubject = "Predictive Maintenance & Asset Health Review";
      instructions = "Analyze tenant-reported maintenance tickets, prioritize urgent tasks, optimize technician allocations, and recommend proactive replacements for broken inventory.";
    }
    
    const contextPrompt = `
You are PMS Pro AI, an Expert Enterprise Property Management System Consulting Specialist.
Task: ${promptSubject}
Instructions: ${instructions}

Format your output in professional, scannable Markdown in indonesian language (Bahasa Indonesia).
Use concise bullet points, bold headers, and structured advice. Avoid fluff. Include action items.

Data Context (JSON format):
${JSON.stringify(reportData, null, 2)}
`;

    const ai = getGeminiClient();

    if (!ai) {
      // Return a simulated high-quality report when backend key is not present so the app runs offline flawlessly
      console.log("Simulating AI Report analysis because GEMINI_API_KEY is not configured.");
      const mockReports: Record<string, string> = {
        occupancy: `### 📈 Analisis Okupansi AI Pro (Simulasi)

Berdasarkan data properti anda saat ini, berikut analisis tingkat hunian (Okupansi):

1. **Okupansi Rata-rata saat ini berada di 78%**: 
   - Properti tipe **Kost Eksklusif** memiliki okupansi tertinggi (**100%**).
   - Properti tipe **Hotel & Villa** mengalami fluktuasi akhir pekan, rata-rata hunian di **65%**.
2. **Identifikasi Unit Kosong Kontributif**:
   - Kamar tipe deluxe nomor 204 dan 301 di Apartemen telah kosong lebih dari 18 hari berturut-turut.
3. **Rekomendasi Penyesuaian Harga**:
   - Turunkan harga sewa unit deluxe kosong sebesar **5% - 7%** selama *low season* ini untuk memicu *booking trigger* cepat.
   - Naikkan harga sewa kamar Kost sebesar **10%** pada tahun ajaran baru melihat permintaan pasar lokal yang padat.

*Rekomendasi ini dibuat otomatis oleh PMS Pro AI.*`,
        
        finance: `### 💵 Analisis Arus Kas & Keuangan AI (Simulasi)

Analisis struktur biaya dan profitabilitas terhadap total properti Anda:

1. **Rasio Pengoperasian Operasional (Operating Expense Ratio)**:
   - Pengeluaran operasional saat ini mengambil porsi **32%** dari pendapatan kotor bulanan Anda.
   - Porsi pengeluaran terbesar berasal dari tagihan **Listrik & Air (Utilitas)** yang menyentuh **45%** dari total pengeluaran operasional.
2. **Kebocoran Operasional Terdeteksi**:
   - Biaya pemeliharaan AC berulang di Hotel menunjukkan indikasi unit pendingin rusak kronis yang lebih baik diganti baru (ROI estimasi 11 bulan melalui efisiensi daya).
3. **Proyeksi EBITDA & ROI**:
   - Pendapatan Bersih Sebelum Bunga & Pajak (EBITDA) mencapai **Rp 88.400.000,-** bulan ini, dengan proyeksi ROI tahunan stabil di kisaran **12,4%**.

*Gunakan stopkontak pintar (smart plug) untuk mengontrol konsumsi AC tenant kost harian.*`,

        maintenance: `### 🛠️ Rekomendasi Pemeliharaan & Aset AI (Simulasi)

Evaluasi tiket pengaduan tenant dan kondisi inventaris properti:

1. **Skala Prioritas Penanganan Kerusakan**:
   - **Darurat (High)**: Kerusakan instalasi pipa air di Kamar 102 Kost memerlukan pengerjaan cepat dalam 12 jam ke depan guna menghindari pengikisan plafon bawah.
   - **Sedang (Medium)**: AC tidak dingin di unit apartemen 405 (jadwal penugasan Teknisi: Doni Sukma).
2. **Produktivitas Tim Maintenance**:
   - Waktu rata-rata penyelesaian masalah (Mean Time to Resolve) adalah **2.4 hari**. Target efisiensi diturunkan menjadi < 1.0 hari untuk mengamankan retensi tenant.
3. **Optimasi Stok Gudang (Inventory)**:
   - Sediakan minimal 3 buah bohlam LED cadangan dan 2 keran air stainless sebagai preventif guna meminimalisir delay pengadaan komparatif.

*Pemeliharaan preventif menghemat pengeluaran perbaikan mendadak hingga 40%.*`
      };
      
      const responseText = mockReports[promptType || "occupancy"] || mockReports.occupancy;
      return res.json({ success: true, analysis: responseText, simulated: true });
    }

    console.log("Requesting Gemini generateContent via '@google/genai' on model 'gemini-3.5-flash'...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contextPrompt,
      config: {
        temperature: 0.7,
      }
    });

    const outputText = response.text || "Tidak ada respon dari model AI.";
    res.json({ success: true, analysis: outputText, simulated: false });

  } catch (err: any) {
    console.error("AI Analysis Endpoint Error:", err);
    res.status(500).json({
      success: false,
      error: "Gagal memproses analisa AI: " + err.message
    });
  }
});

// Setup Vite Dev Server / Static deployment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode. Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode. Serving static artifacts...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted successfully and listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
