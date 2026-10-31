import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { TOOLS_REGISTRY } from '@/config/tools';
import { 
  ChevronRight, 
  Clock, 
  ArrowLeft, 
  QrCode, 
  CheckCircle2,
  KeyRound, 
  FileCode2, 
  Minimize2, 
  Image as ImageIcon, 
  FileText, 
  Link2, 
  Binary, 
  Type, 
  AlignLeft,
  Barcode,
  Sparkles,
  Share2,
  Mail
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  QrCode,
  Barcode,
  Sparkles,
  Share2,
  Mail,
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

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return TOOLS_REGISTRY.filter(
    (tool) => !['qr-code-generator', 'barcode-generator', 'mail-merge', 'image-compressor', 'image-sharpener', 'send', 'receive'].includes(tool.slug)
  ).map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS_REGISTRY.find((t) => t.slug === slug);
  if (!tool) {
    return { title: 'Tool Not Found - NextByte Tools' };
  }
  return {
    title: `${tool.name} - NextByte Tools`,
    description: tool.description,
  };
}

export default async function DynamicToolPage({ params }: ToolPageProps) {
  const { slug } = await params;

  // Redirect ke halaman khusus tool yang tersedia
  if (slug === 'qr-code-generator') {
    redirect('/tools/qr-code-generator');
  }
  if (slug === 'barcode-generator') {
    redirect('/tools/barcode-generator');
  }
  if (slug === 'mail-merge') {
    redirect('/tools/mail-merge');
  }
  if (slug === 'image-compressor') {
    redirect('/tools/image-compressor');
  }
  if (slug === 'image-sharpener') {
    redirect('/tools/image-sharpener');
  }
  if (slug === 'send') {
    redirect('/send');
  }
  if (slug === 'receive') {
    redirect('/receive');
  }

  const tool = TOOLS_REGISTRY.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  const Icon = ICON_MAP[tool.iconName] || FileCode2;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      
      {/* Breadcrumb */}
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
          {tool.name}
        </span>
      </nav>

      {/* Hero Coming Soon Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-2xl text-center space-y-6">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-900 shadow-md">
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Dalam Tahap Pengembangan (Coming Soon)
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tool.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Feature roadmap preview */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto space-y-2 text-left">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Rencana Fitur Tool Ini:
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% diproses langsung di browser secara privat</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Ekspor instan tanpa watermark atau batasan kuota</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Integrasi cloud history menggunakan Supabase</span>
            </div>
          </div>
        </div>

        {/* Action Button: Try available QR Code tool */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/tools/qr-code-generator"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Coba QR Code Generator (Sudah Aktif)
          </Link>
          <Link
            href="/tools"
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Semua Tools
          </Link>
        </div>

      </div>

    </div>
  );
}
