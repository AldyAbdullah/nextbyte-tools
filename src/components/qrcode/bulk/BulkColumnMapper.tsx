'use client';

import React from 'react';
import { ColumnMappingConfig } from '@/types/bulkQr';
import { buildRowContent } from '@/lib/excelHelper';
import { 
  SlidersHorizontal, 
  Check, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BulkColumnMapperProps {
  availableColumns: string[];
  mapping: ColumnMappingConfig;
  sampleRow: Record<string, string>;
  onChange: (newMapping: ColumnMappingConfig) => void;
}

export function BulkColumnMapper({
  availableColumns,
  mapping,
  sampleRow,
  onChange,
}: BulkColumnMapperProps) {
  // Live sample preview calculation
  const sampleContent = buildRowContent(sampleRow || {}, mapping);

  const toggleMultiColumn = (col: string) => {
    const current = mapping.selectedMultiColumns || [];
    const next = current.includes(col)
      ? current.filter((c) => c !== col)
      : [...current, col];
    onChange({ ...mapping, selectedMultiColumns: next });
  };

  const insertTagToTemplate = (col: string) => {
    const tag = `{${col}}`;
    const nextTemplate = mapping.customTemplate ? `${mapping.customTemplate} ${tag}` : tag;
    onChange({ ...mapping, customTemplate: nextTemplate });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Pemetaan Kolom Excel ke QR Code
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih kolom nama dan tentukan data mana saja yang ingin dimasukkan ke dalam QR Code.
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {availableColumns.length} Kolom Terdeteksi
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Mapping Controls */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Pilih Kolom Nama */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>1. Kolom Nama QR (Name Label) *</span>
              <span className="text-[11px] text-slate-400 font-normal">Tampil sebagai judul QR Code</span>
            </label>
            <div className="relative">
              <select
                value={mapping.nameColumn}
                onChange={(e) => onChange({ ...mapping, nameColumn: e.target.value })}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    Kolom: &quot;{col}&quot; (Contoh: {sampleRow[col] || '-'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Pilih Mode Isi / Konten QR Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                2. Isi / Konten yang Dimasukkan ke QR Code *
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Fleksibel & Multi-Kolom
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => onChange({ ...mapping, contentMode: 'single' })}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all text-center ${
                  mapping.contentMode === 'single'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Satu Kolom
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...mapping, contentMode: 'multi' })}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all text-center ${
                  mapping.contentMode === 'multi'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Gabung Kolom
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...mapping, contentMode: 'template' })}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all text-center ${
                  mapping.contentMode === 'template'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Template Bebas
              </button>
            </div>

            {/* Mode A: Single Column */}
            {mapping.contentMode === 'single' && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Pilih satu kolom khusus untuk isi QR Code (misal link, ID, atau teks):
                </span>
                <div className="relative">
                  <select
                    value={mapping.singleContentColumn}
                    onChange={(e) => onChange({ ...mapping, singleContentColumn: e.target.value })}
                    className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        Kolom: &quot;{col}&quot; (Nilai: {sampleRow[col] || '-'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Mode B: Multi-Column Selection */}
            {mapping.contentMode === 'multi' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Centang kolom-kolom yang ingin dimasukkan ke dalam QR Code:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableColumns.map((col) => {
                      const isSelected = mapping.selectedMultiColumns.includes(col);
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => toggleMultiColumn(col)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white text-blue-600' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    Format Penggabungan Teks:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'label-value', label: 'Nama: Nilai (Baris Baru)' },
                      { id: 'value-only', label: 'Nilai Saja (Baris Baru)' },
                      { id: 'csv', label: 'Pisahkan Koma (,)' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onChange({ ...mapping, multiFormat: id as typeof mapping.multiFormat })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] text-center border font-medium transition-all ${
                          mapping.multiFormat === id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-400 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode C: Custom Template */}
            {mapping.contentMode === 'template' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    Tulis format teks Anda dengan tag kolom:
                  </span>
                  <textarea
                    rows={4}
                    value={mapping.customTemplate}
                    onChange={(e) => onChange({ ...mapping, customTemplate: e.target.value })}
                    placeholder="Contoh:&#10;KARTU IDENTITAS&#10;Nama: {nama}&#10;Jabatan: {jabatan}&#10;No HP: {nomor_hp}"
                    className="w-full p-3 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Klik tag kolom untuk menyisipkan ke dalam template:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableColumns.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => insertTagToTemplate(col)}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                      >
                        +{`{${col}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 3. Kolom Opsional: Deskripsi & Nama File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Kolom Deskripsi (Opsional)
              </label>
              <select
                value={mapping.descriptionColumn}
                onChange={(e) => onChange({ ...mapping, descriptionColumn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">(Tidak digunakan)</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Kolom Nama File Output (Opsional)
              </label>
              <select
                value={mapping.filenameColumn}
                onChange={(e) => onChange({ ...mapping, filenameColumn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">(Gunakan kolom Nama otomatis)</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Right Column: Live Sample Output Box */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Live Preview Isi Barcode (Baris #1):
              </span>
              <p className="text-[11px] text-slate-400">
                Berikut adalah teks persis yang akan terbaca ketika pengguna memindai QR Code baris pertama:
              </p>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all min-h-[140px] max-h-[220px] overflow-y-auto">
                {sampleContent || (
                  <span className="text-slate-400 italic">
                    (Belum ada kolom yang dipilih atau isi baris kosong)
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              💡 <strong>Tips:</strong> Anda bisa menggabungkan kolom seperti <em>Nama, Jabatan, NIK, dan Nomor Kontak</em> untuk membuat QR Code ID Card atau Profil Karyawan.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
