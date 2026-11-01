-- ==============================================================================
-- NEXTBYTE CLIPBOARD MIGRATION
-- Jalankan skrip ini di Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable pgcrypto extension untuk pembuatan UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel clipboards (jika belum ada)
CREATE TABLE IF NOT EXISTS public.clipboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    text_content TEXT,
    image_path TEXT,
    management_token_hash TEXT NOT NULL,
    password_hash TEXT,
    burn_after_read BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Pastikan slug unik
    CONSTRAINT clipboards_slug_unique UNIQUE (slug),
    
    -- Pastikan setidaknya teks atau gambar terisi
    CONSTRAINT clipboards_has_content CHECK (
        (text_content IS NOT NULL AND length(trim(text_content)) > 0)
        OR (image_path IS NOT NULL AND length(trim(image_path)) > 0)
    ),
    
    -- Batas teks di sisi server: maks 100 KB
    CONSTRAINT clipboards_text_length CHECK (
        text_content IS NULL OR length(text_content) <= 102400
    )
);

-- Tambahkan kolom burn_after_read jika tabel sudah dibuat sebelumnya
ALTER TABLE public.clipboards ADD COLUMN IF NOT EXISTS burn_after_read BOOLEAN NOT NULL DEFAULT true;

-- 3. Indexes untuk pencarian instan dan query pembersihan
CREATE INDEX IF NOT EXISTS idx_clipboards_slug ON public.clipboards (slug);
CREATE INDEX IF NOT EXISTS idx_clipboards_expires_at ON public.clipboards (expires_at);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.clipboards ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Baca clipboard yang belum kedaluwarsa
DROP POLICY IF EXISTS "Allow anon to select unexpired clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to select unexpired clipboard"
ON public.clipboards
FOR SELECT
TO anon, authenticated
USING (expires_at > timezone('utc'::text, now()));

-- Insert clipboard baru
DROP POLICY IF EXISTS "Allow anon to insert new clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to insert new clipboard"
ON public.clipboards
FOR INSERT
TO anon, authenticated
WITH CHECK (expires_at > timezone('utc'::text, now()));

-- Hapus clipboard
DROP POLICY IF EXISTS "Allow anon to delete clipboard" ON public.clipboards;
CREATE POLICY "Allow anon to delete clipboard"
ON public.clipboards
FOR DELETE
TO anon, authenticated
USING (true);

-- 6. Storage Bucket Setup (Otomatis via SQL):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clipboard-images',
    'clipboard-images',
    false, -- Wajib PRIVATE (diakses via signed URL)
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policy untuk upload
DROP POLICY IF EXISTS "Public upload clipboard images" ON storage.objects;
CREATE POLICY "Public upload clipboard images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'clipboard-images');

-- Storage policy untuk delete
DROP POLICY IF EXISTS "Authorized delete clipboard images" ON storage.objects;
CREATE POLICY "Authorized delete clipboard images"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'clipboard-images');
