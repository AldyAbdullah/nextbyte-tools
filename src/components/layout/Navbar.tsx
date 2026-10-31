'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Mail,
  ListOrdered,
  Image as ImageIcon,
  Minimize2,
  Sparkles,
  Eraser,
  QrCode,
  Barcode,
  Share2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { SearchModal } from '@/components/common/SearchModal';

interface NavToolItem {
  name: string;
  href: string;
  desc: string;
  icon: React.ElementType;
  badge?: string;
  iconColor: string;
  iconBg: string;
}

interface NavCategory {
  title: string;
  items: NavToolItem[];
}

const TOOL_CATEGORIES: NavCategory[] = [
  {
    title: 'DOCUMENT TOOLS',
    items: [
      {
        name: 'Word Mail Merge',
        href: '/tools/mail-merge',
        desc: 'Surat massal dari Word & Excel',
        icon: Mail,
        badge: 'Baru',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      },
      {
        name: 'Word Page Number',
        href: '/tools/word-page-number',
        desc: 'Nomor halaman otomatis & format skripsi',
        icon: ListOrdered,
        badge: 'Baru',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      },
      {
        name: 'Caption Generator',
        href: '/tools/caption-generator',
        desc: 'Caption gambar/tabel & daftar isi dinamis',
        icon: ImageIcon,
        badge: 'Baru',
        iconColor: 'text-sky-600 dark:text-sky-400',
        iconBg: 'bg-sky-50 dark:bg-sky-950/60',
      },
    ],
  },
  {
    title: 'IMAGE TOOLS',
    items: [
      {
        name: 'Image Compressor',
        href: '/tools/image-compressor',
        desc: 'Kompresi PNG, JPG & WebP hemat 90%',
        icon: Minimize2,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      },
      {
        name: 'Image Sharpener',
        href: '/tools/image-sharpener',
        desc: 'Pertajam foto buram & perjelas dokumen KTP',
        icon: Sparkles,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      },
      {
        name: 'Background Remover',
        href: '/tools/image-background-remover',
        desc: 'Hapus background AI lokal tanpa upload',
        icon: Eraser,
        badge: 'AI',
        iconColor: 'text-rose-600 dark:text-rose-400',
        iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      },
    ],
  },
  {
    title: 'QR & BARCODE',
    items: [
      {
        name: 'QR Code Generator',
        href: '/tools/qr-code-generator',
        desc: 'Kustomisasi warna, bentuk & logo HD',
        icon: QrCode,
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      },
      {
        name: 'Barcode Generator',
        href: '/tools/barcode-generator',
        desc: 'Barcode standar retail (Code 128, EAN-13)',
        icon: Barcode,
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        iconBg: 'bg-cyan-50 dark:bg-cyan-950/60',
      },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Desktop mega menu dropdown state
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(true);

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close menus when route changes
  useEffect(() => {
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle click outside to close desktop dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key to close menus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hover handlers with graceful delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsToolsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsToolsOpen(false);
    }, 180);
  };

  const isToolsActive = pathname.startsWith('/tools');
  const isSendActive = pathname === '/send' || pathname.startsWith('/send') || pathname === '/receive';
  const isAboutActive = pathname === '/about';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* ================= BAGIAN KIRI: LOGO & PLATFORM NAME ================= */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center bg-slate-900 border border-slate-800 shrink-0">
              <Image
                src="/logo-icon.png"
                alt="NextByte Logo"
                width={36}
                height={36}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                NextByte
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/80">
                Tools
              </span>
            </div>
          </Link>

          {/* ================= BAGIAN TENGAH: MINIMALIST SAAS NAV ================= */}
          <nav className="hidden md:flex items-center gap-1" ref={dropdownRef}>
            {/* Tools Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                aria-expanded={isToolsOpen}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isToolsActive || isToolsOpen
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm shadow-blue-500/5'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>Tools</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isToolsOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Mega Menu Elevated Panel */}
              {isToolsOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2.5 w-[760px] animate-in fade-in-0 zoom-in-95 duration-150 z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 dark:shadow-black/60 overflow-hidden">
                    {/* Multi-Column Grid */}
                    <div className="p-6 grid grid-cols-3 gap-6">
                      {TOOL_CATEGORIES.map((category) => (
                        <div key={category.title} className="space-y-3">
                          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-2">
                            {category.title}
                          </div>

                          <div className="space-y-1">
                            {category.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isCurrent = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setIsToolsOpen(false)}
                                  className={`group flex items-start gap-3 p-2.5 rounded-2xl transition-all ${
                                    isCurrent
                                      ? 'bg-blue-50/80 dark:bg-blue-950/50'
                                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-850/80'
                                  }`}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm`}
                                  >
                                    <ItemIcon className="w-4 h-4" />
                                  </div>

                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.name}
                                      </span>
                                      {item.badge && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                                      {item.desc}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mega Menu Footer Banner */}
                    <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>100% Client-Side Privacy — Berkas Anda tidak pernah disimpan di server.</span>
                      </div>

                      <Link
                        href="/tools"
                        onClick={() => setIsToolsOpen(false)}
                        className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group text-xs"
                      >
                        <span>Lihat Semua Alat</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nextbyte Send Nav Link */}
            <Link
              href="/send"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isSendActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm shadow-blue-500/5'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Share2 className="w-4 h-4 text-blue-500" />
              <span>Send</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                P2P
              </span>
            </Link>

            {/* About Nav Link */}
            <Link
              href="/about"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isAboutActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-sm shadow-blue-500/5'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              About
            </Link>
          </nav>

          {/* ================= BAGIAN KANAN: SEARCH & THEME TOGGLE ================= */}
          <div className="flex items-center gap-2">
            {/* Search Trigger Button (Compact SaaS style) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all"
              title="Cari alat (Ctrl+K / ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Cari Alat...</span>
              <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-500 rounded border border-slate-300 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              aria-label="Ganti Tema Tampilan"
              title={`Tema: ${theme}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ================= MOBILE DRAWER NAVIGATION ================= */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-6 space-y-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
            {/* Direct Links */}
            <div className="space-y-1">
              <Link
                href="/send"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isSendActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Nextbyte Send</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  P2P Transfer
                </span>
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                  isAboutActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                About Nextbyte
              </Link>
            </div>

            {/* Tools Accordion Section */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <button
                onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Katalog Tools
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileToolsOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {isMobileToolsOpen && (
                <div className="space-y-4 pl-1">
                  {TOOL_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase px-3">
                        {category.title}
                      </div>

                      <div className="space-y-0.5">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isCurrent = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                                isCurrent
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                              >
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/tools"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <span>Lihat Semua Alat Digital</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
