'use client';

import React, { useState } from 'react';
import { BulkGeneratedItem, PdfGridSettings } from '@/types/bulkQr';
import { generateBulkPdf } from '@/lib/bulkQrPdf';
import { useToast } from '@/components/common/Toast';
import { FileText, X, Check, Download } from 'lucide-react';

interface BulkPdfModalProps {
  isOpen: boolean;
  items: BulkGeneratedItem[];
  onClose: () => void;
}

export function BulkPdfModal({ isOpen, items, onClose }: BulkPdfModalProps) {
  const [settings, setSettings] = useState<PdfGridSettings>({
    itemsPerPage: 6,
    includeName: true,
    includeDescription: false,
    marginMm: 12,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const validCount = items.filter((it) => it.success && it.dataUrl).length;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateBulkPdf(items, settings);
      showToast('Dokumen PDF berhasil diunduh!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat dokumen PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cetak PDF Grid (A4)
            </h3>
            <p className="text-xs text-slate-500">
              Menyusun {validCount} QR Code ke dalam lembar dokumen cetak siap potong.
            </p>
          </div>
        </div>

        {/* Layout Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Jumlah QR per Halaman A4
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 4, label: '4 QR (Besar)', sub: '2x2 grid • Stiker meja / display' },
              { id: 6, label: '6 QR (Standar)', sub: '2x3 grid • Rekomendasi' },
              { id: 9, label: '9 QR (Kompak)', sub: '3x3 grid • Badge / kartu nama' },
              { id: 12, label: '12 QR (Mini)', sub: '3x4 grid • Label produk' },
            ].map(({ id, label, sub }) => {
              const isSelected = settings.itemsPerPage === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSettings({ ...settings, itemsPerPage: id as PdfGridSettings['itemsPerPage'] })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <span>{label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Tampilkan Nama di Bawah QR
            </span>
            <input
              type="checkbox"
              checked={settings.includeName}
              onChange={(e) => setSettings({ ...settings, includeName: e.target.checked })}
              className="rounded accent-emerald-600 w-4 h-4"
            />
          </label>

          {settings.itemsPerPage <= 6 && (
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Tampilkan Keterangan / Deskripsi
              </span>
              <input
                type="checkbox"
                checked={settings.includeDescription}
                onChange={(e) => setSettings({ ...settings, includeDescription: e.target.checked })}
                className="rounded accent-emerald-600 w-4 h-4"
              />
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isGenerating || validCount === 0}
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Menyusun PDF...' : 'Download Dokumen PDF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
