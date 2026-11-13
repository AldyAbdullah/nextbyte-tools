'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Archive,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import { getPdfJs } from '@/lib/pdfClientLoader';
import {
  ImageFormat,
  RenderedPageImage,
  renderPdfPagesToImages,
  packageImagesToZip,
} from '@/lib/pdfToImageHelper';

export function PdfToImageStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Settings
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [scale, setScale] = useState<number>(2.0); // 1x, 2x (HD), 3x (Ultra)

  // Rendered state
  const [isRendering, setIsRendering] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [renderedImages, setRenderedImages] = useState<RenderedPageImage[]>([]);

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
      setRenderedImages([]);

      showToast(`Dokumen "${file.name}" berhasil dimuat (${doc.numPages} halaman).`, 'success');
    } catch (err) {
      console.error('Error loading PDF:', err);
      showToast('Gagal membaca file PDF.', 'error');
    }
  };

  // Convert PDF to images
  const handleConvert = async () => {
    if (!pdfBytes || !pdfFile) return;

    setIsRendering(true);
    setProgressPercent(0);
    setProgressMsg('Memulai konversi halaman...');

    try {
      const images = await renderPdfPagesToImages(
        pdfBytes,
        scale,
        format,
        (current, total) => {
          const pct = Math.round((current / total) * 100);
          setProgressPercent(pct);
          setProgressMsg(`Merender halaman ${current} dari ${total}...`);
        }
      );

      setRenderedImages(images);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      showToast(`Berhasil merender ${images.length} halaman ke gambar resolusi tinggi!`, 'success');
    } catch (err) {
      console.error('Rendering error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengonversi PDF ke gambar';
      showToast(msg, 'error');
    } finally {
      setIsRendering(false);
    }
  };

  // Download single image
  const handleDownloadSingle = (img: RenderedPageImage) => {
    if (!pdfFile) return;
    const cleanName = pdfFile.name.replace(/\.pdf$/i, '');
    const ext = format === 'png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = `${cleanName}_hal_${img.pageIndex + 1}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (!pdfFile || renderedImages.length === 0) return;
    showToast('Mengemas seluruh gambar ke dalam file ZIP...', 'info');

    try {
      const zipBlob = await packageImagesToZip(renderedImages, pdfFile.name, format);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfFile.name.replace(/\.pdf$/i, '')}_gambar.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('File ZIP siap diunduh!', 'success');
    } catch (err) {
      console.error('ZIP error:', err);
      showToast('Gagal membuat arsip ZIP.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
        /* Empty State */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-12 text-center cursor-pointer transition-all hover:shadow-xl hover:scale-[1.005] group"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Pilih atau Tarik File PDF ke Sini
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Ekstrak lembar dokumen PDF menjadi gambar tajam format JPG atau PNG berkualitas tinggi. Unduh per halaman atau sekaligus dalam arsip ZIP.
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
        /* Active Workspace */
        <div className="space-y-6">
          {/* File Overview Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-xs sm:max-w-md">
                  {pdfFile.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} Lembar Halaman Siap Dikonversi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ganti File</span>
            </button>
          </div>

          {/* Settings Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Format Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Format Gambar:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      format === 'jpeg'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    JPG (Ukuran Ringan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      format === 'png'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    PNG (Kualitas Tanpa Kompresi)
                  </button>
                </div>
              </div>

              {/* Resolution / DPI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ketajaman / Resolusi Gambar:
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="1.0">Standar 1x (~100-150 DPI - Cepat & Ringan)</option>
                  <option value="2.0">HD 2x (~300 DPI - Teks Sangat Tajam & Jernih)</option>
                  <option value="3.0">Ultra HD 3x (~450 DPI - Kejernihan Ekstrem)</option>
                </select>
              </div>
            </div>

            {/* Convert trigger */}
            {renderedImages.length === 0 && (
              <div className="pt-2">
                {isRendering ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />
                        {progressMsg}
                      </span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all duration-200 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvert}
                    className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Mulai Konversi Seluruh Halaman ({pageCount} Lembar)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rendered Images Results Grid */}
          {renderedImages.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Semua {renderedImages.length} Halaman Berhasil Dikonversi!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Unduh lembaran tertentu di bawah atau unduh sekaligus dalam file ZIP.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Unduh Semua (.ZIP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderedImages([])}
                    className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ubah Pengaturan</span>
                  </button>
                </div>
              </div>

              {/* Grid of images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {renderedImages.map((img) => (
                  <div
                    key={`rendered_${img.pageIndex}`}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="w-full aspect-[1/1.414] rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.dataUrl}
                        alt={`Hal ${img.pageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                        Hal {img.pageIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {img.width} x {img.height} px
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(img)}
                        className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 text-primary-700 dark:text-primary-300 font-bold text-xs transition-all flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Aman & Bebas Bocor:</strong> Seluruh pemrosesan render lembar PDF ke gambar dilakukan di memori browser Anda tanpa pernah diunggah ke server.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
