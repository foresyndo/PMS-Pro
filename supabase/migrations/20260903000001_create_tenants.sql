-- ==========================================================
-- MIGRATION: public.tenants (Master Data Penyewa / Tamu PMS)
-- Deskripsi: Membuat tabel public.tenants dengan primary key,
-- kolom KTP, kontak darurat JSONB, indeks pencarian cepat,
-- auto updated_at trigger, RLS policies, dan publikasi realtime.
-- ==========================================================

-- 1. Pastikan ekstensi pgcrypto tersedia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Buat tabel public.tenants
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

-- 3. Indeks untuk optimasi query pencarian & filter data tenant
CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants (name);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON public.tenants (phone);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants (email);
CREATE INDEX IF NOT EXISTS idx_tenants_ktp ON public.tenants (ktp_number);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants (created_at DESC);

-- 4. Trigger otomatis pembaruan kolom updated_at saat data diedit
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

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan RLS (Row Level Security)
DROP POLICY IF EXISTS "Allow read tenants" ON public.tenants;
CREATE POLICY "Allow read tenants"
    ON public.tenants
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow insert tenants" ON public.tenants;
CREATE POLICY "Allow insert tenants"
    ON public.tenants
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update tenants" ON public.tenants;
CREATE POLICY "Allow update tenants"
    ON public.tenants
    FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete tenants" ON public.tenants;
CREATE POLICY "Allow delete tenants"
    ON public.tenants
    FOR DELETE
    TO authenticated, anon
    USING (true);

-- 7. Publikasi Supabase Realtime
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

-- 8. Seeding Data Awal Penyewa
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
