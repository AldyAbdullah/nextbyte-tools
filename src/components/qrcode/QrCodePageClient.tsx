'use client';

import React, { useState } from 'react';
import { QrCodeGenerator } from './QrCodeGenerator';
import { BulkQrGenerator } from './bulk/BulkQrGenerator';
import { QrCode, FileSpreadsheet } from 'lucide-react';

export type QrMode = 'single' | 'bulk';

export function QrCodePageClient() {
  const [mode, setMode] = useState<QrMode>('single');

  return (
    <div className="space-y-8">
      
      {/* Mode Switcher Banner */}
      <div className="bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
            mode === 'single'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/60 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            mode === 'single' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block leading-tight">Single QR Code</span>
            <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Buat manual satu per satu</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 relative ${
            mode === 'bulk'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/60 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            mode === 'bulk' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="block leading-tight">Bulk QR Code</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Excel
              </span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Generate massal via Excel</span>
          </div>
        </button>
      </div>

      {/* Render Active Generator Mode */}
      {mode === 'single' ? (
        <QrCodeGenerator />
      ) : (
        <BulkQrGenerator />
      )}

    </div>
  );
}
