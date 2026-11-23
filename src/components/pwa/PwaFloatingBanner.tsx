'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Download, X } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

export function PwaFloatingBanner() {
  const pathname = usePathname();
  const { isInstalled, isBannerDismissed, dismissBanner, installApp } = usePwa();

  // If already installed or dismissed, hide
  if (isInstalled || isBannerDismissed) return null;

  // Do not show floating banner on full-screen editing studio pages to prevent taking up canvas/editor space
  const isStudioPage =
    pathname.startsWith('/tools/pdf-editor') ||
    pathname === '/send' ||
    pathname.startsWith('/send') ||
    pathname.startsWith('/receive') ||
    pathname.startsWith('/tools/ai-job-finder') ||
    pathname.startsWith('/tools/mail-merge') ||
    pathname.startsWith('/tools/word-page-number') ||
    pathname.startsWith('/tools/caption-generator') ||
    pathname.startsWith('/tools/image-background-remover');

  if (isStudioPage) return null;

  return (
    <aside
      aria-label="Pasang Aplikasi NextByte"
      className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] sm:max-w-sm animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-xl shadow-black/25 border border-slate-700/60 backdrop-blur-md">
        {/* Compact App Icon */}
        <div className="w-5 h-5 rounded-md overflow-hidden bg-white/10 shrink-0 flex items-center justify-center p-0.5">
          <Image
            src="/icons/icon-192x192.png"
            alt="NextByte App Icon"
            width={18}
            height={18}
            className="rounded object-contain"
          />
        </div>

        {/* Minimalist Text */}
        <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap">
          Pasang di HP Android
        </span>

        {/* Compact Install Pill Action */}
        <button
          type="button"
          onClick={installApp}
          className="px-2.5 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Download className="w-3 h-3" />
          <span>Install</span>
        </button>

        {/* Tiny Dismiss Button */}
        <button
          type="button"
          onClick={dismissBanner}
          className="p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0 ml-0.5"
          title="Tutup pemberitahuan"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
