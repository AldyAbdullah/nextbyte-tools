import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { QrCodePageClient } from '@/components/qrcode/QrCodePageClient';
import { QrCode, ChevronRight, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QR Code Generator (Single & Bulk Excel) - NextByte Tools',
  description: 'Buat QR Code kustom profesional secara individu maupun massal (bulk) via file Excel dengan pilihan bentuk dots, logo tengah, frame Scan Me, dan export ZIP / PDF HD.',
};

export default function QrCodeGeneratorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Breadcrumb & Header Title */}
      <div className="space-y-3">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-blue-600 transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-slate-200 font-medium">
            QR Code Generator
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <QrCode className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Advanced QR Code Generator
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Buat dan modifikasi QR code interaktif satu per satu atau secara massal (Bulk via Excel) lengkap dengan logo, scan frame, dan download kualitas print HD.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Client-Side Generator
            </span>
          </div>
        </div>
      </div>

      {/* Main Generator Mode Component (Single & Bulk Excel) */}
      <QrCodePageClient />

      {/* Instructional Guide & FAQ Section below */}
      <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tips Penggunaan Logo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ketika menambahkan logo di tengah QR Code, gunakan Error Correction level H (High - 30%). Level ini memastikan QR Code tetap dapat dipindai meskipun sebagian pola tengah tertutup logo.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Kontras Warna yang Baik
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pastikan warna Foreground (pola QR) jauh lebih gelap daripada warna Background, atau sebaliknya. Kamera ponsel membaca QR Code berdasarkan kontras warna terang dan gelap.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Resolusi Cetak (HD)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Untuk keperluan cetak banner, brosur, atau kartu nama fisik, pilih resolusi 4x (1200px) atau format SVG vektor agar hasil cetak tidak pecah atau buram.
          </p>
        </div>
      </div>

    </div>
  );
}
