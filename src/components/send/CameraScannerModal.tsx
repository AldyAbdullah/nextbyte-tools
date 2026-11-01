'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerModalProps {
  onScan: (scannedPin: string) => void;
  onClose: () => void;
}

export function CameraScannerModal({ onScan, onClose }: CameraScannerModalProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'nextbyte-qr-reader';
  const hasScannedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    hasScannedRef.current = false;

    async function startScanner() {
      try {
        setIsInitializing(true);
        setErrorMessage('');

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Back camera on mobile
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              const boxSize = Math.floor(minDim * 0.7);
              return { width: boxSize, height: boxSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // Extract PIN from URL or raw text
            let pin = decodedText.trim();
            try {
              if (pin.includes('http://') || pin.includes('https://')) {
                const url = new URL(pin);
                const queryPin = url.searchParams.get('pin') || url.searchParams.get('room');
                if (queryPin) pin = queryPin;
              }
            } catch {
              // use raw text
            }

            // Haptic vibration feedback on mobile
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate(80);
              } catch {}
            }

            // Stop scanner and notify parent
            html5QrCode
              .stop()
              .catch(() => {})
              .finally(() => {
                onScan(pin.toUpperCase());
              });
          },
          () => {
            // Frame scanner heartbeat - ignore scan misses
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsInitializing(false);
        const errStr = err instanceof Error ? err.message : String(err);
        if (errStr.toLowerCase().includes('permission') || errStr.toLowerCase().includes('notallowed')) {
          setErrorMessage('Izin kamera tidak diberikan. Silakan izinkan akses kamera di browser Anda.');
        } else {
          setErrorMessage('Tidak dapat mengakses kamera belakang perangkat.');
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  const handleClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Scan QR Kamera</span>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Arahkan ke QR Code di Layar Laptop
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Posisikan QR Code di dalam kotak pemindai untuk terhubung otomatis.
          </p>
        </div>

        {/* Viewfinder Container */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-slate-200 dark:border-slate-800 shadow-inner">
          <div id={containerId} className="w-full h-full" />

          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white space-y-2 p-4">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs font-medium">Membuka kamera...</span>
            </div>
          )}

          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs text-slate-300 leading-relaxed break-words [overflow-wrap:anywhere]">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Atau Anda juga bisa memasukkan 4-digit PIN secara manual di halaman utama.
        </div>

        <button
          onClick={handleClose}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
        >
          Tutup Pemindai
        </button>
      </div>
    </div>
  );
}
