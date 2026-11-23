'use client';

import React from 'react';
import Image from 'next/image';
import { Download, Smartphone, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

export function PwaHomeBanner() {
  const { isInstalled, installApp } = usePwa();

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-500/25 p-4 sm:p-8 shadow-xl shadow-blue-500/5 text-left">
      {/* Background Decorative Subtle Accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Col: Info & Benefits */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold">
            <Smartphone className="w-3 h-3 text-blue-400" />
            <span>Aplikasi Android & Desktop PWA</span>
          </div>

          <h3 className="text-base sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
            Pasang NextByte di HP Android Tanpa Play Store
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Buka langsung dari layar utama HP tanpa buka browser. Ukuran super ringan (&lt; 1 MB), hemat kuota, dan secepat aplikasi native.
          </p>

          {/* Key Advantages Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
              <Zap className="w-3 h-3 text-amber-400" /> Ringan &lt; 1 MB
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Bebas Iklan
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
              <Smartphone className="w-3 h-3 text-blue-400" /> Akses 1-Ketuk
            </span>
          </div>
        </div>

        {/* Right Col: Compact Action Tile */}
        <div className="w-full md:w-auto shrink-0 flex items-center justify-start md:justify-end">
          <div className="w-full sm:w-auto p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
              <Image
                src="/icons/icon-192x192.png"
                alt="NextByte App Icon"
                width={36}
                height={36}
                className="rounded-lg object-contain"
              />
            </div>

            <div className="flex-1 sm:flex-initial">
              <div className="font-bold text-xs text-white">NextByte App</div>
              <div className="text-[10px] text-slate-400">PWA Mandiri</div>
            </div>

            <div className="shrink-0">
              {isInstalled ? (
                <div className="py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terpasang</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
