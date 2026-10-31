import React from 'react';
import type { Metadata } from 'next';
import PageNumberPageClient from '@/components/page-number/PageNumberPageClient';

export const metadata: Metadata = {
  title: 'Word Page Number Online Gratis (Format Skripsi & Romawi) - NextByte Tools',
  description:
    'Tambahkan nomor halaman dokumen Word (.docx) secara otomatis. Dukungan preset skripsi (sampul tanpa nomor, halaman awal Romawi i, ii, iii, dan bab isi angka Arab 1, 2, 3), orientasi landscape, dan field PAGE dinamis 100% aman di browser.',
  keywords: [
    'word page number',
    'nomor halaman word otomatis',
    'nomor halaman skripsi',
    'berbeda halaman pertama word',
    'different first page docx',
    'nomor romawi dan arab word',
    'page number generator',
    'page number docx online',
    'nextbyte page number',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/word-page-number',
  },
  openGraph: {
    title: 'Word Page Number Online Gratis - NextByte Tools',
    description:
      'Atur nomor halaman dokumen Word (.docx) otomatis dengan preset skripsi: sampul tanpa nomor, romawi kecil, dan angka arab dinamis.',
    url: 'https://www.nextbyte.biz.id/tools/word-page-number',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Word Page Number',
  url: 'https://www.nextbyte.biz.id/tools/word-page-number',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Penomoran Halaman Word Otomatis dengan Field PAGE Dinamis',
    'Preset Standar Skripsi (Sampul Tanpa Nomor, Romawi Kecil, Angka Arab)',
    'Pengaturan Header dan Footer (Kiri, Tengah, Kanan)',
    'Dukungan Section Break dan Orientasi Landscape',
    '100% Client-Side Privacy (Dokumen Diproses Lokal di Browser)',
    'Download Dokumen DOCX yang Tetap Dapat Diedit di Microsoft Word',
  ],
};

export default function WordPageNumberPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageNumberPageClient />
    </>
  );
}
