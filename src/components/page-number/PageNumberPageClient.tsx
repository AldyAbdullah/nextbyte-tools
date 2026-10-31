'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { PageNumberStudio } from './PageNumberStudio';

const FAQS = [
  {
    q: 'Bagaimana cara kerja alat penomoran halaman Word ini?',
    a: 'Alat ini memanipulasi struktur OpenXML (DOCX) secara native langsung di memori browser Anda. Sistem menyisipkan field dinamis Word PAGE dan NUMPAGES ke dalam header atau footer serta mengatur atribut section (<w:sectPr>) dan format angka (<w:pgNumType>) sehingga nomor halaman langsung aktif dan dapat diedit di Microsoft Word.',
  },
  {
    q: 'Apakah ini angka statis atau field dinamis Word yang sesungguhnya?',
    a: '100% menggunakan field Word dinamis (<w:fldSimple w:instr="PAGE"/>). Artinya, jika Anda membuka dokumen tersebut di Microsoft Word, WPS Office, atau Google Docs lalu menambah paragraf baru atau mengedit teks, nomor halaman akan otomatis terhitung ulang secara dinamis sesuai tata letak cetak Anda.',
  },
  {
    q: 'Bagaimana cara membuat format penomoran skripsi (Sampul tanpa nomor, Halaman awal Romawi, Isi angka Arab)?',
    a: 'Cukup pilih preset "Skripsi & Akademik". Sistem akan otomatis mengaktifkan Different First Page (w:titlePg) agar sampul bersih tanpa nomor, memberikan format Romawi kecil (i, ii, iii) pada bagian awal (Kata Pengantar/Daftar Isi), dan beralih ke angka Arab (1, 2, 3) pada Bab Isi.',
  },
  {
    q: 'Bagaimana jika dokumen saya belum memiliki Section Break?',
    a: 'Pada preset Skripsi & Akademik, sistem menyediakan fitur cerdas "Otomatis Pisahkan Section Jika Dokumen Belum Memiliki Section Break". Sistem akan mencari judul seperti "BAB I" atau tanda pemisah halaman untuk membuat section baru secara otomatis.',
  },
  {
    q: 'Apakah dokumen dengan tabel lebar atau halaman landscape tetap aman?',
    a: 'Sangat aman. Sistem mempertahankan seluruh dimensi halaman, margin, orientasi landscape, kop surat, logo, dan tabel asli Anda tanpa mengubah satu pun konten teks dalam dokumen.',
  },
  {
    q: 'Apakah dokumen skripsi atau naskah rahasia saya diunggah ke internet?',
    a: 'Tidak sama sekali. Seluruh proses pembacaan file .docx, penyisipan nomor, dan pengemasan file hasil berjalan 100% di peramban (RAM browser Anda). Berkas tidak pernah diunggah atau disimpan di server mana pun.',
  },
];

export default function PageNumberPageClient() {
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
          <span className="text-blue-600 dark:text-blue-400 font-medium">Word Page Number</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Penomoran Halaman Otomatis Dokumen Word
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Word Page Number{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
              Standar Skripsi &amp; Tesis
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Tambahkan nomor halaman Word (.docx) secara otomatis tanpa ribet mengatur section manual.
            Sampul tanpa nomor, halaman awal Romawi (i, ii, iii), dan isi dokumen angka Arab (1, 2, 3) 100% presisi.
          </p>
        </div>

        {/* Studio Core UI */}
        <PageNumberStudio />

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Preset Skripsi &amp; Akademik</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Terapkan skema penomoran baku skripsi dalam 1 klik: sampul tanpa nomor, halaman pengantar Romawi kecil, dan
              bab isi mulai dari angka Arab 1.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Field Dinamis Word Asli</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Menggunakan field OpenXML PAGE dan NUMPAGES murni. Nomor halaman akan otomatis menyesuaikan diri saat Anda
              menambah atau mengedit halaman di Microsoft Word.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">100% Privat &amp; Aman</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Naskah akademik dan dokumen berharga Anda tidak pernah diunggah ke internet. Seluruh proses manipulasi
              OpenXML berlangsung lokal di peramban Anda.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-4 h-4" />
              Tanya Jawab Seputar Penomoran Halaman Word
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">FAQ Word Page Number</h2>
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
