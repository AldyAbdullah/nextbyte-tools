import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                <Image
                  src="/logo-icon.png"
                  alt="NextByte Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                NextByte <span className="text-blue-600 dark:text-blue-400">Tools</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Platform multi-tools modern untuk produktivitas harian Anda. 100% diproses langsung di browser tanpa upload data ke server untuk privasi maksimal.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Client-Side Privacy
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" /> Ultra Fast
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-blue-500" /> Free Forever
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  All Tools Directory
                </Link>
              </li>
              <li>
                <Link href="/tools/qr-code-generator" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  QR Code Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/barcode-generator" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Barcode Generator
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  About & Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured & Upcoming Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Tool Categories
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/tools?category=Utility" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Utility Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=Developer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Developer Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=Media" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Media & Images
                </Link>
              </li>
              <li>
                <Link href="/tools?category=Security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Security & Encryption
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} NextByte Platform. Hosted on modern edge network.</p>
          <p className="flex items-center gap-1">
            Crafted for <span className="font-semibold text-slate-700 dark:text-slate-300">nextbyte.biz.id</span> & <span className="font-semibold text-slate-700 dark:text-slate-300">aldiabdullah.biz.id</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
