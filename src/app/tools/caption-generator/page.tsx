import React from 'react';
import type { Metadata } from 'next';
import CaptionPageClient from '@/components/caption/CaptionPageClient';

export const metadata: Metadata = {
  title: 'Word Caption Generator Online Gratis (Gambar & Tabel Berdasarkan BAB) - NextByte Tools',
  description:
    'Tambahkan caption gambar dan tabel otomatis berdasarkan BAB (Gambar 1.1, Tabel 2.1) pada dokumen Word (.docx). Buat Daftar Gambar dan Daftar Tabel otomatis dengan field dinamis Word SEQ & TOC 100% aman di peramban.',
  keywords: [
    'caption generator word',
    'caption gambar word otomatis',
    'caption tabel word',
    'penomoran gambar berdasarkan bab',
    'daftar gambar otomatis word',
    'daftar tabel otomatis word',
    'word seq caption',
    'caption skripsi word',
    'nextbyte caption generator',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/caption-generator',
  },
  openGraph: {
    title: 'Word Caption Generator Online Gratis - NextByte Tools',
    description:
      'Tambahkan caption gambar dan tabel otomatis berdasarkan BAB serta buat Daftar Gambar dan Daftar Tabel otomatis di dokumen Word (.docx).',
    url: 'https://www.nextbyte.biz.id/tools/caption-generator',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Word Caption Generator',
  url: 'https://www.nextbyte.biz.id/tools/caption-generator',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Penomoran Caption Otomatis Berdasarkan BAB (Gambar 1.1, Tabel 2.1)',
    'Field Dinamis Word SEQ (SEQ Gambar, SEQ Tabel)',
    'Pembuatan Halaman Daftar Gambar & Daftar Tabel Otomatis (TOC \\c)',
    'Deteksi Gambar & Tabel Otomatis dengan Thumbnail Preview',
    'Pencegahan Caption Ganda dan Penyesuaian Posisi (Atas/Bawah)',
    '100% Client-Side Privacy Tanpa Upload Berkas ke Server',
  ],
};

export default function WordCaptionGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CaptionPageClient />
    </>
  );
}
