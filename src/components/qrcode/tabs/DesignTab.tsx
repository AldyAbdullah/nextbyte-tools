'use client';

import React from 'react';
import { 
  QrDesignConfig, 
  QrDotType, 
  QrCornerSquareType, 
  QrCornerDotType, 
  ErrorCorrectionLevel 
} from '@/types/qrcode';
import { ShieldCheck } from 'lucide-react';

interface DesignTabProps {
  design: QrDesignConfig;
  onChange: (design: QrDesignConfig) => void;
}

const DOT_STYLES: { type: QrDotType; label: string; previewClass: string }[] = [
  { type: 'square', label: 'Square (Klasik)', previewClass: 'rounded-none' },
  { type: 'rounded', label: 'Rounded', previewClass: 'rounded-md' },
  { type: 'dots', label: 'Dots (Bulat)', previewClass: 'rounded-full' },
  { type: 'classy', label: 'Classy', previewClass: 'rounded-tr-lg rounded-bl-lg' },
  { type: 'classy-rounded', label: 'Classy Rounded', previewClass: 'rounded-tl-xl rounded-br-md' },
  { type: 'extra-rounded', label: 'Extra Rounded', previewClass: 'rounded-xl' },
];

const CORNER_SQUARE_STYLES: { type: QrCornerSquareType; label: string }[] = [
  { type: 'square', label: 'Square' },
  { type: 'extra-rounded', label: 'Rounded' },
  { type: 'dot', label: 'Circle / Dot' },
];

const CORNER_DOT_STYLES: { type: QrCornerDotType; label: string }[] = [
  { type: 'square', label: 'Square' },
  { type: 'dot', label: 'Circle / Dot' },
];

const ERROR_CORRECTION_LEVELS: { level: ErrorCorrectionLevel; label: string; desc: string }[] = [
  { level: 'L', label: 'Level L', desc: 'Toleransi 7% (Data ringkas)' },
  { level: 'M', label: 'Level M', desc: 'Toleransi 15% (Standar)' },
  { level: 'Q', label: 'Level Q', desc: 'Toleransi 25% (Aman)' },
  { level: 'H', label: 'Level H (Disarankan)', desc: 'Toleransi 30% (Terbaik jika pakai logo)' },
];

export function DesignTab({ design, onChange }: DesignTabProps) {
  return (
    <div className="space-y-6">
      
      {/* 1. Body Dots Shape */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Bentuk Pola Titik (Dots Style)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {DOT_STYLES.map(({ type, label, previewClass }) => {
            const isSelected = design.dotsType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...design, dotsType: type })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual Mini Dot Icon */}
                <div className={`w-6 h-6 bg-slate-900 dark:bg-slate-100 shrink-0 ${previewClass}`} />
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Outer Corner Shape */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Bentuk Sudut Luar (Outer Corner Shape)
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {CORNER_SQUARE_STYLES.map(({ type, label }) => {
            const isSelected = design.cornersSquareType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...design, cornersSquareType: type })}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`w-7 h-7 border-4 border-slate-900 dark:border-slate-100 ${
                  type === 'square' ? 'rounded-none' : type === 'extra-rounded' ? 'rounded-lg' : 'rounded-full'
                }`} />
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Inner Corner Dot Shape */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Bentuk Titik Sudut Dalam (Inner Corner Dot)
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {CORNER_DOT_STYLES.map(({ type, label }) => {
            const isSelected = design.cornersDotType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...design, cornersDotType: type })}
                className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-3 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 bg-slate-900 dark:bg-slate-100 ${
                  type === 'square' ? 'rounded-none' : 'rounded-full'
                }`} />
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Error Correction Level */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Error Correction Level
            </label>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-semibold">
            Level {design.errorCorrectionLevel}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Semakin tinggi level toleransi, QR Code semakin tahan terhadap goresan, kotoran, atau tumpukan logo di bagian tengah.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {ERROR_CORRECTION_LEVELS.map(({ level, label, desc }) => {
            const isSelected = design.errorCorrectionLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ ...design, errorCorrectionLevel: level })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{label}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
