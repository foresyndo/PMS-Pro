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
