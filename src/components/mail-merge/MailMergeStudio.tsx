'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Settings2,
  Hash,
  Eye,
  FileCheck,
  AlertTriangle,
  Info,
  Trash2,
  FolderArchive
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import {
  MailMergeTemplateInfo,
  RecipientRow,
  AutoNumberConfig,
  ImageDimensionConfig,
  UploadedPhoto,
  GeneratedDocResult,
} from '@/types/mailMerge';
import { scanDocxTemplate, generateSingleDocx } from '@/lib/docxHelper';
import { parseExcelFile } from '@/lib/excelHelper';
import {
  findMatchingPhoto,
  prepareRowData,
  buildDocumentFileName,
  executeBatchMailMerge,
  createBatchZip,
} from '@/lib/mailMergeEngine';
import {
  createSampleDocxTemplate,
  createSampleExcelFile,
} from '@/lib/sampleMailMergeGenerator';

export function MailMergeStudio() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Template Word
  const [template, setTemplate] = useState<MailMergeTemplateInfo | null>(null);
  const [isScanningTemplate, setIsScanningTemplate] = useState(false);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Excel / CSV Data
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelFileSize, setExcelFileSize] = useState(0);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Column Mapping & Configuration
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [imageMapping, setImageMapping] = useState<Record<string, string>>({});
  const [fileNamePattern, setFileNamePattern] = useState('Surat_{{nama}}');
  const [emptyFallback, setEmptyFallback] = useState('');

  // Auto Numbering
  const [autoNumber, setAutoNumber] = useState<AutoNumberConfig>({
    enabled: true,
    variableName: 'nomor_surat',
    prefix: '',
    suffix: '/HRD/X/2026',
    startNumber: 1,
    padding: 3,
  });

  // Step 4: Photos / Images
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensionConfig>({
    widthCm: 3.0,
    heightCm: 4.0,
    missingAction: 'placeholder_text',
  });
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 5: Preview & Batch Generation
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0, currentName: '' });
  const [generatedResults, setGeneratedResults] = useState<GeneratedDocResult[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // --------------------------------------------------------------------------
  // STEP 1: Handle Word Template Upload
  // --------------------------------------------------------------------------
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      showToast('Format tidak didukung. Harap unggah file template berformat .docx', 'error');
      return;
    }

    setIsScanningTemplate(true);
    try {
      const scanned = await scanDocxTemplate(file);
      setTemplate(scanned);

      // Auto-initialize column mappings
      const initialMap: Record<string, string> = {};
      const initialImgMap: Record<string, string> = {};

      scanned.detectedVariables.forEach((v) => {
        initialMap[v] = '';
      });

      scanned.imageVariables.forEach((iv) => {
        initialImgMap[iv] = '';
      });

      setColumnMapping(initialMap);
      setImageMapping(initialImgMap);

      showToast(
        `Template "${file.name}" berhasil dibaca! Terdeteksi ${scanned.detectedVariables.length} variabel.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca template Word. Pastikan file DOCX tidak terenkripsi password.', 'error');
    } finally {
      setIsScanningTemplate(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 2: Handle Excel / CSV Upload
  // --------------------------------------------------------------------------
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    try {
      const result = await parseExcelFile(file);
      if (result.error || result.rawRows.length === 0) {
        showToast(result.error || 'File Excel kosong atau format tidak valid.', 'error');
        return;
      }

      setRawRows(result.rawRows);
      setAvailableColumns(result.availableColumns);
      setExcelFileName(result.fileName);
      setExcelFileSize(result.fileSize);

      // Smart Auto-match variables to Excel columns
      if (template) {
        const newMap: Record<string, string> = { ...columnMapping };
        const newImgMap: Record<string, string> = { ...imageMapping };

        template.detectedVariables.forEach((tplVar) => {
          const matchCol = result.availableColumns.find((col) => {
            const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanTpl = tplVar.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanCol === cleanTpl || cleanCol.includes(cleanTpl) || cleanTpl.includes(cleanCol);
          });
          if (matchCol) {
            newMap[tplVar] = matchCol;
          }
        });

        template.imageVariables.forEach((imgVar) => {
          const matchCol = result.availableColumns.find((col) => {
            return /^(foto|photo|gambar|image|avatar|pic)$/i.test(col);
          });
          if (matchCol) {
            newImgMap[imgVar] = matchCol;
          }
        });

        setColumnMapping(newMap);
        setImageMapping(newImgMap);
      }

      showToast(`Berhasil memuat ${result.rawRows.length} baris data dari "${file.name}".`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses file Excel.', 'error');
    } finally {
      setIsParsingExcel(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 4: Handle Photos Upload
  // --------------------------------------------------------------------------
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: UploadedPhoto[] = [];

    Array.from(files).forEach((file) => {
      const lowerName = file.name.toLowerCase();
      if (!/\.(jpg|jpeg|png|webp)$/i.test(lowerName)) return;

      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
      const url = URL.createObjectURL(file);

      newPhotos.push({
        file,
        name: file.name,
        cleanName,
        url,
        size: file.size,
        type: file.type,
      });
    });

    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    showToast(`Berhasil menambahkan ${newPhotos.length} foto penerima.`, 'success');
  };

  const removePhoto = (photoName: string) => {
    setUploadedPhotos((prev) => {
      const target = prev.find((p) => p.name === photoName);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.name !== photoName);
    });
  };

  const clearAllPhotos = () => {
    uploadedPhotos.forEach((p) => URL.revokeObjectURL(p.url));
    setUploadedPhotos([]);
    showToast('Daftar foto dibersihkan.', 'info');
  };

  // --------------------------------------------------------------------------
  // Download Sample Files
  // --------------------------------------------------------------------------
  const handleDownloadSampleTemplate = async () => {
    try {
      const blob = await createSampleDocxTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contoh-template-surat-nextbyte.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Contoh template Word (.docx) berhasil diunduh.', 'success');
    } catch {
      showToast('Gagal mengunduh contoh template.', 'error');
    }
  };

  const handleDownloadSampleExcel = () => {
    try {
      const blob = createSampleExcelFile();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contoh-data-penerima-nextbyte.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Contoh data Excel (.xlsx) berhasil diunduh.', 'success');
    } catch {
      showToast('Gagal mengunduh contoh data Excel.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // STEP 5: Generate Single Document Preview / Download
  // --------------------------------------------------------------------------
  const handleDownloadSinglePreview = async (rowIndex: number) => {
    if (!template || rawRows.length === 0) return;

    try {
      showToast('Menyiapkan dokumen terpilih...', 'info');
      const row = rawRows[rowIndex];
      const data = prepareRowData(row, rowIndex + 1, columnMapping, autoNumber, emptyFallback);

      const imageFiles = new Map<string, ArrayBuffer>();
      for (const [imgVar, colName] of Object.entries(imageMapping)) {
        if (!colName || colName === '__none__') continue;
        const target = (row[colName] ?? '').trim();
        const recipient = row['nama'] || row['name'] || `Penerima ${rowIndex + 1}`;
        const matched = findMatchingPhoto(target || recipient, uploadedPhotos);
        if (matched) {
          imageFiles.set(imgVar, await matched.file.arrayBuffer());
        }
      }

      const templateBuffer = await template.file.arrayBuffer();
      const blob = await generateSingleDocx(
        templateBuffer,
        data,
        imageFiles,
        imageDimensions,
        rowIndex + 1
      );

      const fileName = buildDocumentFileName(
        fileNamePattern,
        data,
        rowIndex + 1,
        row['nama'] || `Penerima-${rowIndex + 1}`
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Dokumen "${fileName}" berhasil diunduh.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh dokumen.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // STEP 5: Generate All Documents (Batch Generation)
  // --------------------------------------------------------------------------
  const handleGenerateAll = async () => {
    if (!template || rawRows.length === 0) {
      showToast('Harap lengkapi template dan data Excel terlebih dahulu.', 'error');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: rawRows.length, percent: 0, currentName: '' });

    const recipientRows: RecipientRow[] = rawRows.map((raw, idx) => ({
      rowIndex: idx + 2,
      raw,
      outputFileName: '',
      isValid: true,
      missingVars: [],
      missingImages: [],
    }));

    try {
      const results = await executeBatchMailMerge(
        template,
        recipientRows,
        columnMapping,
        imageMapping,
        uploadedPhotos,
        autoNumber,
        imageDimensions,
        fileNamePattern,
        emptyFallback,
        (p) => setProgress(p)
      );

      setGeneratedResults(results);

      const successCount = results.filter((r) => r.status === 'success').length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast(
          `Selesai! Berhasil membuat ${successCount} dokumen${failedCount > 0 ? ` (${failedCount} gagal)` : ''}.`,
          'success'
        );
      } else {
        showToast('Gagal menghasilkan dokumen. Periksa kembali template dan mapping data.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat memproses batch dokumen.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 5: Download All as ZIP
  // --------------------------------------------------------------------------
  const handleDownloadZip = async () => {
    if (generatedResults.length === 0) return;

    setIsZipping(true);
    try {
      const zipBlob = await createBatchZip(generatedResults);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NextByte_MailMerge_${rawRows.length}_Dokumen.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Seluruh dokumen berhasil dikemas ke dalam ZIP dan siap disimpan.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file ZIP.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Reset entire studio
  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data Mail Merge?')) {
      setTemplate(null);
      setRawRows([]);
      setAvailableColumns([]);
      setColumnMapping({});
      setImageMapping({});
      clearAllPhotos();
      setGeneratedResults([]);
      setCurrentStep(1);
      showToast('Workspace Mail Merge direset.', 'info');
    }
  };

  // Calculations for preview
  const currentPreviewRow = rawRows[previewIndex] || {};
  const currentPreparedData = prepareRowData(
    currentPreviewRow,
    previewIndex + 1,
    columnMapping,
    autoNumber,
    emptyFallback
  );

  return (
    <div className="space-y-8">
      {/* Studio Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-3.5 h-3.5" />
              100% Client-Side Privacy • Zero Server Upload
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Nextbyte Mail Merge Studio
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Buat puluhan hingga ratusan dokumen Word (.docx) massal otomatis dari template surat dan data Excel,
              lengkap dengan foto penerima, nomor dokumen otomatis, dan unduhan ZIP instan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              title="Unduh contoh template Word dengan variabel {{nama}}, {{jabatan}}, dll."
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Contoh Template (.docx)
            </button>
            <button
              onClick={handleDownloadSampleExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              title="Unduh contoh data Excel dengan kolom nama, jabatan, alamat, dll."
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Contoh Data (.xlsx)
            </button>
            {(template || rawRows.length > 0) && (
              <button
                onClick={handleReset}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
                title="Reset Workspace"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Wizard Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { step: 1, label: '1. Template Word', done: !!template },
            { step: 2, label: '2. Data Excel', done: rawRows.length > 0 },
            { step: 3, label: '3. Mapping & Format', done: !!template && rawRows.length > 0 },
            { step: 4, label: '4. Foto Penerima', done: uploadedPhotos.length > 0 },
            { step: 5, label: '5. Preview & Generate', done: generatedResults.length > 0 },
          ].map((item) => {
            const isActive = currentStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => setCurrentStep(item.step as 1 | 2 | 3 | 4 | 5)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : item.done
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {item.done && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: TEMPLATE WORD UPLOAD                                              */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Langkah 1: Unggah Template Word (.docx)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Gunakan placeholder dengan kurung kurawal ganda seperti{' '}
                    <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{'{{nama}}'}</code>,{' '}
                    <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{'{{jabatan}}'}</code>,{' '}
                    atau tag foto{' '}
                    <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{'{{foto}}'}</code>.
                  </p>
                </div>
                {template && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Siap
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <input
                ref={templateInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleTemplateUpload}
                className="hidden"
              />

              {!template ? (
                <div
                  onClick={() => templateInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {isScanningTemplate ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Pilih File Template DOCX
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Tarik dan lepaskan file Word Anda ke sini, atau klik untuk memilih file dari komputer.
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
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {template.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(template.size / 1024).toFixed(1)} KB • {template.detectedVariables.length} Variabel Ditemukan
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => templateInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Ganti Template
                    </button>
                  </div>

                  {/* Detected variables badge cloud */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Variabel yang Terdeteksi dalam Dokumen:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {template.detectedVariables.length > 0 ? (
                        template.detectedVariables.map((v) => {
                          const isImg = template.imageVariables.includes(v);
                          return (
                            <span
                              key={v}
                              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border ${
                                isImg
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                              }`}
                            >
                              {isImg ? <ImageIcon className="w-3 h-3 text-amber-500" /> : <TagIcon className="w-3 h-3 text-blue-500" />}
                              {`{{${v}}}`}
                              {isImg && <span className="text-[10px] opacity-75">(foto)</span>}
                            </span>
                          );
                        })
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs border border-amber-200 dark:border-amber-900">
                          Tidak ditemukan variabel bertanda kurung kurawal ganda (contoh: <code>{'{{nama}}'}</code>).
                          Pastikan template Anda memiliki placeholder teks.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={!template}
                  onClick={() => setCurrentStep(2)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    template
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Lanjut ke Data Excel
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Info Card */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Petunjuk Format Template Word
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                <p>
                  Tulis teks dokumen Anda seperti biasa di Microsoft Word / Google Docs / LibreOffice, lalu sisipkan
                  placeholder variabel:
                </p>
                <div className="space-y-1.5 pl-2 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{'{{nama}}'}</span> — Nama penerima
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{'{{jabatan}}'}</span> — Posisi / divisi
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{'{{nomor_surat}}'}</span> — Nomor dokumen otomatis
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{'{{foto}}'}</span> — Foto penerima (teks atau Gambar Dummy Alt Text)
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{'{{#bonus}}Bonus: {{bonus}}{{/bonus}}'}</span> — Teks bersyarat
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <b>Tips Foto:</b> Anda bisa mengetik teks <code className="text-blue-500 font-mono">{'{{foto}}'}</code>, ATAU memasukkan gambar dummy di Word lalu isi Alt Text dengan <code className="text-blue-500 font-mono">{'{{foto}}'}</code> agar ukuran, bingkai, dan posisinya persis seperti di Word.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: EXCEL / CSV DATA UPLOAD                                           */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Langkah 2: Unggah Data Penerima (.xlsx / .csv)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Satu baris data akan menghasilkan satu dokumen Word baru. Baris pertama wajib merupakan header nama kolom.
                  </p>
                </div>
                {rawRows.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {rawRows.length} Penerima
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />

              {rawRows.length === 0 ? (
                <div
                  onClick={() => excelInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {isParsingExcel ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Pilih File Excel atau CSV
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    Mendukung format .xlsx, .xls, dan .csv langsung diolah lokal tanpa diunggah ke server.
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Pilih File Excel / CSV
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                          {excelFileName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(excelFileSize / 1024).toFixed(1)} KB • {rawRows.length} Baris Data • {availableColumns.length} Kolom Header
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => excelInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Ganti File
                    </button>
                  </div>

                  {/* Preview Table of first 5 rows */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pratinjau Data (5 Baris Pertama):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Menampilkan 5 dari {rawRows.length} baris
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-thin">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-3 py-2 w-12 text-center">#</th>
                            {availableColumns.map((col) => (
                              <th key={col} className="px-3 py-2 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {rawRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              {availableColumns.map((col) => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200">
                                  {row[col] || <span className="text-slate-400 italic">kosong</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali ke Template
                </button>
                <button
                  disabled={rawRows.length === 0}
                  onClick={() => setCurrentStep(3)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    rawRows.length > 0
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Lanjut ke Pemetaan Kolom
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500" />
                Ketentuan File Excel / CSV
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                <p>
                  • Baris 1 harus berisi nama header kolom (contoh: <code>nama</code>, <code>jabatan</code>, <code>alamat</code>).
                </p>
                <p>
                  • Untuk kolom foto, isi nama file foto (contoh: <code>andi.jpg</code>, <code>budi.png</code>).
                </p>
                <p>
                  • Tidak ada batasan jumlah baris; ribuan dokumen dapat diproses berurutan secara terstruktur.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: COLUMN MAPPING & AUTO NUMBERING                                   */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-600" />
                  Langkah 3: Pemetaan Variabel Dokumen
                </h2>
                <p className="text-xs text-slate-500">
                  Cocokkan setiap variabel template Word dengan kolom data Excel yang sesuai.
                </p>
              </div>

              {/* Mapping Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5 sm:col-span-4">Variabel Template Word</div>
                  <div className="col-span-2 sm:col-span-1 text-center">Arah</div>
                  <div className="col-span-5 sm:col-span-7">Kolom Data Excel</div>
                </div>

                {template?.detectedVariables && template.detectedVariables.length > 0 ? (
                  template.detectedVariables.map((tplVar) => {
                    const isImg = template.imageVariables.includes(tplVar);
                    const selectedVal = columnMapping[tplVar] ?? '';
                    return (
                      <div
                        key={tplVar}
                        className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
                      >
                        <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                          {isImg ? (
                            <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <TagIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {`{{${tplVar}}}`}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 text-center">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                        </div>

                        <div className="col-span-5 sm:col-span-7">
                          <select
                            value={selectedVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setColumnMapping((prev) => ({ ...prev, [tplVar]: val }));
                              if (isImg) {
                                setImageMapping((prev) => ({ ...prev, [tplVar]: val }));
                              }
                            }}
                            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">-- Lewati / Kosongkan --</option>
                            {availableColumns.map((col) => (
                              <option key={col} value={col}>
                                Kolom Excel: {col} {rawRows[0]?.[col] ? `(misal: "${rawRows[0][col]}")` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
                    Belum ada template yang diunggah. Silakan unggah template Word terlebih dahulu di Langkah 1.
                  </div>
                )}
              </div>

              {/* Auto Numbering Card */}
              <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Penomoran Dokumen Otomatis
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoNumber.enabled}
                      onChange={(e) => setAutoNumber((prev) => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {autoNumber.enabled && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Nama Variabel di Word
                        </label>
                        <input
                          type="text"
                          value={autoNumber.variableName}
                          onChange={(e) =>
                            setAutoNumber((prev) => ({ ...prev, variableName: e.target.value.trim() }))
                          }
                          placeholder="nomor_surat"
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Awalan (Prefix)
                        </label>
                        <input
                          type="text"
                          value={autoNumber.prefix}
                          onChange={(e) => setAutoNumber((prev) => ({ ...prev, prefix: e.target.value }))}
                          placeholder="misal: SRT-"
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Akhiran (Suffix)
                        </label>
                        <input
                          type="text"
                          value={autoNumber.suffix}
                          onChange={(e) => setAutoNumber((prev) => ({ ...prev, suffix: e.target.value }))}
                          placeholder="misal: /HRD/X/2026"
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Nomor Mulai (Start Number)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={autoNumber.startNumber}
                          onChange={(e) =>
                            setAutoNumber((prev) => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))
                          }
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Format Digit Padding (Digit Angka)
                        </label>
                        <select
                          value={autoNumber.padding}
                          onChange={(e) =>
                            setAutoNumber((prev) => ({ ...prev, padding: parseInt(e.target.value) || 3 }))
                          }
                          className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                        >
                          <option value={1}>1 Digit (1, 2, 3...)</option>
                          <option value={2}>2 Digit (01, 02, 03...)</option>
                          <option value={3}>3 Digit (001, 002, 003...)</option>
                          <option value={4}>4 Digit (0001, 0002...)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                      <span>Contoh Format Nomor Dokumen Pertama:</span>
                      <span className="font-mono font-bold">
                        {`${autoNumber.prefix}${String(autoNumber.startNumber).padStart(autoNumber.padding, '0')}${autoNumber.suffix}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* File Name Pattern and Empty Fallback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Pola Nama File Dokumen Output:
                  </label>
                  <input
                    type="text"
                    value={fileNamePattern}
                    onChange={(e) => setFileNamePattern(e.target.value)}
                    placeholder="Surat_{{nama}}"
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5"
                  />
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                    <span>Sisipkan:</span>
                    {template?.detectedVariables.slice(0, 4).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFileNamePattern((prev) => `${prev}_{{${v}}}`)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-700 dark:text-slate-300 font-mono transition-colors"
                      >
                        +{`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Teks Pengganti Jika Data Kolom Kosong:
                  </label>
                  <input
                    type="text"
                    value={emptyFallback}
                    onChange={(e) => setEmptyFallback(e.target.value)}
                    placeholder="Kosong (default: teks kosong)"
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5"
                  />
                  <p className="text-[10px] text-slate-400">
                    Contoh: isi <code>-</code> agar jika kolom kosong akan ditampilkan tanda minus.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali ke Data Excel
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                >
                  Lanjut ke Foto Penerima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Tips Pemetaan Variabel
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                <p>
                  • Jika template memiliki variabel yang tidak ada di Excel, biarkan opsi kosong dan isi nilai default jika diperlukan.
                </p>
                <p>
                  • Fitur <b>Smart Auto-Match</b> otomatis memetakan variabel yang nama atau ejaannya cocok dengan header Excel.
                </p>
                <p>
                  • Penomoran dokumen otomatis akan menghasilkan nomor urut unik per baris penerima tanpa perlu mengedit file Excel secara manual.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: PHOTO & IMAGE UPLOAD & MATCHING                                   */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-500" />
                    Langkah 4: Upload Foto & Pencocokan Gambar (Opsional)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Unggah kumpulan foto penerima (JPG, PNG, WebP). Sistem akan otomatis mencocokkan nama file foto dengan data penerima di Excel.
                  </p>
                </div>
                {uploadedPhotos.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {uploadedPhotos.length} Foto Siap
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handlePhotosUpload}
                className="hidden"
              />

              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pilih Kumpulan Foto Penerima Sekaligus
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
                  Pilih beberapa file foto (JPG, PNG, WebP) sekaligus.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  Unggah File Foto
                </button>
              </div>

              {/* Photo Dimensions & Fallback Settings */}
              <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Pengaturan Ukuran & Penempatan Foto di Dokumen:
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Pengaturan cm ini berlaku untuk placeholder teks <code className="text-blue-500 font-mono">{'{{foto}}'}</code>. Jika template Anda menggunakan <b>Gambar Dummy (Alt Text)</b>, ukuran dan posisi akan otomatis mengikuti gambar dummy di Word.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Preset Ukuran Pas Foto
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '3x4') setImageDimensions((p) => ({ ...p, widthCm: 3.0, heightCm: 4.0 }));
                        if (val === '4x6') setImageDimensions((p) => ({ ...p, widthCm: 4.0, heightCm: 6.0 }));
                        if (val === '2x3') setImageDimensions((p) => ({ ...p, widthCm: 2.0, heightCm: 3.0 }));
                        if (val === 'square') setImageDimensions((p) => ({ ...p, widthCm: 4.0, heightCm: 4.0 }));
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      <option value="3x4">Pas Foto 3 x 4 cm (Standar)</option>
                      <option value="4x6">Pas Foto 4 x 6 cm</option>
                      <option value="2x3">Pas Foto 2 x 3 cm</option>
                      <option value="square">Persegi 4 x 4 cm</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Lebar (cm)
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      max={20}
                      value={imageDimensions.widthCm}
                      onChange={(e) =>
                        setImageDimensions((p) => ({ ...p, widthCm: parseFloat(e.target.value) || 3.0 }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Tinggi (cm)
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      max={20}
                      value={imageDimensions.heightCm}
                      onChange={(e) =>
                        setImageDimensions((p) => ({ ...p, heightCm: parseFloat(e.target.value) || 4.0 }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Jika Foto Penerima Tidak Ditemukan:
                  </label>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="missingAction"
                        checked={imageDimensions.missingAction === 'placeholder_text'}
                        onChange={() =>
                          setImageDimensions((p) => ({ ...p, missingAction: 'placeholder_text' }))
                        }
                      />
                      <span>Tampilkan teks &quot;[Foto tidak tersedia]&quot;</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="missingAction"
                        checked={imageDimensions.missingAction === 'blank'}
                        onChange={() => setImageDimensions((p) => ({ ...p, missingAction: 'blank' }))}
                      />
                      <span>Kosongkan (tanpa teks)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Uploaded Photos Gallery Preview */}
              {uploadedPhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Foto yang Telah Diunggah ({uploadedPhotos.length}):
                    </label>
                    <button
                      onClick={clearAllPhotos}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Bersihkan Semua
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-2 rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-thin">
                    {uploadedPhotos.map((photo) => (
                      <div
                        key={photo.name}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-square"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center">
                          <span className="text-[10px] text-white font-mono truncate w-full px-1">
                            {photo.name}
                          </span>
                          <button
                            onClick={() => removePhoto(photo.name)}
                            className="mt-1 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali ke Mapping
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                >
                  Lanjut ke Preview & Generate
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Matching Status */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Status Pencocokan Foto ({rawRows.length} Penerima)
              </h3>

              {rawRows.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1 text-xs">
                  {rawRows.slice(0, 15).map((row, idx) => {
                    const recipient = row['nama'] || row['name'] || `Penerima ${idx + 1}`;
                    const photoTarget =
                      row['foto'] || row['photo'] || row['gambar'] || row['image'] || recipient;
                    const matched = findMatchingPhoto(photoTarget, uploadedPhotos);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {idx + 1}. {recipient}
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            Target: {photoTarget}
                          </span>
                        </div>
                        {matched ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Cocok
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Belum ada
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {rawRows.length > 15 && (
                    <div className="text-center text-[11px] text-slate-400 pt-1">
                      + {rawRows.length - 15} penerima lainnya
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Unggah file data Excel terlebih dahulu.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: PREVIEW RECIPIENT & BATCH GENERATION                              */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Recipient Interactive Preview Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Pratinjau Data Penerima
                    </h2>
                    <p className="text-xs text-slate-500">
                      Periksa data riil setiap penerima sebelum dokumen dibuat secara massal.
                    </p>
                  </div>

                  {rawRows.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={previewIndex <= 0}
                        onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        title="Penerima Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {previewIndex + 1} dari {rawRows.length}
                      </span>
                      <button
                        disabled={previewIndex >= rawRows.length - 1}
                        onClick={() => setPreviewIndex((p) => Math.min(rawRows.length - 1, p + 1))}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        title="Penerima Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Recipient Details Preview Card */}
                {rawRows.length > 0 ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                          {previewIndex + 1}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {currentPreviewRow['nama'] ||
                              currentPreviewRow['name'] ||
                              `Penerima #${previewIndex + 1}`}
                          </h3>
                          <span className="text-xs text-slate-500">
                            Nama File Output: {buildDocumentFileName(fileNamePattern, currentPreparedData, previewIndex + 1, currentPreviewRow['nama'] || '')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadSinglePreview(previewIndex)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-colors flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh 1 Dokumen Ini (.docx)
                      </button>
                    </div>

                    {/* Mapped Values Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {template?.detectedVariables.map((v) => {
                        const isImg = template.imageVariables.includes(v);
                        const val = currentPreparedData[v] || '';
                        const matchedPhoto = isImg
                          ? findMatchingPhoto(val || currentPreviewRow['nama'] || '', uploadedPhotos)
                          : null;

                        return (
                          <div
                            key={v}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5"
                          >
                            {isImg ? (
                              <ImageIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <TagIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="text-[11px] font-mono text-slate-400 block">
                                {`{{${v}}}`}
                              </span>
                              {isImg ? (
                                matchedPhoto ? (
                                  <div className="flex items-center gap-2 pt-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={matchedPhoto.url}
                                      alt="Preview"
                                      className="w-10 h-12 object-cover rounded-md border border-slate-200 dark:border-slate-700"
                                    />
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                                      {matchedPhoto.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                                    [Foto belum diunggah]
                                  </span>
                                )
                              ) : (
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 break-words">
                                  {val || <span className="text-slate-400 italic font-normal">kosong</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Belum ada data penerima. Unggah template dan file Excel terlebih dahulu.
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Kembali ke Foto
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Generation Execution Box */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Generate Dokumen Massal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proses seluruh {rawRows.length} dokumen secara otomatis.
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Dokumen:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rawRows.length} Dokumen</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Template:</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {template?.name || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penyimpanan:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      100% Memori Browser
                    </span>
                  </div>
                </div>

                {/* Progress bar during generation */}
                {isGenerating && (
                  <div className="space-y-2 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Memproses ({progress.current} / {progress.total})
                      </span>
                      <span>{progress.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900/60 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-400 truncate">
                      Sedang membuat dokumen: {progress.currentName}
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  disabled={isGenerating || rawRows.length === 0 || !template}
                  onClick={handleGenerateAll}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isGenerating || rawRows.length === 0 || !template
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sedang Membuat Dokumen...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      Mulai Generate Semua ({rawRows.length} Dokumen)
                    </>
                  )}
                </button>

                {/* Download All as ZIP button if finished */}
                {generatedResults.length > 0 && (
                  <button
                    disabled={isZipping}
                    onClick={handleDownloadZip}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengemas ZIP...
                      </>
                    ) : (
                      <>
                        <FolderArchive className="w-4 h-4" />
                        Download Semua Dokumen (.ZIP)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated Documents List Table */}
          {generatedResults.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Daftar Dokumen yang Dihasilkan ({generatedResults.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {generatedResults.filter((r) => r.status === 'success').length} berhasil dibuat •{' '}
                    {generatedResults.filter((r) => r.status === 'failed').length} gagal
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Cari penerima / berkas..."
                    className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 outline-none"
                  />
                  <button
                    onClick={handleDownloadZip}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh ZIP
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96 scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">Nama Penerima</th>
                      <th className="px-4 py-3">Nama File Dokumen</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {generatedResults
                      .filter((doc) => {
                        if (!filterQuery) return true;
                        const q = filterQuery.toLowerCase();
                        return (
                          doc.recipientName.toLowerCase().includes(q) ||
                          doc.fileName.toLowerCase().includes(q)
                        );
                      })
                      .map((doc) => (
                        <tr key={doc.rowIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 text-center text-slate-400 font-mono text-[11px]">
                            {doc.rowIndex}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {doc.recipientName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                            {doc.fileName}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {doc.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Sukses
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                                <AlertCircle className="w-3 h-3" /> {doc.error || 'Gagal'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {doc.blob && (
                              <button
                                onClick={() => {
                                  const url = URL.createObjectURL(doc.blob!);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = doc.fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-900 transition-colors inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Unduh
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}
