import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Image as ImageIcon, FileCheck, Layers } from 'lucide-react';
import { ImageToPdfStudio } from '@/components/image-to-pdf/ImageToPdfStudio';

export const metadata: Metadata = {
  title: 'Konversi Gambar ke PDF Online Gratis (JPG/PNG to PDF) - NextByte Tools',
  description:
    'Ubah foto JPG, PNG, dan WebP menjadi satu dokumen PDF rapi secara gratis dan instan. Dukungan ukuran kertas A4 dan F4/Folio, atur orientasi, dan putar foto langsung di browser Anda.',
  keywords: [
    'gambar ke pdf',
    'foto ke pdf online',
    'jpg to pdf gratis',
    'png to pdf online',
    'gabung foto jadi satu pdf',
    'scan foto ke pdf',
    'convert image to pdf',
    'nextbyte image to pdf',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/image-to-pdf',
  },
  openGraph: {
    title: 'Konversi Gambar ke PDF Online Gratis - NextByte Tools',
    description:
      'Satukan koleksi foto nota, struk, KTP, dan dokumen Anda menjadi 1 berkas PDF rapi siap cetak.',
    url: 'https://www.nextbyte.biz.id/tools/image-to-pdf',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Image to PDF Converter',
  url: 'https://www.nextbyte.biz.id/tools/image-to-pdf',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Ubah Banyak Foto JPG, PNG, dan WebP Menjadi 1 File PDF',
    'Pilihan Ukuran Halaman: A4, F4/Folio (215 x 330 mm), Letter, atau Sesuai Gambar',
    'Atur Orientasi: Otomatis, Portrait, atau Landscape',
    'Putar (Rotasi) dan Urutkan Posisi Gambar dengan Bebas',
    '100% Client-Side: Foto Anda Tidak Pernah Dikirim ke Server (Privasi Aman)',
    'Unduh Dokumen PDF Seketika Tanpa Watermark',
  ],
};

export default function ImageToPdfPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-8">
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">Gambar ke PDF</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Alat Konversi Dokumen Instan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Konversi Gambar ke PDF Online Gratis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Gabungkan foto dokumen, struk nota, ijazah, atau KTP menjadi satu file PDF yang rapi dan siap cetak. Atur ukuran kertas (A4/F4) dan tata letak langsung di browser Anda.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <ImageToPdfStudio />
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Dukungan Kertas F4 / Folio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tidak hanya A4, kami menyediakan ukuran kertas F4/Folio (215 x 330 mm) yang paling sering digunakan pada administrasi perkantoran dan sekolah di Indonesia.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Foto Aman & Privat
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Semua gambar diproses secara lokal di browser Anda. Dokumen identitas atau foto pribadi Anda tidak pernah diunggah atau disimpan di server mana pun.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Bebas Rotasi & Atur Urutan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Jika ada foto yang terbalik atau menyamping, putar seketika dengan 1 klik. Geser ke atas atau ke bawah untuk menentukan urutan halaman di PDF akhir.
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary-600" />
            <span>Pertanyaan Umum (FAQ)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Format gambar apa saja yang didukung?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Anda dapat mengunggah file JPG, JPEG, PNG, WebP, dan BMP. Anda bisa memilih puluhan foto sekaligus dalam sekali upload.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Bagaimana jika rasio foto saya berbeda-beda?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Pilih orientasi <strong>Otomatis</strong>. Alat kami akan secara cerdas menyesuaikan orientasi halaman (apakah tegak atau mendatar) mengikuti bentuk foto asli Anda secara proporsional.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah ada watermark pada PDF hasil konversi?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak ada watermark. Dokumen PDF yang Anda buat bersih, profesional, dan siap langsung dicetak atau dilampirkan pada email.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
