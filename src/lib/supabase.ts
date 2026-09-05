import { createClient } from "@supabase/supabase-js";
import { Property, Unit, Tenant, Reservation, Contract, Invoice, Expense, MaintenanceTicket, PaymentLog, WorkChatMessage } from "../types";

// Read environment variables
const rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
export const normalizeSupabaseUrl = (raw: string) => {
  if (!raw || typeof raw !== "string") return "";
  let u = raw.trim();
  if (u.startsWith("//")) u = "https:" + u;
  else if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  if (u.endsWith("/")) u = u.slice(0, -1);
  return u;
};

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const isUrlValid = (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) &&
    !supabaseUrl.includes("MY_SUPABASE") &&
    !supabaseUrl.includes("YOUR_SUPABASE") &&
    !supabaseUrl.includes("your-supabase");

  const isKeyValid = !supabaseAnonKey.includes("MY_KEY") &&
    !supabaseAnonKey.includes("YOUR_ANON") &&
    !supabaseAnonKey.includes("your-anon") &&
    supabaseAnonKey !== "";

  return !!(isUrlValid && isKeyValid);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Return SQL script to run in Supabase SQL Editor
export const getSupabaseInitSQL = () => {
  return `-- SCRIPT STRUKTUR DATABASE - PMS PRO
-- Salin dan jalankan skrip ini di SQL Editor Supabase Anda untuk mengaktifkan sinkronisasi data penuh.

-- 1. Tabel Properties
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  land_area NUMERIC,
  building_area NUMERIC,
  floors_count INTEGER,
  build_year INTEGER,
  image_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb
);

-- 2. Tabel Units
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  type TEXT,
  size NUMERIC,
  price NUMERIC,
  status TEXT NOT NULL,
  facilities JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  floor_plan_url TEXT
);

-- 3. Tabel Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ktp_number TEXT,
  ktp_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  job_title TEXT,
  emergency_contact JSONB DEFAULT '{"name":"","relation":"","phone":""}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants (name);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON tenants (phone);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants (email);
CREATE INDEX IF NOT EXISTS idx_tenants_ktp ON tenants (ktp_number);

-- 4. Tabel Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  deposit NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  terms_description TEXT,
  tenant_signature TEXT,
  owner_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabel Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL,
  whatsapp_status TEXT DEFAULT 'Belum Terkirim',
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Migrasi jika tabel invoices sebelumnya dibuat tanpa kolom whatsapp:
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'Belum Terkirim';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- 7. Tabel Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date TEXT NOT NULL,
  description TEXT,
  created_by TEXT
);

-- 8. Tabel Maintenance Tickets
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  priority TEXT NOT NULL,
  technician TEXT,
  status TEXT NOT NULL,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Tabel Payment Logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TEXT NOT NULL,
  method TEXT NOT NULL,
  transaction_number TEXT NOT NULL,
  proof_url TEXT
);

-- 10. Tabel Work Chats (public.work_chats)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.work_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_work_chats_channel ON public.work_chats (channel);
CREATE INDEX IF NOT EXISTS idx_work_chats_created_at ON public.work_chats (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_chats_user_id ON public.work_chats (user_id);

CREATE OR REPLACE FUNCTION public.set_work_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_work_chats_updated_at ON public.work_chats;
CREATE TRIGGER trg_work_chats_updated_at
  BEFORE UPDATE ON public.work_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.set_work_chats_updated_at();

-- 11. Tabel Role Credentials (Daftar User)
CREATE TABLE IF NOT EXISTS role_credentials (
  role TEXT NOT NULL,
  email TEXT PRIMARY KEY,
  passport TEXT NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_credentials ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik untuk kemudahan Integrasi Client Demo
CREATE POLICY "Akses Terbuka Properties" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Units" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Maintenance Tickets" ON maintenance_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Payment Logs" ON payment_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Terbuka Role Credentials" ON role_credentials FOR ALL USING (true) WITH CHECK (true);

-- Kebijakan RLS Khusus & Aman untuk public.work_chats
DROP POLICY IF EXISTS "Allow reading work chats" ON public.work_chats;
CREATE POLICY "Allow reading work chats"
  ON public.work_chats
  FOR SELECT
  TO authenticated, anon
  USING (
    channel LIKE '#%'
    OR channel NOT LIKE 'dm-%'
    OR auth.uid() = user_id
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Allow inserting work chats" ON public.work_chats;
CREATE POLICY "Allow inserting work chats"
  ON public.work_chats
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR (auth.uid() IS NULL)
  );

DROP POLICY IF EXISTS "Allow updating own work chats" ON public.work_chats;
CREATE POLICY "Allow updating own work chats"
  ON public.work_chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow deleting own work chats" ON public.work_chats;
CREATE POLICY "Allow deleting own work chats"
  ON public.work_chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Publikasi Supabase Realtime untuk public.work_chats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'work_chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_chats;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;
`;
};

