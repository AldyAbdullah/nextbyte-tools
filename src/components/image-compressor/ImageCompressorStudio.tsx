'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  CompressionSettings, 
  CompressedImageItem, 
  CompressionMode, 
  OutputFormat 
} from '@/types/imageCompressor';
import { 
  compressSingleImage, 
  formatFileSize, 
  triggerFileDownload, 
  createCompressedZip 
} from '@/lib/imageCompression';
import { useToast } from '@/components/common/Toast';
import confetti from 'canvas-confetti';
import { 
  UploadCloud, 
  Download, 
  FileArchive, 
  Trash2, 
  Sparkles, 
  Sliders, 
  CheckCircle2
} from 'lucide-react';

const DEFAULT_SETTINGS: CompressionSettings = {
  mode: 'quality',
  quality: 75,
  targetSizeKb: 200,
  format: 'original',
  resizeMode: 'none',
  scalePercent: 100,
  maxWidth: 1920,
  maxHeight: 1080,
  applySharpen: true,
};

export function ImageCompressorStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [items, setItems] = useState<CompressedImageItem[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'original' | 'compressed'>('split');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100 %

  // Summary statistics
  const stats = useMemo(() => {
    let totalOriginal = 0;
    let totalCompressed = 0;
    let successCount = 0;

    items.forEach((item) => {
      totalOriginal += item.originalSize;
      if (item.compressedBlob) {
        totalCompressed += item.compressedSize;
        successCount++;
      }
    });

    const totalSaved = Math.max(0, totalOriginal - totalCompressed);
    const overallReduction = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

    return {
      totalFiles: items.length,
      successCount,
      totalOriginal,
      totalCompressed,
      totalSaved,
      overallReduction,
    };
  }, [items]);

  // Selected item
  const selectedItem = items[selectedIndex] || items[0] || null;

  // Compress a single item with current settings
  const processItem = useCallback(async (
    item: CompressedImageItem,
    activeSettings: CompressionSettings
  ): Promise<CompressedImageItem> => {
    try {
      const result = await compressSingleImage(item.originalFile, activeSettings);
      const compressedUrl = URL.createObjectURL(result.blob);
      const compressedSize = result.blob.size;
      const reductionPercent = Math.max(
        0,
        Math.round(((item.originalSize - compressedSize) / item.originalSize) * 100)
      );

      // Clean up previous blob URL if any
      if (item.compressedUrl) {
        URL.revokeObjectURL(item.compressedUrl);
      }

      return {
        ...item,
        compressedBlob: result.blob,
        compressedSize,
        compressedWidth: result.width,
        compressedHeight: result.height,
        compressedUrl,
        compressedFormat: result.mimeType.replace('image/', '').toUpperCase(),
        reductionPercent,
        status: 'done',
        error: undefined,
      };
    } catch (err) {
      console.error('Compression error:', err);
      return {
        ...item,
        status: 'error',
        error: (err as Error).message || 'Gagal mengompres gambar.',
      };
    }
  }, []);

  // Recompress all loaded items whenever settings change
  const recompressAll = useCallback(async (newSettings: CompressionSettings) => {
    if (items.length === 0) return;
    setIsProcessingBatch(true);

    const updatedList: CompressedImageItem[] = [];
    for (const item of items) {
      const updated = await processItem(item, newSettings);
      updatedList.push(updated);
    }

    setItems(updatedList);
    setIsProcessingBatch(false);
    showToast('Seluruh gambar berhasil dikompresi ulang!', 'success');
  }, [items, processItem, showToast]);

  // Handle incoming files
  const handleAddFiles = async (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) =>
      f.type.match(/^image\/(jpeg|jpg|png|webp)/i)
    );

    if (validFiles.length === 0) {
      showToast('Mohon pilih file gambar berformat JPG, PNG, atau WebP.', 'error');
      return;
    }

    setIsProcessingBatch(true);

    const newItems: CompressedImageItem[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const originalUrl = URL.createObjectURL(file);

      // Get dimensions
      const img = new Image();
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
        img.src = originalUrl;
      });

      const initialItem: CompressedImageItem = {
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        originalWidth: img.naturalWidth || 800,
        originalHeight: img.naturalHeight || 600,
        originalUrl,
        originalFormat: file.type.replace('image/', '').toUpperCase() || 'JPG',
        compressedBlob: null,
        compressedSize: 0,
        compressedWidth: 0,
        compressedHeight: 0,
        compressedUrl: null,
        compressedFormat: '',
        reductionPercent: 0,
        status: 'compressing',
      };

      const compressedItem = await processItem(initialItem, settings);
      newItems.push(compressedItem);
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessingBatch(false);

    if (newItems.length > 0) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      showToast(`${newItems.length} gambar berhasil dimuat dan dikompres!`, 'success');
    }
  };

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Clean up object URLs only on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      });
    };
  }, []);

  // Handle single download
  const handleDownloadSingle = (item: CompressedImageItem) => {
    if (!item.compressedBlob) return;
    const ext = item.compressedFormat.toLowerCase() === 'jpeg' ? 'jpg' : item.compressedFormat.toLowerCase();
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-compressed.${ext || 'jpg'}`;
    triggerFileDownload(item.compressedBlob, filename);
    showToast(`Gambar "${filename}" berhasil diunduh!`, 'success');
  };

  // Handle ZIP download of all files
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((i) => i.compressedBlob !== null);
    if (doneItems.length === 0) return;

    try {
      const zipPayload = doneItems.map((item) => {
        const ext = item.compressedFormat.toLowerCase() === 'jpeg' ? 'jpg' : item.compressedFormat.toLowerCase();
        const baseName = item.name.replace(/\.[^/.]+$/, '');
        return {
          name: `${baseName}-min.${ext || 'jpg'}`,
          blob: item.compressedBlob!,
        };
      });

      const zipBlob = await createCompressedZip(zipPayload);
      triggerFileDownload(zipBlob, `nextbyte-compressed-images-${Date.now()}.zip`);
      showToast('File ZIP berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal membuat file ZIP.', 'error');
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.originalUrl) URL.revokeObjectURL(target.originalUrl);
      if (target?.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedIndex >= filtered.length) {
        setSelectedIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  // Clear all
  const handleClearAll = () => {
    items.forEach((i) => {
      if (i.originalUrl) URL.revokeObjectURL(i.originalUrl);
      if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
    });
    setItems([]);
    setSelectedIndex(0);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Upload Dropzone or Top Batch Bar */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-14 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) {
                handleAddFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-16 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleAddFiles(e.target.files);
                }
              }}
            />

            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Pilih atau Tarik Foto ke Sini
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bisa pilih satu foto atau banyak foto sekaligus. Mendukung format JPG, PNG, dan WebP.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  .JPG / .JPEG
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  .PNG
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  .WEBP
                </span>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600 dark:text-slate-400 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-semibold">100% Client-Side Privacy</strong>
                <span>Foto tidak dikirim ke server. Foto Anda aman di memori browser Anda sendiri.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-semibold">Mode Target Ukuran (KB)</strong>
                <span>Atur foto pas di bawah 200 KB atau 100 KB untuk syarat daftar dokumen.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <FileArchive className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-semibold">Download Massal (ZIP)</strong>
                <span>Kompres puluhan foto sekaligus dan unduh rapi dalam 1 file ZIP.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Top Batch Bar with Global Summary & Actions */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              {stats.overallReduction}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{items.length} Foto Siap</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  (Hemat {formatFileSize(stats.totalSaved)})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asli: {formatFileSize(stats.totalOriginal)} ➔ Kompresi: {formatFileSize(stats.totalCompressed)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              + Tambah Foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
              }}
            />

            {items.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Download Semua (ZIP)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
              title="Hapus Semua Foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Studio Grid (Active when at least 1 image loaded) */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Compression Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengaturan Kompresi
                  </h4>
                  <p className="text-xs text-slate-500">
                    Diterapkan ke seluruh foto yang diunggah
                  </p>
                </div>
              </div>

              {/* Mode Switcher: Quality Slider vs Target Size */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Metode Kompresi:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, mode: 'quality' as CompressionMode };
                      setSettings(updated);
                      recompressAll(updated);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      settings.mode === 'quality'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Atur Kualitas (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, mode: 'target-size' as CompressionMode };
                      setSettings(updated);
                      recompressAll(updated);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      settings.mode === 'target-size'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Target Ukuran (KB)
                  </button>
                </div>
              </div>

              {/* MODE 1: QUALITY SLIDER */}
              {settings.mode === 'quality' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tingkat Kualitas:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {settings.quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.quality}
                    onChange={(e) => {
                      const q = parseInt(e.target.value);
                      setSettings((prev) => ({ ...prev, quality: q }));
                    }}
                    onMouseUp={() => recompressAll(settings)}
                    onTouchEnd={() => recompressAll(settings)}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Ukuran Terkecil (10%)</span>
                    <span className="font-semibold text-blue-600">Rekomendasi (75%)</span>
                    <span>Kualitas Maksimal (100%)</span>
                  </div>
                </div>
              )}

              {/* MODE 2: TARGET FILE SIZE (KB) */}
              {settings.mode === 'target-size' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Batas Maksimal Ukuran File:
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="20"
                      max="10000"
                      value={settings.targetSizeKb}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 200;
                        setSettings((prev) => ({ ...prev, targetSizeKb: val }));
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">KB</span>
                    <button
                      type="button"
                      onClick={() => recompressAll(settings)}
                      className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      Terapkan
                    </button>
                  </div>

                  {/* Quick Preset Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: 'KTP / CPNS 200 KB', kb: 200 },
                      { label: 'Web 300 KB', kb: 300 },
                      { label: 'Sosmed 500 KB', kb: 500 },
                      { label: 'Email 1 MB', kb: 1024 },
                    ].map((badge) => (
                      <button
                        key={badge.kb}
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, targetSizeKb: badge.kb };
                          setSettings(updated);
                          recompressAll(updated);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          settings.targetSizeKb === badge.kb
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                        }`}
                      >
                        {badge.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Output Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Format Output File:
                </label>
                <select
                  value={settings.format}
                  onChange={(e) => {
                    const fmt = e.target.value as OutputFormat;
                    const updated = { ...settings, format: fmt };
                    setSettings(updated);
                    recompressAll(updated);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="original">Pertahankan Format Asli</option>
                  <option value="image/webp">WebP (Rekomendasi Google — Paling Ringan)</option>
                  <option value="image/jpeg">JPG / JPEG (Kompatibel untuk Dokumen)</option>
                  <option value="image/png">PNG (Mendukung Transparansi)</option>
                </select>
              </div>

              {/* Resize / Scale Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Ubah Ukuran Dimensi (Resize):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '100% Asli', mode: 'none' as const, scale: 100 },
                    { label: '75%', mode: 'scale' as const, scale: 75 },
                    { label: '50%', mode: 'scale' as const, scale: 50 },
                    { label: 'Max 1920px', mode: 'dimensions' as const, scale: 100 },
                  ].map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...settings,
                          resizeMode: res.mode,
                          scalePercent: res.scale,
                          maxWidth: 1920,
                        };
                        setSettings(updated);
                        recompressAll(updated);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        settings.resizeMode === res.mode && settings.scalePercent === res.scale
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Edge Sharpening Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Smart Sharpening (Penajaman Tepi)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Mempertegas garis objek agar foto tetap tajam setelah dikompres.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, applySharpen: !settings.applySharpen };
                    setSettings(updated);
                    recompressAll(updated);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.applySharpen ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.applySharpen ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* Batch List Navigation if multiple files */}
            {items.length > 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Daftar Foto ({items.length})</span>
                  <span className="text-[11px] font-normal text-slate-500">Klik untuk melihat perbandingan</span>
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIndex(index)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        selectedIndex === index
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.compressedUrl || item.originalUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatFileSize(item.originalSize)} ➔ {formatFileSize(item.compressedSize)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          -{item.reductionPercent}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Interactive Before/After Preview Studio */}
          <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-8">
            
            {selectedItem && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {selectedItem.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Dimensi: {selectedItem.compressedWidth} × {selectedItem.compressedHeight} px</span>
                      <span>•</span>
                      <span>Format: {selectedItem.compressedFormat}</span>
                    </p>
                  </div>

                  {/* Preview Mode Switcher (Split vs Original vs Compressed) */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
                    {(['split', 'original', 'compressed'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPreviewMode(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                          previewMode === m
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        {m === 'split' ? 'Bandingkan' : m === 'original' ? 'Asli' : 'Hasil'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comparison Viewport */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-[360px] sm:h-[460px] w-full flex items-center justify-center select-none">
                  
                  {isProcessingBatch && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center">
                      <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Mode: Split Screen Slider */}
                  {previewMode === 'split' && (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      {/* Under layer: Compressed image (or original fallback) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.compressedUrl || selectedItem.originalUrl}
                        alt="Hasil Kompresi"
                        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                      />

                      {/* Top layer: Original image clipped by split slider */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{ clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedItem.originalUrl}
                          alt="Foto Asli"
                          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                          onError={() => {
                            if (selectedItem.originalFile) {
                              const freshUrl = URL.createObjectURL(selectedItem.originalFile);
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === selectedItem.id ? { ...it, originalUrl: freshUrl } : it
                                )
                              );
                            }
                          }}
                        />
                      </div>

                      {/* Split Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] z-20 pointer-events-none"
                        style={{ left: `${splitPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center font-bold text-[10px] border border-white">
                          ⇔
                        </div>
                      </div>

                      {/* Slider Input overlay */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={splitPosition}
                        onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize z-25 w-full h-full"
                        title="Geser ke kiri / kanan untuk membandingkan"
                      />

                      {/* Badges Left & Right */}
                      <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                        Foto Asli: {formatFileSize(selectedItem.originalSize)}
                      </div>
                      <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold border border-emerald-400/20">
                        Hasil: {formatFileSize(selectedItem.compressedSize)} (-{selectedItem.reductionPercent}%)
                      </div>
                    </div>
                  )}

                  {/* Mode: Original Only */}
                  {previewMode === 'original' && (
                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.originalUrl}
                        alt="Foto Asli"
                        className="max-w-full max-h-[420px] object-contain select-none"
                        onError={() => {
                          if (selectedItem.originalFile) {
                            const freshUrl = URL.createObjectURL(selectedItem.originalFile);
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === selectedItem.id ? { ...it, originalUrl: freshUrl } : it
                              )
                            );
                          }
                        }}
                      />
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 text-white text-xs font-bold border border-white/10">
                        Asli: {formatFileSize(selectedItem.originalSize)}
                      </div>
                    </div>
                  )}

                  {/* Mode: Compressed Only */}
                  {previewMode === 'compressed' && (
                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.compressedUrl || selectedItem.originalUrl}
                        alt="Hasil Kompresi"
                        className="max-w-full max-h-[420px] object-contain select-none"
                      />
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold border border-emerald-400/20">
                        Hasil: {formatFileSize(selectedItem.compressedSize)} (-{selectedItem.reductionPercent}%)
                      </div>
                    </div>
                  )}

                </div>

                {/* Reduction Metrics Highlight Bar */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block font-semibold">Ukuran Asli</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatFileSize(selectedItem.originalSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block font-semibold">Ukuran Kompresi</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatFileSize(selectedItem.compressedSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block font-semibold">Dihemat</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      -{selectedItem.reductionPercent}%
                    </span>
                  </div>
                </div>

                {/* Primary Download Action Button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(selectedItem)}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Hasil ({selectedItem.compressedFormat} • {formatFileSize(selectedItem.compressedSize)})</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
