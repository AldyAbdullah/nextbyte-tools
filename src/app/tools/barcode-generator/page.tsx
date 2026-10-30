import React from 'react';
import type { Metadata } from 'next';
import { BarcodePageClient } from '@/components/barcode/BarcodePageClient';

export const metadata: Metadata = {
  title: 'Barcode Generator Gratis Online (Code 128, EAN-13, UPC, Code 39) - NextByte Tools',
  description: 'Buat barcode kustom standar industri (Code 128, EAN-13, UPC, Code 39, ITF-14) resolusi tinggi gratis tanpa watermark. Dilengkapi pilihan warna, ukuran, dan ekspor instan format PNG, SVG (Vector), dan JPG.',
  keywords: [
    'barcode generator',
    'barcode generator indonesia',
    'buat barcode gratis',
    'barcode ean 13',
    'barcode code 128',
    'barcode code 39',
    'barcode upc',
    'generator barcode produk',
    'cetak barcode stiker',
    'barcode svg vector',
    'nextbyte barcode',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/barcode-generator',
  },
  openGraph: {
    title: 'Barcode Generator Gratis Online - NextByte Tools',
    description: 'Generator barcode kustom online gratis untuk retail, logistik, nomor resi, dan inventaris produk dengan ekspor PNG & SVG.',
    url: 'https://www.nextbyte.biz.id/tools/barcode-generator',
    type: 'website',
  },
};

// Structured Data (JSON-LD) untuk Google Search
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Barcode Generator',
  url: 'https://www.nextbyte.biz.id/tools/barcode-generator',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Dukungan Standar Format: Code 128, EAN-13, EAN-8, UPC, Code 39, ITF-14, ITF, Codabar',
    'Ekspor Format Vektor SVG (Scalable Vector Graphics)',
    'Ekspor PNG Resolusi Tinggi (1x, 2x HD, 4x Print-Ready)',
    'Kustomisasi Warna Garis & Background (Transparan Support)',
    'Pengaturan Tipografi Teks & Posisi Teks (Atas / Bawah)',
    '100% Client-Side & Gratis Tanpa Batasan Kuota',
  ],
  description: 'Aplikasi pembuat barcode online gratis dengan standar industri Code 128 dan EAN-13 beresolusi tinggi langsung di browser.',
};

export default function BarcodeGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BarcodePageClient />
    </>
  );
}
