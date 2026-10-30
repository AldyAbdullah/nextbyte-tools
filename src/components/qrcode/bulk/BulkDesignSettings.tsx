'use client';

import React, { useState } from 'react';
import { BulkDesignConfig } from '@/types/bulkQr';
import { ExportResolution } from '@/types/qrcode';
import { PRESET_TEMPLATES, COLOR_PRESETS } from '@/constants/qrPresets';
import { PRESET_ICONS } from '@/constants/presetIcons';
import { 
  Palette, 
  Shapes, 
  Image as ImageIcon, 
  Frame, 
  Type, 
  Sparkles, 
  UploadCloud, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface BulkDesignSettingsProps {
  design: BulkDesignConfig;
  onChange: (design: BulkDesignConfig) => void;
}

type TabType = 'colors' | 'style' | 'logo' | 'frame' | 'text';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'colors', label: '1. Warna', icon: Palette },
  { id: 'style', label: '2. Gaya Pola', icon: Shapes },
  { id: 'logo', label: '3. Logo', icon: ImageIcon },
  { id: 'frame', label: '4. Frame Scan', icon: Frame },
  { id: 'text', label: '5. Teks di Bawah QR', icon: Type },
];

export function BulkDesignSettings({ design, onChange }: BulkDesignSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const qrConfig = design.qrConfig;

  const updateQrConfig = (partial: Partial<typeof qrConfig>) => {
    onChange({
      ...design,
      qrConfig: {
        ...qrConfig,
        ...partial,
      },
    });
  };

  const handleApplyPresetTemplate = (preset: typeof PRESET_TEMPLATES[0]) => {
    onChange({
      ...design,
      qrConfig: {
        ...qrConfig,
        design: { ...qrConfig.design, ...(preset.config.design || {}) },
        colors: { ...qrConfig.colors, ...(preset.config.colors || {}) },
        frame: { ...qrConfig.frame, ...(preset.config.frame || {}) },
        subText: { ...qrConfig.subText, ...(preset.config.subText || {}) },
      },
    });
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml|webp)/i)) {
      alert('Format file harus berupa PNG, JPG, WebP, atau SVG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateQrConfig({
        logo: {
          ...qrConfig.logo,
          logoDataUrl: dataUrl,
        },
        design: {
          ...qrConfig.design,
          errorCorrectionLevel: 'H',
        },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      
      {/* 1. Header with Preset Templates */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Preset Cepat Desain Massal:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyPresetTemplate(tmpl)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
              >
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Kualitas Export:</span>
          <select
            value={design.resolution}
            onChange={(e) => onChange({ ...design, resolution: Number(e.target.value) as ExportResolution })}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value={1}>1x (300px - Ringan)</option>
            <option value={2}>2x (600px - Rekomendasi HD)</option>
            <option value={4}>4x (1200px - Siap Cetak)</option>
          </select>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 gap-1 border-b border-slate-100 dark:border-slate-800/80 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Panels */}
      <div>

        {/* Tab 1: Colors */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Preset Palet Warna
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COLOR_PRESETS.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => {
                      updateQrConfig({
                        colors: {
                          ...qrConfig.colors,
                          foregroundColor: pal.foreground,
                          backgroundColor: pal.background,
                          isBackgroundTransparent: false,
                        },
                      });
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 flex items-center justify-between gap-2 text-left bg-white dark:bg-slate-900 transition-all"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {pal.name}
                    </span>
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.foreground }} />
                      <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.background }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Warna Pola QR (Foreground)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={qrConfig.colors.foregroundColor}
                    onChange={(e) => updateQrConfig({ colors: { ...qrConfig.colors, foregroundColor: e.target.value } })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={qrConfig.colors.foregroundColor}
                    onChange={(e) => updateQrConfig({ colors: { ...qrConfig.colors, foregroundColor: e.target.value } })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Warna Latar (Background)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qrConfig.colors.isBackgroundTransparent}
                      onChange={(e) => updateQrConfig({ colors: { ...qrConfig.colors, isBackgroundTransparent: e.target.checked } })}
                      className="rounded accent-blue-600"
                    />
                    <span>Transparan</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={qrConfig.colors.isBackgroundTransparent}
                    value={qrConfig.colors.backgroundColor}
                    onChange={(e) => updateQrConfig({ colors: { ...qrConfig.colors, backgroundColor: e.target.value } })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent disabled:opacity-40"
                  />
                  <input
                    type="text"
                    disabled={qrConfig.colors.isBackgroundTransparent}
                    value={qrConfig.colors.isBackgroundTransparent ? 'TRANSPARAN' : qrConfig.colors.backgroundColor}
                    onChange={(e) => updateQrConfig({ colors: { ...qrConfig.colors, backgroundColor: e.target.value } })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Style */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Bentuk Pola Titik (Dots Style)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'square', label: 'Square' },
                  { id: 'rounded', label: 'Rounded' },
                  { id: 'dots', label: 'Dots' },
                  { id: 'classy', label: 'Classy' },
                  { id: 'classy-rounded', label: 'Classy Round' },
                  { id: 'extra-rounded', label: 'Extra Round' },
                ].map(({ id, label }) => {
                  const isSelected = qrConfig.design.dotsType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateQrConfig({ design: { ...qrConfig.design, dotsType: id as typeof qrConfig.design.dotsType } })}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bentuk Sudut Luar (Corners Square)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'extra-rounded', label: 'Rounded' },
                    { id: 'dot', label: 'Dot' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateQrConfig({ design: { ...qrConfig.design, cornersSquareType: id as typeof qrConfig.design.cornersSquareType } })}
                      className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                        qrConfig.design.cornersSquareType === id
                          ? 'bg-blue-600 text-white font-medium border-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bentuk Titik Sudut (Corners Dot)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'dot', label: 'Dot' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateQrConfig({ design: { ...qrConfig.design, cornersDotType: id as typeof qrConfig.design.cornersDotType } })}
                      className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                        qrConfig.design.cornersDotType === id
                          ? 'bg-blue-600 text-white font-medium border-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Logo */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Logo Kustom untuk Seluruh QR Code (Opsional)
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl p-5 text-center cursor-pointer hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col items-center gap-2"
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
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Klik untuk unggah logo (PNG, JPG, SVG, WebP)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Logo akan dipasang tepat di tengah seluruh QR Code dengan piringan rapi
                  </p>
                </div>
              </div>
            </div>

            {/* Preset Icons */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Atau Pilih Ikon Populer Siap Pakai
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => {
                      updateQrConfig({
                        logo: { ...qrConfig.logo, logoDataUrl: icon.dataUrl },
                        design: { ...qrConfig.design, errorCorrectionLevel: 'H' },
                      });
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      qrConfig.logo.logoDataUrl === icon.dataUrl
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.dataUrl} alt={icon.name} className="w-5 h-5 object-contain" />
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate w-full text-center">
                      {icon.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Controls */}
            {qrConfig.logo.logoDataUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrConfig.logo.logoDataUrl}
                      alt="Logo"
                      className="w-9 h-9 object-contain p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        Logo Aktif Diterapkan ke Seluruh QR
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Error Correction Level H Aktif
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQrConfig({ logo: { ...qrConfig.logo, logoDataUrl: null } })}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Logo
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Ukuran Logo</span>
                      <span className="font-mono text-slate-500">{Math.round(qrConfig.logo.logoSize * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="0.38"
                      step="0.01"
                      value={qrConfig.logo.logoSize}
                      onChange={(e) => updateQrConfig({ logo: { ...qrConfig.logo, logoSize: parseFloat(e.target.value) } })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Jarak / Padding Logo</span>
                      <span className="font-mono text-slate-500">{qrConfig.logo.logoMargin}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      step="1"
                      value={qrConfig.logo.logoMargin}
                      onChange={(e) => updateQrConfig({ logo: { ...qrConfig.logo, logoMargin: parseInt(e.target.value) } })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Logo Background Shape */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Latar Belakang / Piringan Logo:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'circle-white', label: 'Lingkaran Putih' },
                      { id: 'square-white', label: 'Kotak Putih' },
                      { id: 'white', label: 'Kotak Penuh' },
                      { id: 'transparent', label: 'Transparan' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateQrConfig({ logo: { ...qrConfig.logo, logoBackground: id as typeof qrConfig.logo.logoBackground } })}
                        className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                          qrConfig.logo.logoBackground === id
                            ? 'bg-blue-600 text-white border-blue-600 font-medium'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Frame */}
        {activeTab === 'frame' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Template Frame Banner
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'Tanpa Frame' },
                  { id: 'simple-bottom', label: 'Scan Me (Bawah)' },
                  { id: 'simple-top', label: 'Scan Me (Atas)' },
                  { id: 'bubble-bottom', label: 'Bubble Frame' },
                  { id: 'card-banner', label: 'Card Banner' },
                  { id: 'minimal-border', label: 'Minimal Frame' },
                  { id: 'camera-frame', label: 'Camera Viewfinder' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      updateQrConfig({
                        frame: {
                          ...qrConfig.frame,
                          style: id as typeof qrConfig.frame.style,
                          textPosition: id === 'simple-top' ? 'top' : 'bottom',
                          text: id === 'none' ? '' : (qrConfig.frame.text || 'SCAN ME'),
                        },
                      });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      qrConfig.frame.style === id
                        ? 'bg-blue-600 text-white font-medium border-blue-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {qrConfig.frame.style !== 'none' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Teks Frame
                  </label>
                  <input
                    type="text"
                    value={qrConfig.frame.text}
                    onChange={(e) => updateQrConfig({ frame: { ...qrConfig.frame, text: e.target.value } })}
                    placeholder="SCAN ME"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Warna Frame Banner
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrConfig.frame.frameColor}
                      onChange={(e) => updateQrConfig({ frame: { ...qrConfig.frame, frameColor: e.target.value } })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                    />
                    <span className="text-xs font-mono">{qrConfig.frame.frameColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Warna Teks Frame
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrConfig.frame.textColor}
                      onChange={(e) => updateQrConfig({ frame: { ...qrConfig.frame, textColor: e.target.value } })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                    />
                    <span className="text-xs font-mono">{qrConfig.frame.textColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Custom Text (Sub-text) */}
        {activeTab === 'text' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mode Teks Keterangan di Bawah QR Code
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ ...design, subTextMode: 'row-name' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    design.subTextMode === 'row-name'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Nama Otomatis</span>
                    {design.subTextMode === 'row-name' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gunakan isi kolom <strong>name</strong> dari setiap baris Excel secara dinamis.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ ...design, subTextMode: 'custom-text' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    design.subTextMode === 'custom-text'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Teks Custom Tetap</span>
                    {design.subTextMode === 'custom-text' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gunakan satu teks kustom yang sama untuk seluruh hasil QR Code.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ ...design, subTextMode: 'none' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    design.subTextMode === 'none'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Tanpa Teks</span>
                    {design.subTextMode === 'none' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Tidak menampilkan tulisan apapun di bawah QR Code.
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Text input if selected */}
            {design.subTextMode === 'custom-text' && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Teks Kustom Seragam:
                </label>
                <input
                  type="text"
                  value={design.customText}
                  onChange={(e) => onChange({ ...design, customText: e.target.value })}
                  placeholder="Contoh: nextbyte.biz.id atau Scan untuk Info"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Include Description checkbox */}
            {design.subTextMode !== 'none' && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={design.includeDescription}
                  onChange={(e) => onChange({ ...design, includeDescription: e.target.checked })}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">
                    Sertakan Keterangan dari Kolom Description
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Jika diaktifkan dan baris memiliki data di kolom description, keterangan akan otomatis digabungkan di bawah QR Code.
                  </span>
                </div>
              </label>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