// Dedicated SQL Migration for public.work_chats
export const getWorkChatsMigrationSQL = () => {
  return `-- ==========================================================
-- MIGRATION: public.work_chats
-- Deskripsi: Membuat tabel public.work_chats dengan UUID primary key,
-- foreign key user_id ke auth.users, indexes, trigger updated_at,
-- RLS policies aman, dan supabase_realtime publication.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.work_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_work_chats_channel ON public.work_chats (channel);
CREATE INDEX IF NOT EXISTS idx_work_chats_created_at ON public.work_chats (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_chats_user_id ON public.work_chats (user_id);

CREATE OR REPLACE FUNCTION public.set_work_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_work_chats_updated_at ON public.work_chats;
CREATE TRIGGER trg_work_chats_updated_at
  BEFORE UPDATE ON public.work_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.set_work_chats_updated_at();

ALTER TABLE public.work_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow reading work chats" ON public.work_chats;
CREATE POLICY "Allow reading work chats"
  ON public.work_chats
  FOR SELECT
  TO authenticated, anon
  USING (
    channel LIKE '#%'
    OR channel NOT LIKE 'dm-%'
    OR auth.uid() = user_id
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Allow inserting work chats" ON public.work_chats;
CREATE POLICY "Allow inserting work chats"
  ON public.work_chats
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR (auth.uid() IS NULL)
  );

DROP POLICY IF EXISTS "Allow updating own work chats" ON public.work_chats;
CREATE POLICY "Allow updating own work chats"
  ON public.work_chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow deleting own work chats" ON public.work_chats;
CREATE POLICY "Allow deleting own work chats"
  ON public.work_chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'work_chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_chats;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;
`;
};

// Dedicated SQL Migration for public.tenants
export const getTenantsMigrationSQL = () => {
  return `-- ==========================================================
-- MIGRATION: public.tenants (Master Data Penyewa / Tamu PMS)
-- Deskripsi: Membuat tabel public.tenants dengan primary key,
-- kolom KTP, kontak darurat JSONB, indeks pencarian cepat,
-- auto updated_at trigger, RLS policies, dan publikasi realtime.
-- ==========================================================

-- 1. Buat tabel public.tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ktp_number TEXT,
  ktp_url TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  job_title TEXT,
  emergency_contact JSONB DEFAULT '{"name":"","relation":"","phone":""}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indeks untuk optimasi query pencarian & filter data tenant
CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants (name);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON public.tenants (phone);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants (email);
CREATE INDEX IF NOT EXISTS idx_tenants_ktp ON public.tenants (ktp_number);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants (created_at DESC);

-- 3. Trigger otomatis pembaruan kolom updated_at saat data diedit
CREATE OR REPLACE FUNCTION public.set_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenants_updated_at();

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS (Row Level Security)
-- Memungkinkan aplikasi membaca data seluruh tenant aktif
DROP POLICY IF EXISTS "Allow read tenants" ON public.tenants;
CREATE POLICY "Allow read tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Memungkinkan penambahan tenant baru dari form registrasi/kontrak
DROP POLICY IF EXISTS "Allow insert tenants" ON public.tenants;
CREATE POLICY "Allow insert tenants"
  ON public.tenants
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Memungkinkan pembaruan data profil tenant
DROP POLICY IF EXISTS "Allow update tenants" ON public.tenants;
CREATE POLICY "Allow update tenants"
  ON public.tenants
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Memungkinkan penghapusan tenant oleh admin/manajemen
DROP POLICY IF EXISTS "Allow delete tenants" ON public.tenants;
CREATE POLICY "Allow delete tenants"
  ON public.tenants
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- 6. Tambahkan ke publikasi Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'tenants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

-- 7. Data Awal / Contoh Seeding Data Penyewa
INSERT INTO public.tenants (id, name, ktp_number, phone, email, address, job_title, emergency_contact, created_at)
VALUES 
  ('t-1', 'Rian Aditya', '32731102940001', '083811223344', 'rian.aditya@gmail.com', 'Jl. Margahayu Blok G No. 9, Bandung', 'Software Engineer di GoTo', '{"name":"Setyo Aditya","relation":"Orang Tua (Ayah)","phone":"081299887766"}'::jsonb, now()),
  ('t-2', 'Jessica Lauren', '3174092205960004', '081288997766', 'jessica.lauren@mandiri.co.id', 'Kencana Loka Sektor VII, BSD City, Tangerang', 'Investment Analyst di Mandiri Sekuritas', '{"name":"Marcus Lauren","relation":"Kakak Kandung","phone":"081122445566"}'::jsonb, now()),
  ('t-3', 'Danu Broto', '33211504910003', '085211002299', 'danu.broto@consulting.com', 'Sleman Permai II, Ngaglik, Sleman, Yogyakarta', 'Business Consultant', '{"name":"Indah Broto","relation":"Istri","phone":"085211002277"}'::jsonb, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  job_title = EXCLUDED.job_title;
`;
};

