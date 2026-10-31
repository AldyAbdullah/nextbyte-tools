'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Wifi,
  Sparkles,
  QrCode,
  Send,
  Radio,
  KeyRound,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { LocalPeer } from '@/types/nextbyteSend';

interface LocalWifiRadarProps {
  myPeer: LocalPeer | null;
  peers: LocalPeer[];
  myPin: string;
  connectedPin: string | null;
  onSelectPeer: (peer: LocalPeer) => void;
  onShowQr: () => void;
  onOpenScanner: () => void;
  onJoinPin: (pin: string) => void;
}

export function LocalWifiRadar({
  myPeer,
  peers,
  myPin,
  connectedPin,
  onSelectPeer,
  onShowQr,
  onOpenScanner,
  onJoinPin,
}: LocalWifiRadarProps) {
  const [pinInput, setPinInput] = useState('');

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim()) {
      onJoinPin(pinInput.trim().toUpperCase());
      setPinInput('');
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-300">
      {/* Top Bar: My Device Status & Pairing Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            {myPeer ? getDeviceIcon(myPeer.deviceType, 'w-5 h-5') : <Wifi className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Perangkat Anda {connectedPin ? `(Terhubung ke: ${connectedPin})` : '(Hotspot / Wi-Fi)'}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {myPeer?.name || 'Mendeteksi perangkat...'}
            </div>
          </div>
        </div>

        {/* Pairing Actions: PIN Badge + Scan Camera + Show QR */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-sans font-medium text-[11px]">PIN Anda:</span>
            <span className="text-blue-600 dark:text-blue-400 text-sm tracking-wider">{myPin}</span>
          </div>

          {/* Button to open in-browser Camera Scanner (ideal for mobile) */}
          <button
            onClick={onOpenScanner}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all shrink-0"
            title="Buka kamera HP untuk scan QR Code di laptop"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Scan Kamera</span>
          </button>

          {/* Button to show this device's QR code (ideal for laptop) */}
          <button
            onClick={onShowQr}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            title="Tampilkan QR Code perangkat ini agar bisa discan dari HP"
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span>Tampilkan QR</span>
          </button>
        </div>
      </div>

      {/* Main Radar / Nearby Devices Section */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 sm:p-12 text-center overflow-hidden max-w-full">
        {peers.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                {peers.length} Perangkat Terhubung
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Pilih Perangkat untuk Mengirim Berkas
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Klik ikon perangkat di bawah untuk mulai mengirim berkas secara instan.
              </p>
            </div>

            {/* Grid of peers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
              {peers.map((peer) => (
                <button
                  key={peer.id}
                  onClick={() => onSelectPeer(peer)}
                  className="group relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-500 dark:border-slate-800 dark:hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all text-center space-y-3 overflow-hidden"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white flex items-center justify-center mx-auto transition-all shadow-inner shrink-0">
                    {getDeviceIcon(peer.deviceType, 'w-7 h-7 sm:w-8 sm:h-8')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {peer.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
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
          <div className="max-w-md mx-auto space-y-6 py-2">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full bg-blue-500/15 animate-pulse" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
                <Radio className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Hubungkan dengan Perangkat Lain
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Scan QR Code di layar perangkat lain menggunakan kamera HP, atau masukkan 4-digit PIN perangkat tujuan.
              </p>
            </div>

            {/* Quick Action Buttons: Scan Camera (Mobile) or Show QR (Laptop) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                onClick={onOpenScanner}
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all"
              >
                <Camera className="w-4 h-4" />
                Buka Kamera Scan
              </button>

              <button
                onClick={onShowQr}
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Tampilkan QR Perangkat Ini
              </button>
            </div>

            {/* Quick PIN Input to Connect to Target Device */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Atau Hubungkan Menggunakan PIN
              </div>
              <form onSubmit={handlePinSubmit} className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ketik PIN Perangkat Tujuan"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all disabled:opacity-40 shrink-0"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="text-[11px] text-slate-400">
                PIN perangkat ini: <strong className="font-mono text-blue-600 dark:text-blue-400">{myPin}</strong> (berikan kode ini jika perangkat lain ingin menghubungkan ke Anda)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
