'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  DEFAULT_BARCODE_CONFIG, 
  BARCODE_FORMATS, 
  BARCODE_PRESET_TEMPLATES, 
  BARCODE_COLOR_PALETTES 
} from '@/constants/barcodePresets';
import { BarcodeConfig, BarcodeFormat } from '@/types/barcode';
import { useToast } from '@/components/common/Toast';
import { 
  Barcode, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Palette, 
  Type, 
  AlertCircle, 
  Sun, 
  Moon, 
  Grid3X3,
  CheckCircle2,
  Share2
} from 'lucide-react';

export function BarcodeGenerator() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<BarcodeConfig>(DEFAULT_BARCODE_CONFIG);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'text'>('content');
  const [backdrop, setBackdrop] = useState<'checker' | 'light' | 'dark'>('checker');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSvgCopied, setIsSvgCopied] = useState<boolean>(false);
  const [exportResolution, setExportResolution] = useState<number>(2); // 1x, 2x, 4x

  // SVG & Canvas refs
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Current format metadata
  const currentFormatMeta = useMemo(() => {
    return BARCODE_FORMATS.find((f) => f.format === config.format) || BARCODE_FORMATS[0];
  }, [config.format]);

  // Validation
  const validation = useMemo(() => {
    return currentFormatMeta.validate(config.value);
  }, [currentFormatMeta, config.value]);

  // Render Barcode via JsBarcode
  useEffect(() => {
    if (!validation.isValid) return;

    try {
      if (svgRef.current) {
        JsBarcode(svgRef.current, config.value, {
          format: config.format,
          lineColor: config.lineColor,
          background: config.background === 'transparent' ? undefined : config.background,
          width: config.width,
          height: config.height,
          displayValue: config.displayValue,
          font: config.font,
          fontSize: config.fontSize,
          fontOptions: config.fontOptions,
          textAlign: config.textAlign,
          textPosition: config.textPosition,
          textMargin: config.textMargin,
          margin: config.margin,
          flat: config.flat,
        });
      }

      if (canvasRef.current) {
        JsBarcode(canvasRef.current, config.value, {
          format: config.format,
          lineColor: config.lineColor,
          background: config.background === 'transparent' ? 'transparent' : config.background,
          width: config.width * exportResolution,
          height: config.height * exportResolution,
          displayValue: config.displayValue,
          font: config.font,
          fontSize: config.fontSize * exportResolution,
          fontOptions: config.fontOptions,
          textAlign: config.textAlign,
          textPosition: config.textPosition,
          textMargin: config.textMargin * exportResolution,
          margin: config.margin * exportResolution,
          flat: config.flat,
        });
      }
    } catch (err) {
      console.warn('JsBarcode render error:', err);
    }
  }, [config, validation.isValid, exportResolution]);

  // Handlers
  const handleFormatChange = (newFormat: BarcodeFormat) => {
    const meta = BARCODE_FORMATS.find((f) => f.format === newFormat);
    setConfig((prev) => ({
      ...prev,
      format: newFormat,
      value: meta ? meta.defaultSample : prev.value,
    }));
  };

  const handleApplyPreset = (template: typeof BARCODE_PRESET_TEMPLATES[0]) => {
    setConfig((prev) => ({
      ...prev,
      format: template.format,
      value: template.value,
    }));
    showToast(`Template "${template.title}" diterapkan!`, 'info');
  };

  const handleApplyPalette = (palette: typeof BARCODE_COLOR_PALETTES[0]) => {
    setConfig((prev) => ({
      ...prev,
      lineColor: palette.line,
      background: palette.bg,
    }));
    showToast(`Palet warna "${palette.name}" aktif`, 'info');
  };

  // Export & Copy Actions
  const handleDownloadPNG = () => {
    if (!canvasRef.current || !validation.isValid) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `barcode-${config.format.toLowerCase()}-${config.value.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Barcode PNG berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal mengunduh gambar PNG.', 'error');
    }
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current || !validation.isValid) return;
    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgRef.current);
      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-${config.format.toLowerCase()}-${config.value.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Barcode SVG (Vector) berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal mengunduh file SVG.', 'error');
    }
  };

  const handleDownloadJPG = () => {
    if (!canvasRef.current || !validation.isValid) return;
    try {
      // Create white background canvas for JPG
      const srcCanvas = canvasRef.current;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = srcCanvas.width;
      exportCanvas.height = srcCanvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = config.background === 'transparent' ? '#ffffff' : config.background;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(srcCanvas, 0, 0);
      }
      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `barcode-${config.format.toLowerCase()}-${config.value.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Barcode JPG berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal mengunduh gambar JPG.', 'error');
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current || !validation.isValid) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setIsCopied(true);
          showToast('Gambar barcode berhasil disalin ke clipboard!', 'success');
          setTimeout(() => setIsCopied(false), 2000);
        } catch {
          showToast('Browser Anda membatasi salin gambar langsung.', 'info');
        }
      });
    } catch {
      showToast('Gagal menyalin gambar.', 'error');
    }
  };

  const handleCopySVG = () => {
    if (!svgRef.current || !validation.isValid) return;
    try {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgRef.current);
      navigator.clipboard.writeText(source);
      setIsSvgCopied(true);
      showToast('Kode SVG barcode berhasil disalin!', 'success');
      setTimeout(() => setIsSvgCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin kode SVG.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Quick Templates Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Template Cepat Siap Pakai:
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Klik salah satu untuk langsung mengisi format dan contoh data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BARCODE_PRESET_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(tpl)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <span>{tpl.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 font-mono">
                  {tpl.format}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {tpl.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid: Editor (Left 7 Cols) + Live Preview (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tabs Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'content'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>1. Format & Nilai</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'style'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>2. Ukuran & Warna</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>3. Tipografi Teks</span>
            </button>
          </div>

          {/* TAB 1: FORMAT & NILAI */}
          {activeTab === 'content' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Format Dropdown Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Pilih Standar Format Barcode:</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                    Kategori: {currentFormatMeta.category}
                  </span>
                </label>
                <select
                  value={config.format}
                  onChange={(e) => handleFormatChange(e.target.value as BarcodeFormat)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BARCODE_FORMATS.map((fmt) => (
                    <option key={fmt.format} value={fmt.format}>
                      {fmt.name} — {fmt.category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {currentFormatMeta.description}
                </p>
              </div>

              {/* Barcode Value Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nilai / Isi Barcode:
                  </label>
                  <span className="text-xs font-mono text-slate-500">
                    {config.value.length} karakter
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={config.value}
                    onChange={(e) => setConfig({ ...config, value: e.target.value })}
                    placeholder={`Contoh: ${currentFormatMeta.defaultSample}`}
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                      !validation.isValid
                        ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20'
                    }`}
                  />
                  {config.value && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, value: '' })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Validation Status Notice */}
                {!validation.isValid ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{validation.error}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Petunjuk: {currentFormatMeta.patternNotice}
                  </p>
                )}
              </div>

              {/* Sample Reset Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, value: currentFormatMeta.defaultSample })}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Isi Sampel Format Ini ({currentFormatMeta.defaultSample})</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: UKURAN & WARNA */}
          {activeTab === 'style' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Color Palettes */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Preset Kombinasi Warna:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BARCODE_COLOR_PALETTES.map((pal, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPalette(pal)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-medium hover:border-blue-500 transition-all text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: pal.line }} />
                        <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: pal.bg }} />
                      </div>
                      <span className="truncate">{pal.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Line & Background Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Warna Garis (Foreground):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.lineColor}
                      onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={config.lineColor}
                      onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Latar Belakang (Background):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.background === 'transparent' ? '#ffffff' : config.background}
                      onChange={(e) => setConfig({ ...config, background: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setConfig({ 
                        ...config, 
                        background: config.background === 'transparent' ? '#ffffff' : 'transparent' 
                      })}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        config.background === 'transparent'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {config.background === 'transparent' ? 'Transparan (Aktif)' : 'Jadikan Transparan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sizing Sliders */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Ketebalan Garis (Width):</span>
                    <span className="font-mono text-slate-500">{config.width}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={config.width}
                    onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tinggi Barcode (Height):</span>
                    <span className="font-mono text-slate-500">{config.height} px</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="5"
                    value={config.height}
                    onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Jarak Tepi (Margin / Padding):</span>
                    <span className="font-mono text-slate-500">{config.margin} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={config.margin}
                    onChange={(e) => setConfig({ ...config, margin: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TIPOGRAFI TEKS */}
          {activeTab === 'text' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              
              {/* Display Value Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Tampilkan Teks Nilai Barcode
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan angka / huruf yang dapat dibaca manusia di bawah atau atas barcode.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, displayValue: !config.displayValue })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    config.displayValue ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      config.displayValue ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {config.displayValue && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Gaya Huruf (Font Family):
                      </label>
                      <select
                        value={config.font}
                        onChange={(e) => setConfig({ ...config, font: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        <option value="monospace">Monospace (Rekomendasi Barcode)</option>
                        <option value="sans-serif">Sans-Serif (Modern / Bersih)</option>
                        <option value="serif">Serif (Klasik / Formal)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Format Teks:
                      </label>
                      <select
                        value={config.fontOptions}
                        onChange={(e) => setConfig({ ...config, fontOptions: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        <option value="bold">Tebal (Bold - Rekomendasi)</option>
                        <option value="">Normal (Regular)</option>
                        <option value="italic">Miring (Italic)</option>
                        <option value="bold italic">Tebal & Miring (Bold Italic)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Posisi Teks:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, textPosition: 'bottom' })}
                          className={`py-2 rounded-xl border text-xs font-semibold ${
                            config.textPosition === 'bottom'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Di Bawah
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, textPosition: 'top' })}
                          className={`py-2 rounded-xl border text-xs font-semibold ${
                            config.textPosition === 'top'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Di Atas
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Perataan Teks (Align):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => setConfig({ ...config, textAlign: align })}
                            className={`py-2 rounded-xl border text-xs font-semibold capitalize ${
                              config.textAlign === align
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Ukuran Huruf (Font Size):</span>
                      <span className="font-mono text-slate-500">{config.fontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="28"
                      step="1"
                      value={config.fontSize}
                      onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Live Preview & Export Studio */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            
            {/* Header Preview & Viewport Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Preview Barcode
                </h3>
              </div>

              {/* Backdrop Viewport Toggles */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setBackdrop('checker')}
                  title="Latar Transparan"
                  className={`p-1.5 rounded-lg transition-all ${
                    backdrop === 'checker' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('light')}
                  title="Latar Terang"
                  className={`p-1.5 rounded-lg transition-all ${
                    backdrop === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('dark')}
                  title="Latar Gelap"
                  className={`p-1.5 rounded-lg transition-all ${
                    backdrop === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barcode Viewport Box */}
            <div
              className={`relative rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] transition-all overflow-x-auto border border-slate-200/80 dark:border-slate-800 ${
                backdrop === 'checker'
                  ? 'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px]'
                  : backdrop === 'light'
                  ? 'bg-slate-100'
                  : 'bg-slate-950'
              }`}
            >
              {validation.isValid ? (
                <>
                  <svg ref={svgRef} className="max-w-full h-auto transition-transform" />
                  {/* Hidden Canvas for High-Resolution PNG/JPG Export */}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="text-center p-6 space-y-2 text-rose-500">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <p className="text-xs font-semibold">{validation.error}</p>
                </div>
              )}
            </div>

            {/* Quick Action Bar (Copy Image & Copy SVG) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!validation.isValid}
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Gambar'}</span>
              </button>

              <button
                type="button"
                disabled={!validation.isValid}
                onClick={handleCopySVG}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
              >
                {isSvgCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isSvgCopied ? 'Kode SVG Tersalin!' : 'Salin Kode SVG'}</span>
              </button>
            </div>

            {/* Download Options */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Resolution Multiplier */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Resolusi Unduhan PNG:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  {[
                    { label: '1x Web', val: 1 },
                    { label: '2x HD', val: 2 },
                    { label: '4x Cetak', val: 4 },
                  ].map((res) => (
                    <button
                      key={res.val}
                      type="button"
                      onClick={() => setExportResolution(res.val)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                        exportResolution === res.val
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!validation.isValid}
                  onClick={handleDownloadPNG}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  disabled={!validation.isValid}
                  onClick={handleDownloadSVG}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Format Vektor untuk Desain Percetakan"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG (Vector)</span>
                </button>

                <button
                  type="button"
                  disabled={!validation.isValid}
                  onClick={handleDownloadJPG}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JPG</span>
                </button>
              </div>

            </div>

          </div>

          {/* Format Spec Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Standar Format {currentFormatMeta.name}</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Dapat langsung dipindai menggunakan scanner barcode fisik (laser/CCD handheld), scanner kasir POS, maupun kamera smartphone iOS & Android.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
