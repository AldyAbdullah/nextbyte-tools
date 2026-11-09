'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Stamp, ImagePlus, Check, Sparkles, Upload } from 'lucide-react';

interface StampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStamp: (imageDataUrl: string, width: number, height: number) => void;
}

const PRESET_STAMPS = [
  { label: 'LUNAS / PAID', text: 'LUNAS', subtext: 'PAID & VERIFIED', color: '#dc2626' },
  { label: 'APPROVED', text: 'APPROVED', subtext: 'DISETUJUI', color: '#16a34a' },
  { label: 'DITERIMA', text: 'DITERIMA', subtext: 'RECEIVED', color: '#2563eb' },
  { label: 'CONFIDENTIAL', text: 'CONFIDENTIAL', subtext: 'DOKUMEN RAHASIA', color: '#b91c1c' },
  { label: 'DRAFT', text: 'DRAFT', subtext: 'KONSEP DOKUMEN', color: '#64748b' },
  { label: 'ASLI / ORIGINAL', text: 'ORIGINAL', subtext: 'DOKUMEN ASLI', color: '#d97706' },
];

export function StampModal({ isOpen, onClose, onApplyStamp }: StampModalProps) {
  const [activeTab, setActiveTab] = useState<'stamp' | 'upload'>('stamp');

  // Stamp custom state
  const [stampText, setStampText] = useState('LUNAS');
  const [stampSubtext, setStampSubtext] = useState('PAID & VERIFIED');
  const [stampColor, setStampColor] = useState('#dc2626');
  const [stampDate, setStampDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  // Upload image state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedDimensions, setUploadedDimensions] = useState<{ width: number; height: number }>({
    width: 150,
    height: 150,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate rubber stamp preview onto HTML5 canvas
  const renderStampCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 280;
    const height = 130;
    canvas.width = width * 2; // retina sharp
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    // Apply slight tilt (-6 degrees) for authentic physical rubber stamp look
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Outer rounded rectangle border
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, width - 16, height - 16, 12);
    ctx.stroke();

    // Inner thin border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, width - 28, height - 28, 8);
    ctx.stroke();

    // Main Stamp Text
    ctx.fillStyle = stampColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 24px "Arial Black", "Impact", sans-serif';
    ctx.fillText(stampText.toUpperCase(), width / 2, height / 2 - 14);

    // Divider line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, height / 2 + 6);
    ctx.lineTo(width - 35, height / 2 + 6);
    ctx.stroke();

    // Subtext & Date
    ctx.font = 'bold 11px sans-serif';
    ctx.letterSpacing = '1px';
    const bottomLine = `${stampSubtext.toUpperCase()} • ${stampDate}`;
    ctx.fillText(bottomLine, width / 2, height / 2 + 22);

    ctx.restore();
  }, [stampText, stampSubtext, stampColor, stampDate]);

  useEffect(() => {
    if (isOpen && activeTab === 'stamp') {
      renderStampCanvas();
    }
  }, [isOpen, activeTab, renderStampCanvas]);

  if (!isOpen) return null;

  // Handle preset stamp selection
  const handleSelectPreset = (p: (typeof PRESET_STAMPS)[0]) => {
    setStampText(p.text);
    setStampSubtext(p.subtext);
    setStampColor(p.color);
  };

  // Handle image upload
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImageUrl(result);
      const img = new Image();
      img.onload = () => {
        // Normalize aspect ratio to maximum 200px width
        const aspect = img.width / img.height;
        const normWidth = 160;
        const normHeight = Math.round(normWidth / aspect);
        setUploadedDimensions({ width: normWidth, height: normHeight });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Submit stamp or image to parent
  const handleApply = () => {
    if (activeTab === 'stamp') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onApplyStamp(dataUrl, 160, 80);
      onClose();
    } else {
      if (!uploadedImageUrl) return;
      onApplyStamp(uploadedImageUrl, uploadedDimensions.width, uploadedDimensions.height);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Stempel & Sisipkan Gambar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bubuhkan cap kantor, stempel bisnis, logo instansi, atau materai
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

        {/* Tab Switcher */}
        <div className="flex p-1.5 mx-5 mt-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('stamp')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stamp'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stamp className="w-4 h-4 text-amber-500" />
            <span>Cap & Stempel Cepat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImagePlus className="w-4 h-4 text-blue-500" />
            <span>Upload Logo / Gambar</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {activeTab === 'stamp' ? (
            <div className="space-y-4">
              {/* Live Canvas Preview */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <canvas
                  ref={canvasRef}
                  style={{ width: '260px', height: '120px' }}
                  className="rounded-lg shadow-sm bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Hasil stempel bergaya cap karet transparan
                </span>
              </div>

              {/* Preset Stamps */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Preset Stempel Cepat:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_STAMPS.map((p) => {
                    const isSelected = stampText === p.text && stampColor === p.color;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {p.text}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                          {p.subtext}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Teks Utama Cap:
                  </label>
                  <input
                    type="text"
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value)}
                    placeholder="Contoh: LUNAS, ASLI"
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Keterangan Bawah:
                  </label>
                  <input
                    type="text"
                    value={stampSubtext}
                    onChange={(e) => setStampSubtext(e.target.value)}
                    placeholder="Contoh: PT MAJU BERSAMA"
                    maxLength={25}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Color & Date Pickers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Warna Tinta:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#dc2626', '#2563eb', '#16a34a', '#1e293b', '#d97706', '#7c3aed'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setStampColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          stampColor === c ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Tanggal:
                  </span>
                  <input
                    type="text"
                    value={stampDate}
                    onChange={(e) => setStampDate(e.target.value)}
                    className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-900 dark:text-white text-center font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              {uploadedImageUrl ? (
                <div className="space-y-3">
                  <div className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[180px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImageUrl}
                      alt="Preview Gambar"
                      style={{
                        maxWidth: '220px',
                        maxHeight: '160px',
                        objectFit: 'contain',
                      }}
                      className="rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImageUrl(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-center text-xs text-slate-500">
                    Gambar siap disematkan. Anda dapat menggeser dan menarik sudutnya untuk mengubah ukuran di atas PDF.
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Pilih atau Tarik File Gambar ke Sini
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Mendukung PNG (transparan), JPG, WebP, atau SVG. Cocok untuk logo kantor, pasfoto, materai, dan stempel digital.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={activeTab === 'upload' && !uploadedImageUrl}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{activeTab === 'stamp' ? 'Bubuhkan Stempel' : 'Sisipkan Gambar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
