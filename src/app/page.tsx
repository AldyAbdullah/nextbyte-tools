'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  QrCode, 
  KeyRound, 
  FileCode2, 
  Minimize2, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Binary, 
  Type, 
  AlignLeft,
  ChevronRight,
  Layers,
  Barcode,
  Sparkles,
  Share2
} from 'lucide-react';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/config/tools';
import { ToolCategory } from '@/types/tools';

const ICON_MAP: Record<string, React.ElementType> = {
  QrCode,
  Barcode,
  Sparkles,
  Share2,
  KeyRound,
  FileCode2,
  Minimize2,
  Image: ImageIcon,
  FileText,
  Link2,
  Binary,
  Type,
  AlignLeft,
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('All');

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const availableTools = filteredTools.filter((t) => t.status === 'available');
  const comingSoonTools = filteredTools.filter((t) => t.status === 'coming-soon');

  return (
    <div className="space-y-16 pb-20">

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Top Mini Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500 shadow-sm">
          <Image src="/logo-icon.png" alt="NextByte" width={18} height={18} className="rounded-md" />
          <span>NextByte Multi Tools Platform • Modern & Privacy-First</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-5">
          All Your Everyday Tools in <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-500 bg-clip-text text-transparent">
            One Single Place.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Kumpulan utilitas digital pintar untuk mempermudah pekerjaan sehari-hari. Cepat, tanpa instalasi, dan diproses langsung 100% di browser Anda demi keamanan privasi.
        </p>

        {/* Hero Interactive Search Bar */}
        <div className="max-w-xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tools: QR Code, Password, JSON, Wi-Fi, Image..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-20 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
            <Link
              href="/tools/qr-code-generator"
              className="absolute right-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-sm"
            >
              Coba QR
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Client-Side Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Tanpa Server Latency
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-500" /> Gratis Selamanya
          </span>
        </div>

      </section>

      {/* 2. Featured Tool Showcase (QR Code Generator) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/70 to-white dark:from-slate-900/90 dark:to-slate-950 border border-blue-100 dark:border-slate-800 p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Featured & Available Now
              </div>

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                QR Code Generator Profesional
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Buat QR Code dengan kustomisasi tingkat lanjut: pilih bentuk pola titik, bentuk sudut, warna kontras, pasang logo bisnis di tengah, tambahkan frame &ldquo;Scan Me&rdquo;, serta tulisan pendukung. Export hasil beresolusi tinggi (PNG, SVG, JPG) siap cetak.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {['URL & Link', 'WhatsApp Chat', 'Wi-Fi Connect', 'Custom Logo', 'Scan Me Frame', 'High-Res 1200px'].map((f) => (
                  <span
                    key={f}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/tools/qr-code-generator"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 group"
                >
                  Buka QR Code Generator
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/tools"
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
                >
                  Lihat Semua Tools
                </Link>
              </div>
            </div>

            {/* Right Mini Graphic Card Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xs w-full text-center space-y-4">
                <div className="py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                  SCAN ME
                </div>
                <div className="w-44 h-44 mx-auto bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3 border border-slate-200 dark:border-slate-800">
                  <QrCode className="w-full h-full text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  nextbyte.biz.id
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Category Filter Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Eksplorasi Katalog Tools
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan {filteredTools.length} tools dalam berbagai kategori
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TOOL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid: Available Tools First */}
        <div className="pt-8 space-y-10">
          
          {/* Section A: Ready to Use (Available) */}
          {availableTools.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tersedia untuk Digunakan ({availableTools.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTools.map((tool) => {
                  const Icon = ICON_MAP[tool.iconName] || QrCode;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 hover:border-blue-500 dark:hover:border-blue-400 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/60">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            Available
                          </span>
                        </div>

                        <div>
                          <h5 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.name}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <span>Gunakan Tool Sekarang</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section B: Coming Soon Tools */}
          {comingSoonTools.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Segera Hadir / In Development ({comingSoonTools.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {comingSoonTools.map((tool) => {
                  const Icon = ICON_MAP[tool.iconName] || FileCode2;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Coming Soon
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                              {tool.name}
                            </h5>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {tool.category}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                          Detail <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 4. Why NextByte Tools Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mengapa Menggunakan NextByte Tools?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Dibangun dengan standar rekayasa software modern untuk performa tanpa hambatan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                100% Client-Side Privacy
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Data input, teks, password, dan logo Anda tidak pernah dikirim ke server. Pemrosesan dilakukan murni di memori browser Anda.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                Ultra Fast & Responsive
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Di-host menggunakan jaringan Edge global Next.js dan Vercel, memastikan waktu muat secepat kilat dari mana pun Anda mengakses.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                Database Cloud Ready
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dilengkapi arsitektur integrasi Supabase PostgreSQL untuk penyimpanan riwayat konfigurasi dan sinkronisasi akun masa depan.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
