'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BulkRowData, BulkDesignConfig } from '@/types/bulkQr';
import { renderSingleBulkCanvas, canvasToPngBlob, downloadBlob } from '@/lib/bulkQrZip';
import { copyCanvasToClipboard } from '@/lib/exportQrCanvas';
import { useToast } from '@/components/common/Toast';
import { 
  Eye, 
  Download, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  Grid3X3,
  ChevronDown
} from 'lucide-react';

interface BulkPreviewCardProps {
  rows: BulkRowData[];
  design: BulkDesignConfig;
  selectedIndex: number;
  onSelectRow: (index: number) => void;
}

export function BulkPreviewCard({
  rows,
  design,
  selectedIndex,
  onSelectRow,
}: BulkPreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backdrop, setBackdrop] = useState<'checker' | 'light' | 'dark'>('checker');
  const [isCopied, setIsCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const { showToast } = useToast();

  const currentRow = rows[selectedIndex] || rows[0];

  // Render preview canvas whenever currentRow or design changes
  useEffect(() => {
    let isCancelled = false;

    async function draw() {
      if (!currentRow || !canvasRef.current) return;
      setIsRendering(true);

      try {
        const composite = await renderSingleBulkCanvas(currentRow, design);
        if (isCancelled || !canvasRef.current) return;

        const target = canvasRef.current;
        target.width = composite.width;
        target.height = composite.height;
        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, target.width, target.height);
          ctx.drawImage(composite, 0, 0);
        }
      } catch (err) {
        console.warn('Bulk live preview error:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    }

    const timer = setTimeout(draw, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [currentRow, design]);

  const handleDownloadSingle = async () => {
    if (!currentRow) return;
    try {
      const composite = await renderSingleBulkCanvas(currentRow, design);
      const blob = await canvasToPngBlob(composite);
      downloadBlob(blob, `${currentRow.filename}.png`);
      showToast(`QR Code "${currentRow.name}" berhasil diunduh!`, 'success');
    } catch {
      showToast('Gagal mengunduh QR Code.', 'error');
    }
  };

  const handleCopySingle = async () => {
    if (!currentRow) return;
    try {
      const composite = await renderSingleBulkCanvas(currentRow, design);
      const success = await copyCanvasToClipboard(composite);
      if (success) {
        setIsCopied(true);
        showToast('Gambar QR Code berhasil disalin ke clipboard!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        showToast('Browser Anda tidak mendukung salin gambar.', 'info');
      }
    } catch {
      showToast('Gagal menyalin gambar.', 'error');
    }
  };

  if (!currentRow) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 sticky top-8">
      
      {/* Header & Row Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              Live Preview Desain Massal
            </h3>
          </div>

          {/* Backdrop Viewport Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setBackdrop('checker')}
              title="Latar Transparan / Checkerboard"
              className={`p-1.5 rounded-lg transition-all ${
                backdrop === 'checker' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setBackdrop('light')}
              title="Latar Terang"
              className={`p-1.5 rounded-lg transition-all ${
                backdrop === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setBackdrop('dark')}
              title="Latar Gelap"
              className={`p-1.5 rounded-lg transition-all ${
                backdrop === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row Selector dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Pratinjau Baris Data:
          </label>
          <div className="relative">
            <select
              value={selectedIndex}
              onChange={(e) => onSelectRow(Number(e.target.value))}
              className="w-full appearance-none px-3.5 py-2 pr-9 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {rows.map((r, i) => (
                <option key={r.rowIndex} value={i}>
                  #{r.rowIndex} — {r.name} ({r.content.substring(0, 30)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        className={`relative rounded-2xl p-6 flex items-center justify-center min-h-[340px] transition-all overflow-hidden border border-slate-200/80 dark:border-slate-800 ${
          backdrop === 'checker'
            ? 'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px]'
            : backdrop === 'light'
            ? 'bg-slate-100'
            : 'bg-slate-950'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="max-h-[300px] w-auto h-auto rounded-xl shadow-xl transition-all"
        />

        {isRendering && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Row Information Details */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Nama Baris:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
            {currentRow.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Isi / Link:</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-[200px]" title={currentRow.content}>
            {currentRow.content}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Nama File:</span>
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
            {currentRow.filename}.png
          </span>
        </div>
      </div>

      {/* Individual Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleDownloadSingle}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Unduh PNG Ini</span>
        </button>

        <button
          type="button"
          onClick={handleCopySingle}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Salin Gambar</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
