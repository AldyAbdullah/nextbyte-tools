import React from 'react';
import type { Metadata } from 'next';
import BackgroundRemoverPageClient from '@/components/background-remover/BackgroundRemoverPageClient';

export const metadata: Metadata = {
  title: 'Hapus Background Gambar Online Gratis (AI Cerdas & Cepat) - NextByte Tools',
  description:
    'Hapus background foto potret, helai rambut, produk, dan logo secara otomatis dengan AI ISNet. Download PNG transparan atau ganti warna latar pasfoto (merah/biru) 100% lokal di browser tanpa upload ke server.',
  keywords: [
    'hapus background online',
    'remove background online gratis',
    'background remover ai',
    'hapus background foto',
    'png transparan generator',
    'ganti background pasfoto merah biru',
    'hapus background rambut halus',
    'nextbyte background remover',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/image-background-remover',
  },
  openGraph: {
    title: 'Hapus Background Gambar Online Gratis (AI Cerdas) - NextByte Tools',
    description:
      'Hapus background foto otomatis dengan AI lokal langsung di peramban. Hasil presisi untuk rambut halus dan produk.',
    url: 'https://www.nextbyte.biz.id/tools/image-background-remover',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Image Background Remover',
  url: 'https://www.nextbyte.biz.id/tools/image-background-remover',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Penghapusan Background AI Otomatis Berbasis Deep Learning ISNet',
    'Pemisahan Presisi Tinggi untuk Helai Rambut Manusia dan Produk',
    'Slider Pembanding Sebelum dan Sesudah Interaktif',
    'Penggantian Background Warna Solid (Putih, Hitam, Pasfoto Merah/Biru)',
    'Penggantian Background Gambar Kustom',
    '100% Client-Side WebAssembly (Privasi Aman Tanpa Upload ke Server)',
    'Ekspor PNG Transparan Kualitas Tinggi',
  ],
};

export default function ImageBackgroundRemoverPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundRemoverPageClient />
    </>
  );
}
