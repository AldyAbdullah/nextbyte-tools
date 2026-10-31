'use client';

import React from 'react';
import { Zap, Clock, HardDrive, File, XCircle } from 'lucide-react';
import { TransferMetrics } from '@/types/nextbyteSend';
import { formatBytes, formatTimeRemaining } from '@/lib/webrtc/deviceDetection';

interface TransferProgressCardProps {
  metrics: TransferMetrics;
  onCancel: () => void;
  title?: string;
}

export function TransferProgressCard({
  metrics,
  onCancel,
  title = 'Sedang Mentransfer Berkas...',
}: TransferProgressCardProps) {
  const isConnecting = title.toLowerCase().includes('menyiapkan');

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
              {metrics.totalFiles > 0 ? (
                <>
                  Berkas {metrics.currentFileIndex} dari {metrics.totalFiles}:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {metrics.currentFileName}
                  </span>
                </>
              ) : (
                'Menghubungkan langsung ke perangkat penerima secara peer-to-peer...'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-semibold transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" /> Batal
        </button>
      </div>

      {/* Big Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            {formatBytes(metrics.bytesTransferred)} dari {formatBytes(metrics.totalBytes)}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base">
            {metrics.progressPercent}%
          </span>
        </div>

        <div className="w-full h-3 sm:h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/60">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            style={{ width: `${Math.max(2, metrics.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-left">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Zap className="w-3 h-3 text-amber-500" /> Kecepatan
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {isConnecting && metrics.speedBps === 0 ? 'Menghubungkan...' : `${formatBytes(metrics.speedBps)}/s`}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-left">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-cyan-500" /> Estimasi Selesai
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {isConnecting && metrics.speedBps === 0 ? 'Handshake P2P' : formatTimeRemaining(metrics.timeRemainingSec)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-left">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <File className="w-3 h-3 text-blue-500" /> Berkas Aktif
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1 truncate">
            {metrics.currentFileName || (isConnecting ? 'Menyiapkan...' : '-')}
          </div>
        </div>
      </div>
    </div>
  );
}
