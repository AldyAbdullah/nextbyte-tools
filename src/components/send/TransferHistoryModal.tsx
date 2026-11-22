'use client';

import React from 'react';
import { History, X, Trash2, ArrowUpRight, ArrowDownLeft, FileCheck, Calendar, HardDrive } from 'lucide-react';
import { TransferHistoryItem } from '@/types/nextbyteSend';
import { formatBytes } from '@/lib/webrtc/deviceDetection';

interface TransferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TransferHistoryItem[];
  onClearHistory: () => void;
}

export function TransferHistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
}: TransferHistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Riwayat Transfer Berkas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tersimpan lokal di browser ini ({history.length} item)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Transfer</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Setiap berkas yang Anda kirim atau terima lewat NextByte Send akan tercatat di sini secara lokal.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isSent = item.direction === 'sent';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isSent
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <ArrowUpRight className="w-3 h-3" /> Terkirim
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3" /> Diterima
                          </>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {isSent ? `Ke: ${item.peerName}` : `Dari: ${item.peerName}`}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      {formatBytes(item.totalSize)}
                    </span>
                  </div>

                  {/* File list preview */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate pl-1">
                    {item.fileNames.slice(0, 2).join(', ')}
                    {item.fileNames.length > 2 && ` (+${item.fileNames.length - 2} berkas lainnya)`}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {item.fileNames.length} Berkas
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Riwayat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
