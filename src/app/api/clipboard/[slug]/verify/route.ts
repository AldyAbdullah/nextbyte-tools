import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, getSignedImageUrl } from '@/lib/clipboard/serverSupabase';
import { verifyPassword, verifyManagementToken } from '@/lib/clipboard/security';
import { ClipboardItem } from '@/types/clipboard';

interface RouteContext {
  params: Promise<{ slug: string }>;
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

    let signedUrl: string | null = null;
    if (record.image_path) {
      signedUrl = await getSignedImageUrl(record.image_path, expiresAt);
    }

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
      imageUrl: signedUrl,
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
