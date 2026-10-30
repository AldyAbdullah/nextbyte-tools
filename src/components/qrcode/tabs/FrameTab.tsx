'use client';

import React from 'react';
import { QrFrameConfig, FrameStyle, FrameTextPosition } from '@/types/qrcode';
import { Frame } from 'lucide-react';

interface FrameTabProps {
  frame: QrFrameConfig;
  onChange: (frame: QrFrameConfig) => void;
}

const FRAME_TEMPLATES: {
  style: FrameStyle;
  label: string;
  defaultText: string;
  position: FrameTextPosition;
}[] = [
  { style: 'none', label: 'No Frame (Polos)', defaultText: '', position: 'bottom' },
  { style: 'basic-bottom', label: 'Scan Me (Bottom)', defaultText: 'SCAN ME', position: 'bottom' },
  { style: 'basic-top', label: 'Scan Here (Top)', defaultText: 'SCAN HERE', position: 'top' },
  { style: 'bubble-bottom', label: 'Bubble (Bottom)', defaultText: 'SCAN ME', position: 'bottom' },
  { style: 'bubble-top', label: 'Bubble (Top)', defaultText: 'SCAN ME', position: 'top' },
  { style: 'card-banner', label: 'Modern SaaS Badge', defaultText: 'POINT CAMERA HERE', position: 'top' },
  { style: 'minimal-border', label: 'Minimal Frame', defaultText: 'SCAN ME', position: 'bottom' },
  { style: 'camera-frame', label: 'Camera Viewfinder', defaultText: 'POINT YOUR CAMERA HERE', position: 'bottom' },
];

const QUICK_TEXT_PRESETS = [
  'SCAN ME',
  'SCAN HERE',
  'POINT YOUR CAMERA HERE',
  'SCAN TO PAY',
  'FREE WI-FI',
  'FOLLOW US',
  'VIEW MENU',
  'VISIT WEBSITE',
];

export function FrameTab({ frame, onChange }: FrameTabProps) {
  const handleSelectTemplate = (template: typeof FRAME_TEMPLATES[0]) => {
    onChange({
      ...frame,
      style: template.style,
      text: template.defaultText || frame.text || 'SCAN ME',
      textPosition: template.position,
      borderWidth: template.style === 'minimal-border' ? 2 : template.style === 'none' ? 0 : frame.borderWidth,
    });
  };

  return (
    <div className="space-y-6">

      {/* 1. Frame Style Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Pilih Template Frame / Call-to-Action
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FRAME_TEMPLATES.map((item) => {
            const isSelected = frame.style === item.style;
            return (
              <button
                key={item.style + item.position}
                type="button"
                onClick={() => handleSelectTemplate(item)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Frame className="w-5 h-5 text-slate-400" />
                <span className="text-xs truncate w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {frame.style !== 'none' && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
          
          {/* Frame Text Input & Presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Teks pada Frame / Banner
            </label>
            <input
              type="text"
              value={frame.text}
              onChange={(e) => onChange({ ...frame, text: e.target.value })}
              placeholder="SCAN ME"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm uppercase font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {/* Quick text suggestion pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TEXT_PRESETS.map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => onChange({ ...frame, text: txt })}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>

          {/* Text Position Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Posisi Teks Frame
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...frame, textPosition: 'top' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  frame.textPosition === 'top'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Atas QR Code (Top)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...frame, textPosition: 'bottom' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  frame.textPosition === 'bottom'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Bawah QR Code (Bottom)
              </button>
            </div>
          </div>

          {/* Color Settings (Frame Color & Text Color) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Warna Banner / Border Frame
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={frame.frameColor}
                  onChange={(e) => onChange({ ...frame, frameColor: e.target.value })}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={frame.frameColor}
                  onChange={(e) => onChange({ ...frame, frameColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Warna Teks Banner
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={frame.textColor}
                  onChange={(e) => onChange({ ...frame, textColor: e.target.value })}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={frame.textColor}
                  onChange={(e) => onChange({ ...frame, textColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Sliders for Padding & Border Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">Padding Frame</span>
                <span className="font-mono text-slate-500">{frame.padding}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="40"
                step="2"
                value={frame.padding}
                onChange={(e) => onChange({ ...frame, padding: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">Ketebalan Garis Border</span>
                <span className="font-mono text-slate-500">{frame.borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={frame.borderWidth}
                onChange={(e) => onChange({ ...frame, borderWidth: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300">Kelengkungan Sudut (Border Radius)</span>
              <span className="font-mono text-slate-500">{frame.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              step="2"
              value={frame.borderRadius}
              onChange={(e) => onChange({ ...frame, borderRadius: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

        </div>
      )}

    </div>
  );
}
