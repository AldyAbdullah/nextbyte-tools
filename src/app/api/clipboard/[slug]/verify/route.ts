import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSupabase, getSignedImageUrl } from '@/lib/clipboard/serverSupabase';
import { verifyPassword, verifyManagementToken } from '@/lib/clipboard/security';
import { ClipboardItem, ClipboardAttachment } from '@/types/clipboard';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function extractAttachments(record: Record<string, unknown>): ClipboardAttachment[] {
  if (record.attachments && Array.isArray(record.attachments)) {
    return record.attachments as ClipboardAttachment[];
  }
  if (!record.image_path || typeof record.image_path !== 'string') return [];
  try {
    const parsed = JSON.parse(record.image_path);
    if (Array.isArray(parsed)) return parsed as ClipboardAttachment[];
  } catch {
    // Plain string legacy image path
  }
  return [
    {
      id: 'legacy-1',
      name: 'lampiran-gambar.png',
      size: 0,
      type: 'image',
      mimeType: 'image/png',
      path: record.image_path,
    },
  ];
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = slug?.trim().toLowerCase();

    const body = await req.json().catch(() => ({}));
    const password = body?.password?.toString() || '';

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Silakan masukkan kata sandi clipboard.' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database belum terkonfigurasi di server.' },
        { status: 503 }
      );
    }

    const { data: record, error } = await supabase
      .from('clipboards')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error || !record) {
      return NextResponse.json(
        { success: false, error: 'Clipboard tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Expiry check
    const expiresAt = new Date(record.expires_at);
    if (expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Clipboard telah kedaluwarsa.' },
        { status: 410 }
      );
    }

    if (!record.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Clipboard ini tidak memerlukan kata sandi.' },
        { status: 400 }
      );
    }

    const isMatch = verifyPassword(password, record.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi salah. Silakan coba lagi.' },
        { status: 401 }
      );
    }

    // Check management token if provided in header
    const clientToken = req.headers.get('x-management-token') || '';
    const hasManagementToken = Boolean(
      clientToken && verifyManagementToken(clientToken, record.management_token_hash)
    );

    const isBurnAfterRead = record.burn_after_read !== false; // Default: true

    // Resolve attachments with signed URLs
    const rawAttachments = extractAttachments(record);
    const resolvedAttachments: ClipboardAttachment[] = [];
    for (const att of rawAttachments) {
      const signedUrl = await getSignedImageUrl(att.path, expiresAt);
      resolvedAttachments.push({ ...att, url: signedUrl });
    }

    const legacyImageUrl = resolvedAttachments.find((a) => a.type === 'image')?.url || null;

    let isBurned = false;
    // Jika dibuka di perangkat penerima (tanpa token manajemen) dan mode burnAfterRead aktif:
    if (isBurnAfterRead && !hasManagementToken) {
      await supabase.from('clipboards').delete().eq('id', record.id);
      isBurned = true;
    }

    const item: ClipboardItem = {
      id: record.id,
      slug: record.slug,
      textContent: record.text_content,
      imagePath: record.image_path,
      imageUrl: legacyImageUrl,
      attachments: resolvedAttachments,
      createdAt: record.created_at,
      expiresAt: record.expires_at,
      isPasswordProtected: true,
      hasManagementToken,
      burnAfterRead: isBurnAfterRead,
      isBurned,
    };

    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error('Unexpected error in verify clipboard password:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memverifikasi kata sandi.' },
      { status: 500 }
    );
  }
}
