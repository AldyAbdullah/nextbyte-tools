'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Trash2,
  Sparkles,
  Sliders,
  RefreshCw,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  SunMedium,
  Contrast,
  Zap,
  ZoomIn,
} from 'lucide-react';
import {
  SharpenSettings,
  SharpenPreset,
  SharpenImageItem,
  SHARPEN_PRESETS,
} from '@/types/imageSharpener';
import {
  processImageSharpening,
  createSharpenedZip,
  triggerFileDownload,
  formatFileSize,
} from '@/lib/imageSharpening';

const DEFAULT_SETTINGS: SharpenSettings = {
  preset: 'balanced',
  amount: 60,
  radius: 2,
  threshold: 3,
  clarity: 30,
  contrast: 8,
  brightness: 2,
  format: 'original',
  quality: 0.95,
};

export default function ImageSharpenerStudio() {
  const [items, setItems] = useState<SharpenImageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SharpenSettings>(DEFAULT_SETTINGS);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [sliderPos, setSliderPos] = useState<number>(50); // Split comparison (0..100)
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeItem = items.find((i) => i.id === selectedItemId) || items[0] || null;

  // Process a single item with current settings
  const reprocessItem = useCallback(
    async (item: SharpenImageItem, currentSettings: SharpenSettings) => {
      try {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
        );

        const result = await processImageSharpening(item.originalFile, currentSettings);
        const url = URL.createObjectURL(result.blob);

        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              if (i.processedUrl) URL.revokeObjectURL(i.processedUrl);
              return {
                ...i,
                processedBlob: result.blob,
                processedUrl: url,
                processedSize: result.blob.size,
                status: 'done',
              };
            }
            return i;
          })
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal mempertajam gambar.';
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: errorMsg } : i))
        );
      }
    },
    []
  );

  // Debounced auto-reprocess when settings change
  useEffect(() => {
    if (!activeItem) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      reprocessItem(activeItem, settings);
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [settings, activeItem, reprocessItem]);

  // Handle files selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (validFiles.length === 0) return;

    const newItems: SharpenImageItem[] = validFiles.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const url = URL.createObjectURL(file);
      return {
        id,
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        originalUrl: url,
        originalFormat: file.type.replace('image/', '').toUpperCase(),
        processedBlob: null,
        processedUrl: null,
        processedSize: 0,
        status: 'idle',
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setSelectedItemId((curr) => curr || (newItems.length > 0 ? newItems[0].id : null));
  }, []);

  const handlePresetSelect = (presetKey: SharpenPreset) => {
    if (presetKey === 'custom') {
      setSettings((prev) => ({ ...prev, preset: 'custom' }));
      return;
    }
    const preset = SHARPEN_PRESETS[presetKey];
    setSettings((prev) => ({
      ...prev,
      preset: presetKey,
      ...preset.settings,
    }));
  };

  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.originalUrl) URL.revokeObjectURL(target.originalUrl);
      if (target?.processedUrl) URL.revokeObjectURL(target.processedUrl);
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    });
    setItems([]);
    setSelectedItemId(null);
  };

  const handleProcessAll = async () => {
    setIsProcessingBatch(true);
    for (const item of items) {
      await reprocessItem(item, settings);
    }
    setIsProcessingBatch(false);
  };

  const handleDownloadSingle = (item: SharpenImageItem) => {
    if (!item.processedBlob) return;
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    let ext = 'jpg';
    if (item.processedBlob.type === 'image/png') ext = 'png';
    else if (item.processedBlob.type === 'image/webp') ext = 'webp';
    triggerFileDownload(item.processedBlob, `${baseName}-sharpened.${ext}`);
  };

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((i) => i.processedBlob !== null);
    if (readyItems.length === 0) return;
    try {
      const zipBlob = await createSharpenedZip(readyItems);
      triggerFileDownload(zipBlob, `nextbyte-sharpened-${Date.now()}.zip`);
    } catch {
      alert('Gagal membuat arsip ZIP. Silakan coba unduh satuan.');
    }
  };

  // Drag comparison slider logic
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  // Keyboard / Paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files) {
        handleFiles(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFiles]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Upload Zone */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="group relative border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-cyan-500 bg-white/80 dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-900/90 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 shadow-sm backdrop-blur-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/20 transition-transform duration-300 shadow-inner">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
              Tarik & Lepas Foto di Sini, atau <span className="text-cyan-600 dark:text-cyan-400 underline decoration-cyan-500/40 underline-offset-4">Pilih Berkas</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Mendukung format JPG, PNG, WebP • Bisa salin & tempel (<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-xs font-mono">Ctrl + V</kbd>)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Unsharp Mask Multi-Pass
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Mode Khusus KTP & Dokumen
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 100% Client-Side Tanpa Server
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visualizer & Split View (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-3 px-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors border border-slate-200 dark:border-zinc-700/60"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Tambah Foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={handleProcessAll}
                    disabled={isProcessingBatch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-600/20 dark:hover:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                    Terapkan ke Semua ({items.length})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {items.some((i) => i.processedBlob) && (
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" /> Unduh Semua ZIP
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-xs font-semibold transition-colors"
                  title="Hapus semua foto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>

            {/* Split Screen Before / After Canvas Box */}
            {activeItem && (
              <div className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Header Info */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2 truncate max-w-sm">
                    <span className="font-semibold text-slate-900 dark:text-zinc-200 truncate">{activeItem.name}</span>
                    <span className="text-slate-400">•</span>
                    <span>Asli: {formatFileSize(activeItem.originalSize)}</span>
                    {activeItem.processedSize > 0 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                          Hasil: {formatFileSize(activeItem.processedSize)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onMouseDown={() => setIsHoldingOriginal(true)}
                      onMouseUp={() => setIsHoldingOriginal(false)}
                      onTouchStart={() => setIsHoldingOriginal(true)}
                      onTouchEnd={() => setIsHoldingOriginal(false)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-medium border border-slate-200 dark:border-zinc-700/60 select-none active:bg-cyan-500 active:text-slate-950 transition-colors shadow-xs"
                    >
                      Tahan = Lihat Asli
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : 1))}
                      className={`p-1.5 rounded border transition-colors ${
                        zoomLevel > 1
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700/60 shadow-xs'
                      }`}
                      title={zoomLevel > 1 ? 'Reset Zoom (100%)' : 'Perbesar Detail (175%)'}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive Split View Area */}
                <div
                  ref={sliderContainerRef}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                  onMouseMove={handleMouseMove}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  onTouchMove={handleTouchMove}
                  className="relative h-[380px] sm:h-[480px] w-full flex items-center justify-center select-none overflow-hidden cursor-ew-resize bg-slate-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
                >
                  {/* Processing Badge */}
                  {activeItem.status === 'processing' && (
                    <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-2xl">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        Mempertajam gambar...
                      </div>
                    </div>
                  )}

                  {/* Sharpened / Processed Layer (Background) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      isHoldingOriginal
                        ? activeItem.originalUrl
                        : activeItem.processedUrl || activeItem.originalUrl
                    }
                    alt="Sharpened Preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />

                  {/* Original Layer (Clipped to Split Pos) */}
                  {!isHoldingOriginal && (
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeItem.originalUrl}
                        alt="Original View"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-150"
                        style={{ transform: `scale(${zoomLevel})` }}
                        onError={() => {
                          if (activeItem.originalFile) {
                            const fresh = URL.createObjectURL(activeItem.originalFile);
                            setItems((prev) =>
                              prev.map((it) => (it.id === activeItem.id ? { ...it, originalUrl: fresh } : it))
                            );
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Split Divider Bar */}
                  {!isHoldingOriginal && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none z-20"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 border-2 border-white text-slate-950 flex items-center justify-center shadow-lg font-bold text-xs pointer-events-auto">
                        ⬌
                      </div>
                    </div>
                  )}

                  {/* Corner Badges */}
                  <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/75 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                    Asli (Sebelum)
                  </div>
                  <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-cyan-600/90 border border-cyan-400/30 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                    Dipertajam (Sesudah)
                  </div>
                </div>

                {/* Footer Controls / Single Download */}
                <div className="p-4 bg-white dark:bg-zinc-900/95 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 dark:text-zinc-400">
                    Geser pembatas tengah untuk melihat detail perbandingan sebelum & sesudah.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(activeItem)}
                    disabled={!activeItem.processedBlob}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Download className="w-4 h-4" /> Unduh Foto Ini
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail Queue Carousel */}
            {items.length > 1 && (
              <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                  <span>Daftar Foto ({items.length})</span>
                  <span>Klik foto untuk memilih & menyetel</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
                  {items.map((item) => {
                    const isSelected = item.id === activeItem?.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`relative group shrink-0 w-24 h-24 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-cyan-500 ring-2 ring-cyan-500/40 scale-102'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-100 dark:bg-zinc-950'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.processedUrl || item.originalUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          className="absolute top-1 right-1 p-1 rounded bg-black/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {item.status === 'done' && (
                          <div className="absolute bottom-1 right-1 p-0.5 rounded bg-emerald-500 text-slate-950">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Settings Control Panel (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Pengaturan Penajaman</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Atur intensitas detail dan filter</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  title="Kembalikan ke pengaturan awal"
                >
                  Reset
                </button>
              </div>

              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  Pilihan Cepat (Presets)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.keys(SHARPEN_PRESETS) as Array<Exclude<SharpenPreset, 'custom'>>
                  ).map((key) => {
                    const preset = SHARPEN_PRESETS[key];
                    const isActive = settings.preset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePresetSelect(key)}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          isActive
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-500 text-cyan-800 dark:text-cyan-300 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-800/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Sliders */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-800/80">
                {/* 1. Sharpness Amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Tingkat Ketajaman (Amount)
                    </span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{settings.amount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.amount}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preset: 'custom',
                        amount: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>Halus (0%)</span>
                    <span>Seimbang (50%)</span>
                    <span>Maksimal (100%)</span>
                  </div>
                </div>

                {/* 2. Edge Radius */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">Radius Tepi (Edge Width)</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{settings.radius} px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={settings.radius}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preset: 'custom',
                        radius: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>1px (Tipis/Detail Halus)</span>
                    <span>4px (Garis Tebal)</span>
                  </div>
                </div>

                {/* 3. Noise Threshold */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      Ambang Batas Noise (Threshold)
                    </span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{settings.threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={settings.threshold}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preset: 'custom',
                        threshold: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>0 (Semua Piksel)</span>
                    <span>20 (Abaikan Bintik Halus)</span>
                  </div>
                </div>

                {/* 4. Clarity (Local Micro-Contrast) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Kejernihan (Clarity / Dehaze)
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{settings.clarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={settings.clarity}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preset: 'custom',
                        clarity: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-500 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>Netral</span>
                    <span>Meningkatkan kontras lokal</span>
                  </div>
                </div>

                {/* 5. Contrast & Brightness Tweak */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Contrast className="w-3 h-3 text-slate-400 dark:text-zinc-400" /> Kontras
                      </span>
                      <span className="font-mono text-xs">{settings.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="35"
                      step="1"
                      value={settings.contrast}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          preset: 'custom',
                          contrast: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-slate-600 dark:accent-zinc-400 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                      <span className="flex items-center gap-1">
                        <SunMedium className="w-3 h-3 text-slate-400 dark:text-zinc-400" /> Kecerahan
                      </span>
                      <span className="font-mono text-xs">{settings.brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-25"
                      max="35"
                      step="1"
                      value={settings.brightness}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          preset: 'custom',
                          brightness: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-slate-600 dark:accent-zinc-400 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Output Format Settings */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">Format Unduhan</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'original', label: 'Asli' },
                    { id: 'image/png', label: 'PNG' },
                    { id: 'image/jpeg', label: 'JPG' },
                    { id: 'image/webp', label: 'WebP' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, format: fmt.id as SharpenSettings['format'] }))
                      }
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        settings.format === fmt.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-950/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-2.5">
                <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 dark:text-zinc-200">Privasi Terjaga:</strong> Seluruh filter penajaman dihitung di kartu grafis / prosesor browser perangkat Anda. Foto tidak pernah diunggah ke internet.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
