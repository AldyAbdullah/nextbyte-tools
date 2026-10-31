import React from 'react';
import type { Metadata } from 'next';
import MailMergePageClient from '@/components/mail-merge/MailMergePageClient';

export const metadata: Metadata = {
  title: 'Word Mail Merge Online Gratis (Word + Excel + Foto) - NextByte Tools',
  description:
    'Buat ratusan surat, sertifikat, dan dokumen Word (.docx) massal otomatis dari template Word dan data Excel (.xlsx, .csv). Dilengkapi pencocokan foto penerima, penomoran otomatis, dan unduh ZIP massal 100% aman langsung di browser.',
  keywords: [
    'mail merge',
    'word mail merge online',
    'surat massal word excel',
    'mail merge foto',
    'generate sertifikat massal',
    'buat surat otomatis docx',
    'mail merge gratis',
    'docx mail merge',
    'excel ke word massal',
    'nextbyte mail merge',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/mail-merge',
  },
  openGraph: {
    title: 'Word Mail Merge Online Gratis - NextByte Tools',
    description:
      'Hasilkan puluhan hingga ratusan dokumen Word otomatis dari template dan tabel Excel lengkap dengan foto penerima dan ekspor ZIP massal.',
    url: 'https://www.nextbyte.biz.id/tools/mail-merge',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Mail Merge',
  url: 'https://www.nextbyte.biz.id/tools/mail-merge',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Generate Ratusan Dokumen Word (.docx) Otomatis dari Excel',
    'Pencocokan Foto Pas Foto (JPG, PNG, WebP) Otomatis Berdasarkan Nama',
    'Penomoran Dokumen Otomatis (Prefix, Padding 001, Suffix)',
    '100% Client-Side Privacy (Data Tidak Diunggah ke Server)',
    'Pratinjau Hasil Dokumen Sebelum Digenerate',
    'Unduh Dokumen Individual atau Seluruh Berkas dalam Format ZIP',
  ],
};

export default function MailMergePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MailMergePageClient />
    </>
  );
}
