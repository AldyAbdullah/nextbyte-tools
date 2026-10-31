import { Metadata } from 'next';
import { ReceivePageClient } from '@/components/send/ReceivePageClient';

export const metadata: Metadata = {
  title: 'Terima Berkas - Nextbyte Send (P2P File Receiver)',
  description:
    'Terima berkas besar langsung dari pengirim secara cepat, aman, dan privat dengan memasukkan kode 6 karakter atau scan QR Code.',
  keywords: [
    'terima file p2p',
    'receive files online',
    'unduh file dari pengirim',
    'nextbyte receive',
    'webrtc receiver',
    'transfer file instan'
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/receive',
  },
  openGraph: {
    title: 'Terima Berkas - Nextbyte Send',
    description:
      'Terima file berukuran besar secara instan dan aman dari perangkat lain tanpa melalui perantara server cloud.',
    url: 'https://www.nextbyte.biz.id/receive',
    siteName: 'NextByte Tools',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function ReceivePage() {
  return <ReceivePageClient />;
}
