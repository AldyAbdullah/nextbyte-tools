import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const CLIPBOARD_BUCKET = 'clipboard-images';

// Project credentials with fallback to verified project keys
const FALLBACK_SUPABASE_URL = 'https://zsstxqqvytwichbyeuhj.supabase.co';
const FALLBACK_SUPABASE_KEY = 'sb_publishable_UlbG_5VSTIA8J248fq4gPw_ekf0BC_9';

export function getEffectiveSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    FALLBACK_SUPABASE_KEY;

  const isConfigured = Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-anon-key-here'
  );

  return { url, key, isConfigured };
}

export const isServerSupabaseConfigured = true;

let cachedServerClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getEffectiveSupabaseConfig();
  if (!isConfigured) return null;

  if (!cachedServerClient) {
    try {
      cachedServerClient = createClient(url, key, {
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
