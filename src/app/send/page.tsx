import { Metadata } from 'next';
import { SendPageClient } from '@/components/send/SendPageClient';

export const metadata: Metadata = {
  title: 'Nextbyte Send - Kirim File Besar Antarperangkat Cepat & Privat (P2P)',
  description:
    'Kirim file besar (hingga 10 GB) langsung antarperangkat (Windows, Android, iPhone, Mac, Linux) tanpa login, tanpa batasan, dan 100% aman via WebRTC P2P.',
  keywords: [
    'nextbyte send',
    'kirim file p2p',
    'airdrop alternatif windows android',
    'transfer file online gratis',
    'kirim file 10gb gratis',
    'file sharing webrtc',
    'transfer file tanpa login',
    'kirim video ukuran besar',
    'nextbyte tools'
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/send',
  },
  openGraph: {
    title: 'Nextbyte Send - Kirim Berkas Antarperangkat Instan & Aman',
    description:
      'Transfer berkas langsung dari browser Anda ke perangkat penerima tanpa batasan ukuran dan tanpa disimpan di server. Cepat, privat, dan terenkripsi.',
    url: 'https://www.nextbyte.biz.id/send',
    siteName: 'NextByte Tools',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nextbyte Send - Secure Peer-to-Peer File Transfer',
    description:
      'Send files. Anywhere. Instantly. Transfer file besar antarperangkat tanpa perantara server.',
  },
};

export default function SendPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Nextbyte Send',
    url: 'https://www.nextbyte.biz.id/send',
    description:
      'Layanan transfer file peer-to-peer (P2P) berkecepatan tinggi antarperangkat berbasis WebRTC DataChannel dengan enkripsi DTLS, QR code pairing, dan dukungan file hingga 10 GB.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    featureList: [
      'Direct Peer-to-Peer file transfer (WebRTC DataChannel)',
      'Enkripsi DTLS penuh tanpa penyimpanan di server',
      'Dukungan file besar hingga 10 GB via File System Access API',
      'Universal lintas OS (Windows, Android, iOS, macOS, Linux)',
      'Pairing instan dengan Kode 6 Karakter atau QR Code',
      '100% Gratis tanpa login',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SendPageClient />
    </>
  );
}
