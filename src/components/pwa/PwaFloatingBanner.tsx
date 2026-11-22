'use client';

import React from 'react';
import Image from 'next/image';
import { Download, X, Sparkles } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

export function PwaFloatingBanner() {
  const { isInstalled, isBannerDismissed, dismissBanner, installApp } = usePwa();

  // If already installed or user dismissed it, don't show
  if (isInstalled || isBannerDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-500/30 dark:border-blue-400/20 shadow-2xl shadow-blue-500/10 flex items-center justify-between gap-3 text-left">
        {/* App Icon */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
            <Image
              src="/icons/icon-192x192.png"
              alt="NextByte Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
          </div>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              Pasang Aplikasi NextByte
            </h4>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
              PWA
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Akses instan dari Layar Utama, ringan & hemat kuota
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={installApp}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={dismissBanner}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tutup banner"
            aria-label="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
