'use client';

import React from 'react';
import Link from 'next/link';
import { ImageCompressorStudio } from './ImageCompressorStudio';
import { 
  Minimize2, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Lock,
  Sliders
} from 'lucide-react';

export function ImageCompressorPageClient() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Breadcrumb & Hero Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-blue-600 transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-slate-200 font-medium">
            Image Compressor
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Minimize2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Free Online Image Compressor
                </h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Kompres JPG, PNG & WebP hingga 90% Lebih Ringan Tanpa Pecah
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Perkecil ukuran file foto secara satuan maupun massal langsung di browser Anda. Dilengkapi mode target KB (syarat dokumen/CPNS), pengubah format ke WebP, slider perbandingan Before-After, dan penajam garis tepi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Client-Side Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <Zap className="w-3.5 h-3.5 text-blue-500" /> Tanpa Batas Ukuran File
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio */}
      <ImageCompressorStudio />

      {/* Educational Guide Section: Format Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-lg space-y-8">
        <div className="space-y-1.5 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> Panduan Format Gambar
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Format Output Mana yang Paling Tepat untuk Anda?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ketahui perbedaan format agar hasil kompresi maksimal sesuai tujuan pemakaian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
              WebP
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              WebP (Paling Direkomendasikan)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Format generasi baru buatan Google. Mengurangi ukuran 30% hingga 80% lebih kecil dibanding JPG/PNG dengan ketajaman visual yang sama. Sangat cocok untuk website, blog, dan toko online.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
              JPG
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              JPG / JPEG (Standar Dokumen)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Format standar paling kompatibel di seluruh dunia. Wajib digunakan jika Anda mengunggah pas foto ke portal instansi pemerintah, registrasi CPNS, beasiswa, atau visa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs uppercase">
              PNG
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              PNG (Latar Transparan & Logo)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pilihan mutlak untuk logo, ikon, grafik vektor, dan stiker yang membutuhkan latar belakang transparan. Ukuran kompresi tetap tajam tanpa artefak buram di tepian objek.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Pertanyaan Umum (FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="space-y-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
              Apakah foto pribadi / KTP saya aman?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Sangat aman 100%! Tidak seperti website kompresor lain yang mengunggah foto Anda ke server cloud, NextByte Tools menggunakan teknologi Canvas & WebGL lokal di browser Anda. Foto tidak pernah keluar dari laptop atau HP Anda.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500 shrink-0" />
              Bagaimana cara mengompres foto pas di bawah 200 KB untuk CPNS?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Pilih tab <strong>Target Ukuran (KB)</strong> di panel pengaturan, klik tombol cepat <strong>KTP / CPNS 200 KB</strong> (atau ketik angka yang Anda inginkan), lalu sistem akan otomatis menyesuaikan kualitas dan resolusi agar ukurannya pas di bawah 200 KB.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
