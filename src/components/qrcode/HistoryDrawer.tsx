'use client';

import React, { useEffect, useState } from 'react';
import { 
  fetchQrCodeHistory, 
  deleteQrHistoryItem, 
  QrHistoryItem,
  isSupabaseConfigured 
} from '@/lib/supabase';
import { CompleteQrConfig } from '@/types/qrcode';
import { History, X, Trash2, ArrowUpRight, Database, Clock } from 'lucide-react';
import { useToast } from '@/components/common/Toast';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConfig: (config: CompleteQrConfig) => void;
}

export function HistoryDrawer({ isOpen, onClose, onLoadConfig }: HistoryDrawerProps) {
  const [history, setHistory] = useState<QrHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await fetchQrCodeHistory();
      setHistory(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteQrHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Riwayat berhasil dihapus', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              Riwayat QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage status badge */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Storage:{' '}
            <strong className={isSupabaseConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
              {isSupabaseConfigured ? 'Supabase Database' : 'Browser Storage (Local)'}
            </strong>
          </span>
          <span>{history.length} tersimpan</span>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">
              Memuat riwayat...
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Belum ada riwayat tersimpan
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Setiap kali kamu mengunduh QR Code, konfigurasinya akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.config) {
                    onLoadConfig(item.config as unknown as CompleteQrConfig);
                    showToast(`Konfigurasi "${item.name}" berhasil dimuat!`, 'success');
                    onClose();
                  }
                }}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 uppercase">
                        {item.type}
                      </span>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1 line-clamp-1">
                      {item.content}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Gunakan <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
