'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Scissors,
  Palette,
} from 'lucide-react';
import { BackgroundRemoverStudio } from './BackgroundRemoverStudio';

const FAQS = [
  {
    q: 'Bagaimana cara kerja AI Background Remover ini?',
    a: 'Alat ini menggunakan arsitektur deep learning ISNet (Interconnected Segmentation Network) yang dijalankan langsung di browser Anda menggunakan ONNX Runtime Web dan WebAssembly/WebGPU. Model AI ini secara cerdas mendeteksi batas objek utama (seperti manusia, pakaian, helai rambut, atau produk) dan memisahkannya dari latar belakang dengan mask transparansi beresolusi tinggi.',
  },
  {
    q: 'Apakah foto saya dikirim atau disimpan di server?',
    a: 'Tidak sama sekali. Seluruh proses analisis piksel dan penghapusan background dieksekusi 100% secara lokal di peramban (RAM dan GPU komputer/HP Anda). Foto Anda tidak pernah diunggah ke server NextByte maupun pihak ketiga mana pun, sehingga sangat aman untuk foto pribadi, KTP, dokumen rahasia, maupun katalog produk bisnis.',
  },
  {
    q: 'Berapa ukuran file gambar yang didukung?',
    a: 'Anda dapat mengunggah berkas gambar berformat PNG, JPG, JPEG, atau WebP hingga ukuran 25 MB. Jika gambar memiliki resolusi ultra-tinggi (di atas 2560 piksel), sistem secara cerdas akan mengoptimasi dimensi secara proporsional agar pemrosesan berjalan cepat tanpa menghabiskan memori perangkat mobile Anda.',
  },
  {
    q: 'Bisakah saya langsung mengganti background dengan warna merah atau biru untuk pasfoto?',
    a: 'Bisa! Setelah background dihapus, Anda cukup memilih tab "Warna" dan klik warna merah (untuk KTP/ijazah) atau biru (untuk pasfoto kedutaan/akademik). Anda juga dapat memilih warna kustom apa pun melalui color picker.',
  },
  {
    q: 'Mengapa pemrosesan pada gambar pertama memerlukan beberapa detik?',
    a: 'Pada pemrosesan pertama kali, browser perlu mengunduh file bobot model AI neural network (~25MB) dari cache CDN. Setelah model tersimpan di cache lokal browser, pemrosesan gambar berikutnya akan berjalan jauh lebih cepat secara instan.',
  },
  {
    q: 'Apakah fitur ini gratis dan tanpa batasan kuota?',
    a: 'Ya, 100% gratis tanpa watermark dan tanpa batasan kuota harian karena seluruh komputasi berjalan di perangkat Anda sendiri.',
  },
];

export default function BackgroundRemoverPageClient() {
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
          <span className="text-blue-600 dark:text-blue-400 font-medium">Image Background Remover</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            AI Background Remover 100% Lokal &amp; Gratis
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Hapus Background Gambar{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
              Otomatis &amp; Cerdas dengan AI
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Hapus latar belakang foto potret manusia, helai rambut, produk toko online, dan logo dalam hitungan detik.
            Download PNG transparan atau ganti dengan warna pasfoto langsung di peramban Anda.
          </p>
        </div>

        {/* Studio Core Component */}
        <BackgroundRemoverStudio />

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Presisi Rambut &amp; Tepian Halus</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Arsitektur AI ISNet neural network memisahkan helai rambut rumit, bulu pakaian, dan sudut produk yang kompleks
              tanpa tepi bergerigi atau artifak warna.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ganti Latar Pasfoto &amp; Gambar</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Cukup satu klik untuk mengganti background menjadi warna merah/biru pasfoto formal, putih bersih untuk e-commerce,
              atau latar belakang gambar kustom pilihan Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">100% Client-Side Privacy</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Tidak ada foto Anda yang diunggah ke cloud atau server pihak ketiga. Semua pemrosesan berlangsung aman di memori
              perangkat Anda sendiri secara privat.
            </p>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Semua yang perlu Anda ketahui tentang penghapus background gambar berbasis AI
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
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
