'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, PenTool, Upload, Type, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (imageDataUrl: string) => void;
}

export function SignatureModal({ isOpen, onClose, onApplySignature }: SignatureModalProps) {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type state
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<'font-dancing' | 'font-greatvibes' | 'font-caveat' | 'font-sacramento'>('font-dancing');

  // Upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || tab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 460 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;
  }, [isOpen, tab, penColor]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Convert typed text into transparent PNG
  const renderTypedSignatureToPng = (): string | null => {
    if (!typedName.trim()) return null;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 180;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontCss = 'italic 52px "Brush Script MT", cursive';
    if (selectedFont === 'font-greatvibes') fontCss = 'italic 54px "Segoe Script", cursive';
    if (selectedFont === 'font-caveat') fontCss = '50px "Comic Sans MS", cursive';
    if (selectedFont === 'font-sacramento') fontCss = 'italic 56px "Lucida Handwriting", cursive';

    ctx.font = fontCss;
    ctx.fillText(typedName, 250, 90);

    return tempCanvas.toDataURL('image/png');
  };

  const handleSave = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onApplySignature(canvas.toDataURL('image/png'));
      onClose();
    } else if (tab === 'upload') {
      if (uploadedImageUrl) {
        onApplySignature(uploadedImageUrl);
        onClose();
      }
    } else if (tab === 'type') {
      const dataUrl = renderTypedSignatureToPng();
      if (dataUrl) {
        onApplySignature(dataUrl);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-left space-y-5 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Tanda Tangan & Stempel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih metode tanda tangan digital Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setTab('draw')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              tab === 'draw'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Gores / Gambar</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('type')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              tab === 'type'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Ketik Nama</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              tab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah PNG</span>
          </button>
        </div>

        {/* Ink Color Picker (for Draw & Type) */}
        {tab !== 'upload' && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-600 dark:text-slate-400">Warna Tinta:</span>
            <div className="flex items-center gap-2">
              {[
                { color: '#000000', label: 'Hitam' },
                { color: '#1d4ed8', label: 'Biru Resmi' },
                { color: '#b91c1c', label: 'Merah' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setPenColor(c.color)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    penColor === c.color
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content TAB 1: DRAW */}
        {tab === 'draw' && (
          <div className="space-y-2">
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ width: '100%', height: '180px', touchAction: 'none' }}
                className="cursor-crosshair block"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
                  Tanda tangan di sini dengan jari atau mouse
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Latar transparan otomatis disimpan ke PDF</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bersihkan</span>
              </button>
            </div>
          </div>
        )}

        {/* Content TAB 2: TYPE */}
        {tab === 'type' && (
          <div className="space-y-3">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Ketik Nama Anda (misal: Budi Santoso)..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {typedName.trim() && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'font-dancing', label: 'Cursive Elegant', style: 'italic font-serif text-xl' },
                  { id: 'font-greatvibes', label: 'Classic Script', style: 'italic tracking-wider text-xl' },
                  { id: 'font-caveat', label: 'Modern Casual', style: 'font-sans font-medium text-lg' },
                  { id: 'font-sacramento', label: 'Calligraphy Flow', style: 'italic tracking-wide text-xl' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.id as typeof selectedFont)}
                    style={{ color: penColor }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedFont === f.id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`truncate ${f.style}`}>{typedName}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{f.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content TAB 3: UPLOAD */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-950">
              <Upload className="w-8 h-8 text-blue-500 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Pilih Gambar Tanda Tangan / Stempel
              </div>
              <div className="text-[11px] text-slate-400">
                Format PNG transparan disarankan (atau JPG)
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {uploadedImageUrl && (
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedImageUrl} alt="Pratinjau Stempel" className="max-h-24 object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              (tab === 'draw' && !hasDrawn) ||
              (tab === 'type' && !typedName.trim()) ||
              (tab === 'upload' && !uploadedImageUrl)
            }
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan ke PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
