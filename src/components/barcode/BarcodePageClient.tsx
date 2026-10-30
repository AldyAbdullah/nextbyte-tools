'use client';

import React from 'react';
import Link from 'next/link';
import { BarcodeGenerator } from './BarcodeGenerator';
import { 
  Barcode, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Printer, 
  HelpCircle,
  FileCheck2,
  PackageCheck
} from 'lucide-react';

export function BarcodePageClient() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Breadcrumb & Hero Header */}
      <div className="space-y-4">
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
            Barcode Generator
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Free Online Barcode Generator
                </h1>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  Standar Industri: Code 128, EAN-13, UPC, Code 39, ITF-14 & Codabar
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Buat barcode kustom gratis beresolusi tinggi langsung di browser tanpa watermark. Siap dicetak untuk label produk ritel, nomor resi ekspedisi, inventaris barang, atau perpustakaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Client-Side
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <Printer className="w-3.5 h-3.5 text-blue-500" /> Ekspor SVG & HD Print
            </span>
          </div>
        </div>
      </div>

      {/* Main Barcode Generator Interactive Studio */}
      <BarcodeGenerator />

      {/* Guide Section: Format Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-lg space-y-8">
        <div className="space-y-1.5 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" /> Panduan Pemilihan Format
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Format Barcode Mana yang Harus Anda Gunakan?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Pilihlah simbologi barcode yang sesuai dengan kebutuhan sistem dan alat pemindai Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              128
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Code 128 (Paling Direkomendasikan)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standar terbaik untuk penomoran bebas alfanumerik. Cocok untuk nomor resi pengiriman, SKU produk internal gudang, nomor seri peralatan, dan tiket acara.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              EAN
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              EAN-13 (Kemasan Produk Toko)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standar resmi barcode produk ritel yang dijual di supermarket dan minimarket di seluruh Indonesia (GS1). Wajib menggunakan 12 atau 13 digit angka murni.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
              39
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Code 39 (Aset & ID Card)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Banyak digunakan di instansi pemerintah, rumah sakit, dan perusahaan untuk stiker label inventaris aset kantor serta nomor identitas karyawan.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Pertanyaan Umum (FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="space-y-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Apakah hasil barcode ini bisa dipindai dengan smartphone?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Ya! Seluruh format barcode yang dihasilkan memenuhi standar ISO internasional dan dapat langsung dipindai menggunakan aplikasi barcode scanner di smartphone Android & iPhone, maupun pemindai laser kasir POS.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              Format unduhan apa yang paling bagus untuk dicetak?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Gunakan format <strong>SVG (Vector)</strong> untuk hasil cetak paling tajam tanpa pecah sama sekali pada ukuran berapa pun, atau unduh <strong>PNG (Resolusi 4x Cetak)</strong> untuk printer stiker label thermal.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
