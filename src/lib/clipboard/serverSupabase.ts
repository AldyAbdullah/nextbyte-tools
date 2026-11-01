import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const CLIPBOARD_BUCKET = 'clipboard-images';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use Service Role Key for server-side elevated access if configured, or Anon Key as fallback
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseKey !== 'your-anon-key-here'
);

let cachedServerClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  if (!cachedServerClient) {
    try {
      cachedServerClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to create server Supabase client:', err);
      return null;
    }
  }
  return cachedServerClient;
}

/**
 * Uploads a validated image Buffer to the private 'clipboard-images' storage bucket.
 * Uses a cryptographically random UUID filename to prevent collisions and information disclosure.
 */
export async function uploadClipboardImage(
  buffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ path: string } | { error: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { error: 'Database Supabase belum dikonfigurasi di server.' };
  }

  const randomName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `images/${randomName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(CLIPBOARD_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return { error: `Gagal mengunggah gambar ke Storage: ${uploadError.message}` };
    }

    return { path: filePath };
  } catch (err) {
    console.error('Unexpected error during storage upload:', err);
    return { error: 'Terjadi kendala saat mengunggah berkas gambar.' };
  }
}

/**
 * Generates a temporary signed URL for viewing an image from the private bucket.
 * Expire time matches the clipboard's remaining lifetime (max 1 hour per token).
 */
export async function getSignedImageUrl(
  imagePath: string,
  expiresAt: Date
): Promise<string | null> {
  const supabase = getServerSupabase();
  if (!supabase || !imagePath) return null;

  try {
    const remainingSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    // Cap signed URL validity at 3600s (1 hour) or remaining life
    const validSeconds = Math.min(3600, remainingSeconds);

    const { data, error } = await supabase.storage
      .from(CLIPBOARD_BUCKET)
      .createSignedUrl(imagePath, validSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Failed to generate signed image URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('Error creating signed image URL:', err);
    return null;
  }
}

/**
 * Deletes an image file from the private storage bucket.
 */
export async function deleteClipboardImage(imagePath: string): Promise<boolean> {
  const supabase = getServerSupabase();
  if (!supabase || !imagePath) return false;

  try {
    const { error } = await supabase.storage.from(CLIPBOARD_BUCKET).remove([imagePath]);
    if (error) {
      console.warn('Failed to delete image from storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error deleting image from storage:', err);
    return false;
  }
}
