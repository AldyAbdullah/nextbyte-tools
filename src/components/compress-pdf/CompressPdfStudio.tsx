'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Minimize2,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import { getPdfJs } from '@/lib/pdfClientLoader';
import {
  COMPRESS_PRESETS,
  CompressPreset,
  formatFileSize,
  compressPdfDocument,
} from '@/lib/pdfCompressHelper';

export function CompressPdfStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<CompressPreset['id']>('recommended');

  // Custom Settings
  const [customScale, setCustomScale] = useState<number>(1.3);
  const [customQuality, setCustomQuality] = useState<number>(70);

  // Compression state
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Result state
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);

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
      setCompressedBytes(null);
      setCompressedBlobUrl(null);
      setCompressedSize(0);

      showToast(`Dokumen "${file.name}" berhasil dimuat (${doc.numPages} halaman).`, 'success');
    } catch (err) {
      console.error('Error loading PDF:', err);
      showToast('Gagal membaca file PDF.', 'error');
    }
  };

  // Run Compression
  const handleRunCompress = async () => {
    if (!pdfBytes || !pdfFile) return;

    let scale = 1.3;
    let quality = 0.72;

    if (selectedPreset === 'custom') {
      scale = customScale;
      quality = customQuality / 100;
    } else {
      const found = COMPRESS_PRESETS.find((p) => p.id === selectedPreset);
      if (found) {
        scale = found.scale;
        quality = found.quality;
      }
    }

    setIsCompressing(true);
    setProgressPercent(0);
    setProgressMsg('Memulai kompresi dokumen...');

    try {
      const resultBytes = await compressPdfDocument(
        pdfBytes,
        scale,
        quality,
        (current, total, msg) => {
          const pct = Math.round((current / total) * 100);
          setProgressPercent(pct);
          setProgressMsg(msg);
        }
      );

      const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setCompressedBytes(resultBytes);
      setCompressedBlobUrl(url);
      setCompressedSize(resultBytes.byteLength);

      confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      showToast('Kompresi PDF selesai dengan sukses!', 'success');
    } catch (err) {
      console.error('Compression error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengompres PDF';
      showToast(msg, 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  // Download Compressed File
  const handleDownload = () => {
    if (!compressedBlobUrl || !pdfFile) return;
    const cleanName = pdfFile.name.replace(/\.pdf$/i, '');
    const a = document.createElement('a');
    a.href = compressedBlobUrl;
    a.download = `${cleanName}_terkompres.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const calculateSavingsPercent = () => {
    if (!pdfFile || compressedSize === 0) return 0;
    const diff = pdfFile.size - compressedSize;
    if (diff <= 0) return 0;
    return Math.round((diff / pdfFile.size) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <Minimize2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Pilih atau Tarik File PDF ke Sini
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Kecilkan ukuran file PDF agar lolos syarat upload berkas CPNS, BUMN, instansi, atau email. 100% aman dan diproses langsung di perangkat Anda.
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
        /* Active State: Compression Configuration */
        <div className="space-y-6">
          {/* File Overview Card */}
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
                  {pageCount} Halaman • Ukuran Asli:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {formatFileSize(pdfFile.size)}
                  </strong>
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

          {/* Preset Selector Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Pilih Tingkat Kompresi:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COMPRESS_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 shadow-sm ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {preset.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        {preset.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Target Ukuran:</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {preset.targetSizeHint}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Mode Toggle */}
            <div
              onClick={() => setSelectedPreset(selectedPreset === 'custom' ? 'recommended' : 'custom')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedPreset === 'custom'
                  ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20'
                  : 'border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mode Pengaturan Kustom (Manual Slider)
                  </span>
                </div>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">
                  {selectedPreset === 'custom' ? 'Aktif' : 'Atur Sendiri'}
                </span>
              </div>

              {selectedPreset === 'custom' && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600 dark:text-slate-300">
                      <span>Resolusi Skala (DPI):</span>
                      <span className="font-bold text-primary-600">{customScale}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.2"
                      step="0.1"
                      value={customScale}
                      onChange={(e) => setCustomScale(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400">
                      Semakin kecil, ukuran file semakin ramping.
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600 dark:text-slate-300">
                      <span>Kualitas Gambar JPEG:</span>
                      <span className="font-bold text-primary-600">{customQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="95"
                      step="5"
                      value={customQuality}
                      onChange={(e) => setCustomQuality(parseInt(e.target.value, 10))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400">
                      Nilai 60-75% direkomendasikan untuk dokumen teks.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compression Action Button / Progress */}
          {!compressedBytes ? (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {isCompressing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />
                      {progressMsg}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRunCompress}
                  className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Mulai Kompres Dokumen PDF Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            /* Result Card */
            <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Kompresi Berhasil!
                  </span>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                    File Anda Siap Diunduh
                  </h3>
                </div>

                {calculateSavingsPercent() > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md">
                    <TrendingDown className="w-4 h-4" />
                    <span>Lebih Hemat {calculateSavingsPercent()}%</span>
                  </div>
                )}
              </div>

              {/* Before vs After comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Ukuran Awal:
                  </span>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                    {formatFileSize(pdfFile.size)}
                  </p>
                </div>
                <div className="space-y-1 sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    Ukuran Setelah Kompresi:
                  </span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    {formatFileSize(compressedSize)}
                    <span className="text-xs font-medium text-slate-400">
                      (-{formatFileSize(Math.max(0, pdfFile.size - compressedSize))})
                    </span>
                  </p>
                </div>
              </div>

              {/* Download & Retry Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File PDF Terkompres ({formatFileSize(compressedSize)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompressedBytes(null)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kompres Ulang</span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Privasi Terjamin:</strong> Seluruh proses kompresi terjadi 100% di browser Anda. Dokumen sensitif seperti ijazah, KTP, dan slip gaji tidak pernah diunggah ke server.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