// SQL migrasi khusus untuk menambahkan kolom whatsapp ke tabel invoices
export const getInvoicesMigrationSQL = () => {
  return `-- =======================================================
-- MIGRATION: ADD WHATSAPP COLUMNS TO INVOICES TABLE
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- =======================================================

ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'Belum Terkirim',
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- Konfirmasi skema kolom berhasil ditambahkan
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices';
`;
};

// Table column schemas to sanitize payloads and prevent PostgREST schema cache errors
export const TABLE_COLUMNS: Record<string, string[]> = {
  properties: [
    "id", "name", "type", "address", "land_area", "building_area",
    "floors_count", "build_year", "image_url", "documents"
  ],
  units: [
    "id", "property_id", "unit_number", "floor", "type", "size",
    "price", "status", "facilities", "image_url", "floor_plan_url"
  ],
  tenants: [
    "id", "name", "ktp_number", "ktp_url", "phone", "email", "address",
    "job_title", "emergency_contact", "created_at", "updated_at"
  ],
  reservations: [
    "id", "tenant_id", "property_id", "unit_id", "check_in_date",
    "check_out_date", "deposit", "total_price", "payment_status", "status", "created_at"
  ],
  contracts: [
    "id", "tenant_id", "property_id", "unit_id", "start_date", "end_date",
    "monthly_rent", "terms_description", "tenant_signature", "owner_signature", "created_at"
  ],
  invoices: [
    "id", "tenant_id", "property_id", "unit_id", "invoice_number", "items",
    "subtotal", "tax", "total_amount", "due_date", "status", "created_at"
  ],
  expenses: [
    "id", "property_id", "category", "amount", "expense_date", "description", "created_by"
  ],
  maintenance_tickets: [
    "id", "property_id", "unit_id", "reported_by", "description", "image_url",
    "priority", "technician", "status", "cost", "created_at"
  ],
  payment_logs: [
    "id", "invoice_id", "amount", "payment_date", "method", "transaction_number", "proof_url"
  ],
  work_chats: [
    "id", "sender_name", "sender_role", "channel", "message", "user_id", "created_at", "updated_at"
  ],
  role_credentials: [
    "role", "email", "passport"
  ]
};

// In-memory cache of recent invoices to ensure payment_logs can resolve and insert parent invoices first
export const recentInvoicesMap = new Map<string, Invoice>();

export const cacheRecentInvoice = (inv: Invoice) => {
  if (inv && inv.id) {
    recentInvoicesMap.set(inv.id, inv);
  }
};

export const cacheRecentInvoices = (invList: Invoice[]) => {
  if (Array.isArray(invList)) {
    for (const inv of invList) {
      if (inv && inv.id) {
        recentInvoicesMap.set(inv.id, inv);
      }
    }
  }
};

let hasWhatsAppColumns: boolean | null = null;

export const checkInvoicesWhatsAppColumns = async (): Promise<boolean> => {
  if (!supabase) return false;
  if (hasWhatsAppColumns !== null) return hasWhatsAppColumns;
  try {
    const { error } = await supabase.from("invoices").select("whatsapp_status").limit(0);
    hasWhatsAppColumns = !error;
    return hasWhatsAppColumns;
  } catch {
    hasWhatsAppColumns = false;
    return false;
  }
};

// Map local object to DB row names with column filtering
export const toDbRow = (obj: any, tableName?: string) => {
  const result: any = {};
  for (const key in obj) {
    // Ignore internal keys like _invoice
    if (key.startsWith("_")) continue;
    // CamelCase to PascalCase or snake_case conversion for standard Postgres names
    const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    // Check if value is array/object to stringify for Postgres compatibility if table handles JSONB
    if (typeof obj[key] === "object" && obj[key] !== null) {
      result[dbKey] = obj[key];
    } else {
      result[dbKey] = obj[key];
    }
  }

  // If table is known, sanitize columns according to current database schema
  if (tableName && TABLE_COLUMNS[tableName]) {
    const allowed = new Set(TABLE_COLUMNS[tableName]);
    if (tableName === "invoices" && hasWhatsAppColumns === true) {
      allowed.add("whatsapp_status");
      allowed.add("whatsapp_sent_at");
      allowed.add("whatsapp_phone");
    }
    for (const k in result) {
      if (!allowed.has(k)) {
        delete result[k];
      }
    }
  }

  return result;
};

