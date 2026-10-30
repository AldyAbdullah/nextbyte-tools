'use client';

import React from 'react';
import { 
  FileSpreadsheet, 
  FileEdit, 
  Sliders, 
  FileArchive, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function BulkHowToUse() {
  const steps = [
    {
      number: '1',
      title: 'Download Template Excel',
      desc: 'Klik tombol "Download Excel Template" untuk mendapatkan format kolom yang sudah standar (.xlsx). File ini dapat dibuka langsung di Microsoft Excel, Google Sheets, maupun Apple Numbers.',
      icon: FileSpreadsheet,
      badge: 'Langkah 1',
      visual: (
        <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 pb-1">
            <span className="w-8">id</span>
            <span className="w-16">name *</span>
            <span className="w-24">content *</span>
            <span className="w-16">filename</span>
          </div>
          <div className="flex items-center gap-2 truncate text-blue-600 dark:text-blue-400">
            <span className="w-8">001</span>
            <span className="w-16 truncate">Website</span>
            <span className="w-24 truncate">https://...</span>
            <span className="w-16 truncate">web-qr</span>
          </div>
        </div>
      ),
    },
    {
      number: '2',
      title: 'Isi Data QR Code',
      desc: 'Isi baris nama QR Code dan konten data (link URL, teks, nomor WhatsApp, atau Wi-Fi). Anda juga dapat mengisi kolom description dan nama file kustom untuk kemudahan pengelompokan.',
      icon: FileEdit,
      badge: 'Langkah 2',
      visual: (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kolom Wajib Diisi:
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-snug">
            • <strong>name</strong>: Nama pengenal QR<br />
            • <strong>content</strong>: URL/teks yang akan di-scan
          </p>
        </div>
      ),
    },
    {
      number: '3',
      title: 'Upload & Atur Desain',
      desc: 'Unggah file Excel Anda (drag & drop), periksa tabel preview data untuk memastikan tidak ada baris yang kosong/error, lalu tentukan warna, bentuk titik, logo tengah, dan frame scan.',
      icon: Sliders,
      badge: 'Langkah 3',
      visual: (
        <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700/60">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
            QR
          </div>
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
            ✓
          </div>
          <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px]">
            Logo
          </div>
        </div>
      ),
    },
    {
      number: '4',
      title: 'Generate & Download',
      desc: 'Periksa tampilan live preview, lalu klik "Generate & Download ZIP". Sistem akan memproses seluruh QR Code secara instan di browser dan mengemasnya bersama report Excel.',
      icon: FileArchive,
      badge: 'Langkah 4',
      visual: (
        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-2.5 text-center border border-blue-200 dark:border-blue-900/40">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
            📦 bulk-qr-codes.zip
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            QR-Codes/ • report.xlsx • README.txt
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800/80 space-y-8">
      
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Panduan Praktis
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cara Menggunakan Bulk QR Code Generator
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Hasilkan puluhan hingga ratusan QR Code berkualitas cetak dalam 4 langkah mudah tanpa ribet.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.number}
              className="relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
                    {st.number}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {st.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-blue-500" />
                    {st.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>

              {/* Visual Demo snippet */}
              <div className="pt-2">
                {st.visual}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
