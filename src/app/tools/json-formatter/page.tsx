import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FileCode2, ShieldCheck, Zap, FileCheck, Layers } from 'lucide-react';
import { JsonFormatterStudio } from '@/components/json-formatter/JsonFormatterStudio';

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator Online Gratis (Tree View & Minify) - NextByte Tools',
  description:
    'Format, rapikan (beautify), perkecil (minify), dan validasi struktur JSON secara online dan gratis. Dilengkapi penampil hierarki Tree View interaktif dan deteksi error sintaks langsung di browser.',
  keywords: [
    'json formatter online',
    'json validator gratis',
    'json beautifier',
    'json minify',
    'format json rapi',
    'json viewer tree',
    'json parser online',
    'nextbyte json formatter',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/json-formatter',
  },
  openGraph: {
    title: 'JSON Formatter & Validator Online Gratis - NextByte Tools',
    description:
      'Rapikan dan validasi sintaks JSON dengan visual Tree View interaktif langsung di browser Anda.',
    url: 'https://www.nextbyte.biz.id/tools/json-formatter',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte JSON Formatter & Validator',
  url: 'https://www.nextbyte.biz.id/tools/json-formatter',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Format JSON Rapi (Beautify 2 Spasi / 4 Spasi)',
    'Kompresi JSON Padat (Minify) untuk API dan Payload Hemat Bandwidth',
    'Validasi Sintaks JSON Real-Time dengan Pesan Error Jelas',
    'Penampil Struktur Hierarki Interaktif (Collapsible Tree View)',
    'Salin Cepat ke Clipboard dan Unduh File .json',
    '100% Client-Side: Data JSON Tidak Pernah Dikirim ke Server',
  ],
};

export default function JsonFormatterPage() {
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">JSON Formatter & Validator</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Alat Developer Gratis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            JSON Formatter & Validator Online
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Rapikan struktur data JSON yang berantakan, perkecil untuk produksi (*minify*), atau telusuri data hierarkis dengan penampil *Tree View* interaktif.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <JsonFormatterStudio />
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Beautify & Minify Seketika
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Format dengan 2 spasi atau 4 spasi untuk kenyamanan membaca kode, atau minify untuk menghemat kuota payload API dan database.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Privasi Data API Terjaga
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Data konfigurasi internal, kredensial JSON token, dan respon server rahasia Anda diparsing 100% di browser Anda tanpa risiko dikirim ke pihak ketiga.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Penampil Hierarki Tree View
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Objek dan array bertingkat dapat diciutkan (*collapse*) atau dibentangkan (*expand*) secara visual untuk memudahkan debugging struktur data yang panjang.
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
                Bagaimana cara mengetahui baris error pada JSON saya?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Jika terdapat kesalahan koma gantung (*trailing comma*), tanda kurung yang belum ditutup, atau petik satu, validator kami akan memunculkan banner merah lengkap dengan pesan keterangan error.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah ada batasan ukuran teks JSON?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Anda dapat memformat data JSON hingga jutaan karakter selama memori peramban Anda mencukupi, karena proses parsing dijalankan dengan performa native engine V8 browser Anda.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