// Map DB row back to TypeScript model keys
export const fromDbRow = (row: any) => {
  const result: any = {};
  for (const key in row) {
    const jsKey = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );
    result[jsKey] = row[key];
  }
  return result;
};

// High-level wrapper to load all datasets
export const loadAllFromSupabase = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  // Detect WhatsApp columns on invoices table in background
  await checkInvoicesWhatsAppColumns();

  const results = {
    properties: [] as Property[],
    units: [] as Unit[],
    tenants: [] as Tenant[],
    reservations: [] as Reservation[],
    contracts: [] as Contract[],
    invoices: [] as Invoice[],
    expenses: [] as Expense[],
    maintenanceTickets: [] as MaintenanceTicket[],
    paymentLogs: [] as PaymentLog[],
    workChats: [] as WorkChatMessage[],
    roleCredentials: [] as any[],
    tablesStatus: {} as Record<string, boolean>
  };

  const tables = [
    { key: "properties", table: "properties" },
    { key: "units", table: "units" },
    { key: "tenants", table: "tenants" },
    { key: "reservations", table: "reservations" },
    { key: "contracts", table: "contracts" },
    { key: "invoices", table: "invoices" },
    { key: "expenses", table: "expenses" },
    { key: "maintenanceTickets", table: "maintenance_tickets" },
    { key: "paymentLogs", table: "payment_logs" },
    { key: "workChats", table: "work_chats" },
    { key: "roleCredentials", table: "role_credentials" }
  ];

  for (const t of tables) {
    try {
      let { data, error } = await supabase.from(t.table).select("*");
      if (error && t.table === "work_chats") {
        try {
          const fallbackRes = await fetch("/rest/v1/work_chats?select=*");
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
            error = null;
          }
        } catch (e) {
          // ignore fallback error
        }
      }
      if (error) {
        results.tablesStatus[t.table] = false;
        console.warn(`Failed to fetch ${t.table}:`, error.message);
      } else {
        results.tablesStatus[t.table] = true;
        (results as any)[t.key] = (data || []).map(fromDbRow);
      }
    } catch (err: any) {
      results.tablesStatus[t.table] = false;
      console.warn(`Exception reading table ${t.table}:`, err.message || err);
    }
  }

  // Cache invoices in memory for foreign key checks
  if (results.invoices && results.invoices.length > 0) {
    cacheRecentInvoices(results.invoices);
  }

  return results;
};

