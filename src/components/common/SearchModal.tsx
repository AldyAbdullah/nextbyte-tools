'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  QrCode,
  Barcode,
  KeyRound,
  FileCode2,
  Minimize2,
  Image,
  FileText,
  Link2,
  Binary,
  Type,
  AlignLeft,
  Clipboard,
  ArrowRight,
  Sparkles,
  Share2,
  Mail,
  ListOrdered,
  Eraser,
  FileEdit,
  Layers,
  Scissors,
  Briefcase,
  Star,
  Clock,
} from 'lucide-react';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/config/tools';
import { ToolItem, ToolCategory } from '@/types/tools';
import { getRecentTools, getFavoriteTools } from '@/lib/userPreferences';

const ICON_MAP: Record<string, React.ElementType> = {
  QrCode,
  Barcode,
  Sparkles,
  Share2,
  Mail,
  ListOrdered,
  Eraser,
  KeyRound,
  FileCode2,
  Minimize2,
  Image,
  FileText,
  Link2,
  Binary,
  Type,
  AlignLeft,
  Clipboard,
  FileEdit,
  Layers,
  Scissors,
  Briefcase,
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('All');
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecentSlugs(getRecentTools());
      setFavoriteSlugs(getFavoriteTools());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools: ToolItem[] = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const recentTools = recentSlugs
    .map((slug) => TOOLS_REGISTRY.find((t) => t.slug === slug))
    .filter((t): t is ToolItem => Boolean(t));

  const favoriteTools = favoriteSlugs
    .map((slug) => TOOLS_REGISTRY.find((t) => t.slug === slug))
    .filter((t): t is ToolItem => Boolean(t));

  const getToolUrl = (tool: ToolItem) => {
    if (tool.slug === 'send') return '/send';
    if (tool.slug === 'clip' || tool.slug === 'clipboard') return '/clip';
    return `/tools/${tool.slug}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3 shrink-0">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari tools (misal: qr code, send, pdf, password, json)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Hapus
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Recent Tools section when query is empty and on 'All' */}
          {!query && selectedCategory === 'All' && recentTools.length > 0 && (
            <div className="p-2 space-y-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Baru Saja Digunakan</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentTools.slice(0, 5).map((tool) => (
                  <Link
                    key={`recent-${tool.id}`}
                    href={getToolUrl(tool)}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-900 transition-all"
                  >
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Tools section when query is empty and on 'All' */}
          {!query && selectedCategory === 'All' && favoriteTools.length > 0 && (
            <div className="p-2 space-y-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Alat Favorit Anda</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {favoriteTools.map((tool) => (
                  <Link
                    key={`fav-${tool.id}`}
                    href={getToolUrl(tool)}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/60 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/60 dark:border-amber-900 transition-all"
                  >
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Tools List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTools.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Tidak ada tools yang cocok dengan &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredTools.map((tool) => {
                const IconComponent = ICON_MAP[tool.iconName] || QrCode;
                const isAvailable = tool.status === 'available';

                return (
                  <Link
                    key={tool.id}
                    href={getToolUrl(tool)}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className={`p-2.5 rounded-2xl border shrink-0 ${
                        isAvailable 
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {tool.name}
                          </span>
                          {isAvailable ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              Available
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info in modal */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]">ESC</kbd> untuk menutup</span>
          <span>{filteredTools.length} tools</span>
        </div>
      </div>
    </div>
  );
}
