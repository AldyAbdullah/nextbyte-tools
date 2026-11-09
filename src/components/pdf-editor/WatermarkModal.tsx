'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Check, Trash2, Sparkles } from 'lucide-react';

export interface WatermarkConfig {
  text: string;
  color: string;
  opacity: number;
  rotation: number; // 45 or 0
}

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWatermark: WatermarkConfig | null;
  onApplyWatermark: (config: WatermarkConfig | null) => void;
}

const PRESET_WATERMARKS = ['SALINAN', 'CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'RAHASIA', 'ASLI'];

export function WatermarkModal({
  isOpen,
  onClose,
  currentWatermark,
  onApplyWatermark,
}: WatermarkModalProps) {
  const [text, setText] = useState(currentWatermark?.text || 'SALINAN');
  const [color, setColor] = useState(currentWatermark?.color || '#94a3b8');
  const [opacity, setOpacity] = useState(currentWatermark?.opacity || 0.2);
  const [rotation, setRotation] = useState(currentWatermark?.rotation ?? 45);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!text.trim()) {
      onApplyWatermark(null);
    } else {
      onApplyWatermark({
        text: text.trim().toUpperCase(),
        color,
        opacity,
        rotation,
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onApplyWatermark(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Watermark Dokumen
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Beri tanda pengaman transparan ke seluruh halaman PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Live Preview Box */}
          <div className="relative h-32 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
              {/* Dummy text lines */}
              <div className="space-y-1.5 w-full px-6 opacity-30 select-none">
                <div className="h-1.5 bg-slate-400 rounded w-5/6" />
                <div className="h-1.5 bg-slate-400 rounded w-full" />
                <div className="h-1.5 bg-slate-400 rounded w-4/6" />
                <div className="h-1.5 bg-slate-400 rounded w-3/4" />
              </div>

              {/* Watermark overlay */}
              {text && (
                <span
                  style={{
                    color,
                    opacity,
                    transform: `rotate(-${rotation}deg)`,
                  }}
                  className="absolute font-black text-2xl tracking-widest uppercase select-none pointer-events-none transition-all"
                >
                  {text}
                </span>
              )}
            </div>
            <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Tampil di semua halaman
            </span>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilihan Kata Watermark:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_WATERMARKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setText(item)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    text.toUpperCase() === item
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Atau Ketik Teks Kustom:
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contoh: HANYA UNTUK VERIFIKASI BANK"
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white uppercase font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Color & Angle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Warna:
              </label>
              <div className="flex items-center gap-2">
                {[
                  { hex: '#94a3b8', label: 'Abu' },
                  { hex: '#dc2626', label: 'Merah' },
                  { hex: '#2563eb', label: 'Biru' },
                  { hex: '#16a34a', label: 'Hijau' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c.hex
                        ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Sudut Kemiringan:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRotation(45)}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold border ${
                    rotation === 45
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Diagonal (45°)
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  className={`flex-1 py-1 rounded-xl text-xs font-semibold border ${
                    rotation === 0
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Lurus (0°)
                </button>
              </div>
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>Tingkat Transparansi (Opacity):</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.5"
              step="0.02"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {currentWatermark ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Watermark</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
