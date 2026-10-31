'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Settings2,
  Download,
  RefreshCw,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Table as TableIcon,
  ListFilter,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import {
  DocxCaptionInspectionResult,
  CaptionJobConfig,
  CaptionNumberingMode,
  CaptionAlignment,
  ListOfPosition,
} from '@/types/caption';
import {
  inspectDocxForCaptions,
  applyCaptionsToDocx,
} from '@/lib/captionHelper';
import { createSampleCaptionDocx } from '@/lib/sampleCaptionDocx';

export function CaptionStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspection & loading states
  const [docInfo, setDocInfo] = useState<DocxCaptionInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active view tab: 'images' | 'tables' | 'settings' | 'lists'
  const [activeTab, setActiveTab] = useState<'images' | 'tables' | 'settings' | 'lists'>('images');

  // Configuration state
  const [config, setConfig] = useState<CaptionJobConfig>({
    imagePrefix: 'Gambar',
    tablePrefix: 'Tabel',
    separator: '.',
    numberingMode: 'chapter',
    imagePosition: 'below',
    tablePosition: 'above',
    alignment: 'center',
    replaceExistingCaptions: true,
    includeListOfFigures: true,
    listOfFiguresTitle: 'DAFTAR GAMBAR',
    includeListOfTables: true,
    listOfTablesTitle: 'DAFTAR TABEL',
    listOfPosition: 'before-chapters',
    items: [],
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      showToast('Format tidak didukung. Harap unggah file Word berekstensi .docx', 'error');
      return;
    }

    setIsInspecting(true);
    try {
      const inspected = await inspectDocxForCaptions(file);
      setDocInfo(inspected);
      setConfig((prev) => ({
        ...prev,
        items: inspected.items,
      }));

      // Switch to images or tables tab if available
      if (inspected.totalImages > 0) {
        setActiveTab('images');
      } else if (inspected.totalTables > 0) {
        setActiveTab('tables');
      }

      showToast(
        `Berhasil membaca "${file.name}"! Ditemukan ${inspected.totalImages} gambar, ${inspected.totalTables} tabel, dan ${inspected.totalHeadings} bab.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca dokumen Word. Pastikan file DOCX tidak terenkripsi.', 'error');
    } finally {
      setIsInspecting(false);
    }
  };

  // Handle Load Sample Document
  const handleLoadSample = async () => {
    setIsInspecting(true);
    try {
      const sampleBlob = await createSampleCaptionDocx();
      const sampleFile = new File([sampleBlob], 'Proposal_Skripsi_Sample.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const inspected = await inspectDocxForCaptions(sampleFile);
      setDocInfo(inspected);
      setConfig((prev) => ({
        ...prev,
        items: inspected.items,
      }));
      setActiveTab('images');

      showToast(
        'Contoh dokumen skripsi berhasil dimuat! Ditemukan 3 gambar dan 2 tabel terdistribusi di BAB I & BAB II.',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat dokumen contoh.', 'error');
    } finally {
      setIsInspecting(false);
    }
  };

  // Toggle single item enabled
  const handleToggleItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it)),
    }));
  };

  // Update item custom title
  const handleUpdateTitle = (id: string, newTitle: string) => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, customTitle: newTitle } : it)),
    }));
  };

  // Update item position
  const handleUpdatePosition = (id: string, position: 'above' | 'below') => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, position } : it)),
    }));
  };

  // Select All / Deselect All for a kind
  const handleToggleAllKind = (kind: 'image' | 'table', enable: boolean) => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.kind === kind ? { ...it, enabled: enable } : it)),
    }));
  };

  // Process and Download DOCX
  const handleApplyCaptions = async () => {
    if (!docInfo) return;

    setIsProcessing(true);
    try {
      const outputBlob = await applyCaptionsToDocx(docInfo.file, config);

      // Trigger browser download
      const originalName = docInfo.fileName.replace(/\.docx$/i, '');
      const downloadName = `${originalName}_captioned.docx`;

      const downloadUrl = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(`Sukses! Dokumen "${downloadName}" berhasil diunduh.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan caption ke dokumen. Periksa konsol untuk detailnya.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const imageItems = config.items.filter((it) => it.kind === 'image');
  const tableItems = config.items.filter((it) => it.kind === 'table');
  const enabledImagesCount = imageItems.filter((it) => it.enabled).length;
  const enabledTablesCount = tableItems.filter((it) => it.enabled).length;

  return (
    <div className="space-y-8">
      {/* Upload & Dropzone Section */}
      <div className="relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-6 sm:p-10 text-center transition-all hover:border-blue-500/50">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileUpload}
          className="hidden"
          id="docx-caption-file"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            {isInspecting ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {docInfo ? docInfo.fileName : 'Unggah Dokumen Word (.docx)'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {docInfo
                ? `${(docInfo.fileSize / 1024).toFixed(1)} KB — Terdeteksi ${docInfo.totalImages} gambar, ${docInfo.totalTables} tabel, dan ${docInfo.totalHeadings} bab`
                : 'Seret dan lepas file DOCX di sini, atau klik untuk memilih file dari komputer Anda'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isInspecting || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              {docInfo ? 'Ganti File DOCX' : 'Pilih File Word'}
            </button>

            <button
              onClick={handleLoadSample}
              disabled={isInspecting || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Coba Dokumen Contoh Skripsi
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area (Rendered once document is loaded) */}
      {docInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Center Configuration Studio (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Overview Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {docInfo.totalImages}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Gambar Ditemukan</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {docInfo.totalTables}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Tabel Ditemukan</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {docInfo.totalHeadings}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">BAB / Heading</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('images')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'images'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Daftar Gambar ({enabledImagesCount}/{imageItems.length})
              </button>

              <button
                onClick={() => setActiveTab('tables')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'tables'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Daftar Tabel ({enabledTablesCount}/{tableItems.length})
              </button>

              <button
                onClick={() => setActiveTab('lists')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'lists'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                Daftar Gambar &amp; Tabel (TOC)
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                Pengaturan Format
              </button>
            </div>

            {/* TAB 1: Images List */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    Atur teks caption dan posisi untuk setiap gambar yang ditemukan.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAllKind('image', true)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      onClick={() => handleToggleAllKind('image', false)}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      Lewati Semua
                    </button>
                  </div>
                </div>

                {imageItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    Tidak ada gambar yang terdeteksi di dokumen ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {imageItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.enabled
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Checkbox & Thumbnail */}
                          <div className="flex items-center gap-3 shrink-0">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              {item.thumbnailDataUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.thumbnailDataUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Content & Inputs */}
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
                                {config.imagePrefix}{' '}
                                {config.numberingMode === 'chapter'
                                  ? `${item.chapterNumber}${config.separator}${item.itemNumber}`
                                  : idx + 1}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Bab: {item.chapterTitle}
                              </span>

                              {item.hasExistingCaption && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  Caption Lama: &quot;{item.existingCaption}&quot;
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={item.customTitle}
                                onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                                placeholder="Masukkan judul caption gambar..."
                                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              <select
                                value={item.position}
                                onChange={(e) =>
                                  handleUpdatePosition(item.id, e.target.value as 'above' | 'below')
                                }
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none shrink-0"
                              >
                                <option value="below">Bawah Gambar (Standar)</option>
                                <option value="above">Atas Gambar</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Tables List */}
            {activeTab === 'tables' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    Atur teks caption dan posisi untuk setiap tabel yang ditemukan.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAllKind('table', true)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      onClick={() => handleToggleAllKind('table', false)}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      Lewati Semua
                    </button>
                  </div>
                </div>

                {tableItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    Tidak ada tabel yang terdeteksi di dokumen ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tableItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.enabled
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3 shrink-0">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="w-16 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex flex-col items-center justify-center text-center p-1 shrink-0">
                              <TableIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-0.5" />
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                                {item.tableSummary?.cols || 0}x{item.tableSummary?.rows || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                {config.tablePrefix}{' '}
                                {config.numberingMode === 'chapter'
                                  ? `${item.chapterNumber}${config.separator}${item.itemNumber}`
                                  : idx + 1}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Bab: {item.chapterTitle}
                              </span>

                              {item.tableSummary?.sampleHeader && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                  (Kolom: {item.tableSummary.sampleHeader.slice(0, 40)}...)
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={item.customTitle}
                                onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                                placeholder="Masukkan judul caption tabel..."
                                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              <select
                                value={item.position}
                                onChange={(e) =>
                                  handleUpdatePosition(item.id, e.target.value as 'above' | 'below')
                                }
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none shrink-0"
                              >
                                <option value="above">Atas Tabel (Standar Skripsi)</option>
                                <option value="below">Bawah Tabel</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOC & List of Figures / Tables */}
            {activeTab === 'lists' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-blue-600" />
                    Pembuatan Daftar Gambar &amp; Daftar Tabel Otomatis
                  </h4>
                  <p className="text-xs text-slate-500">
                    Sistem akan menyisipkan halaman Daftar Gambar dan Daftar Tabel menggunakan field dinamis Word{' '}
                    <code>TOC \c</code> dan format titik-titik tab (dot leaders) rapi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Daftar Gambar Config */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeListOfFigures}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeListOfFigures: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Sertakan Halaman Daftar Gambar
                      </span>
                    </label>

                    {config.includeListOfFigures && (
                      <div className="space-y-1.5 pl-6">
                        <label className="text-[11px] font-semibold text-slate-500">Judul Halaman:</label>
                        <input
                          type="text"
                          value={config.listOfFiguresTitle}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, listOfFiguresTitle: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Daftar Tabel Config */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeListOfTables}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, includeListOfTables: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Sertakan Halaman Daftar Tabel
                      </span>
                    </label>

                    {config.includeListOfTables && (
                      <div className="space-y-1.5 pl-6">
                        <label className="text-[11px] font-semibold text-slate-500">Judul Halaman:</label>
                        <input
                          type="text"
                          value={config.listOfTablesTitle}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, listOfTablesTitle: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Posisi Penyisipan Halaman Daftar:
                  </label>
                  <select
                    value={config.listOfPosition}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        listOfPosition: e.target.value as ListOfPosition,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="before-chapters">
                      Sebelum BAB I (Setelah Kata Pengantar / Daftar Isi) — Standar Skripsi
                    </option>
                    <option value="end-of-doc">Di Akhir Dokumen (Lampiran)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: General Settings */}
            {activeTab === 'settings' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-600" />
                    Format Penomoran &amp; Pola Teks
                  </h4>
                  <p className="text-xs text-slate-500">
                    Sesuaikan skema penomoran, teks awalan label, dan perataan caption.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Skema Penomoran:
                    </label>
                    <select
                      value={config.numberingMode}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          numberingMode: e.target.value as CaptionNumberingMode,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="chapter">Berdasarkan BAB (Gambar 1.1, Tabel 2.1) — Skripsi</option>
                      <option value="consecutive">Nomor Urut Berurutan (Gambar 1, Gambar 2)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Perataan Caption:
                    </label>
                    <select
                      value={config.alignment}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          alignment: e.target.value as CaptionAlignment,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="center">Rata Tengah (Center)</option>
                      <option value="left">Rata Kiri (Left)</option>
                      <option value="right">Rata Kanan (Right)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Awalan Label Gambar:
                    </label>
                    <input
                      type="text"
                      value={config.imagePrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, imagePrefix: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Awalan Label Tabel:
                    </label>
                    <input
                      type="text"
                      value={config.tablePrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, tablePrefix: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.replaceExistingCaptions}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, replaceExistingCaptions: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Ganti dan perbarui caption lama jika terdeteksi (mencegah caption ganda)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Real-Time Preview & Action (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Preview Caption
              </h4>

              {/* Sample Rendered Image Caption Mockup */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Contoh Elemen Gambar:</div>
                <div className="w-full h-16 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div
                  className={`text-[11px] font-semibold text-slate-800 dark:text-slate-200 italic ${
                    config.alignment === 'center'
                      ? 'text-center'
                      : config.alignment === 'left'
                      ? 'text-left'
                      : 'text-right'
                  }`}
                >
                  {config.imagePrefix} 1{config.separator}1 Contoh Diagram Arsitektur
                </div>
              </div>

              {/* Sample Rendered Table Caption Mockup */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Contoh Elemen Tabel:</div>
                <div
                  className={`text-[11px] font-semibold text-slate-800 dark:text-slate-200 italic ${
                    config.alignment === 'center'
                      ? 'text-center'
                      : config.alignment === 'left'
                      ? 'text-left'
                      : 'text-right'
                  }`}
                >
                  {config.tablePrefix} 1{config.separator}1 Data Parameter Pengujian
                </div>
                <div className="w-full h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                  [Tabel 3 Kolom x 3 Baris]
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                <span className="font-semibold block">Field Dinamis Word SEQ:</span>
                <p>
                  Caption disisipkan menggunakan field <code>SEQ Gambar</code> dan <code>SEQ Tabel</code> native
                  sehingga nomor otomatis sinkron saat naskah diedit di Microsoft Word.
                </p>
              </div>
            </div>

            {/* Action Box */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <button
                disabled={!docInfo || isProcessing || (enabledImagesCount === 0 && enabledTablesCount === 0)}
                onClick={handleApplyCaptions}
                className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !docInfo || isProcessing || (enabledImagesCount === 0 && enabledTablesCount === 0)
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyisipkan Caption &amp; TOC...
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
                100% diproses di browser Anda
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
