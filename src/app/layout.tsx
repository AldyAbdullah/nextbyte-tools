import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/common/Toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nextbyte.biz.id'),
  title: {
    default: 'NextByte Tools - Platform Alat Digital & QR Code Generator Terlengkap',
    template: '%s | NextByte Tools',
  },
  description: 'Platform multi-tools modern, cepat, dan 100% aman langsung di browser. Buat QR Code kustom lengkap dengan logo, warna, scan frame, serta fitur Bulk QR Code via Excel gratis.',
  keywords: [
    'nextbyte',
    'nextbyte tools',
    'qr code generator indonesia',
    'buat qr code gratis',
    'qr code massal excel',
    'bulk qr code generator',
    'qr code logo',
    'qr generator online',
    'alat digital online',
    'free web utilities',
  ],
  authors: [{ name: 'NextByte Team', url: 'https://www.nextbyte.biz.id' }],
  creator: 'NextByte',
  publisher: 'NextByte',
  alternates: {
    canonical: 'https://www.nextbyte.biz.id',
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'NextByte Tools - Platform Alat Digital & QR Code Generator Terlengkap',
    description: 'Buat QR Code kustom logo dan generate massal (bulk) dari file Excel dengan cepat dan gratis langsung di browser Anda.',
    url: 'https://www.nextbyte.biz.id',
    siteName: 'NextByte Tools',
    images: [
      {
        url: '/logo-icon.png',
        width: 512,
        height: 512,
        alt: 'NextByte Tools Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextByte Tools - QR Code Generator Kustom & Bulk Excel',
    description: 'Platform alat digital modern dengan fitur generate QR Code massal dari Excel 100% client-side & gratis.',
    images: ['/logo-icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors`}>
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
