import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Sparkles, PenTool } from 'lucide-react';
import { PdfEditorStudio } from '@/components/pdf-editor/PdfEditorStudio';

export const metadata: Metadata = {
  title: 'PDF Editor Online Gratis (Edit Teks, Tanda Tangan & OCR) - NextByte Tools',
  description:
    'Edit file PDF langsung di browser: ganti teks/nama, sematkan tanda tangan digital atau stempel, redaksi whiteout, dan fitur OCR per halaman yang super ringan dan hemat kuota.',
  keywords: [
    'pdf editor online',
    'edit pdf gratis',
    'ganti nama di pdf',
    'ubah teks pdf',
    'tanda tangan pdf online',
    'pdf ocr per halaman',
    'redact pdf',
    'whiteout pdf',
    'nextbyte pdf editor',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/pdf-editor',
  },
  openGraph: {
    title: 'PDF Editor Online Gratis (Edit Teks, Tanda Tangan & OCR) - NextByte Tools',
    description:
      'Edit file PDF langsung di browser: ganti teks/nama, sematkan tanda tangan digital, whiteout, dan OCR per halaman yang ringan.',
    url: 'https://www.nextbyte.biz.id/tools/pdf-editor',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte PDF Editor & OCR Studio',
  url: 'https://www.nextbyte.biz.id/tools/pdf-editor',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Edit dan Ganti Teks PDF dengan Font Asli Proporsional',
    'OCR Cerdas Khusus Per Halaman (Sangat Ringan & Cepat)',
    'Sematkan Tanda Tangan Digital (Gambar, Ketik Estetik, Unggah PNG)',
    'Fitur Redaksi Whiteout untuk Menutupi Teks atau Logo',
    'Sorot / Highlight Teks Dokumen',
    'Rotasi Halaman dan Hapus Halaman PDF',
    '100% Aman & Privasi Terjaga',
  ],
};

export default function PdfEditorPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto space-y-6">
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
          <span className="text-slate-800 dark:text-slate-200 font-medium">PDF Editor & OCR</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OCR On-Demand Per Halaman</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            PDF Editor Online & OCR Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Edit berkas PDF secara instan: ganti teks/nama, bubuhkan tanda tangan digital, tutup bagian dengan whiteout, serta jalankan OCR khusus halaman yang sedang Anda edit tanpa membebani memori dan kuota.
          </p>
        </div>

        {/* Studio Workspace */}
        <PdfEditorStudio />

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">OCR Cerdas Per Halaman</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Beban server dan HP tetap sangat ringan. OCR hanya dijalankan pada halaman yang Anda inginkan saat hendak mengganti teks atau nama penting.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tanda Tangan & Stempel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bubuhkan paraf dan tanda tangan dengan 3 opsi mudah: gambar langsung di layar sentuh, ketik nama dengan font estetik, atau unggah PNG transparan.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privasi & Keamanan Terjamin</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              File diproses di peramban secara lokal dengan pustaka PDF standar OpenPDF/pdf-lib tanpa disimpan di database, menjaga kerahasiaan dokumen Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
