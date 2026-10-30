'use client';

import React from 'react';
import { BulkGenerationProgress, BulkGeneratedItem } from '@/types/bulkQr';
import { downloadBlob } from '@/lib/bulkQrZip';
import { 
  FileArchive, 
  FileText, 
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface BulkProgressModalProps {
  isOpen: boolean;
  progress: BulkGenerationProgress;
  zipBlob: Blob | null;
  generatedItems: BulkGeneratedItem[];
  onCancel: () => void;
  onClose: () => void;
  onOpenPdfModal: () => void;
}

export function BulkProgressModal({
  isOpen,
  progress,
  zipBlob,
  generatedItems,
  onCancel,
  onClose,
  onOpenPdfModal,
}: BulkProgressModalProps) {
  if (!isOpen) return null;

  const handleDownloadZip = () => {
    if (zipBlob) {
      downloadBlob(zipBlob, `bulk-qr-codes-${Date.now()}.zip`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
        
        {/* Close Button when done or idle */}
        {(progress.isComplete || progress.isCancelled) && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2">
          {progress.isGenerating && (
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <span className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {progress.isComplete && !progress.isCancelled && (
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-7 h-7 text-emerald-500" />
            </div>
          )}

          {progress.isCancelled && (
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
          )}

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {progress.isGenerating && 'Sedang Menghasilkan QR Code Massal...'}
            {progress.isComplete && !progress.isCancelled && 'Generate Massal Selesai! 🎉'}
            {progress.isCancelled && 'Proses Dibatalkan'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {progress.isGenerating && progress.statusText}
            {progress.isComplete && !progress.isCancelled && `Seluruh ${progress.success} QR Code berhasil dibuat dan dikemas ke dalam file ZIP siap pakai.`}
            {progress.isCancelled && 'Proses generate telah dihentikan sesuai permintaan Anda.'}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">
              Progress: {progress.current} / {progress.total}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              {progress.percentage}%
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                progress.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Data</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{progress.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Berhasil</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{progress.success}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block">Gagal</span>
            <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{progress.failed}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {progress.isGenerating && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Batalkan Proses
            </button>
          )}

          {progress.isComplete && !progress.isCancelled && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={!zipBlob}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <FileArchive className="w-4 h-4" />
                <span>Unduh File ZIP (.zip)</span>
              </button>

              <button
                type="button"
                onClick={onOpenPdfModal}
                disabled={generatedItems.length === 0}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Cetak / Export PDF Grid (A4)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Selesai & Tutup Jendela
              </button>
            </div>
          )}

          {progress.isCancelled && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Tutup
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
