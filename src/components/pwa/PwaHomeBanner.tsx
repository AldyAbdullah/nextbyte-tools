'use client';

import React from 'react';
import Image from 'next/image';
import { Download, Smartphone, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

export function PwaHomeBanner() {
  const { isInstalled, installApp } = usePwa();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-500/30 p-6 sm:p-10 shadow-2xl shadow-blue-500/10 text-left">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Info & Benefits */}
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>Progressive Web App (PWA) Android & Desktop</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
            Gunakan NextByte Lebih Cepat Lewat Aplikasi Android
          </h3>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Pasang langsung ke layar utama smartphone Android Anda tanpa perlu unduh dari Google Play Store. Sangat ringan, hemat memori ponsel, dan terbuka instan layaknya aplikasi native.
          </p>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ukuran Super Ringan &lt; 1 MB</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Aman & Tanpa Iklan</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Akses Cepat 1-Ketuk</span>
            </div>
          </div>
        </div>

        {/* Right Col: Action & Mockup Visual */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
          <div className="w-full max-w-xs p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-md p-2 flex items-center justify-center">
              <Image
                src="/icons/icon-192x192.png"
                alt="NextByte App Icon"
                width={56}
                height={56}
                className="rounded-xl object-contain"
              />
            </div>

            <div>
              <div className="font-bold text-sm text-white">NextByte Tools Web App</div>
              <div className="text-[11px] text-slate-400">Versi 1.0 • Android / Desktop PWA</div>
            </div>

            {isInstalled ? (
              <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplikasi Terpasang</span>
              </div>
            ) : (
              <button
                onClick={installApp}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>Pasang Aplikasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <p className="text-[10px] text-slate-400">
              Kompatibel dengan Google Chrome, Samsung Internet, Microsoft Edge, dan Safari.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
