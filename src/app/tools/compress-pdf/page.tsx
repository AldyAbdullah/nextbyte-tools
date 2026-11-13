import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Minimize2, FileCheck, Layers } from 'lucide-react';
import { CompressPdfStudio } from '@/components/compress-pdf/CompressPdfStudio';

export const metadata: Metadata = {
  title: 'Kompres PDF Online Gratis (Kecilkan Ukuran PDF CPNS / BUMN) - NextByte Tools',
  description:
    'Kecilkan ukuran file PDF online gratis tanpa mengurangi keterbacaan teks. Target ukuran < 200 KB, < 300 KB, < 500 KB untuk syarat upload CPNS, BUMN, dan beasiswa. 100% aman diproses di browser.',
  keywords: [
    'kompres pdf online',
    'compress pdf gratis',
    'kecilkan ukuran pdf',
    'kompres pdf cpns',
    'kompres pdf bumn',
    'pdf di bawah 200kb',
    'pdf di bawah 300kb',
    'pdf di bawah 500kb',
    'nextbyte compress pdf',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/compress-pdf',
  },
  openGraph: {
    title: 'Kompres PDF Online Gratis - NextByte Tools',
    description:
      'Kecilkan ukuran dokumen PDF secara instan dan 100% privat langsung di perangkat Anda.',
    url: 'https://www.nextbyte.biz.id/tools/compress-pdf',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte PDF Compressor',
  url: 'https://www.nextbyte.biz.id/tools/compress-pdf',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Kecilkan Ukuran Dokumen PDF Hingga Lebih Hemat 90%',
    'Preset Khusus Berkas CPNS, BUMN, dan Beasiswa (< 500 KB, < 300 KB)',
    'Slider Kustom: Resolusi Skala dan Kualitas Gambar JPEG',
    'Teks Tetap Tajam dan Terbaca Jelas',
    '100% Client-Side: File Tidak Pernah Dikirim ke Server (Privat & Bebas Bocor)',
    'Unduh Hasil Kompresi Seketika Tanpa Watermark',
  ],
};

export default function CompressPdfPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">Kompres PDF</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Alat Kompresi PDF Instan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Kompres PDF Online Gratis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Perkecil ukuran dokumen PDF untuk memenuhi syarat batas upload berkas pendaftaran (CPNS, BUMN, Beasiswa) tanpa mengorbankan keterbacaan teks penting.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <CompressPdfStudio />
        </main>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Siap untuk CPNS & BUMN
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dilengkapi preset yang dirancang khusus untuk mencapai target ukuran umum seperti di bawah 300 KB atau 500 KB.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Privasi 100% Aman
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Berkas penting seperti KTP, Kartu Keluarga, dan Ijazah tidak pernah diunggah ke cloud/server. Diproses lokal langsung di browser.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Kontrol Slider Kustom
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ingin hasil yang presisi? Gunakan mode pengaturan kustom untuk mengatur skala resolusi dan tingkat kualitas kompresi sesuai keinginan.
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
                Bagaimana cara mengecilkan PDF agar di bawah 300 KB atau 500 KB?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Pilih opsi <strong>Direkomendasikan (CPNS/BUMN)</strong> atau <strong>Kompres Ekstrem</strong>. Alat kami akan secara otomatis mengoptimalkan kompresi JPEG dan resolusi rendering halaman.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah tulisan di dalam PDF akan menjadi buram?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Kami menggunakan algoritma sampling gambar dengan ketajaman tinggi, sehingga teks nomor induk kependudukan, nilai ijazah, dan tanda tangan tetap terbaca jelas oleh panitia verifikasi.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah ada watermark pada PDF hasil kompresi?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak ada watermark sama sekali. Hasil kompresi bersih dan siap langsung Anda gunakan untuk melamar kerja atau keperluan resmi lainnya.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Berapa biaya menggunakan alat kompresi ini?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                100% gratis tanpa batasan jumlah file per hari dan tanpa perlu registrasi akun.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
