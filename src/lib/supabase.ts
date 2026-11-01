import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://zsstxqqvytwichbyeuhj.supabase.co';
const FALLBACK_SUPABASE_KEY = 'sb_publishable_UlbG_5VSTIA8J248fq4gPw_ekf0BC_9';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  FALLBACK_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

export interface QrHistoryItem {
  id: string;
  name: string;
  type: string;
  content: string;
  config: Record<string, unknown>;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'nextbyte_qr_history';

/**
 * Simpan konfigurasi QR Code ke Supabase jika tersedia,
 * atau ke LocalStorage sebagai fallback offline & instant.
 */
export async function saveQrCodeToHistory(item: Omit<QrHistoryItem, 'created_at'>): Promise<boolean> {
  const record: QrHistoryItem = {
    ...item,
    created_at: new Date().toISOString(),
  };

  // Simpan selalu ke LocalStorage sebagai local cache
  try {
    if (typeof window !== 'undefined') {
      const existing = getLocalHistory();
      const filtered = existing.filter((i) => i.id !== record.id);
      const updated = [record, ...filtered].slice(0, 30); // simpan maks 30 riwayat terakhir
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }

  // Jika Supabase aktif, simpan juga ke tabel 'qr_history' di database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('qr_history').insert([
        {
          id: record.id,
          name: record.name,
          type: record.type,
          content: record.content,
          config: record.config,
        },
      ]);
      if (error) {
        console.warn('Supabase insert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase connection error:', err);
    }
  }

  return true;
}

function getLocalHistory(): QrHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Mengambil riwayat QR Code
 */
export async function fetchQrCodeHistory(): Promise<QrHistoryItem[]> {
  // Coba ambil dari Supabase terlebih dahulu jika terkonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('qr_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data as QrHistoryItem[];
      }
    } catch (err) {
      console.warn('Could not fetch from Supabase, falling back to local storage:', err);
    }
  }

  // Fallback ke local storage
  return getLocalHistory();
}

/**
 * Hapus riwayat dari local storage & database
 */
export async function deleteQrHistoryItem(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalHistory();
      const filtered = existing.filter((i) => i.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('qr_history').delete().eq('id', id);
    } catch (err) {
      console.warn(err);
    }
  }
}
