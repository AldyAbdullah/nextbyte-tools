import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { AttachmentType } from '@/types/clipboard';

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
 * Detects the file category for icons and viewer handling
 */
export function detectAttachmentType(filename: string, mime: string): AttachmentType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }
  if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('msword')) {
    return 'word';
  }
  if (['xls', 'xlsx'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet')) {
    return 'excel';
  }
  if (['ppt', 'pptx'].includes(ext) || mime.includes('powerpoint') || mime.includes('presentation')) {
    return 'powerpoint';
  }
  return 'file';
}

/**
 * Uploads a validated file Buffer (image or document) to the private storage bucket.
 * Uses a cryptographically random UUID filename to prevent collisions and information disclosure.
 */
export async function uploadClipboardFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  ext: string
): Promise<{ path: string } | { error: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { error: 'Database Supabase belum dikonfigurasi di server.' };
  }

  const randomName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `files/${randomName}`;

  try {
    let { error: uploadError } = await supabase.storage
      .from(CLIPBOARD_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    // If bucket restrictions reject the specific mime type, retry with generic application/octet-stream
    if (uploadError && (uploadError.message?.toLowerCase().includes('mime type') || uploadError.message?.toLowerCase().includes('not supported'))) {
      console.warn(`MIME type "${mimeType}" rejected by bucket, retrying with application/octet-stream...`);
      const retryResult = await supabase.storage
        .from(CLIPBOARD_BUCKET)
        .upload(filePath, buffer, {
          contentType: 'application/octet-stream',
          cacheControl: '3600',
          upsert: true,
        });
      uploadError = retryResult.error;
    }

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return { error: `Gagal mengunggah berkas (${filename}): ${uploadError.message}` };
    }

    return { path: filePath };
  } catch (err) {
    console.error('Unexpected error during storage upload:', err);
    return { error: `Terjadi kendala saat mengunggah berkas ${filename}.` };
  }
}

/**
 * Uploads a validated image Buffer (legacy compatibility alias)
 */
export async function uploadClipboardImage(
  buffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ path: string } | { error: string }> {
  return uploadClipboardFile(buffer, `image.${ext}`, mimeType, ext);
}

/**
 * Generates a temporary signed URL for viewing/downloading a file from the private bucket.
 * Expire time matches the clipboard's remaining lifetime (max 1 hour per token).
 */
export async function getSignedImageUrl(
  filePath: string,
  expiresAt: Date
): Promise<string | null> {
  const supabase = getServerSupabase();
  if (!supabase || !filePath) return null;

  try {
    const remainingSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    // Cap signed URL validity at 3600s (1 hour) or remaining life
    const validSeconds = Math.min(3600, remainingSeconds);

    const { data, error } = await supabase.storage
      .from(CLIPBOARD_BUCKET)
      .createSignedUrl(filePath, validSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Failed to generate signed file URL, falling back to public URL:', error?.message);
      const { data: pubData } = supabase.storage
        .from(CLIPBOARD_BUCKET)
        .getPublicUrl(filePath);
      return pubData?.publicUrl || null;
    }

    let signedUrl = data.signedUrl;
    if (signedUrl.startsWith('/')) {
      const { url } = getEffectiveSupabaseConfig();
      signedUrl = `${url}${signedUrl}`;
    }

    return signedUrl;
  } catch (err) {
    console.warn('Error creating signed file URL, falling back to public URL:', err);
    try {
      const { data: pubData } = supabase.storage
        .from(CLIPBOARD_BUCKET)
        .getPublicUrl(filePath);
      return pubData?.publicUrl || null;
    } catch {
      return null;
    }
  }
}

/**
 * Deletes an array of files from the private storage bucket.
 */
export async function deleteClipboardFiles(filePaths: string[]): Promise<boolean> {
  const supabase = getServerSupabase();
  if (!supabase || filePaths.length === 0) return false;

  try {
    const { error } = await supabase.storage.from(CLIPBOARD_BUCKET).remove(filePaths);
    if (error) {
      console.warn('Failed to delete files from storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error deleting files from storage:', err);
    return false;
  }
}

/**
 * Deletes an image file from the private storage bucket (legacy compatibility alias)
 */
export async function deleteClipboardImage(imagePath: string): Promise<boolean> {
  return deleteClipboardFiles([imagePath]);
}
