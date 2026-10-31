'use client';

import React from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Wifi,
  Sparkles,
  QrCode,
  Send,
  Radio,
} from 'lucide-react';
import { LocalPeer } from '@/types/nextbyteSend';

interface LocalWifiRadarProps {
  myPeer: LocalPeer | null;
  peers: LocalPeer[];
  onSelectPeer: (peer: LocalPeer) => void;
  onShowQr: () => void;
}

export function LocalWifiRadar({
  myPeer,
  peers,
  onSelectPeer,
  onShowQr,
}: LocalWifiRadarProps) {
  const getDeviceIcon = (type: LocalPeer['deviceType'], className = 'w-6 h-6') => {
    switch (type) {
      case 'mobile':
        return <Smartphone className={className} />;
      case 'tablet':
        return <Tablet className={className} />;
      default:
        return <Laptop className={className} />;
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Bar: My Device Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {myPeer ? getDeviceIcon(myPeer.deviceType, 'w-5 h-5') : <Wifi className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Perangkat Anda (Aktif di Wi-Fi)
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {myPeer?.name || 'Mendeteksi perangkat...'}
            </div>
          </div>
        </div>

        <button
          onClick={onShowQr}
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
        >
          <QrCode className="w-4 h-4 text-blue-500" />
          Buka di HP (Scan QR)
        </button>
      </div>

      {/* Main Radar / Nearby Devices Section */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8 sm:p-12 text-center overflow-hidden">
        {peers.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                {peers.length} Perangkat Ditemukan di Wi-Fi Ini
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Pilih Perangkat untuk Mengirim Berkas
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Klik ikon perangkat yang ingin Anda kirimi file.
              </p>
            </div>

            {/* Grid of peers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
              {peers.map((peer) => (
                <button
                  key={peer.id}
                  onClick={() => onSelectPeer(peer)}
                  className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-500 dark:border-slate-800 dark:hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all text-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white flex items-center justify-center mx-auto transition-all shadow-inner">
                    {getDeviceIcon(peer.deviceType, 'w-8 h-8')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {peer.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {peer.os} • {peer.browser}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 pt-1">
                    <Send className="w-3.5 h-3.5" />
                    Kirim Berkas
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State: Radar animation waiting for second device */
          <div className="max-w-md mx-auto space-y-6 py-4">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {/* Radar pulse rings */}
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full bg-blue-500/15 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Mencari Perangkat di Jaringan Wi-Fi...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Buka halaman ini di HP, tablet, atau laptop lain yang tersambung ke <strong>Wi-Fi yang sama</strong>. Perangkat akan otomatis terdeteksi di sini.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onShowQr}
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Tampilkan QR Code untuk HP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
