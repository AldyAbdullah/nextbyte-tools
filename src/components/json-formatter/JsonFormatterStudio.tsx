'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Download,
  Trash2,
  Check,
  AlertCircle,
  Minimize2,
  Maximize2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';

const SAMPLE_JSON = `{
  "nama_aplikasi": "NextByte Tools",
  "versi": "2.4.0",
  "status": "aktif",
  "fitur_unggulan": [
    "PDF Editor & OCR",
    "Gabung & Pisah PDF",
    "Kompres PDF",
    "Gambar ke PDF"
  ],
  "pengaturan": {
    "tema": "dark",
    "bahasa": "id-ID",
    "maksimal_ukuran_mb": 100,
    "privasi": {
      "mode_lokal": true,
      "enkripsi_end_to_end": true
    }
  },
  "pengembang": {
    "tim": "NextByte Dev Team",
    "lokasi": "Indonesia"
  }
}`;

// Recursive JSON Tree Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonTreeNode({ keyName, value, isLast }: { keyName?: string; value: any; isLast?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isContainer = isObject || isArray;

  const renderValue = (val: unknown) => {
    if (val === null) return <span className="text-rose-500 font-bold">null</span>;
    if (typeof val === 'boolean') {
      return <span className="text-amber-500 font-bold">{val ? 'true' : 'false'}</span>;
    }
    if (typeof val === 'number') {
      return <span className="text-emerald-500 font-mono">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="text-sky-500 break-all font-mono">&quot;{val}&quot;</span>;
    }
    return String(val);
  };

  if (!isContainer) {
    return (
      <div className="font-mono text-xs py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded px-1 flex items-start gap-1">
        {keyName && <span className="text-purple-600 dark:text-purple-400 font-semibold shrink-0">&quot;{keyName}&quot;:</span>}
        <span>{renderValue(value)}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    );
  }

  const keys = Object.keys(value);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  return (
    <div className="font-mono text-xs py-0.5">
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded px-1 select-none"
      >
        <button type="button" className="text-slate-400 hover:text-slate-600">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {keyName && <span className="text-purple-600 dark:text-purple-400 font-semibold">&quot;{keyName}&quot;:</span>}
        <span className="text-slate-500 font-bold">{openBracket}</span>
        {collapsed && (
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500">
            {keys.length} item
          </span>
        )}
        {collapsed && <span className="text-slate-500 font-bold">{closeBracket}</span>}
      </div>

      {!collapsed && (
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 ml-2">
          {keys.map((k, idx) => (
            <JsonTreeNode
              key={k}
              keyName={isArray ? undefined : k}
              value={value[k]}
              isLast={idx === keys.length - 1}
            />
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="pl-1 text-slate-500 font-bold">
          {closeBracket}
          {!isLast && <span className="text-slate-400">,</span>}
        </div>
      )}
    </div>
  );
}

export function JsonFormatterStudio() {
  const { showToast } = useToast();

  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'formatted' | 'tree'>('formatted');
  const [copied, setCopied] = useState(false);

  // Validation state
  const parseJson = () => {
    if (!inputJson.trim()) {
      return { valid: true, data: null, error: null };
    }
    try {
      const data = JSON.parse(inputJson);
      return { valid: true, data, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sintaks JSON tidak valid';
      return { valid: false, data: null, error: msg };
    }
  };

  const parsed = parseJson();

  // Formatted Output
  const getFormattedJson = (): string => {
    if (!parsed.valid || parsed.data === null) return '';
    return JSON.stringify(parsed.data, null, indentSize === 0 ? undefined : indentSize);
  };

  const handleBeautify = (spaces: number) => {
    setIndentSize(spaces);
    if (!parsed.valid) {
      showToast('Perbaiki sintaks JSON yang error terlebih dahulu.', 'error');
      return;
    }
    showToast(`Diformat rapi (${spaces === 0 ? 'Minify' : spaces + ' Spasi'})`, 'success');
  };

  const handleMinify = () => {
    setIndentSize(0);
    showToast('JSON berhasil dipadatkan (Minified)!', 'success');
  };

  const copyToClipboard = async () => {
    const text = getFormattedJson() || inputJson;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      showToast('JSON berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin teks.', 'error');
    }
  };

  const handleDownload = () => {
    const text = getFormattedJson() || inputJson;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File data.json berhasil diunduh.', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Validation Status Indicator */}
        <div className="flex items-center gap-2">
          {parsed.valid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Check className="w-3.5 h-3.5" />
              Sintaks JSON Valid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              Error Sintaks
            </span>
          )}

          <button
            type="button"
            onClick={() => setInputJson(SAMPLE_JSON)}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline ml-2"
          >
            Muat Contoh JSON
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleBeautify(2)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>2 Spasi</span>
          </button>
          <button
            type="button"
            onClick={() => handleBeautify(4)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>4 Spasi</span>
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={copyToClipboard}
            className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>
          <button
            type="button"
            onClick={() => setInputJson('')}
            title="Bersihkan"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Alert Box */}
      {!parsed.valid && parsed.error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <div>
            <strong>Kesalahan Sintaks JSON:</strong> {parsed.error}
          </div>
        </div>
      )}

      {/* Editor & Viewer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Pane: Raw JSON Input */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Input JSON Mentah:</span>
            <span className="font-mono text-[11px] font-normal lowercase">
              {inputJson.length} karakter
            </span>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Tempelkan atau ketik JSON di sini..."
            className="w-full h-[520px] p-3 font-mono text-xs text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Right Pane: Formatted / Tree View */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col space-y-2">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('formatted')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'formatted'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Teks Rapi (Code)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tree')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tree'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tree View (Hierarki)
              </button>
            </div>
          </div>

          {/* Viewport */}
          <div className="w-full h-[520px] overflow-auto p-3 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            {parsed.valid && parsed.data !== null ? (
              activeTab === 'formatted' ? (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all">
                  {getFormattedJson()}
                </pre>
              ) : (
                <div className="space-y-1">
                  <JsonTreeNode value={parsed.data} isLast />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <FileCode2 className="w-8 h-8 mb-2 opacity-50" />
                <span>Masukkan JSON yang valid untuk melihat pratinjau.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
