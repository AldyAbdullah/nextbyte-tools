import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Layers, FileCheck } from 'lucide-react';
import { MergePdfStudio } from '@/components/merge-pdf/MergePdfStudio';

export const metadata: Metadata = {
  title: 'Gabung PDF Online Gratis (Merge PDF Tanpa Batas) - NextByte Tools',
  description:
    'Gabungkan beberapa file PDF menjadi satu dokumen secara online, cepat, dan 100% gratis. Atur urutan file, pilih rentang halaman, dan proses langsung di browser tanpa upload ke server.',
  keywords: [
    'gabung pdf online',
    'merge pdf gratis',
    'satukan file pdf',
    'combine pdf online',
    'gabung pdf cpns',
    'gabung berkas lamaran pdf',
    'merge pdf client side',
    'nextbyte merge pdf',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/merge-pdf',
  },
  openGraph: {
    title: 'Gabung PDF Online Gratis (Merge PDF) - NextByte Tools',
    description:
      'Satukan banyak file PDF jadi satu dokumen secara instan dan 100% aman langsung di browser Anda.',
    url: 'https://www.nextbyte.biz.id/tools/merge-pdf',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Merge PDF Studio',
  url: 'https://www.nextbyte.biz.id/tools/merge-pdf',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Gabungkan Banyak File PDF Tanpa Batas Ukuran',
    'Atur Urutan Halaman dan Dokumen dengan Mudah',
    'Pilih Halaman Tertentu yang Ingin Digabung (Page Range)',
    'Putar Halaman yang Terbalik (Rotasi 90°)',
    '100% Client-Side: File Tidak Pernah Dikirim ke Server (Privat & Aman)',
    'Unduh Dokumen Hasil Penggabungan Secara Instan',
  ],
};

export default function MergePdfPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-blue-600 transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 dark:text-slate-200 font-medium">Gabung PDF</span>
        </nav>

        {/* Studio Workspace */}
        <MergePdfStudio />

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cepat & Tanpa Antrean
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Semua proses penggabungan berkas dijalankan langsung oleh mesin WebAssembly di browser Anda dalam hitungan detik.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              100% Privat & Aman
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dokumen sensitif (ijazah, CV, KTP, data pribadi) tidak pernah diunggah atau disimpan di server mana pun.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Atur Urutan & Rentang Halaman
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Atur posisi urutan file semudah menekan tombol panah, serta tentukan rentang halaman tertentu yang ingin digabungkan.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div>
              <p className="font-bold text-slate-800 dark:text-white mb-1">
                Apakah ada batas maksimal ukuran file PDF yang digabung?
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Tidak ada batas kuota server karena pemrosesan dilakukan sepenuhnya di perangkat Anda (client-side). Anda bebas menggabungkan puluhan dokumen sekaligus.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white mb-1">
                Apakah bisa hanya mengambil beberapa halaman dari satu file?
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Bisa. Pada kolom &apos;Hal&apos;, Anda dapat mengetikkan rentang halaman seperti &apos;1-3, 5&apos; untuk hanya menyertakan halaman 1 sampai 3 dan halaman 5 dari dokumen tersebut.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
