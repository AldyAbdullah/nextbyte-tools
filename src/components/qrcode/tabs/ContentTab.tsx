'use client';

import React from 'react';
import { 
  Globe, 
  FileText, 
  Mail, 
  Phone, 
  MessageSquare, 
  Wifi, 
  SendHorizontal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { QrDataContent, QrDataType } from '@/types/qrcode';
import { validateQrContent } from '@/lib/qrDataFormatter';

interface ContentTabProps {
  content: QrDataContent;
  onChange: (content: QrDataContent) => void;
}

const DATA_TYPES: { type: QrDataType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'url', label: 'URL / Web', icon: Globe, description: 'Tautan ke website atau landing page' },
  { type: 'text', label: 'Teks Bebas', icon: FileText, description: 'Catatan, quote, atau pesan biasa' },
  { type: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Buka percakapan chat WhatsApp instan' },
  { type: 'wifi', label: 'Wi-Fi', icon: Wifi, description: 'Koneksi jaringan Wi-Fi otomatis tanpa ketik password' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Kirim email dengan subjek & template isi' },
  { type: 'phone', label: 'Telepon', icon: Phone, description: 'Panggilan nomor langsung di smartphone' },
  { type: 'sms', label: 'SMS', icon: SendHorizontal, description: 'Kirim pesan SMS ke nomor tujuan' },
];

export function ContentTab({ content, onChange }: ContentTabProps) {
  const validation = validateQrContent(content);

  const handleTypeChange = (type: QrDataType) => {
    onChange({ ...content, type });
  };

  return (
    <div className="space-y-6">
      {/* Type Selector Pills/Grid */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Pilih Jenis Konten QR Code
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DATA_TYPES.map(({ type, label, icon: Icon }) => {
            const isSelected = content.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm font-medium'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="text-xs truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Input Sesuai Jenis Konten */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
        
        {/* URL Form */}
        {content.type === 'url' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Alamat Website (URL)
            </label>
            <div className="relative">
              <input
                type="url"
                value={content.url}
                onChange={(e) => onChange({ ...content, url: e.target.value })}
                placeholder="https://nextbyte.biz.id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contoh: `https://nextbyte.biz.id` atau `https://aldiabdullah.biz.id`
            </p>
          </div>
        )}

        {/* Text Form */}
        {content.type === 'text' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Teks Konten
            </label>
            <textarea
              rows={4}
              value={content.text}
              onChange={(e) => onChange({ ...content, text: e.target.value })}
              placeholder="Ketik teks yang ingin dimasukkan ke dalam QR Code..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jumlah karakter: {content.text.length}
            </p>
          </div>
        )}

        {/* WhatsApp Form */}
        {content.type === 'whatsapp' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                value={content.whatsappNumber}
                onChange={(e) => onChange({ ...content, whatsappNumber: e.target.value })}
                placeholder="6281234567890 atau 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan format dengan kode negara (contoh: 628...)
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Pesan Awal (Opsional)
              </label>
              <textarea
                rows={3}
                value={content.whatsappMessage}
                onChange={(e) => onChange({ ...content, whatsappMessage: e.target.value })}
                placeholder="Halo, saya ingin menanyakan informasi tentang layanan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>
          </div>
        )}

        {/* Wi-Fi Form */}
        {content.type === 'wifi' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Nama Jaringan Wi-Fi (SSID)
              </label>
              <input
                type="text"
                value={content.wifiSsid}
                onChange={(e) => onChange({ ...content, wifiSsid: e.target.value })}
                placeholder="NextByte-Guest-WiFi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Password Wi-Fi
                </label>
                <input
                  type="text"
                  disabled={content.wifiEncryption === 'nopass'}
                  value={content.wifiPassword}
                  onChange={(e) => onChange({ ...content, wifiPassword: e.target.value })}
                  placeholder={content.wifiEncryption === 'nopass' ? 'Tanpa password' : 'Password Wi-Fi'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Jenis Keamanan
                </label>
                <select
                  value={content.wifiEncryption}
                  onChange={(e) => onChange({ ...content, wifiEncryption: e.target.value as 'WPA' | 'WEP' | 'nopass' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="WPA">WPA / WPA2 / WPA3 (Umum)</option>
                  <option value="WEP">WEP (Lama)</option>
                  <option value="nopass">Tanpa Sandi (Terbuka)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="wifiHidden"
                checked={content.wifiHidden}
                onChange={(e) => onChange({ ...content, wifiHidden: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="wifiHidden" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Jaringan tersembunyi (Hidden SSID)
              </label>
            </div>
          </div>
        )}

        {/* Email Form */}
        {content.type === 'email' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Email Penerima
              </label>
              <input
                type="email"
                value={content.email}
                onChange={(e) => onChange({ ...content, email: e.target.value })}
                placeholder="nama@nextbyte.biz.id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Subjek Email
              </label>
              <input
                type="text"
                value={content.emailSubject}
                onChange={(e) => onChange({ ...content, emailSubject: e.target.value })}
                placeholder="Pertanyaan Kerjasama"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Isi Pesan Email
              </label>
              <textarea
                rows={3}
                value={content.emailBody}
                onChange={(e) => onChange({ ...content, emailBody: e.target.value })}
                placeholder="Tulis pesan draft di sini..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>
          </div>
        )}

        {/* Phone Form */}
        {content.type === 'phone' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Nomor Telepon
            </label>
            <input
              type="tel"
              value={content.phoneNumber}
              onChange={(e) => onChange({ ...content, phoneNumber: e.target.value })}
              placeholder="+6281234567890"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ketika dipindai, smartphone akan langsung membuka aplikasi dialer telepon.
            </p>
          </div>
        )}

        {/* SMS Form */}
        {content.type === 'sms' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Nomor Tujuan SMS
              </label>
              <input
                type="tel"
                value={content.smsNumber}
                onChange={(e) => onChange({ ...content, smsNumber: e.target.value })}
                placeholder="+6281234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                Isi Pesan SMS
              </label>
              <textarea
                rows={3}
                value={content.smsMessage}
                onChange={(e) => onChange({ ...content, smsMessage: e.target.value })}
                placeholder="Pesan SMS yang sudah otomatis tertulis..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>
          </div>
        )}

        {/* Live Validation Indicator */}
        {!validation.isValid && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validation.message}</span>
          </div>
        )}

        {validation.isValid && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Input valid & siap dipindai</span>
          </div>
        )}

      </div>
    </div>
  );
}
