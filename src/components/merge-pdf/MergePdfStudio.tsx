'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Plus,
  ShieldCheck,
  Sparkles,
  Layers,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import {
  MergePdfFileItem,
  mergePdfDocuments,
  formatFileSize,
  parsePageRange,
} from '@/lib/pdfMergeHelper';

// Dynamic PDF.js loader for fast client-side thumbnail rendering
async function getPdfJs() {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('pdfjs-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = '/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat PDF.js'));
    document.head.appendChild(script);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = (window as any).pdfjsLib;
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
  return pdfjs;
}

export function MergePdfStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MergePdfFileItem[]>([]);
  const [outputFileName, setOutputFileName] = useState('merged_document_nextbyte');
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);

  // Load and parse multiple PDF files
  const handleFilesAdded = async (fileList: FileList | File[]) => {
    const pdfFiles = Array.from(fileList).filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      showToast('Silakan pilih file berekstensi PDF.', 'error');
      return;
    }

    showToast(`Memuat ${pdfFiles.length} file PDF...`, 'info');
    const pdfjs = await getPdfJs();
    const newItems: MergePdfFileItem[] = [];

    for (const f of pdfFiles) {
      try {
        const buffer = await f.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let pageCount = 1;
        let thumbUrl = '';

        if (pdfjs) {
          try {
            const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
            pageCount = doc.numPages;
            const page = await doc.getPage(1);
            const vp = page.getViewport({ scale: 0.25 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: vp }).promise;
              thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
            }
          } catch (pdfJsErr) {
            console.warn('Thumbnail generation skipped:', pdfJsErr);
          }
        }

        newItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file: f,
          bytes,
          pageCount,
          pageRange: 'all',
          rotation: 0,
          thumbnailUrl: thumbUrl,
        });
      } catch (err) {
        console.error(`Gagal membaca file ${f.name}:`, err);
      }
    }

    setFiles((prev) => [...prev, ...newItems]);
    setMergedBlobUrl(null);
    showToast(`${newItems.length} file PDF berhasil ditambahkan!`, 'success');
  };

  // Reorder File Position
  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Rotate All Pages in a File
  const handleRotateFile = (index: number) => {
    setFiles((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  // Update Page Range
  const handleUpdatePageRange = (index: number, val: string) => {
    setFiles((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, pageRange: val } : item))
    );
  };

  // Remove File
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
    setMergedBlobUrl(null);
    showToast('File dihapus dari daftar.', 'info');
  };

  // Clear all files
  const handleClearAll = () => {
    setFiles([]);
    setMergedBlobUrl(null);
  };

  // Execute Merge
  const handleMergePdfs = async () => {
    if (files.length < 2) {
      showToast('Pilih minimal 2 file PDF untuk digabungkan.', 'error');
      return;
    }

    setIsMerging(true);
    showToast('Menggabungkan dokumen PDF secara lokal...', 'info');

    try {
      const mergedBytes = await mergePdfDocuments(files);
      const blob = new Blob([mergedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedBlobUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      const cleanName = outputFileName.trim().replace(/\.pdf$/i, '') || 'merged_document';
      a.download = `${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}

      showToast('PDF berhasil digabungkan dan diunduh!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menggabungkan PDF';
      showToast(msg, 'error');
    } finally {
      setIsMerging(false);
    }
  };

  // Calculate total pages to be merged
  const totalSelectedPages = files.reduce((acc, item) => {
    const indices = parsePageRange(item.pageRange, item.pageCount);
    return acc + indices.length;
  }, 0);

  const totalRawSize = files.reduce((acc, item) => acc + item.file.size, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      {/* Hidden Multi-File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Header Banner & Privacy Callout */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              100% Client-Side
            </span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Privasi Terjamin: File tidak dikirim ke server</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Gabung Banyak PDF Menjadi Satu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Satukan ijazah, CV, berkas lamaran kerja, nota, atau kontrak secara instan tanpa batas ukuran dan tanpa antrean.
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span>Tambah File Lagi</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              Kosongkan
            </button>
          </div>
        )}
      </div>

      {/* Main Dropzone if no files yet */}
      {files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center min-h-[340px] group"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Pilih atau Tarik Berkas PDF ke Sini
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
            Anda dapat memilih beberapa file sekaligus (tekan tombol Ctrl / Shift saat memilih file di komputer).
          </p>
          <button
            type="button"
            className="mt-6 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all"
          >
            Pilih Berkas PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              <span>DAFTAR FILE ({files.length}) • URUTAN PENGGABUNGAN</span>
              <span>Gunakan tanda panah untuk mengatur urutan</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Index badge */}
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    {/* Thumbnail preview */}
                    <div className="w-12 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl}
                          alt="Thumbnail"
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                          }}
                          className="w-full h-full object-contain transition-transform"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={item.file.name}>
                        {item.file.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium">{formatFileSize(item.file.size)}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.pageCount} Halaman
                        </span>
                        {item.rotation !== 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                            Rotasi {item.rotation}°
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Page Range & Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Custom Page Range */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Hal:</span>
                      <input
                        type="text"
                        value={item.pageRange}
                        onChange={(e) => handleUpdatePageRange(idx, e.target.value)}
                        placeholder="all atau 1-3"
                        title="Tentukan halaman yang diambil, misal: 'all' untuk semua atau '1-3, 5'"
                        className="w-24 sm:w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveFile(idx, 'up')}
                        disabled={idx === 0}
                        title="Geser ke Atas"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFile(idx, 'down')}
                        disabled={idx === files.length - 1}
                        title="Geser ke Bawah"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateFile(idx)}
                        title="Putar Dokumen 90°"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        title="Hapus dari Gabungan"
                        className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Output Bar & Action */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ringkasan Dokumen Gabungan</h3>
                  <p className="text-xs text-slate-400">
                    {files.length} file dipilih • Total sekitar {totalSelectedPages} halaman ({formatFileSize(totalRawSize)})
                  </p>
                </div>
              </div>

              {/* Output File Name */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Nama File Hasil:</span>
                <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs">
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    placeholder="nama_file_gabung"
                    className="bg-transparent text-white focus:outline-none w-44 font-medium"
                  />
                  <span className="text-slate-400">.pdf</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dokumen diproses di browser Anda dalam hitungan detik tanpa batas kuota server.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {mergedBlobUrl && (
                  <a
                    href={mergedBlobUrl}
                    download={`${outputFileName || 'merged_document'}.pdf`}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Unduh Ulang</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleMergePdfs}
                  disabled={isMerging || files.length < 2}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                >
                  {isMerging ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menggabungkan...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Gabungkan & Unduh PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
