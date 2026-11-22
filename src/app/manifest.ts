import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NextByte Tools - Platform Alat Digital & QR Code',
    short_name: 'NextByte',
    description:
      'Platform multi-tools modern, cepat, dan 100% aman langsung di browser. QR Code Generator, Send File P2P, Word Mail Merge, PDF OCR Editor, dan AI Job Finder.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'id',
    dir: 'ltr',
    categories: ['utilities', 'productivity', 'tools'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'QR Code Generator',
        short_name: 'QR Code',
        description: 'Buat QR Code kustom logo & warna',
        url: '/tools/qr-code-generator',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'NextByte Send',
        short_name: 'Send P2P',
        description: 'Kirim berkas cepat antarperangkat via WebRTC',
        url: '/send',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'NextByte Clip',
        short_name: 'Clip',
        description: 'Bagikan teks & gambar via URL unik',
        url: '/clip',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'AI Job Vacancy Finder',
        short_name: 'Job Finder',
        description: 'Cari lowongan kerja aktif via Gemini AI',
        url: '/tools/ai-job-finder',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
