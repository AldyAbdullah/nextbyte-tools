'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  DownloadCloud,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown,
  Monitor,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { SendStudio } from './SendStudio';

const FAQS = [
  {
    q: 'Bagaimana cara menerima berkas dari pengirim?',
    a: 'Cukup buka halaman ini di perangkat Anda yang terhubung ke jaringan Wi-Fi yang sama dengan pengirim. Perangkat Anda akan otomatis muncul di radar pengirim. Saat pengirim memilih perangkat Anda, klik "Terima Berkas".',
  },
  {
    q: 'Di mana berkas yang diterima akan disimpan?',
    a: 'Pada peramban komputer (Chrome atau Edge), Anda dapat memilih langsung folder penyimpanan di harddisk Anda melalui File System Access API. Pada ponsel (Android atau iPhone), berkas otomatis masuk ke folder Unduhan (Downloads) perangkat Anda.',
  },
  {
    q: 'Apakah penerima bisa menolak transfer?',
    a: 'Ya, Anda akan diperlihatkan pop-up berisi daftar nama berkas, ukuran, dan jenis perangkat pengirim sebelum transfer dimulai. Anda bebas mengklik "Tolak" kapan saja.',
  },
  {
    q: 'Apakah transfer aman dari intipan jaringan Wi-Fi umum?',
    a: 'Sangat aman. Jalur data dilindungi dengan enkripsi DTLS (Datagram Transport Layer Security) standar tinggi langsung antar-browser, sehingga siapa pun di jaringan Wi-Fi tidak dapat membaca isi berkas Anda.',
  },
];

function ReceiveStudioFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      <span className="text-xs text-slate-500 font-medium">Menghubungkan ke Wi-Fi Lokal...</span>
    </div>
  );
}

export function ReceivePageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
          <Link href="/tools" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Alat
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">Terima Berkas</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <DownloadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Transfer Berkas Wi-Fi Lokal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Terima Berkas{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Langsung ke Perangkat
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Dapatkan berkas ukuran besar secara langsung dari perangkat pengirim di Wi-Fi yang sama tanpa kompresi dan tanpa perantara server.
          </p>
        </div>

        {/* Studio Component wrapped in Suspense */}
        <Suspense fallback={<ReceiveStudioFallback />}>
          <SendStudio />
        </Suspense>

        {/* Feature Highlights Grid */}
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mengapa Memilih Nextbyte Send?
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Solusi berbagi berkas berukuran besar tercepat tanpa kompresi dan tanpa perantara pihak ketiga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Direct Peer-to-Peer</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Berkas mengalir langsung antarperangkat melalui koneksi LAN Wi-Fi berkecepatan tinggi tanpa antrean upload cloud.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Enkripsi DTLS Penuh</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Seluruh jalur transfer data terlindungi enkripsi kriptografis tingkat tinggi. Hanya Anda dan pengirim yang memiliki kuncinya.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Universal Lintas OS</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                AirDrop untuk semua platform. Bekerja mulus antar Windows, Android, macOS, iOS, dan Linux tanpa instalasi aplikasi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Penyimpanan Streaming</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Dukungan File System Access API yang mengalirkan berkas besar langsung ke harddisk penerima tanpa membebani RAM browser.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-3.5 h-3.5" />
              Pertanyaan Umum
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Seputar Penerimaan Berkas
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  type="button"
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-blue-500' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
