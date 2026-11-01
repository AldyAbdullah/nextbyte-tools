'use client';

import React, { useRef, useState } from 'react';
import { QrLogoConfig, ErrorCorrectionLevel } from '@/types/qrcode';
import { PRESET_ICONS } from '@/constants/presetIcons';
import { UploadCloud, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/common/Toast';

interface LogoTabProps {
  logo: QrLogoConfig;
  errorCorrectionLevel: ErrorCorrectionLevel;
  onChange: (logo: QrLogoConfig) => void;
  onUpdateErrorCorrection: (level: ErrorCorrectionLevel) => void;
}

export function LogoTab({
  logo,
  errorCorrectionLevel,
  onChange,
  onUpdateErrorCorrection,
}: LogoTabProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml|webp)/i)) {
      showToast('Format file harus berupa PNG, JPG, WebP, atau SVG.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange({
        ...logo,
        logoDataUrl: dataUrl,
      });

      // Otomatis naikkan ke Level H untuk keamanan pemindaian
      if (errorCorrectionLevel !== 'H') {
        onUpdateErrorCorrection('H');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    onChange({
      ...logo,
      logoDataUrl: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Drag and Drop Upload Area */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Upload Logo Kustom (PNG, JPG, SVG)
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
              : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Klik untuk unggah atau seret file logo ke sini
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Mendukung PNG, JPG, SVG, WebP (Rekomendasi rasio 1:1 persegi)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Preset Popular Icons for Immediate Pick */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Atau Pilih Ikon Populer Siap Pakai
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESET_ICONS.map((icon) => {
            const isSelected = logo.logoDataUrl === icon.dataUrl;
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => {
                  onChange({
                    ...logo,
                    logoDataUrl: icon.dataUrl,
                  });
                  if (errorCorrectionLevel !== 'H') {
                    onUpdateErrorCorrection('H');
                  }
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon.dataUrl} alt={icon.name} className="w-6 h-6 object-contain" />
                <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate w-full text-center">
                  {icon.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Logo Controls when Logo is Present */}
      {logo.logoDataUrl && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.logoDataUrl}
                alt="Logo Preview"
                className="w-10 h-10 object-contain p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Logo Aktif di Tengah QR
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Error Correction otomatis diset ke Level H
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Logo
            </button>
          </div>

          {/* Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Ukuran Logo</span>
              <span className="font-mono text-slate-500">{Math.round(logo.logoSize * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.38"
              step="0.01"
              value={logo.logoSize}
              onChange={(e) => onChange({ ...logo, logoSize: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            {logo.logoSize > 0.32 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> Ukuran logo besar dapat mempengaruhi kecepatan pemindaian pada kamera beresolusi rendah.
              </p>
            )}
          </div>

          {/* Margin / Padding Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Jarak / Padding Logo</span>
              <span className="font-mono text-slate-500">{logo.logoMargin}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="1"
              value={logo.logoMargin}
              onChange={(e) => onChange({ ...logo, logoMargin: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Background behind Logo */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Latar Belakang Logo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'circle-white', label: 'Lingkaran Putih' },
                { id: 'square-white', label: 'Kotak Putih' },
                { id: 'white', label: 'Kotak Penuh' },
                { id: 'transparent', label: 'Transparan' },
              ].map(({ id, label }) => {
                const isSelected = logo.logoBackground === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange({ ...logo, logoBackground: id as QrLogoConfig['logoBackground'] })}
                    className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-medium'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
