'use client';

import React from 'react';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

interface PwaNavButtonProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export function PwaNavButton({ variant = 'desktop', className = '' }: PwaNavButtonProps) {
  const { isInstalled, installApp } = usePwa();

  if (isInstalled) {
    if (variant === 'mobile') {
      return (
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold ${className}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Aplikasi Terpasang</span>
        </div>
      );
    }
    return (
      <div
        title="NextByte Tools sudah terpasang di perangkat Anda"
        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Terpasang</span>
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={installApp}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Pasang Aplikasi Android (PWA)</span>
        </div>
        <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
          <Download className="w-3 h-3" />
          <span>Install</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={installApp}
      title="Pasang NextByte sebagai aplikasi di Android atau Komputer Anda"
      className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
}
