'use client';

import React, { useState, useMemo } from 'react';
import { BulkRowData } from '@/types/bulkQr';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';

interface BulkDataPreviewTableProps {
  rows: BulkRowData[];
  fileName: string;
  fileSize: number;
  validCount: number;
  invalidCount: number;
  availableColumnsCount?: number;
  isMappingOpen?: boolean;
  onToggleMapping?: () => void;
  onClearFile: () => void;
  onProceed: (onlyValid: boolean) => void;
}

export function BulkDataPreviewTable({
  rows,
  fileName,
  fileSize,
  validCount,
  invalidCount,
  availableColumnsCount = 0,
  isMappingOpen = false,
  onToggleMapping,
  onClearFile,
  onProceed,
}: BulkDataPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Format file size
  const formattedSize = useMemo(() => {
    if (fileSize < 1024) return `${fileSize} B`;
    if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
    return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
  }, [fileSize]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Status filter
      if (filterStatus === 'valid' && !r.isValid) return false;
      if (filterStatus === 'invalid' && r.isValid) return false;

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(term) ||
        r.content.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.filename.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    });
  }, [rows, filterStatus, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      
      {/* 1. File Summary Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {fileName}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formattedSize}</span>
              <span>•</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{rows.length} total baris</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} bermasalah
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onToggleMapping && (
            <button
              type="button"
              onClick={onToggleMapping}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isMappingOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {isMappingOpen 
                  ? 'Tutup Pemetaan' 
                  : `Atur Kolom QR${availableColumnsCount > 0 ? ` (${availableColumnsCount})` : ''}`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClearFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Ganti File
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, URL, isi teks, atau ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStatus('valid');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'valid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Valid ({validCount})
            </button>
            {invalidCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('invalid');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterStatus === 'invalid'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Error ({invalidCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-16">Baris</th>
                <th className="py-3 px-4">Nama QR</th>
                <th className="py-3 px-4">Isi / Content</th>
                <th className="py-3 px-4 hidden md:table-cell">Deskripsi</th>
                <th className="py-3 px-4 hidden lg:table-cell">Output File</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => (
                  <tr
                    key={r.rowIndex}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                      !r.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{r.rowIndex}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {r.name || <span className="text-rose-500 italic">(kosong)</span>}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {r.content || <span className="text-rose-500 italic">(kosong)</span>}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-slate-500 max-w-xs truncate">
                      {r.description || '-'}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell font-mono text-[11px] text-slate-500">
                      {r.filename}.png
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span
                          title={r.errors.join(', ')}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 cursor-help"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {r.errors[0] || 'Error'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Row count footer */}
        <div className="py-3 px-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Menampilkan {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} data
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons for Next Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          {invalidCount > 0 ? (
            <p>
              Terdapat <strong className="text-rose-600 font-semibold">{invalidCount} baris tidak valid</strong>. Anda dapat mengabaikan data bermasalah dan hanya memproses {validCount} data valid, atau mengunggah ulang file Excel yang telah diperbaiki.
            </p>
          ) : (
            <p className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Seluruh {validCount} baris data siap diproses untuk generate massal!
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {validCount > 0 && (
            <button
              type="button"
              onClick={() => onProceed(invalidCount > 0)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Pengaturan Desain ({validCount} QR)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
