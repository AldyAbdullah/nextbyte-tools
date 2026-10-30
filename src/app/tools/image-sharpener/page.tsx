import { Metadata } from 'next';
import ImageSharpenerPageClient from '@/components/image-sharpener/ImageSharpenerPageClient';

export const metadata: Metadata = {
  title: 'Image Sharpener Online Gratis - Pertajam & Jernihkan Foto Blur',
  description:
    'Pertajam foto buram, tingkatkan kejernihan teks dokumen KTP/struk, dan perjelas detail gambar secara online gratis. 100% aman tanpa unggah ke server.',
  keywords: [
    'image sharpener',
    'pertajam foto',
    'jernihkan foto buram',
    'cara memperjelas foto ktp buram',
    'penajam gambar online',
    'unsharp mask online',
    'photo enhancer gratis',
    'perjelas tulisan kabur',
    'nextbyte tools'
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/image-sharpener',
  },
  openGraph: {
    title: 'Image Sharpener Online Gratis - NextByte Tools',
    description:
      'Perjelas foto buram, tingkatkan kontras teks dokumen, dan pertajam detail gambar secara instan tanpa batas dan tanpa biaya.',
    url: 'https://www.nextbyte.biz.id/tools/image-sharpener',
    siteName: 'NextByte Tools',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image Sharpener Online Gratis - NextByte Tools',
    description:
      'Pertajam foto buram dan perjelas teks dokumen dengan algoritma Unsharp Mask langsung di browser.',
  },
};

export default function ImageSharpenerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Sharpener & Photo Enhancer NextByte',
    url: 'https://www.nextbyte.biz.id/tools/image-sharpener',
    description:
      'Aplikasi penajam foto dan penjernih dokumen berbasis web berkecepatan tinggi dengan unsharp mask, perjelas teks KTP, slider sebelum & sesudah, serta ekspor resolusi penuh tanpa server.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    featureList: [
      'Unsharp Mask multi-pass sharpening',
      'Preset khusus foto KTP, struk, dan dokumen buram',
      'Interactive Split-Screen Before & After Slider',
      'Pengaturan Mikro-Kontras (Clarity) & Noise Threshold',
      'Batch processing dan unduh sekaligus ZIP',
      '100% Client-Side Privacy (Tanpa upload ke server)',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageSharpenerPageClient />
    </>
  );
}
