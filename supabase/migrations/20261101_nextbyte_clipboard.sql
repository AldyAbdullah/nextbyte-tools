-- ==============================================================================
-- NEXTBYTE CLIPBOARD MIGRATION
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable pgcrypto extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the clipboards table
CREATE TABLE IF NOT EXISTS public.clipboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    text_content TEXT,
    image_path TEXT,
    management_token_hash TEXT NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Ensure slug is unique across all clipboards
    CONSTRAINT clipboards_slug_unique UNIQUE (slug),
    
    -- Ensure at least text or image is present
    CONSTRAINT clipboards_has_content CHECK (
        (text_content IS NOT NULL AND length(trim(text_content)) > 0)
        OR (image_path IS NOT NULL AND length(trim(image_path)) > 0)
    ),
    
    -- Server-side text size limit: max 100 KB (approx 102,400 characters)
    CONSTRAINT clipboards_text_length CHECK (
        text_content IS NULL OR length(text_content) <= 102400
    )
);

-- 3. Indexes for ultra-fast lookup and efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_clipboards_slug ON public.clipboards (slug);
CREATE INDEX IF NOT EXISTS idx_clipboards_expires_at ON public.clipboards (expires_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.clipboards ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Note: Sensitive operations (management token verification, password verification, 
-- signed image URL generation) are strictly performed via Next.js Server API endpoints.
-- Service Role Key bypasses RLS automatically.

-- Allow anon to select non-expired clipboards
DROP POLICY IF EXISTS "Allow anon to select unexpired clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to select unexpired clipboard"
ON public.clipboards
FOR SELECT
TO anon, authenticated
USING (expires_at > timezone('utc'::text, now()));

-- Allow anon to insert new clipboard with valid expiration in the future
DROP POLICY IF EXISTS "Allow anon to insert new clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to insert new clipboard"
ON public.clipboards
FOR INSERT
TO anon, authenticated
WITH CHECK (expires_at > timezone('utc'::text, now()));

-- Allow deletion (verified by server using management token)
DROP POLICY IF EXISTS "Allow anon to delete clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to delete clipboard"
ON public.clipboards
FOR DELETE
TO anon, authenticated
USING (true);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION FOR SUPABASE DASHBOARD:
-- 1. Go to Supabase Dashboard > Storage > Buckets
-- 2. Click "New Bucket"
-- 3. Name: clipboard-images
-- 4. Set Public bucket: OFF (Keep it PRIVATE)
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp
-- 6. Max file size: 5 MB (5242880 bytes)
-- ==============================================================================
