'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { usePwa } from '@/context/PwaContext';

export function PwaInstallGuideModal() {
  const { showGuideModal, setShowGuideModal, platform, installApp, isInstallable, isInstalled } = usePwa();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(
    platform === 'ios' ? 'ios' : platform === 'desktop' ? 'desktop' : 'android'
  );

  if (!showGuideModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/20 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1.5 shrink-0">
              <Image
                src="/icons/icon-192x192.png"
                alt="NextByte Tools"
                width={36}
                height={36}
                className="rounded-xl object-contain"
              />
            </div>
            <div>
              <h3 id="pwa-install-title" className="text-base font-bold text-slate-900 dark:text-white">
                Pasang NextByte Web App
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses cepat, ringan &lt; 1MB, langsung dari Layar Utama
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuideModal(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'android'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'ios'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-sm leading-none">🍎</span>
            <span>iPhone / iPad</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'desktop'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Komputer / PC</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Aplikasi Sudah Terpasang!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  NextByte Tools sudah aktif di perangkat Anda sebagai aplikasi mandiri.
                </p>
              </div>
            </div>
          ) : null}

          {/* Android Guide */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Perangkat Siap Pasang Langsung
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                      Browser Anda mendukung instalasi 1-klik otomatis.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowGuideModal(false);
                      installApp();
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pasang Sekarang</span>
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cara pasang manual di Google Chrome atau Samsung Internet:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Buka situs ini di browser ponsel Anda, lalu ketuk menu <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1">Titik Tiga (⋮) <MoreVertical className="w-3.5 h-3.5 inline text-slate-500" /></strong> di pojok kanan atas browser.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Pilih opsi <strong className="text-blue-600 dark:text-blue-400">&ldquo;Instal aplikasi&rdquo;</strong> atau <strong className="text-blue-600 dark:text-blue-400">&ldquo;Tambahkan ke Layar Utama&rdquo;</strong> (<em>Add to Home screen</em>).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Ketuk <strong className="text-slate-900 dark:text-white">&ldquo;Instal&rdquo;</strong> pada dialog konfirmasi. Ikon NextByte akan otomatis muncul di layar utama HP Anda layaknya aplikasi dari Google Play Store!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cara pasang di iPhone / iPad menggunakan Safari:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Buka situs ini di peramban <strong className="text-slate-900 dark:text-white">Safari</strong> (bukan di dalam browser aplikasi lain).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Ketuk tombol <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1">Bagikan (Share) <Share className="w-3.5 h-3.5 inline text-blue-500" /></strong> di bilah navigasi bagian bawah layar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Gulir ke bawah dan ketuk opsi <strong className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Tambah ke Layar Utama</strong> (<em>Add to Home Screen</em>).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Ketuk <strong className="text-slate-900 dark:text-white">&ldquo;Tambah&rdquo;</strong> di pojok kanan atas. NextByte akan langsung siap digunakan tanpa batas URL bar!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Guide */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cara pasang di Windows, Mac, atau Linux via Google Chrome & Microsoft Edge:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Perhatikan ikon <strong className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"><Download className="w-3.5 h-3.5 inline" /> Instal Aplikasi</strong> di ujung kanan bilah alamat (<em>address bar</em>) browser Anda.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Klik ikon tersebut atau buka menu titik tiga browser ➔ <strong className="text-slate-900 dark:text-white">&ldquo;Instal NextByte Tools&rdquo;</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Aplikasi akan terbuka dalam jendela tersendiri tanpa tab browser dan memiliki shortcut di Start Menu / Desktop.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Footer */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Super ringan &lt; 1 MB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Aman tanpa akses mencurigakan</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => setShowGuideModal(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            Tutup
          </button>
          {isInstallable && !isInstalled && (
            <button
              onClick={() => {
                setShowGuideModal(false);
                installApp();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang Langsung</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
