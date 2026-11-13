import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, KeyRound, ShieldCheck, Zap, Lock, FileCheck } from 'lucide-react';
import { PasswordGeneratorStudio } from '@/components/password-generator/PasswordGeneratorStudio';

export const metadata: Metadata = {
  title: 'Strong Password Generator Online Gratis (Kuat & Acak) - NextByte Tools',
  description:
    'Buat password kuat, aman, dan acak menggunakan Web Crypto API. Kustomisasi panjang karakter, simbol, angka, dan mode frasa sandi mudah diingat. 100% aman langsung di browser Anda.',
  keywords: [
    'password generator online',
    'pembuat kata sandi kuat',
    'strong password generator',
    'password acak gratis',
    'secure password generator',
    'passphrase generator indonesia',
    'nextbyte password generator',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/password-generator',
  },
  openGraph: {
    title: 'Strong Password Generator Online Gratis - NextByte Tools',
    description:
      'Generate password ultra-aman dengan entropi kriptografi tinggi langsung di browser Anda.',
    url: 'https://www.nextbyte.biz.id/tools/password-generator',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte Strong Password Generator',
  url: 'https://www.nextbyte.biz.id/tools/password-generator',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Generate Password dengan Entropi Kriptografi Tinggi (Web Crypto API)',
    'Slider Panjang Karakter Fleksibel (8 - 64 karakter)',
    'Mode Frasa Sandi (Passphrase) Bahasa Indonesia yang Mudah Diingat',
    'Indikator Kekuatan Password dan Estimasi Waktu Retas',
    'Opsi Hindari Karakter Membingungkan (1, l, I, 0, O)',
    '100% Client-Side: Password Tidak Pernah Dikirim ke Server',
  ],
};

export default function PasswordGeneratorPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Alat
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Password Generator</span>
        </nav>

        {/* Header Title & Subtitle */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Alat Keamanan & Sandi Gratis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Strong Password Generator Online
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Buat kata sandi acak dengan tingkat keamanan maksimal untuk akun email, media sosial, perbankan, dan server Anda. 100% aman dan tidak pernah dikirim ke jaringan.
          </p>
        </header>

        {/* Interactive Studio */}
        <main>
          <PasswordGeneratorStudio />
        </main>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Kriptografi Standar Militer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Menggunakan fungsi entropi bawaan `crypto.getRandomValues()` yang anti-prediksi dan tahan terhadap serangan *brute-force*.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Nol Log di Server
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Password dibuat langsung di memori lokal peramban Anda. Kami tidak menyimpan atau merekam kata sandi yang Anda buat.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Mode Frasa Sandi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sulit menghafal karakter acak? Aktifkan mode frasa sandi (*passphrase*) untuk kombinasi kata yang mudah diingat namun tetap sangat sulit ditembus.
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary-600" />
            <span>Pertanyaan Umum (FAQ)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Berapa panjang kata sandi yang direkomendasikan?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Pakar keamanan merekomendasikan minimal <strong>16 karakter</strong> yang menggabungkan huruf besar, huruf kecil, angka, dan simbol untuk akun-akun penting Anda.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Apakah aman menyalin kata sandi dari website ini?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Sangat aman. Seluruh logika algoritma pembuatan password berjalan 100% *client-side* di perangkat Anda tanpa interaksi jaringan ke server kami.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
