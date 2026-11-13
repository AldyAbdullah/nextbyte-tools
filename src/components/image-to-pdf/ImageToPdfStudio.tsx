'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import {
  ImageToPdfItem,
  PageSizeOption,
  PageOrientationOption,
  MarginOption,
  convertImagesToPdf,
} from '@/lib/imageToPdfHelper';

export function ImageToPdfStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageToPdfItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<PageOrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>('none');
  const [outputFileName, setOutputFileName] = useState<string>('dokumen_gambar');
  const [isConverting, setIsConverting] = useState(false);

  // Handle image files added
  const handleFilesAdded = (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(f.type) ||
      /\.(jpg|jpeg|png|webp|bmp)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      showToast('Silakan pilih file gambar yang valid (JPG, PNG, WebP).', 'error');
      return;
    }

    const newItems: ImageToPdfItem[] = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        rotation: 0,
        width: 0,
        height: 0,
      };
    });

    setImages((prev) => [...prev, ...newItems]);
    showToast(`Berhasil menambahkan ${newItems.length} foto/gambar.`, 'success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
    e.target.value = '';
  };

  // Reorder items
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setImages(updated);
  };

  // Rotate item 90 degrees
  const rotateItem = (index: number) => {
    setImages((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  // Delete item
  const deleteItem = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // Clear all
  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  };

  // Process Convert to PDF
  const handleConvert = async () => {
    if (images.length === 0) {
      showToast('Tambahkan minimal 1 gambar terlebih dahulu.', 'error');
      return;
    }

    setIsConverting(true);
    showToast('Mengonversi foto ke dokumen PDF...', 'info');

    try {
      const pdfBytes = await convertImagesToPdf(images, {
        pageSize,
        orientation,
        margin,
        fileName: outputFileName || 'dokumen_gambar',
      });

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${outputFileName || 'dokumen_gambar'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      showToast('PDF berhasil dibuat dan langsung diunduh!', 'success');
    } catch (err) {
      console.error('Convert error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengonversi gambar ke PDF';
      showToast(msg, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/png,image/jpeg,image/webp,image/bmp"
        multiple
        className="hidden"
      />

      {/* Main Container */}
      {images.length === 0 ? (
        /* Empty State */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-12 text-center cursor-pointer transition-all hover:shadow-xl hover:scale-[1.005] group"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Pilih atau Tarik Foto / Gambar ke Sini
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Gabungkan foto nota, struk, KTP, ijazah, atau tangkapan layar menjadi 1 berkas PDF rapi siap cetak. Mendukung ukuran A4 dan Folio/F4.
          </p>
          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Pilih Gambar (Bisa Banyak Sekaligus)</span>
          </button>
        </div>
      ) : (
        /* Active Workspace */
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {images.length} Gambar Terpilih
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Urutkan lembaran atau putar posisi foto sebelum dikonversi ke PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Foto</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-500 text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* PDF Page Settings Panel */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-primary-500" />
              <span>Pengaturan Format Dokumen PDF:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ukuran Halaman:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="a4">A4 (210 x 297 mm - Standar)</option>
                  <option value="f4">F4 / Folio (215 x 330 mm - Kantor)</option>
                  <option value="letter">Letter (8.5 x 11 inci)</option>
                  <option value="fit">Sesuai Ukuran Gambar Asli</option>
                </select>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Orientasi Halaman:
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as PageOrientationOption)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="auto">Otomatis (Sesuai Gambar)</option>
                  <option value="portrait">Portrait (Tegak / Vertikal)</option>
                  <option value="landscape">Landscape (Mendatar / Horizontal)</option>
                </select>
              </div>

              {/* Margin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Margin (Batas Tepi):
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as MarginOption)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="none">Tanpa Margin (Gambar Penuh)</option>
                  <option value="small">Margin Sedang (Rapi)</option>
                  <option value="large">Margin Tebal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image List / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-primary-400 transition-all space-y-2.5"
              >
                {/* Image Preview with rotation */}
                <div className="w-full aspect-[1/1.2] rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-1 border border-slate-100 dark:border-slate-800 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                  />
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                    #{index + 1}
                  </span>
                </div>

                {/* Filename */}
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate" title={item.file.name}>
                  {item.file.name}
                </p>

                {/* Card Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-500">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      title="Geser ke kiri / atas"
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === images.length - 1}
                      title="Geser ke kanan / bawah"
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateItem(index)}
                      title="Putar 90 derajat"
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-primary-600"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteItem(index)}
                    title="Hapus foto ini"
                    className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Nama File PDF:</span>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting || images.length === 0}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengonversi ke PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Konversi & Unduh Dokumen PDF ({images.length} Halaman)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
