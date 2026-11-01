'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clipboard,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  X,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Code2,
  Flame,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import { validateSlug, sanitizeSlug, generateRandomSlug } from '@/lib/clipboard/slug';
import type { ClipboardExpiry } from '@/types/clipboard';
import confetti from 'canvas-confetti';

const EXPIRY_OPTIONS: Array<{ value: ClipboardExpiry; label: string; desc: string }> = [
  { value: '10m', label: '10 Menit', desc: 'Transfer cepat sekali pakai' },
  { value: '1h', label: '1 Jam', desc: 'Sangat privat, cepat hilang' },
  { value: '6h', label: '6 Jam', desc: 'Cocok untuk rapat / tugas' },
  { value: '12h', label: '12 Jam', desc: 'Maksimal batas simpan (Default)' },
];

export function ClipboardCreatorClient() {
  const { showToast } = useToast();

  // Form states
  const [slug, setSlug] = useState<string>('');
  const [slugTouched, setSlugTouched] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>('');
  const [isMonospace, setIsMonospace] = useState<boolean>(false);
  const [expiry, setExpiry] = useState<ClipboardExpiry>('12h');
  const [burnAfterRead, setBurnAfterRead] = useState<boolean>(true); // Default: TRUE (Hapus otomatis setelah dibuka di perangkat lain)
  const [password, setPassword] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Success modal states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdData, setCreatedData] = useState<{
    slug: string;
    url: string;
    managementToken: string;
    expiresAt: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Validate slug on the fly
  const slugValidation = validateSlug(slug);
  const isSlugValid = slugValidation.valid;

  // Real-time byte count of text (max 100 KB = 102400 bytes)
  const textBytes = typeof window !== 'undefined' ? new Blob([textContent]).size : textContent.length;
  const isTextTooLarge = textBytes > 102400;

  // Cleanup object URL preview on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle Image Selection
  const handleSelectImage = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar melebihi batas maksimal 5 MB.', 'error');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast('Hanya format JPG, JPEG, PNG, dan WebP yang diizinkan.', 'error');
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(preview);
    showToast('Gambar berhasil dipilih!', 'success');
  }, [imagePreviewUrl, showToast]);

  // Handle Clipboard Paste (Paste image directly from OS clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing text into textarea or input
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleSelectImage(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleSelectImage]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleSelectImage(files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-generate random slug
  const handleRandomizeSlug = () => {
    const generated = generateRandomSlug();
    setSlug(generated);
    setSlugTouched(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isSlugValid) {
      showToast(slugValidation.error || 'Harap periksa format custom URL Anda.', 'error');
      return;
    }

    const hasText = Boolean(textContent && textContent.trim().length > 0);
    const hasImage = Boolean(imageFile);

    if (!hasText && !hasImage) {
      setErrorMessage('Harap masukkan teks atau unggah gambar untuk membuat clipboard.');
      showToast('Harap masukkan teks atau unggah gambar.', 'error');
      return;
    }

    if (isTextTooLarge) {
      setErrorMessage('Ukuran teks melebihi batas maksimal 100 KB.');
      showToast('Ukuran teks melebihi 100 KB.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('slug', slug.trim().toLowerCase());
      if (hasText) formData.append('textContent', textContent);
      if (hasImage && imageFile) formData.append('image', imageFile);
      formData.append('expiry', expiry);
      formData.append('burnAfterRead', burnAfterRead ? 'true' : 'false');
      if (password.trim()) formData.append('password', password.trim());

      const res = await fetch('/api/clipboard/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat clipboard.');
      }

      // Store management token in localStorage so user can delete from this browser
      try {
        if (typeof window !== 'undefined' && data.slug && data.managementToken) {
          localStorage.setItem(`nb_mgmt_${data.slug}`, data.managementToken);
        }
      } catch (err) {
        console.warn('Could not save management token to localStorage:', err);
      }

      setCreatedData({
        slug: data.slug,
        url: data.url,
        managementToken: data.managementToken,
        expiresAt: data.expiresAt,
      });

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}

      showToast('Clipboard berhasil dibuat!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan clipboard.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Render QR Code inside Success Modal
  useEffect(() => {
    const targetUrl = createdData?.url;
    if (!targetUrl || !qrContainerRef.current) return;

    let isMounted = true;
    async function renderQr() {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        if (!isMounted || !qrContainerRef.current) return;
        qrContainerRef.current.innerHTML = '';

        const qr = new QRCodeStyling({
          width: 180,
          height: 180,
          data: targetUrl,
          dotsOptions: {
            color: '#2563eb',
            type: 'rounded',
          },
          cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#1d4ed8',
          },
          backgroundOptions: {
            color: 'transparent',
          },
        });

        qr.append(qrContainerRef.current);
      } catch (err) {
        console.warn('Gagal merender QR Code clipboard:', err);
      }
    }

    renderQr();
    return () => {
      isMounted = false;
    };
  }, [createdData]);

  const handleCopyLink = () => {
    if (createdData?.url) {
      navigator.clipboard.writeText(createdData.url);
      setCopiedLink(true);
      showToast('Tautan clipboard disalin ke papan klip!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* 1. HERO SECTION */}
      <div className="text-center space-y-3.5 max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Nextbyte Clipboard • Berbagi Instan Lintas Perangkat</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Share anything, <span className="text-blue-600 dark:text-blue-400">instantly.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          A simple way to share text and images between your devices. Bagikan catatan, cuplikan kode, atau gambar via URL khusus tanpa login.
        </p>
      </div>

      {/* 2. FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button type="button" onClick={() => setErrorMessage('')} className="p-1 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 1: CUSTOM URL INPUT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">1</span>
              <span>Tentukan Custom URL</span>
            </label>

            <button
              type="button"
              onClick={handleRandomizeSlug}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Acak URL</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden transition-all">
              <span className="pl-4 pr-1 text-xs sm:text-sm text-slate-400 font-mono select-none truncate">
                nextbyte.biz.id/clipboard/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(sanitizeSlug(e.target.value));
                  setSlugTouched(true);
                }}
                onBlur={() => setSlugTouched(true)}
                placeholder="nama-url-kamu"
                maxLength={30}
                required
                className="w-full py-3.5 pr-4 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
              />
            </div>

            {/* Validation Feedback */}
            {slugTouched && slug.length > 0 && (
              <div className="flex items-center justify-between text-xs px-1">
                {isSlugValid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Format URL valid dan siap digunakan.</span>
                  </span>
                ) : (
                  <span className="text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{slugValidation.error}</span>
                  </span>
                )}
                <span className="text-slate-400 font-mono">{slug.length}/30</span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: TEXT EDITOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">2</span>
              <span>Tulis atau Tempel Teks (Opsional)</span>
            </label>

            <button
              type="button"
              onClick={() => setIsMonospace(!isMonospace)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isMonospace
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Mode Kode / Monospace</span>
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Ketik catatan, pesan, tautan, atau tempelkan cuplikan kode di sini..."
              rows={7}
              className={`w-full p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${
                isMonospace ? 'font-mono' : 'font-sans'
              }`}
            />

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Mendukung teks multibaris & baris kosong</span>
              <span className={`font-mono ${isTextTooLarge ? 'text-rose-500 font-bold' : ''}`}>
                {(textBytes / 1024).toFixed(1)} KB / 100 KB
              </span>
            </div>
          </div>
        </div>

        {/* STEP 3: IMAGE UPLOADER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">3</span>
              <span>Unggah Gambar (Opsional)</span>
            </label>
            <span className="text-[11px] text-slate-400">Maks. 1 gambar (5 MB)</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSelectImage(e.target.files[0]);
              }
            }}
            className="hidden"
            id="clipboard-image-input"
          />

          {!imageFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed cursor-pointer text-center space-y-3 transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-950/30'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Klik untuk memilih gambar atau seret berkas ke sini
                </p>
                <p className="text-xs text-slate-400">
                  Mendukung JPG, PNG, WebP • Bisa juga langsung tekan <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd> untuk tempel gambar
                </p>
              </div>
            </div>
          ) : (
            /* Image Preview Card */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="relative rounded-xl overflow-hidden max-h-72 flex items-center justify-center bg-slate-900/10 dark:bg-slate-900/60">
                {imagePreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{imageFile.name}</p>
                  <p className="text-slate-400 font-mono mt-0.5">{(imageFile.size / 1024).toFixed(1)} KB</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold transition-all"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: BURN AFTER READ SETTING (Default: Aktif) */}
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 border border-orange-200/80 dark:border-orange-900/50 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Flame className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Hapus Otomatis Saat Dibuka di Perangkat Lain (Burn After Read)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  Default Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Saat tautan dibuka pertama kali oleh penerima di perangkat lain, konten langsung ditampilkan dan otomatis terhapus permanen dari server. Jika dinonaktifkan, clipboard akan tetap tersimpan hingga batas masa berlaku (maksimal 12 jam).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBurnAfterRead(!burnAfterRead)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                burnAfterRead ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Burn After Read"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  burnAfterRead ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* STEP 5: EXPIRY SETTINGS & PASSWORD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Expiry Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Masa Berlaku Clipboard</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiry(opt.value)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    expiry === opt.value
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Password Protection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Kunci Sandi (Opsional)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordInput(!showPasswordInput);
                  if (showPasswordInput) setPassword('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                {showPasswordInput ? 'Nonaktifkan' : '+ Tambah Sandi'}
              </button>
            </div>

            {showPasswordInput ? (
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi perlindungan..."
                  className="w-full py-2.5 pl-3.5 pr-10 text-xs sm:text-sm rounded-xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Clipboard dapat dibuka langsung oleh siapa saja yang memiliki tautan tanpa perlu memasukkan kata sandi.
              </p>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !isSlugValid || (!textContent.trim() && !imageFile)}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Menyimpan Clipboard...</span>
              </>
            ) : (
              <>
                <Clipboard className="w-5 h-5" />
                <span>Buat Clipboard Baru (Create Clipboard)</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Koneksi HTTPS terenkripsi. Clipboard bersifat pribadi dan kedaluwarsa otomatis.</span>
          </p>
        </div>
      </form>

      {/* SUCCESS MODAL POPUP */}
      {createdData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900/60 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Clipboard Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buka tautan ini dari perangkat Anda yang lain untuk membaca atau menyalin konten:
              </p>
            </div>

            {/* Link Copy Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                {createdData.url}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Salin Tautan"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* QR Code Container for Instant Mobile Scan */}
            <div className="space-y-2 pt-1">
              <div className="p-3 bg-white rounded-2xl inline-block shadow-inner border border-slate-100 dark:border-slate-800">
                <div ref={qrContainerRef} className="w-[180px] h-[180px] flex items-center justify-center" />
              </div>
              <p className="text-[11px] text-slate-400">
                Pindai kode QR di atas dengan kamera HP untuk langsung membuka clipboard
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/clipboard/${createdData.slug}`}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Buka Halaman Clipboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCreatedData(null);
                  setSlug('');
                  setTextContent('');
                  handleRemoveImage();
                  setPassword('');
                }}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
              >
                Buat Clipboard Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
