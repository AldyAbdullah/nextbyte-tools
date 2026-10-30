'use client';

import React, { useState, useRef } from 'react';
import { 
  BulkRowData, 
  BulkDesignConfig, 
  BulkGenerationProgress, 
  BulkGeneratedItem,
  ColumnMappingConfig 
} from '@/types/bulkQr';
import { DEFAULT_QR_CONFIG } from '@/constants/qrPresets';
import { downloadExcelTemplate, parseExcelFile, applyColumnMapping } from '@/lib/excelHelper';
import { generateBulkZip } from '@/lib/bulkQrZip';
import { BulkColumnMapper } from './BulkColumnMapper';
import { BulkDataPreviewTable } from './BulkDataPreviewTable';
import { BulkDesignSettings } from './BulkDesignSettings';
import { BulkPreviewCard } from './BulkPreviewCard';
import { BulkProgressModal } from './BulkProgressModal';
import { BulkPdfModal } from './BulkPdfModal';
import { BulkHowToUse } from './BulkHowToUse';
import { useToast } from '@/components/common/Toast';
import confetti from 'canvas-confetti';
import { 
  Download, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowLeft, 
  FileArchive,
  AlertTriangle
} from 'lucide-react';

export function BulkQrGenerator() {
  const { showToast } = useToast();

  // Wizard Step: 'upload' | 'design'
  const [currentStep, setCurrentStep] = useState<'upload' | 'design'>('upload');

  // Excel Upload States & Column Mapping
  const [rows, setRows] = useState<BulkRowData[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMappingConfig>({
    nameColumn: '',
    contentMode: 'single',
    singleContentColumn: '',
    selectedMultiColumns: [],
    multiFormat: 'label-value',
    customTemplate: '',
    descriptionColumn: '',
    filenameColumn: '',
  });
  const [isMappingOpen, setIsMappingOpen] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [validCount, setValidCount] = useState<number>(0);
  const [invalidCount, setInvalidCount] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Design Configuration
  const [design, setDesign] = useState<BulkDesignConfig>({
    qrConfig: {
      ...DEFAULT_QR_CONFIG,
      subText: {
        ...DEFAULT_QR_CONFIG.subText,
        enabled: true,
      },
    },
    subTextMode: 'row-name',
    customText: '',
    includeDescription: false,
    resolution: 2, // 2x HD (600px)
  });

  // Selected row for Live Preview
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  // Generation Progress & Result States
  const isCancelledRef = useRef<boolean>(false);
  const [progress, setProgress] = useState<BulkGenerationProgress>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    percentage: 0,
    statusText: '',
    isGenerating: false,
    isCancelled: false,
    isComplete: false,
  });

  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [generatedItems, setGeneratedItems] = useState<BulkGeneratedItem[]>([]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // 1. Handle File Upload & Parse
  const handleProcessFile = async (file: File) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Format file tidak didukung. Mohon unggah file berekstensi .xlsx, .xls, atau .csv.');
      showToast('Format file harus .xlsx, .xls, atau .csv', 'error');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseExcelFile(file);

      if (result.error) {
        setParseError(result.error);
        showToast(result.error, 'error');
        return;
      }

      setRows(result.rows);
      setRawRows(result.rawRows);
      setAvailableColumns(result.availableColumns);
      setMapping(result.initialMapping);
      setIsMappingOpen(true);
      setFileName(result.fileName);
      setFileSize(result.fileSize);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
      setSelectedPreviewIndex(0);

      showToast(`File ${result.fileName} (${result.validCount} data valid) berhasil dimuat!`, 'success');
    } catch (err) {
      console.error(err);
      setParseError('Gagal memproses file Excel. Pastikan file tidak rusak.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMappingChange = (newMapping: ColumnMappingConfig) => {
    setMapping(newMapping);
    if (rawRows.length > 0) {
      const { rows: updatedRows, validCount: vCount, invalidCount: invCount } = applyColumnMapping(rawRows, newMapping);
      setRows(updatedRows);
      setValidCount(vCount);
      setInvalidCount(invCount);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setRows([]);
    setRawRows([]);
    setAvailableColumns([]);
    setMapping({
      nameColumn: '',
      contentMode: 'single',
      singleContentColumn: '',
      selectedMultiColumns: [],
      multiFormat: 'label-value',
      customTemplate: '',
      descriptionColumn: '',
      filenameColumn: '',
    });
    setIsMappingOpen(true);
    setFileName('');
    setFileSize(0);
    setValidCount(0);
    setInvalidCount(0);
    setParseError(null);
    setCurrentStep('upload');
  };

  // 2. Start Bulk Generation Process
  const handleStartGeneration = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Tidak ada data valid yang dapat diproses.', 'error');
      return;
    }

    isCancelledRef.current = false;
    setProgress({
      total: validRows.length,
      current: 0,
      success: 0,
      failed: 0,
      percentage: 0,
      statusText: 'Mempersiapkan proses generate massal...',
      isGenerating: true,
      isCancelled: false,
      isComplete: false,
    });
    setZipBlob(null);
    setIsProgressModalOpen(true);

    try {
      const { zipBlob: generatedZip, items, successCount, failedCount } = await generateBulkZip({
        rows: validRows,
        design,
        onProgress: (current, total, percentage, currentName) => {
          setProgress((prev) => ({
            ...prev,
            current,
            total,
            percentage,
            success: current - (prev.failed || 0),
            statusText: `Sedang memproses baris: ${currentName}...`,
          }));
        },
        checkCancelled: () => isCancelledRef.current,
      });

      setZipBlob(generatedZip);
      setGeneratedItems(items);

      setProgress((prev) => ({
        ...prev,
        current: validRows.length,
        percentage: 100,
        success: successCount,
        failed: failedCount,
        statusText: 'Kompresi file ZIP selesai!',
        isGenerating: false,
        isComplete: true,
      }));

      // Trigger Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      showToast(`Sukses membuat ${successCount} QR Code! File ZIP siap diunduh.`, 'success');
    } catch (err) {
      if (isCancelledRef.current) {
        setProgress((prev) => ({
          ...prev,
          isGenerating: false,
          isCancelled: true,
          statusText: 'Generate massal dibatalkan.',
        }));
        showToast('Proses generate dibatalkan.', 'info');
      } else {
        console.error('Bulk generate error:', err);
        setProgress((prev) => ({
          ...prev,
          isGenerating: false,
          statusText: (err as Error).message || 'Terjadi kesalahan saat memproses.',
        }));
        showToast('Gagal menyelesaikan generate massal.', 'error');
      }
    }
  };

  const handleCancelGeneration = () => {
    isCancelledRef.current = true;
  };

  return (
    <div className="space-y-8">
      
      {/* Step Navigator Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentStep === 'upload'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-center leading-5 text-[11px] font-bold">1</span>
            <span>Upload & Periksa Data</span>
            {rows.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                {rows.length}
              </span>
            )}
          </button>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            disabled={validCount === 0}
            onClick={() => setCurrentStep('design')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 'design'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-center leading-5 text-[11px] font-bold">2</span>
            <span>Atur Desain & Generate</span>
          </button>
        </div>

        {/* Quick Excel Template Download Button */}
        <button
          type="button"
          onClick={downloadExcelTemplate}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Download Excel Template (.xlsx)</span>
        </button>
      </div>

      {/* ================= STEP 1: UPLOAD & PREVIEW ================= */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          
          {rows.length === 0 ? (
            /* Upload Dropzone Empty State */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
              
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    {isParsing ? (
                      <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {isParsing ? 'Menganalisis File Excel...' : 'Upload File Excel (.xlsx, .xls, .csv)'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Klik untuk memilih file atau seret & lepas file Excel Anda ke area ini.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      .XLSX
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      .XLS
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      .CSV
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert if parse failed */}
              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 text-left max-w-xl mx-auto">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-semibold block">Gagal Membaca File</span>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Template Assistance Info */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2 text-left">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Belum punya format data? Unduh template resmi kami untuk contoh kolom dan data siap pakai.</span>
                </div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors shrink-0"
                >
                  Download Template
                </button>
              </div>

            </div>
          ) : (
            /* Column Mapping & Data Preview Table */
            <div className="space-y-6">
              {/* Collapsible Flexible Column Mapping Section */}
              {isMappingOpen && (
                <BulkColumnMapper
                  availableColumns={availableColumns}
                  mapping={mapping}
                  sampleRow={rawRows[0] || {}}
                  onChange={handleMappingChange}
                />
              )}

              {/* Data Preview Table & Validation */}
              <BulkDataPreviewTable
                rows={rows}
                fileName={fileName}
                fileSize={fileSize}
                validCount={validCount}
                invalidCount={invalidCount}
                availableColumnsCount={availableColumns.length}
                isMappingOpen={isMappingOpen}
                onToggleMapping={() => setIsMappingOpen((prev) => !prev)}
                onClearFile={handleClearFile}
                onProceed={() => setCurrentStep('design')}
              />
            </div>
          )}

        </div>
      )}

      {/* ================= STEP 2: DESIGN & BATCH GENERATE ================= */}
      {currentStep === 'design' && (
        <div className="space-y-6">
          
          {/* Top Banner with Summary & Generate Button */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('upload')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Kembali ke Tabel Data"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Pengaturan Desain Massal ({validCount} QR Code)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Siap Generate
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Desain, warna, frame, dan logo di bawah ini akan diterapkan secara seragam ke seluruh {validCount} data QR Code.
                </p>
              </div>
            </div>

            {/* Main CTA: Generate All */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <FileArchive className="w-4 h-4" />
                <span>Mulai Generate Massal (Download ZIP)</span>
              </button>
            </div>
          </div>

          {/* Two-Column Layout: Design Settings (Left) + Live Preview Card (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-7">
              <BulkDesignSettings
                design={design}
                onChange={setDesign}
              />
            </div>

            <div className="lg:col-span-5">
              <BulkPreviewCard
                rows={rows.filter((r) => r.isValid)}
                design={design}
                selectedIndex={selectedPreviewIndex}
                onSelectRow={setSelectedPreviewIndex}
              />
            </div>

          </div>

        </div>
      )}

      {/* Progress & Completion Modal */}
      <BulkProgressModal
        isOpen={isProgressModalOpen}
        progress={progress}
        zipBlob={zipBlob}
        generatedItems={generatedItems}
        onCancel={handleCancelGeneration}
        onClose={() => setIsProgressModalOpen(false)}
        onOpenPdfModal={() => {
          setIsProgressModalOpen(false);
          setIsPdfModalOpen(true);
        }}
      />

      {/* PDF Grid Export Modal */}
      <BulkPdfModal
        isOpen={isPdfModalOpen}
        items={generatedItems}
        onClose={() => setIsPdfModalOpen(false)}
      />

      {/* How to use Guide Section */}
      <BulkHowToUse />

    </div>
  );
}
