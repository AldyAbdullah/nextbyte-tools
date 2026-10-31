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
import { ReceiveStudio } from './ReceiveStudio';

const FAQS = [
  {
    q: 'Bagaimana cara menerima berkas dari pengirim?',
    a: 'Minta 6 karakter kode transfer dari pengirim (contoh: NB-9281) atau pindai kode QR yang tertera pada layar pengirim menggunakan kamera ponsel Anda. Setelah terhubung, klik "Terima & Simpan Berkas".',
  },
  {
    q: 'Di mana berkas yang diterima akan disimpan?',
    a: 'Pada peramban komputer (Chrome atau Edge), Anda dapat memilih langsung folder penyimpanan di harddisk Anda melalui File System Access API. Pada ponsel (Android atau iPhone), berkas otomatis masuk ke folder Unduhan (Downloads) perangkat Anda.',
  },
  {
    q: 'Apakah penerima bisa menolak transfer?',
    a: 'Ya, Anda akan diperlihatkan daftar nama berkas, ukuran, dan jenis perangkat pengirim sebelum transfer dimulai. Anda bebas mengklik "Tolak Transfer" kapan saja.',
  },
  {
    q: 'Apakah transfer aman dari intipan jaringan Wi-Fi umum?',
    a: 'Sangat aman. Jalur data WebRTC diproteksi dengan enkripsi DTLS (Datagram Transport Layer Security) standar militer langsung antar-browser, sehingga siapa pun di jaringan Wi-Fi umum tidak dapat membaca isi berkas Anda.',
  },
];

function ReceiveStudioFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-3">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      <span className="text-xs text-slate-500 font-medium">Memuat Halaman Terima Berkas...</span>
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
            Terima Berkas P2P Berkecepatan Penuh
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Terima Berkas{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Langsung ke Perangkat
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Dapatkan berkas ukuran besar secara langsung dari perangkat pengirim tanpa kompresi dan tanpa perantara server.
          </p>

          {/* Quick Tabs: Kirim vs Terima */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner mt-2">
            <Link
              href="/send"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Kirim Berkas
            </Link>
            <span className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm">
              Terima Berkas
            </span>
          </div>
        </div>

        {/* Studio Component wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<ReceiveStudioFallback />}>
          <ReceiveStudio />
        </Suspense>

        {/* Feature Highlights Grid */}
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Keunggulan Penerimaan Berkas Nextbyte
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Perlindungan privasi maksimal dan kenyamanan unduh berkecepatan tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Langsung Tersimpan</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Data berkas yang masuk langsung dialirkan ke media penyimpanan lokal tanpa menunggu proses render lambat.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Kendali Persetujuan</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Anda selalu memiliki kendali penuh untuk meninjau nama & ukuran berkas sebelum memutuskan menerima atau menolak.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Tanpa Aplikasi</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Cukup buka tautan di browser bawaan ponsel atau komputer. Tidak perlu mengunduh aplikasi tambahan apa pun.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Terenkripsi Ujung ke Ujung</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Jalur koneksi langsung antara peramban Anda dan pengirim dilindungi enkripsi aman (WebRTC DTLS).
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
              Pelajari selengkapnya tentang proses penerimaan berkas di NextByte Send.
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
