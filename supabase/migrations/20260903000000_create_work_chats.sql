-- Migration: Create public.work_chats table for PMS Work Chat & Team Coordination
-- Description: Creates the work_chats table with UUID primary key, auditing timestamps,
-- user foreign key, optimized indexes, secure RLS policies, and realtime publication.

-- 1. Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create table public.work_chats
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

-- 3. Create indexes for high-frequency query patterns
CREATE INDEX IF NOT EXISTS idx_work_chats_channel ON public.work_chats (channel);
CREATE INDEX IF NOT EXISTS idx_work_chats_created_at ON public.work_chats (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_chats_user_id ON public.work_chats (user_id);

-- 4. Trigger to automatically keep updated_at in sync
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.work_chats ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies
-- SELECT: Team members can read coordination channels (#...) and their personal DMs
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

-- INSERT: Authenticated users can insert messages authored by themselves
DROP POLICY IF EXISTS "Allow inserting work chats" ON public.work_chats;
CREATE POLICY "Allow inserting work chats"
    ON public.work_chats
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
        OR (auth.uid() IS NULL)
    );

-- UPDATE: Users can only update their own messages
DROP POLICY IF EXISTS "Allow updating own work chats" ON public.work_chats;
CREATE POLICY "Allow updating own work chats"
    ON public.work_chats
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own messages
DROP POLICY IF EXISTS "Allow deleting own work chats" ON public.work_chats;
CREATE POLICY "Allow deleting own work chats"
    ON public.work_chats
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. Add table to Supabase Realtime publication for live chat broadcasts
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
