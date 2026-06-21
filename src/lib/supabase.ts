import { createClient } from "@supabase/supabase-js";
import { Property, Unit, Tenant, Reservation, Contract, Invoice, Expense, MaintenanceTicket, PaymentLog, WorkChatMessage } from "../types";

// Read environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || typeof supabaseUrl !== "string") return false;
  if (!supabaseAnonKey || typeof supabaseAnonKey !== "string") return false;

  const url = supabaseUrl.trim();
  const key = supabaseAnonKey.trim();

  const isUrlValid = (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.includes("MY_SUPABASE") &&
    !url.includes("YOUR_SUPABASE") &&
    !url.includes("your-supabase");

  const isKeyValid = !key.includes("MY_KEY") &&
    !key.includes("YOUR_ANON") &&
    !key.includes("your-anon") &&
    key !== "";

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

-- 10. Tabel Work Chats
CREATE TABLE IF NOT EXISTS work_chats (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Aktifkan Row Level Security (RLS) tapi izinkan akses anonim demi kemudahan demo
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_chats ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Akses Terbuka Work Chats" ON work_chats FOR ALL USING (true) WITH CHECK (true);
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
    { key: "workChats", table: "work_chats" }
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t.table).select("*");
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
    { name: "work_chats", list: payload.workChats || [] }
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
