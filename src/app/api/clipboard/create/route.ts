import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
  uploadClipboardFile,
  detectAttachmentType,
} from '@/lib/clipboard/serverSupabase';
import { ClipboardExpiry, ClipboardAttachment } from '@/types/clipboard';

const MAX_TEXT_BYTES = 100 * 1024; // 100 KB
const MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_FILES_BYTES = 20 * 1024 * 1024; // 20 MB total (maks 2 file x 10 MB)
const MAX_FILES_COUNT = 2; // Maksimal 2 file

// Supported extensions and MIME types
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp',
  'doc', 'docx',
  'xls', 'xlsx',
  'ppt', 'pptx',
  'pdf',
]);

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
    const burnAfterRead = formData.get('burnAfterRead') !== 'false'; // Default: True

    // 1. Validate Slug
    const slugValidation = validateSlug(rawSlug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { success: false, error: slugValidation.error },
        { status: 400 }
      );
    }
    const cleanSlug = rawSlug.trim().toLowerCase();

    // 2. Collect files (supports multi-file 'files' or legacy single 'image')
    const filesToUpload: File[] = [];
    const allFiles = formData.getAll('files');
    for (const item of allFiles) {
      if (item && typeof item === 'object' && 'size' in item && (item as File).size > 0) {
        filesToUpload.push(item as File);
      }
    }
    // Check fallback legacy 'image' field
    if (filesToUpload.length === 0) {
      const legacyImage = formData.get('image');
      if (legacyImage && typeof legacyImage === 'object' && 'size' in legacyImage && (legacyImage as File).size > 0) {
        filesToUpload.push(legacyImage as File);
      }
    }

    const hasText = Boolean(textContent && textContent.trim().length > 0);
    const hasAttachments = filesToUpload.length > 0;

    if (!hasText && !hasAttachments) {
      return NextResponse.json(
        { success: false, error: 'Harap sertakan teks atau lampirkan berkas untuk membuat clipboard.' },
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

    // 4. Validate Files (Count, Size, Format)
    if (filesToUpload.length > MAX_FILES_COUNT) {
      return NextResponse.json(
        { success: false, error: `Maksimal lampiran adalah ${MAX_FILES_COUNT} berkas sekaligus.` },
        { status: 400 }
      );
    }

    let totalFilesSize = 0;
    for (const file of filesToUpload) {
      if (file.size > MAX_SINGLE_FILE_BYTES) {
        return NextResponse.json(
          { success: false, error: `Berkas "${file.name}" melebihi batas maksimal 10 MB.` },
          { status: 400 }
        );
      }
      totalFilesSize += file.size;

      let ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.has(ext) && file.type) {
        if (file.type === 'image/png') ext = 'png';
        else if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg';
        else if (file.type === 'image/webp') ext = 'webp';
        else if (file.type === 'application/pdf') ext = 'pdf';
      }

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            success: false,
            error: `Format berkas "${file.name}" tidak didukung. Format yang diizinkan: JPG, PNG, WebP, DOC/DOCX, XLS/XLSX, PPT/PPTX, PDF.`,
          },
          { status: 400 }
        );
      }
    }

    if (totalFilesSize > MAX_TOTAL_FILES_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Total ukuran seluruh lampiran melebihi batas 20 MB.' },
        { status: 400 }
      );
    }

    // 5. Upload files to Storage
    const uploadedAttachments: ClipboardAttachment[] = [];
    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const mime = file.type.toLowerCase() || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadRes = await uploadClipboardFile(buffer, file.name, mime, ext);
      if ('error' in uploadRes) {
        return NextResponse.json(
          { success: false, error: uploadRes.error },
          { status: 500 }
        );
      }

      uploadedAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: detectAttachmentType(file.name, mime),
        mimeType: mime,
        path: uploadRes.path,
      });
    }

    // 6. Check if slug is already taken (or active)
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
            error: `URL "${cleanSlug}" sudah digunakan oleh clip lain yang masih aktif. Silakan pilih nama lain.`,
          },
          { status: 409 }
        );
      }
      // If previously expired, remove the old record to allow re-use
      await supabase.from('clipboards').delete().eq('id', existing.id);
    }

    // 7. Security credentials
    const managementToken = generateManagementToken();
    const managementTokenHash = hashManagementToken(managementToken);
    const passwordHash = password.trim() ? hashPassword(password.trim()) : null;
    const expiresAt = calculateExpiresAt(expiry);

    // Serialization for backward and forward compatibility
    const attachmentsJson = uploadedAttachments.length > 0 ? JSON.stringify(uploadedAttachments) : null;
    // Legacy image path for single photo backward compatibility:
    const legacyImagePath = uploadedAttachments.length === 1 && uploadedAttachments[0].type === 'image'
      ? uploadedAttachments[0].path
      : attachmentsJson;

    // 8. Insert to Supabase DB (supports attachments column with graceful fallback)
    const recordPayload: Record<string, unknown> = {
      slug: cleanSlug,
      text_content: hasText ? textContent : null,
      image_path: legacyImagePath,
      management_token_hash: managementTokenHash,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead,
      expires_at: expiresAt.toISOString(),
      attachments: uploadedAttachments,
    };

    let { error: insertError } = await supabase.from('clipboards').insert(recordPayload);

    // If attachments or burn_after_read column is missing in DB schema, retry without it
    if (insertError && (insertError.message?.includes('attachments') || insertError.message?.includes('burn_after_read'))) {
      const fallbackPayload: Record<string, unknown> = {
        slug: cleanSlug,
        text_content: hasText ? textContent : null,
        image_path: legacyImagePath,
        management_token_hash: managementTokenHash,
        password_hash: passwordHash,
        expires_at: expiresAt.toISOString(),
      };
      if (!insertError.message?.includes('burn_after_read')) {
        fallbackPayload.burn_after_read = burnAfterRead;
      }
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
    const fullUrl = `${proto}://${host}/clip/${cleanSlug}`;

    return NextResponse.json({
      success: true,
      slug: cleanSlug,
      url: fullUrl,
      managementToken,
      expiresAt: expiresAt.toISOString(),
      burnAfterRead,
      attachmentsCount: uploadedAttachments.length,
    });
  } catch (err) {
    console.error('Unexpected error in create clipboard:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses clipboard.' },
      { status: 500 }
    );
  }
}
