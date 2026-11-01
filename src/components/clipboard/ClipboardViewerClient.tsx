'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clipboard,
  Copy,
  Check,
  Download,
  Trash2,
  Lock,
  Clock,
  AlertTriangle,
  ArrowLeft,
  FileText,
  ImageIcon,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import type { ClipboardItem as ClipboardItemData } from '@/types/clipboard';

interface ClipboardViewerClientProps {
  slug: string;
}

export function ClipboardViewerClient({ slug }: ClipboardViewerClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [item, setItem] = useState<ClipboardItemData | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Password unlock state
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Action states
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isCopyingImage, setIsCopyingImage] = useState<boolean>(false);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch clipboard data
  const fetchClipboard = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');

    try {
      const localToken = typeof window !== 'undefined'
        ? localStorage.getItem(`nb_mgmt_${slug}`) || ''
        : '';

      const res = await fetch(`/api/clipboard/${encodeURIComponent(slug)}`, {
        headers: {
          'x-management-token': localToken,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorStatus(res.status);
        setErrorMessage(data.error || 'Clipboard tidak ditemukan.');
        return;
      }

      setItem(data.item);
    } catch {
      setErrorStatus(500);
      setErrorMessage('Terjadi kendala saat memuat clipboard.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchClipboard();
  }, [fetchClipboard]);

  // Handle Password Unlock
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Silakan masukkan kata sandi.');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      const localToken = typeof window !== 'undefined'
        ? localStorage.getItem(`nb_mgmt_${slug}`) || ''
        : '';

      const res = await fetch(`/api/clipboard/${encodeURIComponent(slug)}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-management-token': localToken,
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordError(data.error || 'Kata sandi tidak tepat.');
        return;
      }

      setItem(data.item);
      showToast('Kata sandi terverifikasi! Konten dibuka.', 'success');
    } catch {
      setPasswordError('Gagal memverifikasi kata sandi.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Copy Text Action
  const handleCopyText = () => {
    if (item?.textContent) {
      navigator.clipboard.writeText(item.textContent);
      setCopiedText(true);
      showToast('Teks berhasil disalin ke papan klip!', 'success');
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  // Copy Link Action
  const handleCopyLink = () => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast('Tautan berhasil disalin!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Copy Image Action via Clipboard API
  const handleCopyImage = async () => {
    if (!item?.imageUrl) return;

    setIsCopyingImage(true);
    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();

      // Check if browser supports ClipboardItem for images
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        // Some browsers require converting WebP/JPEG to PNG for clipboard writing
        let imageBlob = blob;
        if (blob.type !== 'image/png') {
          // Convert to PNG via canvas if necessary
          imageBlob = await new Promise<Blob>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))), 'image/png');
              } else {
                reject(new Error('Canvas 2D context unavailable'));
              }
            };
            img.onerror = reject;
            img.src = item.imageUrl!;
          });
        }

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': imageBlob,
          }),
        ]);

        setCopiedImage(true);
        showToast('Gambar berhasil disalin ke papan klip!', 'success');
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch (err) {
      console.warn('Copy image to clipboard not supported by browser:', err);
      showToast('Browser ini tidak mendukung salin gambar langsung. Silakan gunakan tombol Unduh Gambar.', 'info');
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Download Image Action
  const handleDownloadImage = async () => {
    if (!item?.imageUrl) return;

    try {
      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clipboard-${slug}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      showToast('Gambar berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal mengunduh gambar.', 'error');
    }
  };

  // Delete Clipboard Action (Authorized via management token)
  const handleDeleteClipboard = async () => {
    const localToken = typeof window !== 'undefined'
      ? localStorage.getItem(`nb_mgmt_${slug}`) || ''
      : '';

    if (!localToken) {
      showToast('Token pengelolaan tidak ditemukan pada perangkat ini.', 'error');
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clipboard/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-management-token': localToken,
        },
        body: JSON.stringify({ managementToken: localToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus clipboard.');
      }

      // Remove from localStorage
      try {
        localStorage.removeItem(`nb_mgmt_${slug}`);
      } catch {}

      showToast('Clipboard berhasil dihapus permanen!', 'success');
      router.push('/clipboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat menghapus.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Format relative time left
  const formatTimeLeft = (expiresAtIso: string) => {
    const diff = new Date(expiresAtIso).getTime() - Date.now();
    if (diff <= 0) return 'Telah kedaluwarsa';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} hari ${hours % 24} jam lagi`;
    }
    if (hours > 0) {
      return `${hours} jam ${minutes} menit lagi`;
    }
    return `${minutes} menit lagi`;
  };

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // 2. ERROR / EXPIRED / NOT FOUND STATE
  if (errorStatus || !item) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {errorStatus === 410 ? 'Clipboard Telah Dihapus / Kedaluwarsa' : 'Clipboard Tidak Ditemukan'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {errorStatus === 410
              ? 'Tautan ini telah dibuka sebelumnya (Burn After Read) atau telah melewati batas masa berlakunya sehingga data telah dihapus permanen dari server.'
              : errorMessage || 'Tautan ini mungkin salah atau telah dihapus oleh pemiliknya.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/clipboard"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <Clipboard className="w-4 h-4" />
            <span>Buat Clipboard Baru</span>
          </Link>
        </div>
      </div>

    );
  }

  // 3. PASSWORD PROTECTED UNLOCK STATE
  if (item.isPasswordProtected && item.textContent === null && !item.imageUrl) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Clipboard Ini Dilindungi Sandi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pembuat clipboard <span className="font-mono text-blue-600 font-bold">/{slug}</span> menyematkan kata sandi untuk membuka konten ini.
          </p>
        </div>

        <form onSubmit={handleVerifyPassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {passwordError}
            </div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ketik kata sandi..."
              autoFocus
              required
              className="w-full py-3 pl-4 pr-11 text-sm rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isVerifyingPassword || !password.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isVerifyingPassword ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Buka Konten Clipboard</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4">
          <Link href="/clipboard" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Clipboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // 4. MAIN CONTENT VIEW STATE (AUTHENTICATED / UNLOCKED)
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/80">
              Nextbyte Clipboard
            </span>
            {item.isBurned ? (
              <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Terhapus Otomatis (Burn After Read)</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{formatTimeLeft(item.expiresAt)}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono truncate">
            /{item.slug}
          </h1>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
          </button>

          {/* Show delete button if this browser created the clipboard (holds valid token) */}
          {item.hasManagementToken && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors"
              title="Hapus clipboard ini"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          )}

          <Link
            href="/clipboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Clipboard className="w-4 h-4" />
            <span>Buat Baru</span>
          </Link>
        </div>
      </div>

      {/* BURN AFTER READ NOTICE */}
      {item.isBurned && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500/15 via-red-500/15 to-amber-500/15 border-2 border-orange-500/30 text-slate-900 dark:text-white space-y-1.5 shadow-lg shadow-orange-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400 text-sm">
            <Flame className="w-4 h-4 animate-pulse text-orange-500" />
            <span>Clipboard Ini Telah Terhapus Otomatis (Burn After Read)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Karena tautan ini telah dibuka di perangkat Anda, data telah <strong>langsung dihapus secara permanen dari server</strong> untuk menjaga kerahasiaan. Pastikan Anda menyalin teks atau mengunduh gambar sekarang sebelum menutup halaman ini!
          </p>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="space-y-6">
        {/* TEXT CONTENT CARD (Only shown if text exists) */}
        {item.textContent && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Konten Teks</span>
              </div>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Tersalin!' : 'Copy Text (Salin Teks)'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed max-h-[600px] overflow-y-auto">
                {item.textContent}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{item.textContent.length} karakter</span>
              <span>Dibuat: {new Date(item.createdAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}

        {/* IMAGE CONTENT CARD (Only shown if image exists) */}
        {item.imageUrl && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Gambar Terlampir</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={isCopyingImage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedImage ? 'Gambar Disalin!' : 'Copy Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-2 sm:p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={`Gambar ${item.slug}`}
                className="max-h-[650px] w-auto object-contain rounded-xl shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hapus Clipboard Ini?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini permanen. Seluruh konten teks dan gambar yang terhubung dengan tautan ini akan segera dihapus dari server.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteClipboard}
                disabled={isDeleting}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Sekarang</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
