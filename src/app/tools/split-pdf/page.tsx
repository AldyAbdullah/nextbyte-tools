import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Scissors, FileCheck, Layers } from 'lucide-react';
import { SplitPdfStudio } from '@/components/split-pdf/SplitPdfStudio';

export const metadata: Metadata = {
  title: 'Pisah PDF Online Gratis (Split PDF Per Halaman) - NextByte Tools',
  description:
    'Pisahkan file PDF menjadi beberapa lembar terpisah atau ekstrak rentang halaman tertentu secara online, cepat, dan 100% gratis. Proses aman di browser tanpa unggah file ke server.',
  keywords: [
    'pisah pdf online',
    'split pdf gratis',
    'ekstrak halaman pdf',
    'pecah file pdf',
    'pisah lembar pdf',
    'split pdf cpns',
    'potong pdf online',
    'nextbyte split pdf',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/split-pdf',
  },
  openGraph: {
    title: 'Pisah PDF Online Gratis (Split PDF) - NextByte Tools',
    description:
      'Pisahkan halaman PDF atau ekstrak lembaran tertentu secara instan dan 100% aman langsung di browser Anda.',
    url: 'https://www.nextbyte.biz.id/tools/split-pdf',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Split PDF Studio',
  url: 'https://www.nextbyte.biz.id/tools/split-pdf',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Pisahkan Lembaran PDF Tertentu Secara Fleksibel',
    'Ekstrak Halaman Terpilih Menjadi 1 Dokumen PDF Baru',
    'Pecah Setiap Halaman Menjadi File PDF Terpisah (.ZIP)',
    'Pratinjau Visual Thumbnail Tiap Lembar Halaman',
    'Fitur Pilih Cepat: Ganjil, Genap, Rentang Manual (1-3, 5)',
    '100% Client-Side: File Tidak Pernah Dikirim ke Server (Privat & Aman)',
  ],
};

export default function SplitPdfPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Alat
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Pisah PDF (Split PDF)</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <Scissors className="w-3.5 h-3.5" />
            <span>Alat Dokumen PDF Gratis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Pisah PDF Online Gratis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Pilih lembar halaman yang Anda butuhkan atau pecah seluruh dokumen menjadi file PDF 1 lembar dalam arsip ZIP. Proses 100% di browser Anda tanpa antre dan tanpa batas ukuran.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <SplitPdfStudio />
        </main>

        {/* Features & Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Instan & Tanpa Upload
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pemisahan diproses menggunakan mesin WebAssembly dan PDF-Lib modern langsung di laptop/HP Anda. Tidak perlu menunggu unggah file besar ke server.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Privasi 100% Terjaga
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dokumen rahasia, laporan keuangan, atau berkas pribadi Anda tidak pernah meninggalkan perangkat Anda. Nol risiko kebocoran data.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Pratinjau Thumbnail Visual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tiap halaman ditampilkan dengan pratinjau thumbnail yang jelas. Anda bisa memilih lembaran hanya dengan sekali klik atau mengetik rentang halaman (misal: 1-5, 8).
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary-600" />
            <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah ada batasan jumlah halaman atau ukuran file?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak ada batasan. Karena proses pemisahan PDF berjalan sepenuhnya di browser Anda, file dengan ratusan halaman sekalipun dapat diproses selama memori perangkat Anda mencukupi.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apa perbedaan opsi Ekstrak dan Pecah (.ZIP)?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>Ekstrak</strong> akan menggabungkan halaman-halaman yang Anda pilih ke dalam satu file PDF baru. Sementara <strong>Pecah (.ZIP)</strong> akan membuat tiap halaman yang dipilih menjadi file PDF tersendiri dan mengemasnya dalam arsip .ZIP.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah file saya disimpan di server NextByte?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Sama sekali tidak. Dokumen Anda tidak pernah diunggah ke server mana pun. Seluruh operasi pemisahan dan pengunduhan PDF terjadi 100% di browser lokal Anda.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah bisa memilih halaman ganjil atau genap saja?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tentu saja! Kami menyediakan tombol Pilih Cepat untuk memilih seluruh halaman ganjil, genap, membalik pilihan, atau mengetik rentang nomor halaman secara manual.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
