'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Type } from 'lucide-react';
import { PdfAnnotationItem } from '@/lib/pdfEditorHelper';

interface ReplaceTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRect: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    text: string;
    fontsize?: number;
  } | null;
  pageIndex: number;
  onApplyReplace: (annotation: PdfAnnotationItem) => void;
}

export function ReplaceTextModal({
  isOpen,
  onClose,
  targetRect,
  pageIndex,
  onApplyReplace,
}: ReplaceTextModalProps) {
  const [newText, setNewText] = useState('');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [autoExpandWidth, setAutoExpandWidth] = useState(true);

  useEffect(() => {
    if (targetRect) {
      setNewText(targetRect.text || '');
      if (targetRect.fontsize) {
        setFontSize(Math.round(targetRect.fontsize));
      } else {
        const height = targetRect.y1 - targetRect.y0;
        setFontSize(Math.max(9, Math.round(height * 0.75)));
      }
    }
  }, [targetRect]);

  if (!isOpen || !targetRect) return null;

  const originalWidth = targetRect.x1 - targetRect.x0;
  const originalHeight = targetRect.y1 - targetRect.y0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    // Estimate width based on character length if newText is longer than original
    let finalWidth = originalWidth;
    if (autoExpandWidth && newText.length > (targetRect.text?.length || 0)) {
      const approxCharWidth = fontSize * 0.55;
      finalWidth = Math.max(originalWidth, newText.length * approxCharWidth + 6);
    }

    const annotation: PdfAnnotationItem = {
      id: `replace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageIndex,
      type: 'replace',
      x: targetRect.x0,
      y: targetRect.y0,
      width: finalWidth,
      height: originalHeight,
      text: newText,
      originalText: targetRect.text,
      fontSize,
      fontFamily,
      color: textColor,
      bgColor,
    };

    onApplyReplace(annotation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl text-left space-y-5 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ganti Teks / Nama
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tutupi teks lama & ganti dengan teks baru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teks Asli Terdeteksi */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Teks Asli Terdeteksi (OCR):
            </label>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono truncate">
              {targetRect.text || '(Area Kosong / Scan)'}
            </div>
          </div>

          {/* Input Teks Baru */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Teks Baru / Pengganti:
            </label>
            <input
              type="text"
              autoFocus
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ketik teks baru di sini..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Typography Settings (Grid) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Font Family */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Jenis Font:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as typeof fontFamily)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Helvetica">Helvetica / Arial (Standar)</option>
                <option value="TimesRoman">Times New Roman (Resmi)</option>
                <option value="Courier">Courier (Mesin Ketik)</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Ukuran Font (pt):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={6}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 12)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Text Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Warna Teks:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase">
                  {textColor}
                </span>
              </div>
            </div>

            {/* Whiteout / Background Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Warna Tutup (Whiteout):</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase">
                  {bgColor}
                </span>
              </div>
            </div>
          </div>

          {/* Checkbox auto expand */}
          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoExpandWidth}
              onChange={(e) => setAutoExpandWidth(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Perlebar kotak otomatis jika teks baru lebih panjang</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Ganti Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
