'use client';

import React from 'react';
import { 
  QrSubTextConfig, 
  SubTextFontFamily, 
  SubTextFontWeight, 
  SubTextAlign 
} from '@/types/qrcode';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextTabProps {
  subText: QrSubTextConfig;
  onChange: (subText: QrSubTextConfig) => void;
}

export function TextTab({ subText, onChange }: TextTabProps) {
  return (
    <div className="space-y-6">

      {/* 1. Enable Toggle */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
              Tampilkan Teks Tambahan di Bawah QR Code
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Cocok untuk nama bisnis, nama Wi-Fi, URL, atau instruksi tambahan
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={subText.enabled}
              onChange={(e) => onChange({ ...subText, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {subText.enabled && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            
            {/* Input Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Isi Teks Bebas
              </label>
              <input
                type="text"
                value={subText.text}
                onChange={(e) => onChange({ ...subText, text: e.target.value })}
                placeholder="Contoh: nextbyte.biz.id atau Scan untuk menu"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Alignment & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Alignment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Perataan (Alignment)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { align: 'left', icon: AlignLeft, label: 'Kiri' },
                    { align: 'center', icon: AlignCenter, label: 'Tengah' },
                    { align: 'right', icon: AlignRight, label: 'Kanan' },
                  ].map(({ align, icon: Icon, label }) => {
                    const isSelected = subText.align === align;
                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() => onChange({ ...subText, align: align as SubTextAlign })}
                        className={`py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Weight */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ketebalan Font (Weight)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { weight: '400', label: 'Regular' },
                    { weight: '600', label: 'Semibold' },
                    { weight: '700', label: 'Bold' },
                  ].map(({ weight, label }) => {
                    const isSelected = subText.fontWeight === weight;
                    return (
                      <button
                        key={weight}
                        type="button"
                        onClick={() => onChange({ ...subText, fontWeight: weight as SubTextFontWeight })}
                        className={`py-1.5 px-2 rounded-lg border text-xs text-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Jenis Font (Font Family)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sans', label: 'Sans-Serif (Modern)', fontClass: 'font-sans' },
                  { id: 'mono', label: 'Monospace (Code)', fontClass: 'font-mono' },
                  { id: 'serif', label: 'Serif (Elegan)', fontClass: 'font-serif' },
                  { id: 'display', label: 'Display (Tebal)', fontClass: 'font-black' },
                ].map(({ id, label, fontClass }) => {
                  const isSelected = subText.fontFamily === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChange({ ...subText, fontFamily: id as SubTextFontFamily })}
                      className={`p-2 rounded-xl border text-xs text-center transition-all ${fontClass} ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size & Spacing Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Ukuran Font</span>
                  <span className="font-mono text-slate-500">{subText.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="11"
                  max="28"
                  step="1"
                  value={subText.fontSize}
                  onChange={(e) => onChange({ ...subText, fontSize: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Jarak ke QR Code</span>
                  <span className="font-mono text-slate-500">{subText.spacing}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="2"
                  value={subText.spacing}
                  onChange={(e) => onChange({ ...subText, spacing: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Text Color Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Warna Teks
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={subText.color}
                  onChange={(e) => onChange({ ...subText, color: e.target.value })}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={subText.color}
                  onChange={(e) => onChange({ ...subText, color: e.target.value })}
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
