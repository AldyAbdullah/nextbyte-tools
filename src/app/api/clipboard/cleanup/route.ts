import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSupabase, CLIPBOARD_BUCKET } from '@/lib/clipboard/serverSupabase';

export async function GET(req: NextRequest) {
  try {
    // Optional cron secret protection if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase client is not configured' },
        { status: 503 }
      );
    }

    const nowIso = new Date().toISOString();

    // 1. Fetch expired records with their image paths
    const { data: expiredRecords, error: fetchError } = await supabase
      .from('clipboards')
      .select('id, image_path')
      .lte('expires_at', nowIso);

    if (fetchError) {
      console.error('Error fetching expired clipboards for cleanup:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!expiredRecords || expiredRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired clipboards to clean up.',
        deletedCount: 0,
      });
    }

    // 2. Remove orphan image files from storage bucket
    const imagePaths = expiredRecords
      .map((r) => r.image_path)
      .filter((p): p is string => Boolean(p));

    if (imagePaths.length > 0) {
      try {
        const { error: storageError } = await supabase.storage
          .from(CLIPBOARD_BUCKET)
          .remove(imagePaths);

        if (storageError) {
          console.warn('Storage cleanup warning:', storageError.message);
        }
      } catch (err) {
        console.warn('Failed to remove expired images from storage:', err);
      }
    }

    // 3. Delete database records
    const ids = expiredRecords.map((r) => r.id);
    const { error: deleteError } = await supabase
      .from('clipboards')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Failed to delete expired records from DB:', deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${ids.length} expired clipboards and ${imagePaths.length} storage files.`,
      deletedCount: ids.length,
      deletedImagesCount: imagePaths.length,
    });
  } catch (err) {
    console.error('Unexpected error in cleanup cron route:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error during cleanup' },
      { status: 500 }
    );
  }
}
