'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { MailMergeStudio } from './MailMergeStudio';

const FAQS = [
  {
    q: 'Apa itu Nextbyte Mail Merge?',
    a: 'Nextbyte Mail Merge adalah alat otomatisasi dokumen yang memungkinkan Anda menghasilkan puluhan hingga ratusan dokumen Word (.docx) secara massal dari satu template dokumen dan kumpulan data Excel (.xlsx, .xls) atau CSV. Sangat cocok untuk pembuatan surat dinas, piagam penghargaan, sertifikat pelatihan, slip gaji, kartu ujian, dan undangan.',
  },
  {
    q: 'Bagaimana cara menambahkan placeholder variabel di template Word saya?',
    a: 'Cukup ketik nama variabel diapit oleh kurung kurawal ganda di dalam dokumen Word Anda. Contoh: {{nama}}, {{jabatan}}, {{alamat}}, {{tanggal}}, {{nomor_surat}}, atau {{foto}}. Format font, warna, ukuran huruf, tata letak tabel, dan kop surat akan otomatis dipertahankan oleh sistem.',
  },
  {
    q: 'Apakah bisa menyisipkan foto atau pas foto penerima secara otomatis?',
    a: 'Bisa! Anda cukup membuat placeholder {{foto}} di template Word Anda, lalu pada Excel sediakan kolom berisi nama file foto (misal: andi.jpg). Di langkah ke-4 studio, unggah kumpulan foto penerima sekaligus. Sistem akan otomatis mencocokkan foto dengan setiap penerima dan memasukkannya ke dalam dokumen dengan ukuran presisi yang dapat Anda atur (misal Pas Foto 3x4 cm atau 4x6 cm).',
  },
  {
    q: 'Apakah dokumen atau data Excel saya diunggah ke server pihak ketiga?',
    a: 'Tidak sama sekali. Seluruh proses pembacaan Excel, analisis template Word, penggantian variabel, penyisipan foto, dan pengemasan ZIP dijalankan 100% di memori peramban (browser) perangkat Anda. Privasi data karyawan, siswa, atau klien Anda terjamin aman 100%.',
  },
  {
    q: 'Bagaimana jika ada nama kolom di Excel yang berbeda dengan nama variabel di Word?',
    a: 'Pada Langkah 3 (Pemetaan Kolom), sistem menyediakan fitur Smart Auto-Match serta menu pilihan dropdown manual. Anda dapat memetakan variabel Word apa pun ke kolom Excel mana pun yang Anda inginkan dengan fleksibel.',
  },
  {
    q: 'Apakah mendukung nomor surat otomatis dengan pola tertentu?',
    a: 'Ya, Anda dapat mengaktifkan fitur Penomoran Dokumen Otomatis. Anda bisa mengatur awalan (prefix), nomor awal, jumlah digit (misal: 001, 002), dan akhiran/suffix (misal: /HRD/X/2026). Variabel ini dapat disisipkan ke dalam dokumen melalui tag {{nomor_surat}}.',
  },
];

export default function MailMergePageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
          <Link href="/tools" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Alat
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">Word Mail Merge</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Otomatisasi Dokumen Massal Cepat & Privat
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Word Mail Merge Massal{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
              Via Excel & Foto
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Hasilkan ratusan surat, sertifikat, dan dokumen Word (.docx) secara otomatis berdasarkan template dan data
            Excel Anda. Lengkap dengan pencocokan foto, penomoran otomatis, dan ekspor ZIP instan.
          </p>
        </div>

        {/* Studio Core UI */}
        <MailMergeStudio />

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Privasi Data 100% Aman</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Seluruh pemrosesan dokumen Word dan data Excel diproses secara lokal langsung di memori browser Anda. Tidak
              ada data sensitif atau foto yang dikirim ke server luar.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pencocokan Foto Otomatis</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Dukungan pas foto dan gambar penerima (JPG, PNG, WebP) yang dapat dicocokkan otomatis berdasarkan nama berkas
              dengan ukuran proporsional (Pas Foto 3x4, 4x6 cm).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Massal Instan</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Hasilkan ribuan dokumen dalam hitungan detik, pratinjau data riil sebelum dibuat, dan unduh seluruh berkas
              dalam satu file arsip ZIP dengan penamaan otomatis.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-4 h-4" />
              Pertanyaan yang Sering Diajukan
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">FAQ Nextbyte Mail Merge</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
