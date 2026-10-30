import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Database, 
  Sparkles, 
  ArrowRight,
  Globe,
  Lock,
  Cpu
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang NextByte Tools - Multi Tools Platform',
  description: 'Kenali visi NextByte Tools: platform utilitas digital modern berbasis client-side yang cepat, privat, dan bebas biaya.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Visi & Misi Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Sederhana, Cepat, dan <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Privat untuk Semua Orang.
          </span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          NextByte Tools diciptakan untuk menyediakan berbagai alat bantu digital produktivitas tanpa iklan yang mengganggu dan tanpa mengorbankan privasi data Anda.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Privasi Adalah Prioritas Utama
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Berbeda dengan converter atau generator online pada umumnya yang mengunggah teks, password, atau foto Anda ke server mereka, NextByte memproses semuanya langsung di memori browser (client-side). Tidak ada log yang tersimpan di server kami.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Performa Edge Network Modern
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Dibangun dengan Next.js App Router dan di-deploy melalui jaringan serverless global Vercel. Waktu muat halaman instan, responsif di semua perangkat, dan siap menangani ribuan pengunjung bersamaan.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Dukungan Database Supabase
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Platform ini terintegrasi dengan database modern Supabase PostgreSQL. Pengguna dapat menyimpan riwayat konfigurasi desain QR code baik secara lokal di browser maupun disinkronkan ke database cloud secara gratis.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Bebas Biaya & Tanpa Watermark
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Semua hasil generate (termasuk unduhan gambar QR Code beresolusi 4x 1200px dan format vektor SVG) bebas dari watermark apa pun dan dapat digunakan langsung untuk keperluan komersial maupun pribadi.
          </p>
        </div>
      </div>

      {/* Roadmap & Architecture */}
      <div className="p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Peta Rencana Pengembangan (Roadmap)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tools berikutnya yang sedang dalam persiapan rilis:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { phase: 'Tahap 1 (Sekarang)', item: 'Advanced QR Code Generator dengan Logo & Scan Frame', status: 'Selesai' },
            { phase: 'Tahap 2', item: 'Strong Password Generator dengan Entropy Calculator', status: 'In Progress' },
            { phase: 'Tahap 3', item: 'JSON Formatter, Validator & Tree Visualizer', status: 'Next' },
            { phase: 'Tahap 4', item: 'Client-Side Image Compressor & Format Converter (WebP, PNG, JPG)', status: 'Planned' },
          ].map((r, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block uppercase">
                  {r.phase}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{r.item}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                r.status === 'Selesai'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/tools/qr-code-generator"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            Mulai Gunakan QR Code Generator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
