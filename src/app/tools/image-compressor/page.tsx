import React from 'react';
import type { Metadata } from 'next';
import { ImageCompressorPageClient } from '@/components/image-compressor/ImageCompressorPageClient';

export const metadata: Metadata = {
  title: 'Image Compressor Online Gratis (JPG, PNG, WebP) - NextByte Tools',
  description: 'Kompres gambar dan foto online gratis hingga 90% lebih kecil tanpa pecah. Dilengkapi fitur target ukuran file (200 KB CPNS), konversi ke WebP, resize dimensi, smart sharpening, dan download ZIP massal 100% privat langsung di browser.',
  keywords: [
    'image compressor',
    'kompres foto online',
    'kompres jpg gratis',
    'kompres png',
    'kompres foto 200 kb',
    'kompres foto cpns',
    'perkecil ukuran foto',
    'convert to webp',
    'image optimizer online',
    'nextbyte image compressor',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/image-compressor',
  },
  openGraph: {
    title: 'Image Compressor Online Gratis - NextByte Tools',
    description: 'Perkecil ukuran gambar JPG, PNG, dan WebP secara instan hingga 90% lebih ringan langsung di browser tanpa watermark.',
    url: 'https://www.nextbyte.biz.id/tools/image-compressor',
    type: 'website',
  },
};

// Structured Data (JSON-LD) untuk Google Search
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Image Compressor',
  url: 'https://www.nextbyte.biz.id/tools/image-compressor',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Kompresi Gambar JPG, PNG, dan WebP hingga 90%',
    'Mode Target Ukuran File (Target 200 KB untuk CPNS & Dokumen)',
    'Konversi Format Otomatis ke Google WebP',
    'Interactive Split-Screen Before & After Comparison',
    'Kompresi Massal (Batch Processing) & Download ZIP',
    'Smart Edge Sharpening (Penajaman Tepi Objek)',
    '100% Client-Side Privacy (Foto Tidak Dikirim ke Server)',
  ],
  description: 'Aplikasi kompresi dan optimasi gambar online gratis tanpa batas ukuran file dan 100% privat diproses di browser.',
};

export default function ImageCompressorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageCompressorPageClient />
    </>
  );
}
