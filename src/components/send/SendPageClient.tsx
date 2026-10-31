'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ChevronRight,
  Share2,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown,
  Monitor,
  Lock,
} from 'lucide-react';
import { SendStudio } from './SendStudio';

const FAQS = [
  {
    q: 'Apakah Nextbyte Send benar-benar gratis dan tanpa batasan jumlah file?',
    a: 'Ya, 100% gratis tanpa biaya langganan, tanpa watermark, dan tidak memerlukan pendaftaran akun. Anda dapat mengirim banyak berkas sekaligus tanpa batasan kuota harian.',
  },
  {
    q: 'Apakah berkas saya diunggah dan disimpan ke server NextByte?',
    a: 'Sama sekali tidak. Nextbyte Send menggunakan teknologi WebRTC DataChannel (Peer-to-Peer). Berkas dikirimkan langsung dari memori perangkat pengirim ke penyimpanan perangkat penerima secara terenkripsi (DTLS). Tidak ada satu byte pun isi berkas Anda yang disimpan di cloud atau database kami.',
  },
  {
    q: 'Apakah kedua perangkat harus berada di jaringan Wi-Fi yang sama?',
    a: 'Tidak harus. Nextbyte Send mendukung transfer antarperangkat di jaringan Wi-Fi yang sama maupun melalui koneksi internet berbeda (misalnya dari Wi-Fi rumah ke data seluler 4G/5G) dengan bantuan STUN dan TURN relay fallback otomatis.',
  },
  {
    q: 'Bagaimana cara mengirim berkas hingga 10 GB tanpa membuat browser kehabisan RAM?',
    a: 'Nextbyte Send memecah berkas menjadi potongan kecil (chunk 64 KiB) dan menggunakan File System Access API pada peramban modern (Chrome & Edge) untuk menulis potongan data langsung ke harddisk penerima tanpa menimbunnya di memori RAM.',
  },
  {
    q: 'Bisa mengirim dari laptop Windows ke HP Android atau iPhone?',
    a: 'Sangat bisa. Nextbyte Send dirancang universal untuk semua peramban modern (Chrome, Edge, Safari, Firefox) di Windows, macOS, Android, iOS, dan Linux tanpa memerlukan aplikasi tambahan.',
  },
];

function SendStudioFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      <span className="text-xs text-slate-500 font-medium">Menghubungkan ke Wi-Fi Lokal...</span>
    </div>
  );
}

export function SendPageClient() {
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
          <span className="text-blue-600 dark:text-blue-400 font-medium">Nextbyte Send</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Send files. Anywhere. Instantly.
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Transfer Berkas Antarperangkat{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Cepat & Privat
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Kirim foto, video besar, atau dokumen langsung dari browser Anda ke perangkat lain tanpa batas ukuran, tanpa login, dan tanpa disimpan di server.
          </p>

          {/* Wi-Fi Mode Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Mode Wi-Fi Lokal Aktif • Auto-Detect Tanpa Kode
          </div>
        </div>

        {/* Studio Component */}
        <Suspense fallback={<SendStudioFallback />}>
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
                Berkas mengalir langsung antarperangkat melalui koneksi WebRTC berkecepatan tinggi tanpa antrean upload cloud.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Enkripsi DTLS Penuh</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Seluruh jalur transfer data terlindungi enkripsi kriptografis tingkat tinggi. Hanya Anda dan penerima yang memiliki kuncinya.
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
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Penyimpanan Streaming</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Dukungan File System Access API yang mengalirkan berkas besar langsung ke harddisk penerima tanpa membebani RAM browser.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Pelajari selengkapnya tentang teknologi transfer peer-to-peer di NextByte Send.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
