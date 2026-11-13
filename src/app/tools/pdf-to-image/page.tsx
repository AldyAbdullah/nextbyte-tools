import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Image as ImageIcon, FileCheck, Layers } from 'lucide-react';
import { PdfToImageStudio } from '@/components/pdf-to-image/PdfToImageStudio';

export const metadata: Metadata = {
  title: 'Konversi PDF ke Gambar Online Gratis (PDF to JPG / PNG HD) - NextByte Tools',
  description:
    'Ubah lembar dokumen PDF menjadi gambar JPG atau PNG resolusi tinggi secara online dan 100% gratis. Unduh per lembar atau semua halaman sekaligus dalam format ZIP. Cepat, jernih, dan aman di browser.',
  keywords: [
    'pdf ke gambar',
    'pdf to jpg online',
    'pdf to png gratis',
    'ekstrak gambar pdf',
    'convert pdf to image',
    'unduh pdf jadi jpg',
    'pdf to hd image',
    'nextbyte pdf to image',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/pdf-to-image',
  },
  openGraph: {
    title: 'Konversi PDF ke Gambar Online Gratis - NextByte Tools',
    description:
      'Ekstrak lembaran PDF menjadi gambar tajam JPG atau PNG kualitas tinggi secara instan langsung di perangkat Anda.',
    url: 'https://www.nextbyte.biz.id/tools/pdf-to-image',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte PDF to Image Converter',
  url: 'https://www.nextbyte.biz.id/tools/pdf-to-image',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Ekstrak Lembar Dokumen PDF Menjadi Gambar Format JPG atau PNG',
    'Pilihan Resolusi Ketajaman Tinggi: Standar 1x, HD 2x (300 DPI), Ultra HD 3x',
    'Unduh Lembar Tertentu Secara Satuan',
    'Unduh Seluruh Halaman Sekaligus dalam Format Arsip (.ZIP)',
    '100% Client-Side: File Tidak Pernah Dikirim ke Server (Privasi Aman)',
    'Hasil Gambar Bersih Tanpa Watermark',
  ],
};

export default function PdfToImagePage() {
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">PDF ke Gambar</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Alat Ekstraksi Dokumen Cepat</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Konversi PDF ke Gambar JPG / PNG Online Gratis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Ubah tiap lembar PDF menjadi gambar berkualitas tinggi dengan teks yang tetap tajam. Unduh foto halaman yang Anda inginkan atau unduh seluruh lembar dalam satu file ZIP.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <PdfToImageStudio />
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Resolusi HD Hingga 300+ DPI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dukungan skala hingga 3x memastikan tulisan berukuran kecil dan detail tanda tangan pada dokumen tetap terlihat jernih dan tajam tanpa pecah.
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
              Dokumen Anda diproses langsung menggunakan mesin grafis browser lokal tanpa perantara server, menjaga kerahasiaan berkas dari risiko kebocoran.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Unduh Sekaligus (.ZIP)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Memiliki dokumen PDF dengan puluhan halaman? Anda dapat mengunduh seluruh lembaran secara instan hanya dengan sekali klik dalam kemasan file .ZIP.
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
                Pilih format JPG atau PNG?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Pilih <strong>JPG</strong> jika Anda menginginkan ukuran file gambar yang lebih kecil dan mudah dibagikan via WhatsApp. Pilih <strong>PNG</strong> jika Anda menginginkan gambar tanpa kompresi dengan ketajaman garis dan warna maksimal.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Berapa batas halaman dokumen yang bisa dikonversi?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak ada batas kuota. Anda bisa mengonversi dokumen 1 lembar hingga ratusan lembar secara gratis.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
