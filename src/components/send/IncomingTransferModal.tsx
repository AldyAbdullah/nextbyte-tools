'use client';

import React from 'react';
import { DownloadCloud, X, Check, FileText } from 'lucide-react';
import { formatBytes } from '@/lib/webrtc/deviceDetection';

interface IncomingTransferModalProps {
  senderName: string;
  files: Array<{ id: string; name: string; size: number; type: string }>;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingTransferModal({
  senderName,
  files,
  onAccept,
  onReject,
}: IncomingTransferModalProps) {
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <DownloadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Permintaan Terima Berkas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">{senderName}</strong> ingin mengirim{' '}
              {files.length} berkas ({formatBytes(totalSize)}) langsung lewat Wi-Fi.
            </p>
          </div>
        </div>

        {/* Files preview list */}
        <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate pr-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate min-w-0">{file.name}</span>
              </div>
              <span className="text-slate-400 font-mono shrink-0">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onReject}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4 text-slate-400" />
            Tolak
          </button>
          <button
            onClick={onAccept}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Terima Berkas
          </button>
        </div>
      </div>
    </div>
  );
}
