'use client';

import React from 'react';
import { QrColorConfig } from '@/types/qrcode';
import { COLOR_PRESETS, ColorPreset } from '@/constants/qrPresets';
import { Sparkles } from 'lucide-react';

interface ColorsTabProps {
  colors: QrColorConfig;
  onChange: (colors: QrColorConfig) => void;
  onApplyPreset?: (preset: ColorPreset) => void;
}

export function ColorsTab({ colors, onChange, onApplyPreset }: ColorsTabProps) {
  return (
    <div className="space-y-6">

      {/* 1. Color Palettes Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Preset Kombinasi Warna
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isCurrent =
              colors.foregroundColor.toLowerCase() === preset.foreground.toLowerCase() &&
              colors.backgroundColor.toLowerCase() === preset.background.toLowerCase();

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange({
                    ...colors,
                    foregroundColor: preset.foreground,
                    backgroundColor: preset.background,
                    isBackgroundTransparent: false,
                    customCorners: !!(preset.cornersSquare || preset.cornersDot),
                    cornersSquareColor: preset.cornersSquare || preset.foreground,
                    cornersDotColor: preset.cornersDot || preset.foreground,
                  });
                  if (onApplyPreset) onApplyPreset(preset);
                }}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual dual swatch circle */}
                <div className="w-6 h-6 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-700 shrink-0 shadow-inner">
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.foreground }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.background }} />
                </div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Foreground & Background Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Foreground Color */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Warna QR (Foreground)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm shrink-0">
              <input
                type="color"
                value={colors.foregroundColor}
                onChange={(e) => onChange({ ...colors, foregroundColor: e.target.value })}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              />
              <div 
                className="w-full h-full rounded-xl"
                style={{ backgroundColor: colors.foregroundColor }}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={colors.foregroundColor}
                onChange={(e) => onChange({ ...colors, foregroundColor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <span className="text-[10px] text-slate-400">Klik kotak untuk membuka color picker</span>
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Warna Latar (Background)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="transBg"
                checked={colors.isBackgroundTransparent}
                onChange={(e) => onChange({ ...colors, isBackgroundTransparent: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="transBg" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Transparan
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm shrink-0 ${
              colors.isBackgroundTransparent ? 'bg-checkerboard' : ''
            }`}>
              {!colors.isBackgroundTransparent && (
                <>
                  <input
                    type="color"
                    value={colors.backgroundColor}
                    onChange={(e) => onChange({ ...colors, backgroundColor: e.target.value })}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div 
                    className="w-full h-full rounded-xl"
                    style={{ backgroundColor: colors.backgroundColor }}
                  />
                </>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                disabled={colors.isBackgroundTransparent}
                value={colors.isBackgroundTransparent ? 'TRANSPARENT' : colors.backgroundColor}
                onChange={(e) => onChange({ ...colors, backgroundColor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-400">
                {colors.isBackgroundTransparent ? 'Background tembus pandang' : 'Klik kotak untuk ubah'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Custom Corner Colors */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
              Kustomisasi Warna Sudut (Corner Color)
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Beri warna berbeda pada 3 kotak sudut QR code
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={colors.customCorners}
              onChange={(e) => onChange({ ...colors, customCorners: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {colors.customCorners && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Outer Corner Color */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Warna Kotak Luar Sudut
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors.cornersSquareColor}
                  onChange={(e) => onChange({ ...colors, cornersSquareColor: e.target.value })}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={colors.cornersSquareColor}
                  onChange={(e) => onChange({ ...colors, cornersSquareColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                />
              </div>
            </div>

            {/* Inner Corner Dot Color */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Warna Titik Dalam Sudut
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors.cornersDotColor}
                  onChange={(e) => onChange({ ...colors, cornersDotColor: e.target.value })}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={colors.cornersDotColor}
                  onChange={(e) => onChange({ ...colors, cornersDotColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