// Set values on individual tables
export const upsertToSupabase = async (tableName: string, data: any): Promise<boolean> => {
  if (!supabase) return false;

  // Cache invoice if this is an invoice record
  if (tableName === "invoices" && data?.id) {
    cacheRecentInvoice(data);
  }

  // Foreign key safeguard for payment_logs -> invoices
  if (tableName === "payment_logs") {
    const invoiceId = data.invoiceId || data.invoice_id;
    if (invoiceId) {
      try {
        const { data: invRow } = await supabase
          .from("invoices")
          .select("id")
          .eq("id", invoiceId)
          .maybeSingle();

        if (!invRow) {
          // Parent invoice is not yet saved in Supabase
          const cachedInvoice = recentInvoicesMap.get(invoiceId) || (data as any)._invoice;
          if (cachedInvoice) {
            console.info(`[PMS Supabase] Faktur induk ${invoiceId} belum ada di Supabase. Menyimpan faktur terlebih dahulu...`);
            const invSaved = await upsertToSupabase("invoices", cachedInvoice);
            if (!invSaved) {
              console.warn(`[PMS Supabase] Gagal menyimpan faktur induk ${invoiceId}. Menunda penyimpanan payment_logs agar tidak memicu error foreign key.`);
              return false;
            }
          } else {
            console.warn(
              `[PMS Supabase] Tidak dapat menyimpan payment_logs: Faktur ID ${invoiceId} belum ada di Supabase dan tidak ada di memori. Melewati penyimpanan untuk mencegah pelanggaran foreign key (payment_logs_invoice_id_fkey).`
            );
            return false;
          }
        }
      } catch (fkCheckErr) {
        console.warn("[PMS Supabase] Pengecekan foreign key invoice_id:", fkCheckErr);
      }
    }
  }

  const row = toDbRow(data, tableName);
  try {
    let { error } = await supabase.from(tableName).upsert(row);

    // Auto-recovery if a column is missing in Supabase schema cache
    if (error && error.message && error.message.includes("in the schema cache")) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`[PMS Supabase] Kolom '${missingCol}' tidak ditemukan di tabel '${tableName}'. Menghapus kolom dan mencoba ulang...`);
        if (tableName === "invoices" && missingCol.startsWith("whatsapp")) {
          hasWhatsAppColumns = false;
        }
        delete row[missingCol];
        const retry = await supabase.from(tableName).upsert(row);
        error = retry.error;
      }
    }

    if (error) {
      console.error(`Error saving to table ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`Exception upserting to ${tableName}:`, err);
    return false;
  }
};

// Delete record on table
export const deleteFromSupabase = async (tableName: string, id: string) => {
  if (!supabase) return null;
  try {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      console.error(`Error deleting from table ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Exception deleting from ${tableName}:`, err);
    return false;
  }
};

// Helper to push all local data to Supabase (Initial Seed)
export const pushAllToSupabase = async (payload: {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  reservations: Reservation[];
  contracts: Contract[];
  invoices: Invoice[];
  expenses: Expense[];
  maintenanceTickets: MaintenanceTicket[];
  paymentLogs: PaymentLog[];
  workChats?: WorkChatMessage[];
  roleCredentials?: any[];
}) => {
  if (!supabase) return { success: false, error: "Supabase not initialized." };

  // Cache invoices in memory
  if (payload.invoices) {
    cacheRecentInvoices(payload.invoices);
  }

  const tables = [
    { name: "properties", list: payload.properties },
    { name: "units", list: payload.units },
    { name: "tenants", list: payload.tenants },
    { name: "reservations", list: payload.reservations },
    { name: "contracts", list: payload.contracts },
    { name: "invoices", list: payload.invoices },
    { name: "expenses", list: payload.expenses },
    { name: "maintenance_tickets", list: payload.maintenanceTickets },
    { name: "payment_logs", list: payload.paymentLogs },
    { name: "work_chats", list: payload.workChats || [] },
    { name: "role_credentials", list: payload.roleCredentials || [] }
  ];

  const results: Record<string, boolean> = {};
  let overallSuccess = true;

  for (const t of tables) {
    if (t.list && t.list.length > 0) {
      try {
        let rows = t.list.map((item) => toDbRow(item, t.name));

        // For payment_logs, filter to only items whose invoiceId is present in payload.invoices
        if (t.name === "payment_logs" && payload.invoices && payload.invoices.length > 0) {
          const validInvoiceIds = new Set(payload.invoices.map((inv) => inv.id));
          rows = rows.filter((r) => r.invoice_id && validInvoiceIds.has(r.invoice_id));
        }

        let { error } = await supabase.from(t.name).upsert(rows);

        // Auto-recovery if column missing in schema cache during seeding
        if (error && error.message && error.message.includes("in the schema cache")) {
          const match = error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const missingCol = match[1];
            console.warn(`[PMS Supabase] Seeding: Kolom '${missingCol}' tidak ditemukan di '${t.name}'. Mencoba ulang tanpa kolom...`);
            if (t.name === "invoices" && missingCol.startsWith("whatsapp")) {
              hasWhatsAppColumns = false;
            }
            rows.forEach((r: any) => delete r[missingCol]);
            const retry = await supabase.from(t.name).upsert(rows);
            error = retry.error;
          }
        }

        if (error) {
          results[t.name] = false;
          overallSuccess = false;
          console.error(`Error seeding ${t.name}:`, error.message);
        } else {
          results[t.name] = true;
        }
      } catch (err: any) {
        results[t.name] = false;
        overallSuccess = false;
        console.error(`Exception seeding ${t.name}:`, err.message || err);
      }
    } else {
      results[t.name] = true; // empty is ok
    }
  }

  return { success: overallSuccess, results };
};

// Realtime subscription for work_chats
export const subscribeToWorkChats = (onInsert: (msg: WorkChatMessage) => void) => {
  if (!supabase) return null;
  try {
    const channel = supabase
      .channel("work_chats_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_chats" },
        (payload: any) => {
          if (payload.new) {
            onInsert(fromDbRow(payload.new) as WorkChatMessage);
          }
        }
      )
      .subscribe();
    return channel;
  } catch (err) {
    console.warn("Could not subscribe to work_chats realtime:", err);
    return null;
  }
};

