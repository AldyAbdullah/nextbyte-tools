'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  FileText,
  Eye,
} from 'lucide-react';
import ImageSharpenerStudio from './ImageSharpenerStudio';

const FAQS = [
  {
    q: 'Bagaimana cara kerja alat penajam foto (Image Sharpener) ini?',
    a: 'Alat ini menggunakan algoritma Unsharp Masking (USM) mutakhir yang berjalan langsung di browser via Canvas API. Algoritma ini menganalisis kontras tepi objek, mendeteksi perbedaan frekuensi tinggi antara gambar asli dan versi buram (blur matrix), lalu mempertegas garis tepi tersebut sehingga gambar tampak jauh lebih jernih dan tegas tanpa merusak warna aslinya.',
  },
  {
    q: 'Apakah bisa mengubah foto yang sangat pecah atau buram parah menjadi resolusi 4K?',
    a: 'Filter penajaman (sharpening & clarity) bekerja dengan memaksimalkan detail piksel yang sudah ada pada foto asli. Filter ini sangat efektif untuk foto yang sedikit kabur karena fokus kamera meleset, teks dokumen yang buram, atau foto yang kehilangan kontras tepi. Namun, jika gambar aslinya sudah pecah parah (misal thumbnail 50x50 piksel), penajaman tidak bisa mengarang piksel baru dari ketiadaan.',
  },
  {
    q: 'Bagaimana setelan terbaik untuk memperjelas tulisan pada foto KTP, SIM, atau struk?',
    a: 'Pilih preset "Dokumen & Teks (KTP/Struk)". Preset ini telah dikalibrasi dengan radius tepi tipis (1px), ambang batas noise moderat, serta peningkatan kontras lokal sehingga angka NIK dan huruf hitam pada latar terang menjadi lebih kontras, tajam, dan mudah dibaca oleh petugas verifikasi maupun sistem OCR.',
  },
  {
    q: 'Apakah foto pribadi atau dokumen rahasia saya aman?',
    a: 'Sangat aman 100%. Berbeda dengan layanan lain yang mewajibkan Anda mengunggah dokumen ke server cloud, NextByte Image Sharpener memproses seluruh algoritma di memori peramban (RAM/GPU perangkat Anda). Tidak ada berkas yang dikirim ke internet ataupun disimpan di server.',
  },
  {
    q: 'Apakah layanan ini gratis dan ada batasan jumlah foto?',
    a: 'Layanan ini 100% gratis tanpa batasan kuota harian, tanpa watermark, dan tanpa perlu mendaftar akun.',
  },
];

export default function ImageSharpenerPageClient() {
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
          <span className="text-cyan-600 dark:text-cyan-400 font-medium">Image Sharpener</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Penajam & Penjernih Foto Beresolusi Tinggi
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Pertajam & Jernihkan Foto{' '}
            <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-400 bg-clip-text text-transparent">
              Secara Instan
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Pertegas detail gambar yang kabur, perjelas teks pada dokumen KTP/struk, dan tingkatkan mikro-kontras foto tanpa mengorbankan privasi.
          </p>
        </div>

        {/* Interactive Studio Workspace */}
        <ImageSharpenerStudio />

        {/* Feature Highlights Grid */}
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kenapa Menggunakan Image Sharpener NextByte?</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Teknologi pemrosesan citra digital tingkat lanjut yang dirancang khusus untuk kenyamanan, kecepatan, dan keamanan berkas Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Unsharp Mask Presisi</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Algoritma matematis konvolusi multi-pass yang mempertegas garis tepi secara selektif tanpa menghasilkan bintik noise berlebihan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Mode KTP & Dokumen</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Optimasi khusus untuk mempertegas angka NIK, tulisan tanda tangan, dan teks struk yang buram agar mudah dibaca saat verifikasi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Slider Sebelum & Sesudah</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Fitur pembanding interaktif geser dua sisi (*split view*) yang memungkinkan Anda memeriksa perbedaan detail piksel sebelum mengunduh.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">100% Bebas Server</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Tidak ada risiko kebocoran data. Seluruh pemrosesan komputasi berjalan di sisi klien (browser), tanpa login, dan sepenuhnya gratis.
              </p>
            </div>
          </div>
        </div>

        {/* Practical Step by Step */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Cara Mempertajam Foto dalam 3 Langkah Mudah</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Unggah Foto</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Tarik berkas foto JPG, PNG, atau WebP ke area dropzone, atau gunakan pintasan papan ketik <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-[10px]">Ctrl + V</kbd>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Pilih Preset & Sesuaikan</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Gunakan pilihan cepat (*Natural, Seimbang, Ultra, Dokumen*) atau atur slider ketajaman, kejernihan, dan ambang batas sesuai selera.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Unduh Hasil</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Bandingkan langsung melalui slider split-screen, lalu unduh gambar beresolusi penuh atau simpan semua foto sekaligus dalam berkas ZIP.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pertanyaan yang Sering Diajukan (FAQ)</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Pelajari selengkapnya tentang cara kerja pemrosesan ketajaman citra digital di NextByte.
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
                    className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-800 dark:text-zinc-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''
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
