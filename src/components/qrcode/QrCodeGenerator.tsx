'use client';

import React, { useState } from 'react';
import { CompleteQrConfig } from '@/types/qrcode';
import { DEFAULT_QR_CONFIG, PRESET_TEMPLATES } from '@/constants/qrPresets';
import { ContentTab } from './tabs/ContentTab';
import { DesignTab } from './tabs/DesignTab';
import { ColorsTab } from './tabs/ColorsTab';
import { LogoTab } from './tabs/LogoTab';
import { FrameTab } from './tabs/FrameTab';
import { TextTab } from './tabs/TextTab';
import { QrCodePreview } from './QrCodePreview';
import { HistoryDrawer } from './HistoryDrawer';
import { saveQrCodeToHistory } from '@/lib/supabase';
import { useToast } from '@/components/common/Toast';
import { 
  FileEdit, 
  Shapes, 
  Palette, 
  Image as ImageIcon, 
  Frame, 
  Type, 
  RotateCcw, 
  History, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

type ActiveTab = 'content' | 'design' | 'colors' | 'logo' | 'frame' | 'text';

const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'content', label: '1. Konten', icon: FileEdit },
  { id: 'design', label: '2. Pola & Sudut', icon: Shapes },
  { id: 'colors', label: '3. Warna', icon: Palette },
  { id: 'logo', label: '4. Logo', icon: ImageIcon },
  { id: 'frame', label: '5. Frame', icon: Frame },
  { id: 'text', label: '6. Teks Tambahan', icon: Type },
];

export function QrCodeGenerator() {
  const [config, setConfig] = useState<CompleteQrConfig>(DEFAULT_QR_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { showToast } = useToast();

  // Reset to default
  const handleReset = () => {
    if (window.confirm('Reset seluruh konfigurasi ke nilai default?')) {
      setConfig(DEFAULT_QR_CONFIG);
      showToast('Konfigurasi QR Code berhasil direset.', 'info');
    }
  };

  // Apply Quick Preset Template
  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      content: {
        ...prev.content,
        ...(preset.config.content || {}),
      },
      design: {
        ...prev.design,
        ...(preset.config.design || {}),
      },
      colors: {
        ...prev.colors,
        ...(preset.config.colors || {}),
      },
      frame: {
        ...prev.frame,
        ...(preset.config.frame || {}),
      },
      subText: {
        ...prev.subText,
        ...(preset.config.subText || {}),
      },
    }));
    showToast(`Template "${preset.name}" berhasil diterapkan!`, 'success');
  };

  // Save to history on export
  const handleSaveToHistory = async () => {
    try {
      let displayName = 'QR Code';
      if (config.content.type === 'url') displayName = config.content.url.replace(/^https?:\/\//i, '');
      else if (config.content.type === 'wifi') displayName = `Wi-Fi: ${config.content.wifiSsid}`;
      else if (config.content.type === 'whatsapp') displayName = `WA: ${config.content.whatsappNumber}`;
      else if (config.content.type === 'email') displayName = config.content.email;
      else if (config.content.type === 'text') displayName = config.content.text.substring(0, 24);

      await saveQrCodeToHistory({
        id: `qr-${Date.now()}`,
        name: displayName || 'Custom QR Code',
        type: config.content.type,
        content: displayName,
        config: config as unknown as Record<string, unknown>,
      });
    } catch (e) {
      console.warn('History save notice:', e);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Action Bar: Presets & Utility Tools */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Quick Template Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Preset Template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyPreset(tmpl)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1.5"
              >
                <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {tmpl.badge}
                </span>
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset & History Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-blue-500" />
            Riwayat
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Controls with Tabs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            
            {/* Tab Navigation Navigation Bar */}
            <div className="flex overflow-x-auto pb-2 gap-1 border-b border-slate-100 dark:border-slate-800/80 mb-6 scrollbar-none">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

            {/* Tab Panels */}
            <div>
              {activeTab === 'content' && (
                <ContentTab
                  content={config.content}
                  onChange={(content) => setConfig({ ...config, content })}
                />
              )}

              {activeTab === 'design' && (
                <DesignTab
                  design={config.design}
                  onChange={(design) => setConfig({ ...config, design })}
                />
              )}

              {activeTab === 'colors' && (
                <ColorsTab
                  colors={config.colors}
                  onChange={(colors) => setConfig({ ...config, colors })}
                />
              )}

              {activeTab === 'logo' && (
                <LogoTab
                  logo={config.logo}
                  errorCorrectionLevel={config.design.errorCorrectionLevel}
                  onChange={(logo) => setConfig({ ...config, logo })}
                  onUpdateErrorCorrection={(level) =>
                    setConfig((prev) => ({
                      ...prev,
                      design: { ...prev.design, errorCorrectionLevel: level },
                    }))
                  }
                />
              )}

              {activeTab === 'frame' && (
                <FrameTab
                  frame={config.frame}
                  onChange={(frame) => setConfig({ ...config, frame })}
                />
              )}

              {activeTab === 'text' && (
                <TextTab
                  subText={config.subText}
                  onChange={(subText) => setConfig({ ...config, subText })}
                />
              )}
            </div>

            {/* Quick Next / Prev Tab Navigator Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Langkah {TABS.findIndex((t) => t.id === activeTab) + 1} dari {TABS.length}
              </span>
              <div className="flex items-center gap-2">
                {activeTab !== 'content' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = TABS.findIndex((t) => t.id === activeTab);
                      if (idx > 0) setActiveTab(TABS[idx - 1].id);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Sebelumnya
                  </button>
                )}
                {activeTab !== 'text' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = TABS.findIndex((t) => t.id === activeTab);
                      if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 flex items-center gap-1"
                  >
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Konfigurasi Lengkap!
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Sticky Live Preview + Export Controls */}
        <div className="lg:col-span-5">
          <QrCodePreview
            config={config}
            onSaveToHistory={handleSaveToHistory}
          />
        </div>

      </div>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadConfig={(loaded) => setConfig(loaded)}
      />

    </div>
  );
}
