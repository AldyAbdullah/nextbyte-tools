'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Check,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import {
  BgMode,
  RemovalStatus,
  ProcessProgress,
  ProcessedImageResult,
} from '@/types/backgroundRemover';
import {
  getImageDimensions,
  removeImageBackground,
  compositeImageWithBackground,
} from '@/lib/backgroundRemovalHelper';
import { BeforeAfterSlider } from './BeforeAfterSlider';

// Preset Colors
const COLOR_PRESETS = [
  { name: 'Putih Bersih', color: '#ffffff', border: true },
  { name: 'Hitam Pekat', color: '#000000' },
  { name: 'Abu Studio', color: '#f1f5f9', border: true },
  { name: 'Biru Pasfoto', color: '#0284c7' },
  { name: 'Merah KTP/Ijazah', color: '#dc2626' },
  { name: 'Kuning Toko', color: '#facc15' },
  { name: 'Hijau Tosca', color: '#10b981' },
];

// Sample images for 1-click testing
const SAMPLE_PORTRAIT_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
const SAMPLE_PRODUCT_URL =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

export function BackgroundRemoverStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // Studio states
  const [status, setStatus] = useState<RemovalStatus>('idle');
  const [progress, setProgress] = useState<ProcessProgress>({ stage: '', percent: 0 });
  const [result, setResult] = useState<ProcessedImageResult | null>(null);

  // Background replacement controls
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [customBgImageUrl, setCustomBgImageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Handle uploaded file
  const handleProcessFile = async (file: File) => {
    // Validate format
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format tidak didukung. Harap unggah gambar PNG, JPG, JPEG, atau WebP.', 'error');
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showToast('Ukuran berkas terlalu besar. Batas maksimal adalah 25 MB.', 'error');
      return;
    }

    setStatus('processing');
    setProgress({ stage: 'Menganalisis gambar...', percent: 5 });

    const originalUrl = URL.createObjectURL(file);

    try {
      const { width, height } = await getImageDimensions(file);

      const transparentBlob = await removeImageBackground(file, (p) => {
        setProgress(p);
      });

      const transparentUrl = URL.createObjectURL(transparentBlob);

      setResult({
        originalFile: file,
        originalUrl,
        transparentBlob,
        transparentUrl,
        width,
        height,
      });

      setStatus('done');
      showToast('Latar belakang berhasil dihapus secara cerdas!', 'success');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Gagal menghapus background. Pastikan koneksi internet aktif untuk inisialisasi model.';
      showToast(errorMsg, 'error');
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Handle load sample image via fetch
  const handleLoadSample = async (sampleUrl: string, sampleName: string) => {
    setStatus('processing');
    setProgress({ stage: 'Memuat gambar sampel...', percent: 5 });
    try {
      const resp = await fetch(sampleUrl);
      const blob = await resp.blob();
      const file = new File([blob], sampleName, { type: 'image/jpeg' });
      await handleProcessFile(file);
    } catch (e) {
      console.error(e);
      setStatus('error');
      showToast('Gagal memuat gambar sampel.', 'error');
    }
  };

  // Handle Custom Background Image Upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (customBgImageUrl) {
      URL.revokeObjectURL(customBgImageUrl);
    }

    const url = URL.createObjectURL(file);
    setCustomBgImageUrl(url);
    setBgMode('image');
    showToast('Gambar latar belakang berhasil diterapkan!', 'success');
  };

  // Handle Download Final Composite or Transparent PNG
  const handleDownload = async () => {
    if (!result) return;

    setIsExporting(true);
    try {
      let finalBlob = result.transparentBlob;

      if (bgMode === 'color') {
        finalBlob = await compositeImageWithBackground(result.transparentBlob, {
          mode: 'color',
          color: selectedColor,
          width: result.width,
          height: result.height,
        });
      } else if (bgMode === 'image' && customBgImageUrl) {
        finalBlob = await compositeImageWithBackground(result.transparentBlob, {
          mode: 'image',
          bgImageUrl: customBgImageUrl,
          width: result.width,
          height: result.height,
        });
      }

      // Download
      const originalBase = result.originalFile.name.replace(/\.[^/.]+$/, '');
      const downloadName =
        bgMode === 'transparent'
          ? `${originalBase}_transparent.png`
          : `${originalBase}_new_bg.png`;

      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`Gambar "${downloadName}" berhasil diunduh!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor gambar.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset Studio
  const handleReset = () => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.transparentUrl);
    }
    if (customBgImageUrl) {
      URL.revokeObjectURL(customBgImageUrl);
    }
    setResult(null);
    setStatus('idle');
    setBgMode('transparent');
    setCustomBgImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (bgImageInputRef.current) bgImageInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Upload & Dropzone Area (Shown when idle or error) */}
      {!result && status !== 'processing' && (
        <div className="relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-8 sm:p-12 text-center transition-all hover:border-blue-500/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            id="bg-remover-upload"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Unggah Foto atau Gambar Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Mendukung format PNG, JPG, JPEG, dan WebP hingga 25 MB.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Pilih Gambar
              </button>
            </div>

            {/* Quick Sample Buttons */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Atau coba dengan foto contoh:</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleLoadSample(SAMPLE_PORTRAIT_URL, 'model_portrait.jpg')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Foto Potret (Rambut Kompleks)
                </button>
                <button
                  onClick={() => handleLoadSample(SAMPLE_PRODUCT_URL, 'produk_sepatu.jpg')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Foto Produk (Sepatu)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress State */}
      {status === 'processing' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Sedang Menghapus Background...
            </h3>
            <p className="text-xs text-slate-500 font-mono">{progress.stage}</p>
            {progress.details && (
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold border border-blue-200 dark:border-blue-900">
                {progress.details}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>{progress.details ? 'Mengunduh bobot AI...' : 'Proses WebAssembly Lokal'}</span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            *Pemrosesan pertama memerlukan unduhan model ISNet neural network. Proses selanjutnya akan jauh lebih instan.
          </div>
        </div>
      )}

      {/* Result Studio Area */}
      {result && status === 'done' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visualizer (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <BeforeAfterSlider
              originalUrl={result.originalUrl}
              resultUrl={result.transparentUrl}
              bgColor={bgMode === 'color' ? selectedColor : undefined}
              bgImageUrl={bgMode === 'image' && customBgImageUrl ? customBgImageUrl : undefined}
              isTransparent={bgMode === 'transparent'}
            />

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Dimensi Asli: <strong>{result.width} x {result.height} px</strong>
              </span>
              <span>
                Nama File: <strong>{result.originalFile.name}</strong>
              </span>
            </div>
          </div>

          {/* Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Background Customizer Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pengaturan Latar Belakang
              </h4>

              {/* Mode Buttons */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-850 text-xs font-semibold">
                <button
                  onClick={() => setBgMode('transparent')}
                  className={`py-2 px-1 rounded-lg transition-all text-center ${
                    bgMode === 'transparent'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Transparan
                </button>
                <button
                  onClick={() => setBgMode('color')}
                  className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    bgMode === 'color'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Warna
                </button>
                <button
                  onClick={() => setBgMode('image')}
                  className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    bgMode === 'image'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Gambar
                </button>
              </div>

              {/* Color Mode Options */}
              {bgMode === 'color' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Warna Latar:
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => setSelectedColor(preset.color)}
                        title={preset.name}
                        className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                          preset.border ? 'border border-slate-300 dark:border-slate-700' : ''
                        } ${selectedColor === preset.color ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'}`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {selectedColor === preset.color && (
                          <Check
                            className={`w-4 h-4 ${
                              preset.color === '#ffffff' || preset.color === '#f1f5f9'
                                ? 'text-slate-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}

                    {/* Custom Color Input */}
                    <label
                      title="Warna Kustom"
                      className="w-8 h-8 rounded-full border border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative overflow-hidden"
                    >
                      <Plus className="w-4 h-4 text-slate-500" />
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Image Mode Options */}
              {bgMode === 'image' && (
                <div className="space-y-3 pt-2">
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBgImageUpload}
                    className="hidden"
                  />

                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gambar Latar Belakang:
                  </div>

                  <button
                    onClick={() => bgImageInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-500" />
                    {customBgImageUrl ? 'Ganti Gambar Latar' : 'Unggah Gambar Latar Sendiri'}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={isExporting}
                  onClick={handleDownload}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengekspor Gambar...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {bgMode === 'transparent'
                        ? 'Download PNG Transparan'
                        : 'Download Gambar Hasil'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ganti Gambar Lain
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                100% diproses langsung di peramban Anda
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
