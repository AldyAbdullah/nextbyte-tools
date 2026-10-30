'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CompleteQrConfig, 
  ExportFormat, 
  ExportResolution 
} from '@/types/qrcode';
import { formatQrPayload } from '@/lib/qrDataFormatter';
import { 
  renderCompositeCanvas, 
  downloadCompositeImage, 
  copyCanvasToClipboard 
} from '@/lib/exportQrCanvas';
import { useToast } from '@/components/common/Toast';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  Grid3X3
} from 'lucide-react';

interface QrStylingInstance {
  update: (options: Record<string, unknown>) => void;
  download: (options: { name: string; extension: string }) => Promise<void>;
  append: (container: HTMLElement) => void;
}

interface QrCodePreviewProps {
  config: CompleteQrConfig;
  onSaveToHistory?: () => void;
}

export function QrCodePreview({ config, onSaveToHistory }: QrCodePreviewProps) {
  const { showToast } = useToast();
  
  // Hidden container for qr-code-styling internal rendering
  const qrRef = useRef<HTMLDivElement>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [qrCodeInstance, setQrCodeInstance] = useState<QrStylingInstance | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Export Settings
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [resolution, setResolution] = useState<ExportResolution>(2);
  const [transparentBg, setTransparentBg] = useState(false);
  
  // Preview Backdrop Color (Checkerboard, Light, Dark)
  const [previewBackdrop, setPreviewBackdrop] = useState<'checker' | 'light' | 'dark'>('checker');

  const rawPayload = formatQrPayload(config.content);

  // 1. Initialize QRCodeStyling dynamically on client side
  useEffect(() => {
    let isMounted = true;

    async function initQr() {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;

        const instance = new QRCodeStyling({
          width: 300,
          height: 300,
          data: rawPayload,
          dotsOptions: {
            type: config.design.dotsType,
            color: config.colors.foregroundColor,
          },
          cornersSquareOptions: {
            type: config.design.cornersSquareType,
            color: config.colors.customCorners ? config.colors.cornersSquareColor : config.colors.foregroundColor,
          },
          cornersDotOptions: {
            type: config.design.cornersDotType,
            color: config.colors.customCorners ? config.colors.cornersDotColor : config.colors.foregroundColor,
          },
          backgroundOptions: {
            color: config.colors.isBackgroundTransparent ? 'rgba(0,0,0,0)' : config.colors.backgroundColor,
          },
          image: config.logo.logoDataUrl || undefined,
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: config.logo.logoMargin,
            imageSize: config.logo.logoSize,
            hideBackgroundDots: config.logo.logoBackground !== 'transparent',
          },
          qrOptions: {
            errorCorrectionLevel: config.design.errorCorrectionLevel,
          },
        });

        if (isMounted) {
          setQrCodeInstance(instance as unknown as QrStylingInstance);
          if (qrRef.current) {
            qrRef.current.innerHTML = '';
            instance.append(qrRef.current);
          }
        }
      } catch (err) {
        console.error('Failed to init QRCodeStyling:', err);
      }
    }

    initQr();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Draw to the live preview canvas
  const drawLivePreview = useCallback(async () => {
    if (!qrRef.current) return;
    const internalCanvas = qrRef.current.querySelector('canvas');
    if (!internalCanvas) return;

    try {
      const compositeCanvas = await renderCompositeCanvas({
        qrCanvas: internalCanvas,
        config,
        resolution: 1, // 1x for live preview viewport
        transparentBackground: config.colors.isBackgroundTransparent,
      });

      const target = livePreviewCanvasRef.current;
      if (target) {
        target.width = compositeCanvas.width;
        target.height = compositeCanvas.height;
        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, target.width, target.height);
          ctx.drawImage(compositeCanvas, 0, 0);
        }
      }
    } catch (err) {
      console.warn('Preview canvas draw warning:', err);
    }
  }, [config]);

  // 3. Update QR Code Styling when config changes
  useEffect(() => {
    if (!qrCodeInstance) return;

    qrCodeInstance.update({
      data: rawPayload,
      dotsOptions: {
        type: config.design.dotsType,
        color: config.colors.foregroundColor,
      },
      cornersSquareOptions: {
        type: config.design.cornersSquareType,
        color: config.colors.customCorners ? config.colors.cornersSquareColor : config.colors.foregroundColor,
      },
      cornersDotOptions: {
        type: config.design.cornersDotType,
        color: config.colors.customCorners ? config.colors.cornersDotColor : config.colors.foregroundColor,
      },
      backgroundOptions: {
        color: config.colors.isBackgroundTransparent ? 'rgba(0,0,0,0)' : config.colors.backgroundColor,
      },
      image: config.logo.logoDataUrl || undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: config.logo.logoMargin,
        imageSize: config.logo.logoSize,
        hideBackgroundDots: config.logo.logoBackground !== 'transparent',
      },
      qrOptions: {
        errorCorrectionLevel: config.design.errorCorrectionLevel,
      },
    });

    // Render composite preview on canvas after short delay for internal canvas paint
    const timer = setTimeout(() => {
      drawLivePreview();
    }, 60);

    return () => clearTimeout(timer);
  }, [config, qrCodeInstance, rawPayload, drawLivePreview]);

  // 4. Handle Download
  const handleDownload = async () => {
    if (!qrRef.current) return;
    const internalCanvas = qrRef.current.querySelector('canvas');
    if (!internalCanvas) return;

    setIsExporting(true);

    try {
      if (exportFormat === 'svg') {
        // SVG direct export
        if (qrCodeInstance) {
          await qrCodeInstance.download({
            name: `nextbyte-qr-${Date.now()}`,
            extension: 'svg',
          });
        }
      } else {
        // High resolution composite canvas export
        const highResCanvas = await renderCompositeCanvas({
          qrCanvas: internalCanvas,
          config,
          resolution,
          transparentBackground: transparentBg || config.colors.isBackgroundTransparent,
        });

        await downloadCompositeImage(
          highResCanvas,
          exportFormat,
          `nextbyte-qr-${Date.now()}`
        );
      }

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      showToast(`QR Code berhasil diunduh (${exportFormat.toUpperCase()} • ${resolution}x)!`, 'success');

      if (onSaveToHistory) {
        onSaveToHistory();
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh QR Code. Silakan coba lagi.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Copy image to clipboard
  const handleCopy = async () => {
    if (!qrRef.current) return;
    const internalCanvas = qrRef.current.querySelector('canvas');
    if (!internalCanvas) return;

    try {
      const highResCanvas = await renderCompositeCanvas({
        qrCanvas: internalCanvas,
        config,
        resolution: 2,
        transparentBackground: false,
      });

      const success = await copyCanvasToClipboard(highResCanvas);
      if (success) {
        setCopied(true);
        showToast('Gambar QR Code berhasil disalin ke clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      } else {
        showToast('Browser Anda tidak mendukung salin gambar ke clipboard.', 'info');
      }
    } catch {
      showToast('Gagal menyalin gambar.', 'error');
    }
  };

  return (
    <div className="space-y-5 sticky top-24">
      
      {/* Preview Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        
        {/* Preview Header & Backdrop Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Preview
            </h3>
          </div>

          {/* Backdrop toggle pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setPreviewBackdrop('checker')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewBackdrop === 'checker' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Checkerboard (Transparansi)"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewBackdrop('light')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewBackdrop === 'light' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Light Background"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewBackdrop('dark')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                previewBackdrop === 'dark' ? 'bg-white dark:bg-slate-900 text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Dark Background"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hidden qr-code-styling mount container */}
        <div ref={qrRef} className="hidden" aria-hidden="true" />

        {/* Center Stage Live Canvas Display */}
        <div className={`my-5 py-6 px-4 rounded-2xl flex items-center justify-center transition-colors min-h-[360px] ${
          previewBackdrop === 'checker' 
            ? 'bg-checkerboard border border-slate-200/80 dark:border-slate-800/80' 
            : previewBackdrop === 'light'
            ? 'bg-slate-100 border border-slate-200'
            : 'bg-slate-950 border border-slate-800'
        }`}>
          <canvas
            ref={livePreviewCanvasRef}
            className="max-w-full h-auto drop-shadow-md rounded-2xl transition-transform hover:scale-[1.02]"
            style={{ maxHeight: '340px' }}
          />
        </div>

        {/* Payload Summary Bar */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 truncate max-w-[80%]">
            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:border-slate-800">
              {config.content.type}
            </span>
            <span className="truncate font-mono">{rawPayload}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium shrink-0 transition-colors ml-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>

      </div>

      {/* Export Options & Download Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Pengaturan Unduh & Resolusi
        </h4>

        {/* Format Selector Pills */}
        <div className="grid grid-cols-3 gap-2">
          {(['png', 'svg', 'jpg'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setExportFormat(fmt)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase border transition-all ${
                exportFormat === fmt
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Resolution Selector (PNG & JPG) */}
        {exportFormat !== 'svg' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Ukuran Resolusi Export:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {resolution === 1 ? '300px (Standar)' : resolution === 2 ? '600px (HD 2x)' : '1200px (Print 4x)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { res: 1, label: '1x (Web)' },
                { res: 2, label: '2x (HD)' },
                { res: 4, label: '4x (Cetak)' },
              ].map(({ res, label }) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res as ExportResolution)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                    resolution === res
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transparent BG Toggle for PNG */}
        {exportFormat === 'png' && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Latar Belakang Transparan
            </span>
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}

        {/* Primary Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isExporting ? 'Memproses File...' : `Download ${exportFormat.toUpperCase()}`}</span>
        </button>

      </div>

    </div>
  );
}
