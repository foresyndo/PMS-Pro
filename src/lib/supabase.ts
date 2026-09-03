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
  address TEXT,
  job_title TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

// Map local object to DB row names
const toDbRow = (obj: any) => {
  const result: any = {};
  for (const key in obj) {
    // CamelCase to PascalCase or snake_case conversion for standard Postgres names
    const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    // Check if value is array/object to stringify for Postgres compatibility if table handles JSONB
    if (typeof obj[key] === "object" && obj[key] !== null) {
      result[dbKey] = obj[key];
    } else {
      result[dbKey] = obj[key];
    }
  }
  return result;
};

// Map DB row back to TypeScript model keys
const fromDbRow = (row: any) => {
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

  return results;
};

// Set values on individual tables
export const upsertToSupabase = async (tableName: string, data: any) => {
  if (!supabase) return null;
  const row = toDbRow(data);
  try {
    const { error } = await supabase.from(tableName).upsert(row);
    if (error) {
      console.error(`Error saving to table ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
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
        const rows = t.list.map(toDbRow);
        const { error } = await supabase.from(t.name).upsert(rows);
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

