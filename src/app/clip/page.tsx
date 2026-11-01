import { Metadata } from 'next';
import { ClipboardCreatorClient } from '@/components/clipboard/ClipboardCreatorClient';

export const metadata: Metadata = {
  title: 'Nextbyte Clip - Bagikan Teks & Gambar Instan Lewat Custom URL',
  description:
    'Simpan dan bagikan catatan teks, cuplikan kode, atau gambar antarperangkat secara instan lewat custom URL unik tanpa login. Privasi terjamin dengan masa berlaku otomatis dan mode burn-after-read.',
  keywords: [
    'nextbyte clip',
    'online clipboard',
    'bagikan teks online',
    'share text and image url',
    'cl1p net alternative',
    'clipboard antar perangkat',
    'temp pastebin image',
    'pastebin gambar gratis',
    'berbagi teks tanpa login',
    'nextbyte tools'
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/clip',
  },
  openGraph: {
    title: 'Nextbyte Clip - Share Anything, Instantly',
    description:
      'Cara paling ringkas dan cepat untuk berbagi teks dan gambar antarperangkat Anda dengan custom URL pendek tanpa perlu mendaftar atau login.',
    url: 'https://www.nextbyte.biz.id/clip',
    siteName: 'NextByte Tools',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nextbyte Clip - Instant Text & Image Sharing',
    description:
      'Bagikan catatan, kode, atau gambar antarperangkat langsung melalui custom URL unik.',
  },
};

export default function ClipPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Nextbyte Clip',
    url: 'https://www.nextbyte.biz.id/clip',
    description:
      'Layanan penyimpanan dan berbagi teks serta gambar sementara antarperangkat melalui custom URL tanpa registrasi dengan enkripsi, masa berlaku otomatis, dan proteksi password opsional.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    featureList: [
      'Custom URL slug yang ringkas (/clip/nama)',
      'Penyimpanan teks hingga 100 KB dan gambar hingga 5 MB',
      'Masa berlaku fleksibel hingga 12 jam',
      'Mode Burn After Read (otomatis terhapus setelah dibuka)',
      'Opsi enkripsi proteksi password',
      'Manajemen token aman untuk pemilik clipboard',
      '100% Gratis tanpa login atau instalasi',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClipboardCreatorClient />
    </>
  );
}
