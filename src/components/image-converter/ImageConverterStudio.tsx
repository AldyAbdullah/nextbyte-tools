'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Archive,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { useToast } from '@/components/common/Toast';

export type TargetFormat = 'png' | 'jpeg' | 'webp' | 'ico' | 'bmp';

interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
  convertedBlob?: Blob;
  convertedDataUrl?: string;
  convertedSize?: number;
  status: 'idle' | 'converting' | 'done' | 'error';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ImageConverterStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('webp');
  const [quality, setQuality] = useState<number>(85); // 0-100%
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  const handleFilesAdded = (fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|svg|ico)$/i.test(f.name)
    );

    if (valid.length === 0) {
      showToast('Pilih file gambar yang valid.', 'error');
      return;
    }

    const newItems: ImageFileItem[] = valid.map((file) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));

    setItems((prev) => [...prev, ...newItems]);
    showToast(`Berhasil menambahkan ${newItems.length} gambar.`, 'success');
  };

  const convertSingleImage = async (
    item: ImageFileItem,
    fmt: TargetFormat,
    q: number
  ): Promise<{ blob: Blob; dataUrl: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');

        if (fmt === 'ico') {
          // Standard favicon square (max 64x64)
          canvas.width = Math.min(64, img.naturalWidth);
          canvas.height = Math.min(64, img.naturalHeight);
        } else {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi canvas context.'));
          return;
        }

        // Fill white background for JPEG/BMP if source has transparency
        if (fmt === 'jpeg' || fmt === 'bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let mimeType = 'image/png';
        if (fmt === 'jpeg') mimeType = 'image/jpeg';
        else if (fmt === 'webp') mimeType = 'image/webp';
        else if (fmt === 'ico') mimeType = 'image/x-icon';
        else if (fmt === 'bmp') mimeType = 'image/bmp';

        const qualityParam = ['jpeg', 'webp'].includes(fmt) ? q / 100 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengekspor blob gambar.'));
              return;
            }
            const dataUrl = canvas.toDataURL(mimeType, qualityParam);
            resolve({ blob, dataUrl, size: blob.size });
          },
          mimeType,
          qualityParam
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar.'));
      img.src = item.previewUrl;
    });
  };

  // Convert all items
  const handleConvertAll = async () => {
    if (items.length === 0) return;

    setIsConvertingAll(true);
    showToast(`Mengonversi ${items.length} gambar ke format ${targetFormat.toUpperCase()}...`, 'info');

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'converting';
      setItems([...updated]);

      try {
        const res = await convertSingleImage(updated[i], targetFormat, quality);
        updated[i].convertedBlob = res.blob;
        updated[i].convertedDataUrl = res.dataUrl;
        updated[i].convertedSize = res.size;
        updated[i].status = 'done';
      } catch (err) {
        console.error(err);
        updated[i].status = 'error';
      }
      setItems([...updated]);
    }

    setIsConvertingAll(false);
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
    showToast('Seluruh gambar selesai dikonversi!', 'success');
  };

  // Download single item
  const handleDownloadSingle = (item: ImageFileItem) => {
    if (!item.convertedDataUrl) return;
    const base = item.file.name.replace(/\.[^.]+$/, '');
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    const a = document.createElement('a');
    a.href = item.convertedDataUrl;
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.status === 'done' && it.convertedBlob);
    if (doneItems.length === 0) return;

    showToast('Mengemas seluruh file ke dalam ZIP...', 'info');
    const zip = new JSZip();
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;

    for (const it of doneItems) {
      const base = it.file.name.replace(/\.[^.]+$/, '');
      zip.file(`${base}.${ext}`, it.convertedBlob!);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koleksi_gambar_${targetFormat}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File ZIP siap diunduh!', 'success');
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
          e.target.value = '';
        }}
        accept="image/*"
        multiple
        className="hidden"
      />

      {items.length === 0 ? (
        /* Empty State */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-12 text-center cursor-pointer transition-all hover:shadow-xl hover:scale-[1.005] group"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Pilih atau Tarik File Gambar ke Sini
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Ubah format gambar PNG, JPG, WebP, ICO, atau BMP secara instan tanpa batasan ukuran file. 100% diproses langsung di browser Anda.
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
          {/* Header Controls */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {items.length} Gambar Dimuat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih format tujuan di bawah lalu klik tombol konversi.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 hover:bg-primary-100 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tambah Lagi</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* Format Settings Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ubah Semua Gambar Menjadi Format:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'webp', label: 'WebP', desc: 'Sangat Ringan untuk Web' },
                  { id: 'png', label: 'PNG', desc: 'Transparan & Tajam' },
                  { id: 'jpeg', label: 'JPG', desc: 'Kompatibilitas Standar' },
                  { id: 'ico', label: 'ICO', desc: 'Favicon Website' },
                  { id: 'bmp', label: 'BMP', desc: 'Bitmap Windows' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id as TargetFormat)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetFormat === fmt.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <span className="font-black text-sm block">{fmt.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{fmt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider for JPEG / WebP */}
            {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kualitas Gambar:
                  </span>
                  <span className="font-mono text-xs font-black text-primary-600">{quality}%</span>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Button & ZIP trigger */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleConvertAll}
              disabled={isConvertingAll}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isConvertingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengonversi Gambar...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mulai Konversi Seluruh Gambar ke {targetFormat.toUpperCase()}</span>
                </>
              )}
            </button>

            {items.some((it) => it.status === 'done') && (
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>Unduh Semua (.ZIP)</span>
              </button>
            )}
          </div>

          {/* Image Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.convertedDataUrl || item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Asli: {formatFileSize(item.file.size)}
                      {item.convertedSize && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                          → {formatFileSize(item.convertedSize)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.status === 'done' ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item)}
                      title="Unduh file"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  ) : item.status === 'converting' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary-500 m-2" />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Cepat & Privat:</strong> Gambar diproses langsung menggunakan mesin kanvas browser Anda tanpa pernah diunggah ke internet.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
