import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { validateSlug } from '@/lib/clipboard/slug';
import {
  generateManagementToken,
  hashManagementToken,
  hashPassword,
  calculateExpiresAt,
} from '@/lib/clipboard/security';
import {
  getServerSupabase,
  uploadClipboardImage,
} from '@/lib/clipboard/serverSupabase';
import { ClipboardExpiry } from '@/types/clipboard';

const MAX_TEXT_BYTES = 100 * 1024; // 100 KB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

/**
 * Validates image magic bytes to ensure the binary data matches allowed raster formats.
 */
function isValidImageBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (mimeType === 'image/webp') {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database Supabase belum terkonfigurasi pada server.' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const rawSlug = formData.get('slug')?.toString() || '';
    const textContent = formData.get('textContent')?.toString() || '';
    const expiry = (formData.get('expiry')?.toString() || '12h') as ClipboardExpiry;
    const password = formData.get('password')?.toString() || '';
    const imageFile = formData.get('image') as File | null;
    const burnAfterRead = formData.get('burnAfterRead') !== 'false'; // Default: True (Hapus setelah dibuka)

    // 1. Validate Slug
    const slugValidation = validateSlug(rawSlug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { success: false, error: slugValidation.error },
        { status: 400 }
      );
    }
    const cleanSlug = rawSlug.trim().toLowerCase();

    // 2. Validate Content (At least text or image must be provided)
    const hasText = Boolean(textContent && textContent.trim().length > 0);
    const hasImage = Boolean(imageFile && imageFile.size > 0);

    if (!hasText && !hasImage) {
      return NextResponse.json(
        { success: false, error: 'Harap sertakan teks atau unggah gambar untuk membuat clipboard.' },
        { status: 400 }
      );
    }

    // 3. Validate Text Length
    if (hasText) {
      const textBytes = Buffer.byteLength(textContent, 'utf8');
      if (textBytes > MAX_TEXT_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Ukuran teks melebihi batas maksimal 100 KB.' },
          { status: 400 }
        );
      }
    }

    // 4. Validate and Process Image if provided
    let uploadedImagePath: string | null = null;
    if (hasImage && imageFile) {
      if (imageFile.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Ukuran gambar melebihi batas maksimal 5 MB.' },
          { status: 400 }
        );
      }

      const mime = imageFile.type.toLowerCase();
      const ext = ALLOWED_MIME_TYPES.get(mime);
      if (!ext) {
        return NextResponse.json(
          {
            success: false,
            error: 'Format gambar tidak didukung. Harap gunakan format JPG, JPEG, PNG, atau WebP.',
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!isValidImageBytes(buffer, mime)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Berkas gambar tidak valid atau format data biner tidak cocok.',
          },
          { status: 400 }
        );
      }

      // Upload to private bucket
      const uploadRes = await uploadClipboardImage(buffer, mime, ext);
      if ('error' in uploadRes) {
        return NextResponse.json(
          { success: false, error: uploadRes.error },
          { status: 500 }
        );
      }
      uploadedImagePath = uploadRes.path;
    }

    // 5. Check if slug is already taken (or active)
    const { data: existing, error: checkError } = await supabase
      .from('clipboards')
      .select('id, expires_at')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking slug availability:', checkError);
      return NextResponse.json(
        { success: false, error: 'Terjadi kendala saat memeriksa ketersediaan URL.' },
        { status: 500 }
      );
    }

    if (existing) {
      const isExpired = new Date(existing.expires_at).getTime() <= Date.now();
      if (!isExpired) {
        return NextResponse.json(
          {
            success: false,
            error: `URL "${cleanSlug}" sudah digunakan oleh clipboard lain yang masih aktif. Silakan pilih nama lain.`,
          },
          { status: 409 }
        );
      }
      // If previously expired, remove the old record to allow re-use
      await supabase.from('clipboards').delete().eq('id', existing.id);
    }

    // 6. Security credentials
    const managementToken = generateManagementToken();
    const managementTokenHash = hashManagementToken(managementToken);
    const passwordHash = password.trim() ? hashPassword(password.trim()) : null;
    const expiresAt = calculateExpiresAt(expiry);

    // 7. Insert to Supabase DB (supports burn_after_read with fallback)
    const recordPayload = {
      slug: cleanSlug,
      text_content: hasText ? textContent : null,
      image_path: uploadedImagePath,
      management_token_hash: managementTokenHash,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead,
      expires_at: expiresAt.toISOString(),
    };

    let { error: insertError } = await supabase.from('clipboards').insert(recordPayload);

    // If column burn_after_read is missing from older migration, retry without it
    if (insertError && insertError.message?.includes('burn_after_read')) {
      const fallbackPayload = {
        slug: cleanSlug,
        text_content: hasText ? textContent : null,
        image_path: uploadedImagePath,
        management_token_hash: managementTokenHash,
        password_hash: passwordHash,
        expires_at: expiresAt.toISOString(),
      };
      const retryResult = await supabase.from('clipboards').insert(fallbackPayload);
      insertError = retryResult.error;
    }

    if (insertError) {
      console.error('Supabase insert clipboard error:', insertError);
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: `URL "${cleanSlug}" baru saja digunakan. Silakan gunakan nama lain.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan clipboard: ${insertError.message}` },
        { status: 500 }
      );
    }

    const host = req.headers.get('host') || 'nextbyte.biz.id';
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const fullUrl = `${proto}://${host}/clipboard/${cleanSlug}`;

    return NextResponse.json({
      success: true,
      slug: cleanSlug,
      url: fullUrl,
      managementToken,
      expiresAt: expiresAt.toISOString(),
      burnAfterRead,
    });
  } catch (err) {
    console.error('Unexpected error in create clipboard:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses clipboard.' },
      { status: 500 }
    );
  }
}
