'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Settings2,
  Download,
  RefreshCw,
  Sparkles,
  BookOpen,
  LayoutTemplate,
  Layers,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  Check,
  Compass,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import {
  DocxInspectionResult,
  PageNumberJobConfig,
  PresetType,
  PageNumberPosition,
  PageNumberAlignment,
  PageNumberFormat,
  PageNumberTextStyle,
} from '@/types/pageNumber';
import {
  inspectDocxForPageNumbering,
  applyPageNumberingToDocx,
} from '@/lib/pageNumberHelper';
import { createSamplePageNumberDocx } from '@/lib/samplePageNumberDocx';

export function PageNumberStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploaded file and inspection state
  const [docInfo, setDocInfo] = useState<DocxInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<PageNumberJobConfig>({
    preset: 'academic',
    position: 'footer',
    alignment: 'center',
    format: 'decimal',
    textStyle: 'number-only',
    startNumber: 1,
    differentFirstPage: true,
    academic: {
      coverNoNumber: true,
      frontMatterFormat: 'lowerRoman',
      frontMatterPosition: 'footer',
      frontMatterAlignment: 'center',
      bodyFormat: 'decimal',
      bodyPosition: 'footer',
      bodyAlignment: 'right',
      bodyStartNumber: 1,
      insertSectionBreakIfMissing: true,
      splitPageNumber: 4,
      splitMode: 'auto',
      selectedHeading: '',
    },
    customSections: [],
  });

  // Handle DOCX upload & inspection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      showToast('Format tidak didukung. Harap unggah file Word berekstensi .docx', 'error');
      return;
    }

    setIsInspecting(true);
    try {
      const inspected = await inspectDocxForPageNumbering(file);
      setDocInfo(inspected);
      showToast(
        `Berhasil memuat "${file.name}"! Terdeteksi ${inspected.totalSections} section dan ${inspected.detectedParagraphs} paragraf.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca dokumen Word. Pastikan file DOCX tidak terenkripsi.', 'error');
    } finally {
      setIsInspecting(false);
    }
  };

  // Download Sample Document
  const handleDownloadSample = async () => {
    try {
      const blob = await createSamplePageNumberDocx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contoh-dokumen-skripsi-nextbyte.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Contoh dokumen multi-halaman (.docx) berhasil diunduh.', 'success');
    } catch {
      showToast('Gagal mengunduh contoh dokumen.', 'error');
    }
  };

  // Process and Download Result
  const handleApplyPageNumbers = async () => {
    if (!docInfo) {
      showToast('Harap unggah file dokumen Word (.docx) terlebih dahulu.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const modifiedBlob = await applyPageNumberingToDocx(docInfo.file, config);

      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      const originalName = docInfo.fileName.replace(/\.docx$/i, '');
      const downloadName = `${originalName}_Numbered.docx`;

      const url = URL.createObjectURL(modifiedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Nomor halaman berhasil ditambahkan! Dokumen "${downloadName}" tersimpan.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat memproses penomoran halaman.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset workspace
  const handleReset = () => {
    if (confirm('Reset workspace penomoran halaman?')) {
      setDocInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Workspace direset.', 'info');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Word PAGE Fields • OpenXML ISO/IEC 29500
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Word Page Number Studio
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Atur nomor halaman dokumen Word (.docx) secara presisi dengan standar akademik skripsi, tesis,
              dan laporan: sampul tanpa nomor, halaman awal Romawi, isi angka Arab, dan otomatis buat section break.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadSample}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              title="Unduh contoh dokumen DOCX multi-halaman lengkap dengan sampul dan section"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Contoh Dokumen Skripsi (.docx)
            </button>
            {docInfo && (
              <button
                onClick={handleReset}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
                title="Ganti Dokumen"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Upload & Preset Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Upload Dropzone */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                1. Unggah Dokumen Word (.docx)
              </h2>
              {docInfo && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Siap Diberi Nomor
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!docInfo ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {isInspecting ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pilih Dokumen Word Anda
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
                  Tarik dan lepaskan file .docx di sini, atau klik tombol di bawah.
                </p>
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Pilih File Word (.docx)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {docInfo.fileName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(docInfo.fileSize / 1024).toFixed(1)} KB • {docInfo.totalSections} Bagian (Section) Terdeteksi
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Ganti File
                  </button>
                </div>

                {/* Section Structure Chips */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
                  <div className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    Analisis Struktur Dokumen:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-400 block text-[10px]">Total Section:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {docInfo.totalSections} Section {docInfo.totalSections === 1 && '(Belum dipisah)'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-400 block text-[10px]">Page Breaks:</span>
                      <span className="font-bold text-slate-900 dark:text-white">~{docInfo.detectedPageBreaks + 1} Halaman</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-400 block text-[10px]">Orientasi Landscape:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {docInfo.sections.some((s) => s.isLandscape) ? 'Ada' : 'Tidak ada'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-400 block text-[10px]">Header/Footer Asli:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {docInfo.hasExistingHeader || docInfo.hasExistingFooter ? 'Terdeteksi' : 'Belum ada'}
                      </span>
                    </div>
                  </div>

                  {docInfo.totalSections === 1 && (
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium pt-1">
                      💡 Dokumen Anda belum memiliki Section Break di Word. Fitur <strong>Otomatis Buat Section Break</strong> di bawah akan membagi halaman awal (Romawi) dan bab isi (Angka 1) secara otomatis!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Preset Selection */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                2. Pilih Skema Penomoran Halaman
              </h2>
              <p className="text-xs text-slate-500">
                Gunakan preset akademik siap pakai untuk skripsi/laporan, atau atur nomor standar sesuai selera.
              </p>
            </div>

            {/* Preset Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'academic',
                  title: 'Skripsi & Akademik',
                  badge: 'Paling Populer',
                  desc: 'Sampul tanpa nomor, Halaman awal Romawi (i, ii, iii), Bab isi angka Arab (1, 2, 3).',
                  icon: BookOpen,
                },
                {
                  id: 'standard',
                  title: 'Standar Berurutan',
                  badge: 'Simpel',
                  desc: 'Nomor halaman berurutan 1, 2, 3 di seluruh dokumen dengan opsi Different First Page.',
                  icon: LayoutTemplate,
                },
                {
                  id: 'custom',
                  title: 'Kustom Format',
                  badge: 'Fleksibel',
                  desc: 'Atur bebas format angka (Romawi/Arab), awalan, teks halaman, dan penempatan.',
                  icon: Layers,
                },
              ].map((p) => {
                const isSelected = config.preset === p.id;
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() => setConfig((prev) => ({ ...prev, preset: p.id as PresetType }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span>{isSelected ? 'Terpilih' : 'Pilih Preset'}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* PRESET 1: AKADEMIK OPTIONS                                                */}
            {/* ========================================================================= */}
            {config.preset === 'academic' && (
              <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Pengaturan Skripsi &amp; Karya Ilmiah:
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sesuai pedoman baku penulisan tugas akhir perguruan tinggi di Indonesia.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Option 1: Cover without number */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.academic.coverNoNumber}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          academic: { ...prev.academic, coverNoNumber: e.target.checked },
                        }))
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Hilangkan Nomor Halaman pada Sampul (Cover Page)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Mengaktifkan Different First Page (w:titlePg) dan footer kosong pada halaman sampul.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Front matter & Body settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Bagian Awal (Kata Pengantar, Daftar Isi):
                      </span>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Format Nomor:</span>
                          <span className="font-semibold text-blue-600 font-mono">Romawi (i, ii, iii)</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Posisi:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Footer Bawah Tengah</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Bab Isi (Bab I s.d. Selesai):
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Format Nomor:</span>
                          <span className="font-semibold text-emerald-600 font-mono">Arab (1, 2, 3)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Posisi Isi:</span>
                          <select
                            value={`${config.academic.bodyPosition}-${config.academic.bodyAlignment}`}
                            onChange={(e) => {
                              const [pos, align] = e.target.value.split('-') as [PageNumberPosition, 'right' | 'center'];
                              setConfig((prev) => ({
                                ...prev,
                                academic: {
                                  ...prev.academic,
                                  bodyPosition: pos,
                                  bodyAlignment: align,
                                },
                              }));
                            }}
                            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-900 dark:text-white"
                          >
                            <option value="footer-right">Footer Kanan (Bawah Kanan)</option>
                            <option value="footer-center">Footer Tengah (Bawah Tengah)</option>
                            <option value="header-right">Header Kanan (Atas Kanan)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Section split assistance (Auto-add sections) */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.academic.insertSectionBreakIfMissing}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            academic: {
                              ...prev.academic,
                              insertSectionBreakIfMissing: e.target.checked,
                            },
                          }))
                        }
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Otomatis Buat Section Break (Jika Dokumen Belum Ada Section)
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-relaxed">
                          Menyisipkan Section Break (Next Page) otomatis sehingga halaman awal menjadi Romawi (i, ii, iii) dan Bab isi menjadi angka Arab (1, 2, 3) tanpa perlu mengedit section manual di Microsoft Word.
                        </span>
                      </div>
                    </label>

                    {/* Heading Selector for Split Point */}
                    {config.academic.insertSectionBreakIfMissing && (
                      <div className="pl-7 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Awal Mulai Bab Isi (Angka 1):
                          </span>
                          {docInfo?.totalSections && docInfo.totalSections > 1 ? (
                            <span className="text-emerald-600 font-semibold text-[10px]">
                              Dokumen sudah memiliki {docInfo.totalSections} section
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold text-[10px]">
                              Mode Sisip Section Otomatis
                            </span>
                          )}
                        </div>

                        <select
                          value={config.academic.selectedHeading || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              academic: {
                                ...prev.academic,
                                selectedHeading: e.target.value,
                              },
                            }))
                          }
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="">✨ Otomatis Deteksi (BAB I / BAB 1 / PENDAHULUAN)</option>
                          {docInfo?.previewHeadings &&
                            docInfo.previewHeadings.map((headingText, i) => (
                              <option key={i} value={headingText}>
                                Judul Dokumen: {headingText}
                              </option>
                            ))}
                        </select>

                        <p className="text-[10px] text-slate-400 leading-snug">
                          {config.academic.selectedHeading
                            ? `Section break akan disisipkan tepat sebelum "${config.academic.selectedHeading}".`
                            : 'Sistem akan memindai judul "BAB I" / "BAB 1" / "PENDAHULUAN" untuk membagi section secara otomatis.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PRESET 2 & 3: STANDARD & CUSTOM OPTIONS                                   */}
            {/* ========================================================================= */}
            {(config.preset === 'standard' || config.preset === 'custom') && (
              <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Pengaturan Penomoran:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Posisi: Header vs Footer */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Posisi Halaman
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, position: 'footer' }))}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          config.position === 'footer'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Bawah (Footer)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, position: 'header' }))}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          config.position === 'header'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Atas (Header)
                      </button>
                    </div>
                  </div>

                  {/* Perataan: Left, Center, Right */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Perataan (Alignment)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'left', label: 'Kiri', icon: AlignLeft },
                        { id: 'center', label: 'Tengah', icon: AlignCenter },
                        { id: 'right', label: 'Kanan', icon: AlignRight },
                      ].map((al) => {
                        const isAl = config.alignment === al.id;
                        const Icon = al.icon;
                        return (
                          <button
                            key={al.id}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, alignment: al.id as PageNumberAlignment }))}
                            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                              isAl
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {al.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Format Nomor */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Format Angka
                    </label>
                    <select
                      value={config.format}
                      onChange={(e) => setConfig((p) => ({ ...p, format: e.target.value as PageNumberFormat }))}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="decimal">1, 2, 3 (Angka Arab)</option>
                      <option value="lowerRoman">i, ii, iii (Romawi Kecil)</option>
                      <option value="upperRoman">I, II, III (Romawi Besar)</option>
                    </select>
                  </div>

                  {/* Gaya Teks */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Tampilan Teks Halaman
                    </label>
                    <select
                      value={config.textStyle}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, textStyle: e.target.value as PageNumberTextStyle }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="number-only">Angka Saja (1)</option>
                      <option value="page-x">Halaman X (Halaman 1)</option>
                      <option value="x-of-y">X dari Y (1 dari 10)</option>
                      <option value="x-slash-y">X / Y (1 / 10)</option>
                    </select>
                  </div>

                  {/* Nomor Awal */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Nomor Awal (Start Number)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.startNumber}
                      onChange={(e) => setConfig((p) => ({ ...p, startNumber: parseInt(e.target.value) || 1 }))}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Different First Page checkbox */}
                <label className="flex items-center gap-2.5 pt-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.differentFirstPage}
                    onChange={(e) => setConfig((p) => ({ ...p, differentFirstPage: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Hilangkan nomor halaman pada sampul / halaman pertama (Different First Page)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Live Interactive Mockup & Execute */}
        <div className="space-y-6">
          {/* Visual Page Mockup Box */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Simulasi Pratinjau Halaman
            </h3>

            {/* Document Pages Mini-Mockup */}
            <div className="space-y-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
              {/* Page 1 Mockup: Cover */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Halaman 1: Sampul (Cover)</span>
                  <span className="text-amber-500 font-semibold">
                    {config.preset === 'academic' || config.differentFirstPage
                      ? 'Tanpa Nomor'
                      : 'Bernomor'}
                  </span>
                </div>
                <div className="space-y-1 py-1">
                  <div className="w-2/3 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-1/2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                {!(config.preset === 'academic' || config.differentFirstPage) && (
                  <div className="text-right text-[9px] font-mono font-bold text-blue-600">1</div>
                )}
              </div>

              {/* Page 2 Mockup: Front Matter */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Halaman 2: Kata Pengantar</span>
                  <span className="text-blue-500 font-semibold font-mono">
                    {config.preset === 'academic' ? 'ii' : '2'}
                  </span>
                </div>
                <div className="space-y-1 py-1">
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-5/6 h-1.5 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div
                  className={`text-[9px] font-mono font-bold text-blue-600 ${
                    config.preset === 'academic'
                      ? 'text-center'
                      : config.alignment === 'center'
                      ? 'text-center'
                      : config.alignment === 'left'
                      ? 'text-left'
                      : 'text-right'
                  }`}
                >
                  {config.preset === 'academic' ? 'ii' : '2'}
                </div>
              </div>

              {/* Page 3 Mockup: Body */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Halaman 3: Bab I Isi</span>
                  <span className="text-emerald-500 font-semibold font-mono">
                    {config.preset === 'academic' ? '1' : '3'}
                  </span>
                </div>
                <div className="space-y-1 py-1">
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="w-4/5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div
                  className={`text-[9px] font-mono font-bold text-emerald-600 ${
                    config.preset === 'academic'
                      ? config.academic.bodyAlignment === 'center'
                        ? 'text-center'
                        : 'text-right'
                      : config.alignment === 'center'
                      ? 'text-center'
                      : config.alignment === 'left'
                      ? 'text-left'
                      : 'text-right'
                  }`}
                >
                  {config.preset === 'academic' ? '1' : '3'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Field Dinamis Microsoft Word:
              </span>
              <p>
                Nomor halaman dihasilkan dengan field <code>PAGE</code> standar OpenXML sehingga otomatis menyesuaikan jika Anda menambah atau mengedit paragraf di Word.
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <button
              disabled={!docInfo || isProcessing}
              onClick={handleApplyPageNumbers}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                !docInfo || isProcessing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses Dokumen...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Terapkan &amp; Download Dokumen (.docx)
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% diproses langsung di peramban
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
