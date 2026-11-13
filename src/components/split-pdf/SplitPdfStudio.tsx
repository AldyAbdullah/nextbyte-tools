'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Scissors,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Archive,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import { getPdfJs } from '@/lib/pdfClientLoader';
import {
  formatFileSize,
  parsePageRange,
  extractPagesToSinglePdf,
  splitPagesToZip,
} from '@/lib/pdfSplitHelper';

type SplitMode = 'extract' | 'split_all';

export function SplitPdfStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [rangeInput, setRangeInput] = useState<string>('');
  const [splitMode, setSplitMode] = useState<SplitMode>('extract');
  const [outputFileName, setOutputFileName] = useState<string>('dokumen_pisah');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingThumbs, setIsRenderingThumbs] = useState(false);

  // Handle PDF file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Silakan pilih file berekstensi .PDF.', 'error');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const pdfjs = await getPdfJs();
      if (!pdfjs) throw new Error('Mesin PDF.js tidak tersedia');

      const loadingTask = pdfjs.getDocument({ data: bytes });
      const doc = await loadingTask.promise;

      setPdfFile(file);
      setPdfBytes(bytes);
      setPageCount(doc.numPages);
      // Default: select all pages initially
      const allPages = Array.from({ length: doc.numPages }, (_, i) => i);
      setSelectedPages(allPages);
      setRangeInput(`1-${doc.numPages}`);
      setOutputFileName(file.name.replace(/\.pdf$/i, '') + '_ekstrak');
      setThumbnails({});

      showToast(`Dokumen "${file.name}" berhasil dimuat (${doc.numPages} halaman).`, 'success');

      // Generate thumbnails asynchronously
      loadThumbnails(doc);
    } catch (err) {
      console.error('Error loading PDF:', err);
      showToast('Gagal membaca file PDF.', 'error');
    }
  };

  // Render thumbnails for all pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadThumbnails = async (doc: any) => {
    setIsRenderingThumbs(true);
    const thumbs: Record<number, string> = {};

    for (let i = 0; i < doc.numPages; i++) {
      try {
        const page = await doc.getPage(i + 1);
        const vp = page.getViewport({ scale: 0.28 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          thumbs[i] = canvas.toDataURL('image/jpeg', 0.75);
          // Incrementally update state so user sees preview immediately
          if (i === 0 || i % 4 === 0 || i === doc.numPages - 1) {
            setThumbnails({ ...thumbs });
          }
        }
      } catch (err) {
        console.warn(`Gagal me-render thumbnail halaman ${i + 1}:`, err);
      }
    }
    setThumbnails(thumbs);
    setIsRenderingThumbs(false);
  };

  // Toggle single page selection
  const togglePageSelection = (pageIdx: number) => {
    setSelectedPages((prev) => {
      let updated: number[];
      if (prev.includes(pageIdx)) {
        updated = prev.filter((p) => p !== pageIdx);
      } else {
        updated = [...prev, pageIdx].sort((a, b) => a - b);
      }
      // Update range input text to match
      syncRangeInputFromPages(updated);
      return updated;
    });
  };

  // Convert array of page indices to readable range string "1-3, 5, 8"
  const syncRangeInputFromPages = useCallback((pages: number[]) => {
    if (pages.length === 0) {
      setRangeInput('');
      return;
    }
    const sorted = [...pages].sort((a, b) => a - b).map((p) => p + 1);
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const cur = sorted[i];
      if (cur === prev + 1) {
        prev = cur;
      } else {
        if (start === prev) {
          ranges.push(`${start}`);
        } else {
          ranges.push(`${start}-${prev}`);
        }
        start = cur;
        prev = cur;
      }
    }
    setRangeInput(ranges.join(', '));
  }, []);

  // Handle manual range input typing
  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parsePageRange(val, pageCount);
    setSelectedPages(parsed);
  };

  // Quick Select buttons
  const selectAll = () => {
    const all = Array.from({ length: pageCount }, (_, i) => i);
    setSelectedPages(all);
    setRangeInput(`1-${pageCount}`);
  };

  const clearSelection = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const selectOddPages = () => {
    const odds = Array.from({ length: pageCount }, (_, i) => i).filter((p) => p % 2 === 0);
    setSelectedPages(odds);
    syncRangeInputFromPages(odds);
  };

  const selectEvenPages = () => {
    const evens = Array.from({ length: pageCount }, (_, i) => i).filter((p) => p % 2 === 1);
    setSelectedPages(evens);
    syncRangeInputFromPages(evens);
  };

  const invertSelection = () => {
    const inverted = Array.from({ length: pageCount }, (_, i) => i).filter(
      (p) => !selectedPages.includes(p)
    );
    setSelectedPages(inverted);
    syncRangeInputFromPages(inverted);
  };

  // Process Split or Extract
  const handleProcessSplit = async () => {
    if (!pdfBytes || selectedPages.length === 0) {
      showToast('Pilih minimal 1 halaman untuk diproses.', 'error');
      return;
    }

    setIsProcessing(true);
    showToast('Memproses pemisahan dokumen...', 'info');

    try {
      if (splitMode === 'extract') {
        const resultBytes = await extractPagesToSinglePdf(pdfBytes, selectedPages);
        const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${outputFileName || 'dokumen_pisah'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
        showToast(
          `Berhasil mengekstrak ${selectedPages.length} halaman menjadi 1 file PDF!`,
          'success'
        );
      } else {
        // Split each page into separate PDFs inside a ZIP
        const zipBlob = await splitPagesToZip(
          pdfBytes,
          selectedPages,
          outputFileName || 'dokumen_pisah'
        );
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${outputFileName || 'dokumen_pisah'}_pecah.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        confetti({ particleCount: 85, spread: 70, origin: { y: 0.8 } });
        showToast(
          `Berhasil memecah ${selectedPages.length} halaman ke dalam file ZIP!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Split error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memproses pemisahan PDF';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,.pdf"
        className="hidden"
      />

      {/* Main Container */}
      {!pdfFile ? (
        /* Empty State: Upload Hero */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-12 text-center cursor-pointer transition-all hover:shadow-xl hover:scale-[1.005] group"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Scissors className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Pilih atau Tarik File PDF ke Sini
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Pisahkan lembar halaman PDF tertentu atau ekstrak tiap lembar menjadi dokumen terpisah. 100% aman, gratis, dan diproses langsung di browser Anda.
          </p>
          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Pilih File PDF</span>
          </button>
        </div>
      ) : (
        /* Active State: File Loaded Workspace */
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-xs sm:max-w-md">
                  {pdfFile.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} Halaman • {formatFileSize(pdfFile.size)} •{' '}
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {selectedPages.length} terpilih
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ganti File</span>
              </button>
            </div>
          </div>

          {/* Mode Selector & Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Split Mode Cards */}
            <div
              onClick={() => setSplitMode('extract')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                splitMode === 'extract'
                  ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 shadow-sm ring-2 ring-primary-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    splitMode === 'extract'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Ekstrak Halaman Jadi 1 PDF
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Menggabungkan seluruh lembar yang Anda pilih ke dalam satu file PDF baru.
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSplitMode('split_all')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                splitMode === 'split_all'
                  ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 shadow-sm ring-2 ring-primary-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    splitMode === 'split_all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Pecah Setiap Lembar Terpisah (.ZIP)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Masing-masing halaman terpilih disimpan sebagai file PDF 1 lembar dalam arsip ZIP.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Selection Toolbar & Range Input */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
                  Pilih Cepat:
                </span>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-primary-500" />
                  Semua
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  Kosongkan
                </button>
                <button
                  type="button"
                  onClick={selectOddPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-all"
                >
                  Ganjil
                </button>
                <button
                  type="button"
                  onClick={selectEvenPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-all"
                >
                  Genap
                </button>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Balik
                </button>
              </div>

              {/* Range Input box */}
              <div className="w-full sm:w-64 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Rentang:</span>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  placeholder="Contoh: 1-3, 5, 8"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Page Grid Selector */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Klik lembar halaman untuk memilih / membatalkan:
              </span>
              {isRenderingThumbs && (
                <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menyiapkan preview...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-h-[550px] overflow-y-auto p-1">
              {Array.from({ length: pageCount }, (_, idx) => {
                const isSelected = selectedPages.includes(idx);
                const thumb = thumbnails[idx];

                return (
                  <div
                    key={`page_${idx}`}
                    onClick={() => togglePageSelection(idx)}
                    className={`group relative rounded-2xl border-2 transition-all cursor-pointer p-2 flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/20 shadow-md scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white/90 dark:bg-slate-800/90 text-transparent border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>

                    {/* Thumbnail Image */}
                    <div className="w-full aspect-[1/1.414] rounded-lg bg-white overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={`Hal ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <Eye className="w-5 h-5 mb-1" />
                          <span className="text-[10px]">Hal {idx + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Page Number Label */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300'
                            : 'text-slate-500'
                        }`}
                      >
                        Halaman {idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Nama File:</span>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="button"
              onClick={handleProcessSplit}
              disabled={isProcessing || selectedPages.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Dokumen...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {splitMode === 'extract'
                      ? `Unduh ${selectedPages.length} Halaman Terpilih (.PDF)`
                      : `Unduh Lembaran Terpisah (.ZIP)`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>100% Aman & Terjaga:</strong> Seluruh pemisahan dan pengunduhan PDF diproses secara langsung di browser lokal Anda tanpa pernah diunggah ke server.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
