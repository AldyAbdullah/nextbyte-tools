import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Image as ImageIcon, FileCheck, Layers } from 'lucide-react';
import { ImageConverterStudio } from '@/components/image-converter/ImageConverterStudio';

export const metadata: Metadata = {
  title: 'Konverter Format Gambar Online Gratis (PNG, JPG, WebP, ICO, BMP) - NextByte Tools',
  description:
    'Ubah format gambar PNG, JPG, WebP, ICO, dan BMP secara instan di browser. Konversi banyak file sekaligus (batch) dan unduh dalam bentuk ZIP tanpa batas ukuran.',
  keywords: [
    'konverter format gambar',
    'image converter online',
    'png to webp gratis',
    'jpg to png online',
    'png to ico favicon',
    'convert webp to jpg',
    'ubah format foto',
    'nextbyte image converter',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/image-converter',
  },
  openGraph: {
    title: 'Konverter Format Gambar Online Gratis - NextByte Tools',
    description:
      'Ubah format file foto PNG, JPG, WebP, ICO, dan BMP secara cepat dan 100% privat langsung di perangkat Anda.',
    url: 'https://www.nextbyte.biz.id/tools/image-converter',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Image Format Converter',
  url: 'https://www.nextbyte.biz.id/tools/image-converter',
  applicationCategory: 'MediaApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Konversi Antar Format: PNG, JPG, WebP, Favicon ICO, dan BMP',
    'Konversi Massal Banyak Gambar Sekaligus (Batch Processing)',
    'Pengatur Kualitas Gambar untuk Format JPG dan WebP',
    'Unduh File Satuan atau Sekaligus dalam Format Arsip (.ZIP)',
    '100% Client-Side: Gambar Tidak Pernah Diunggah ke Server',
  ],
};

export default function ImageConverterPage() {
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">Konverter Gambar</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Alat Konversi Media Gratis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Konverter Format Gambar Online Gratis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Ubah foto dan gambar menjadi format WebP modern untuk website ringan, PNG transparan, JPG standar, atau favicon ICO. Cepat, gratis, dan tanpa batas ukuran.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <ImageConverterStudio />
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              WebP untuk Website Cepat
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Format WebP terbukti hingga 30% lebih hemat ukuran daripada JPEG dan PNG dengan kualitas visual yang sama jernihnya, mempercepat loading website Anda.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Privasi Aman 100%
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Semua gambar diproses menggunakan grafis canvas peramban lokal Anda. Tidak ada gambar yang diunggah ke cloud server pihak luar.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Batch & Unduh ZIP
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Konversi puluhan foto dalam satu antrean sekaligus, lalu unduh seluruh hasilnya yang sudah rapi dalam satu file kemasan .ZIP.
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
                Bagaimana cara membuat Favicon (.ico)?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Pilih format tujuan <strong>ICO</strong>. Alat kami akan secara otomatis meresize gambar Anda menjadi format ikon persegi tajam yang siap dipasang pada website.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah ada watermark pada hasil konversi?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak ada watermark apa pun. Semua file hasil konversi bersih dan bebas digunakan untuk keperluan komersial maupun pribadi.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
