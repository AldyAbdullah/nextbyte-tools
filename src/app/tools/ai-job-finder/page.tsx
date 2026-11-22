import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Briefcase, ShieldCheck, Sparkles, Search, FileText } from 'lucide-react';
import { JobFinderStudio } from '@/components/job-finder/JobFinderStudio';

export const metadata: Metadata = {
  title: 'AI Job Vacancy Finder & Career Assistant - NextByte Tools',
  description:
    'Temukan lowongan kerja nyata, terverifikasi, dan terkini dari berbagai portal karir via Google Search Grounding & Gemini AI. Dilengkapi tips lolos seleksi dan generator surat lamaran kerja instan.',
  keywords: [
    'lowongan kerja terkini',
    'pencari kerja ai',
    'ai job finder',
    'loker indonesia',
    'surat lamaran kerja otomatis',
    'gemini job search',
    'nextbyte job finder',
  ],
  alternates: {
    canonical: 'https://www.nextbyte.biz.id/tools/ai-job-finder',
  },
  openGraph: {
    title: 'AI Job Vacancy Finder & Career Assistant - NextByte Tools',
    description:
      'Cari lowongan kerja nyata via Google Search Grounding & Gemini AI dengan mode privat eksklusif.',
    url: 'https://www.nextbyte.biz.id/tools/ai-job-finder',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextByte AI Job Finder & Career Assistant',
  url: 'https://www.nextbyte.biz.id/tools/ai-job-finder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  featureList: [
    'Pencarian Lowongan Kerja Real-Time via Google Search Grounding',
    'Dukungan Model Gemini 2.5 Flash, 2.0 Flash, dan Gemini 1.5 Pro',
    'Mode Akses Eksklusif Privat (BYOK - Bring Your Own Key)',
    'Generator Surat Lamaran Kerja (Cover Letter) Instan & Siap Pakai',
    'Tips Strategi Lolos Seleksi Berkas Khusus Posisi Terpilih',
    'Smart Local Cache: Hemat Kuota & Token 100% untuk Pencarian Berulang',
  ],
};

export default function AiJobFinderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-semibold">
            AI Job Vacancy Finder
          </span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Ditenagai Google Search Grounding & Gemini AI Pribadi</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>AI Job Vacancy Finder & Career Assistant</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Temukan lowongan kerja nyata, terkini, dan terverifikasi dari portal karir terkemuka di Indonesia dan luar negeri. Dilengkapi fitur analisis kualifikasi, tips seleksi AI, dan generator surat lamaran kerja resmi dalam hitungan detik.
          </p>
        </div>

        {/* Main Studio Interface */}
        <JobFinderStudio />

        {/* Trust Badges & Privacy Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">100% Akses Eksklusif Pribadi</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kunci API tersimpan di browser Anda, tidak bisa diakses atau dipakai oleh pengunjung web lain.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Search Grounding</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mencari data lowongan kerja nyata dari Jobstreet, LinkedIn, Glints, Karir.com, dan situs resmi.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Surat Lamaran Kerja Instan</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Buat draf Cover Letter formal yang disesuaikan persis dengan persyaratan lowongan terpilih.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
