import { NextRequest, NextResponse } from 'next/server';
import {
  getServerSupabase,
  getSignedImageUrl,
  deleteClipboardImage,
} from '@/lib/clipboard/serverSupabase';
import { verifyManagementToken } from '@/lib/clipboard/security';
import { ClipboardItem } from '@/types/clipboard';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = slug?.trim().toLowerCase();

    if (!cleanSlug) {
      return NextResponse.json({ success: false, error: 'Slug tidak valid.' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database Supabase belum terkonfigurasi di server.' },
        { status: 503 }
      );
    }

    const { data: record, error } = await supabase
      .from('clipboards')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching clipboard by slug:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat clipboard.' },
        { status: 500 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Clipboard tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check expiration
    const expiresAt = new Date(record.expires_at);
    if (expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Clipboard telah kedaluwarsa.',
          isExpired: true,
        },
        { status: 410 }
      );
    }

    // Check management token from client header
    const clientToken = req.headers.get('x-management-token') || '';
    const hasManagementToken = Boolean(
      clientToken && verifyManagementToken(clientToken, record.management_token_hash)
    );

    const isPasswordProtected = Boolean(record.password_hash);
    const isBurnAfterRead = record.burn_after_read !== false; // Default: true (Hapus setelah dibuka)

    // If password-protected, redact text and image URL until verified
    if (isPasswordProtected) {
      return NextResponse.json({
        success: true,
        item: {
          id: record.id,
          slug: record.slug,
          textContent: null,
          imagePath: null,
          imageUrl: null,
          createdAt: record.created_at,
          expiresAt: record.expires_at,
          isPasswordProtected: true,
          hasManagementToken,
          burnAfterRead: isBurnAfterRead,
          isBurned: false,
        } as ClipboardItem,
      });
    }

    // Generate secure temporary signed URL for private image
    let signedUrl: string | null = null;
    if (record.image_path) {
      signedUrl = await getSignedImageUrl(record.image_path, expiresAt);
    }

    let isBurned = false;
    // Jika dibuka di perangkat lain (tanpa token manajemen) dan mode burnAfterRead aktif:
    if (isBurnAfterRead && !hasManagementToken) {
      // Hapus langsung dari database agar tidak bisa dibuka lagi
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
      isPasswordProtected: false,
      hasManagementToken,
      burnAfterRead: isBurnAfterRead,
      isBurned,
    };

    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error('Unexpected error in GET clipboard:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memuat clipboard.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = slug?.trim().toLowerCase();

    const body = await req.json().catch(() => ({}));
    const token = body?.managementToken || req.headers.get('x-management-token') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token pengelolaan clipboard diperlukan untuk menghapus.' },
        { status: 401 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database belum terkonfigurasi di server.' },
        { status: 503 }
      );
    }

    const { data: record, error: findError } = await supabase
      .from('clipboards')
      .select('id, slug, image_path, management_token_hash')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (findError || !record) {
      return NextResponse.json(
        { success: false, error: 'Clipboard tidak ditemukan atau sudah dihapus.' },
        { status: 404 }
      );
    }

    const isValidToken = verifyManagementToken(token, record.management_token_hash);
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: 'Token pengelolaan tidak valid. Anda tidak memiliki izin untuk menghapus clipboard ini.' },
        { status: 403 }
      );
    }

    // Delete image from storage if present
    if (record.image_path) {
      await deleteClipboardImage(record.image_path);
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from('clipboards')
      .delete()
      .eq('id', record.id);

    if (deleteError) {
      console.error('Failed to delete clipboard DB record:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus data clipboard dari database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Clipboard berhasil dihapus.' });
  } catch (err) {
    console.error('Unexpected error in DELETE clipboard:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat menghapus clipboard.' },
      { status: 500 }
    );
  }
}
