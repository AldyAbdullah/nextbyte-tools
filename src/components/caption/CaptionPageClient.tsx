'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  BookOpen,
  FileCheck,
  ListFilter,
} from 'lucide-react';
import { CaptionStudio } from './CaptionStudio';

const FAQS = [
  {
    q: 'Bagaimana cara kerja Caption Generator Word ini?',
    a: 'Sistem menganalisis struktur dokumen OpenXML (.docx) Anda untuk mendeteksi semua elemen gambar (<w:drawing>) dan tabel (<w:tbl>), lalu mengaitkannya dengan nomor BAB terdekat. Sistem menyisipkan caption berformat field Word dynamic SEQ (misalnya SEQ Gambar \\s 1) dan membuat halaman Daftar Gambar serta Daftar Tabel menggunakan field TOC.',
  },
  {
    q: 'Apakah nomor caption ini statis atau field dinamis Microsoft Word yang sesungguhnya?',
    a: '100% menggunakan field Word dinamis (<w:fldSimple w:instr="SEQ Gambar \\* ARABIC \\s 1"/>). Artinya, jika naskah dibuka di Microsoft Word dan Anda menambah gambar baru di tengah naskah, nomor gambar setelahnya akan otomatis menyesuaikan saat Anda menekan tombol F9 (Update Field).',
  },
  {
    q: 'Bagaimana penomoran berdasarkan BAB bekerja?',
    a: 'Sistem mendeteksi judul BAB (misal: "BAB I PENDAHULUAN" atau style Heading 1). Gambar pertama di BAB I akan bernomor "Gambar 1.1", gambar kedua "Gambar 1.2". Saat berpindah ke BAB II, nomor otomatis dimulai ulang menjadi "Gambar 2.1". Begitu pula untuk penomoran tabel ("Tabel 1.1", "Tabel 2.1").',
  },
  {
    q: 'Bagaimana Daftar Gambar dan Daftar Tabel dibuat?',
    a: 'Sistem menyisipkan halaman khusus sebelum BAB I dengan judul "DAFTAR GAMBAR" dan "DAFTAR TABEL". Halaman ini dilengkapi field Word TOC dynamic serta tab dot leaders (titik-titik rapi standar skripsi), sehingga naskah langsung siap dicetak maupun diperbarui di Microsoft Word.',
  },
  {
    q: 'Bagaimana jika dokumen saya sudah memiliki caption sebelumnya?',
    a: 'Sistem secara otomatis mendeteksi jika suatu gambar atau tabel sudah memiliki teks caption di sekitarnya. Anda dapat memilih opsi "Ganti / Perbarui caption lama" untuk menghindari caption ganda, atau mempertahankan caption asli.',
  },
  {
    q: 'Apakah gambar atau tabel saya akan berubah ukuran atau kualitasnya?',
    a: 'Tidak sama sekali. Sistem mempertahankan seluruh dimensi gambar (<wp:extent>), resolusi file media asli, padding, dan struktur baris/kolom tabel tanpa merusak tata letak dokumen Anda.',
  },
];

export default function CaptionPageClient() {
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
          <span className="text-blue-600 dark:text-blue-400 font-medium">Caption Generator Word</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Caption Otomatis &amp; Daftar Gambar/Tabel Word
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Word Caption Generator{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
              Standar Skripsi &amp; Karya Ilmiah
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Tambahkan caption gambar dan tabel otomatis berdasarkan BAB (Gambar 1.1, Tabel 2.1) serta buat{' '}
            <strong>Daftar Gambar</strong> dan <strong>Daftar Tabel</strong> dinamis langsung di file Word (.docx) Anda.
          </p>
        </div>

        {/* Studio Core Component */}
        <CaptionStudio />

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Penomoran Berdasarkan BAB</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Otomatis mengikuti struktur BAB naskah Anda. Gambar di BAB I menjadi <code>Gambar 1.1</code>, dan tabel di BAB II
              menjadi <code>Tabel 2.1</code> dengan reset nomor otomatis di setiap bab baru.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Field Dinamis Word (SEQ &amp; TOC)</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Bukan sekadar teks biasa. Menggunakan field Word native sehingga nomor caption dan daftar gambar/tabel dapat diperbarui
              secara dinamis saat Anda mengedit naskah di Microsoft Word.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ListFilter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Gambar &amp; Tabel Rapi</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Otomatis membuat halaman Daftar Gambar dan Daftar Tabel lengkap dengan titik-titik tab (dot leader) rapi siap cetak
              sesuai panduan penulisan skripsi perguruan tinggi.
            </p>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Semua yang perlu Anda ketahui tentang Caption Generator Word otomatis
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
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
