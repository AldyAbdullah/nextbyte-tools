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
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Code2,
  Flame,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  File,
  Trash2,
  Paperclip,
  Settings2,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import { validateSlug, sanitizeSlug, generateRandomSlug } from '@/lib/clipboard/slug';
import type { ClipboardExpiry, AttachmentType } from '@/types/clipboard';
import confetti from 'canvas-confetti';

const EXPIRY_OPTIONS: Array<{ value: ClipboardExpiry; label: string; desc: string }> = [
  { value: '10m', label: '10 Menit', desc: 'Transfer cepat sekali pakai' },
  { value: '1h', label: '1 Jam', desc: 'Sangat privat, cepat hilang' },
  { value: '6h', label: '6 Jam', desc: 'Cocok untuk rapat / tugas' },
  { value: '12h', label: '12 Jam', desc: 'Batas simpan maksimal' },
];

const MAX_FILES = 5;
const MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_FILES_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TEXT_BYTES = 100 * 1024; // 100 KB

interface LocalFileAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: AttachmentType;
  previewUrl?: string;
}

function detectFileType(fileName: string, mime: string): AttachmentType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mime.startsWith('image/')) return 'image';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'word';
  if (['xls', 'xlsx'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) return 'excel';
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'powerpoint';
  return 'document';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClipboardCreatorClient() {
  const { showToast } = useToast();

  // Form states
  const [slug, setSlug] = useState<string>('');
  const [slugTouched, setSlugTouched] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>('');
  const [isMonospace, setIsMonospace] = useState<boolean>(false);

  // Settings states
  const [expiry, setExpiry] = useState<ClipboardExpiry>('12h');
  const [burnAfterRead, setBurnAfterRead] = useState<boolean>(true); // Default: TRUE
  const [passwordProtection, setPasswordProtection] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  // Multi-attachment states
  const [attachments, setAttachments] = useState<LocalFileAttachment[]>([]);
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

  // Slug validation
  const slugValidation = validateSlug(slug);
  const isSlugValid = slugValidation.valid;

  // Real-time byte calculation of text
  const textBytes = typeof window !== 'undefined' ? new Blob([textContent]).size : textContent.length;
  const isTextTooLarge = textBytes > MAX_TEXT_BYTES;

  // Total attachments size
  const totalAttachmentsSize = attachments.reduce((sum, item) => sum + item.size, 0);

  // Cleanup object URLs on unmount or when removed
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  // Handle adding files
  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setAttachments((prev) => {
      if (prev.length + fileArray.length > MAX_FILES) {
        showToast(`Maksimal ${MAX_FILES} lampiran berkas diperbolehkan.`, 'error');
        return prev;
      }

      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      const newItems: LocalFileAttachment[] = [];

      let currentTotalSize = prev.reduce((sum, item) => sum + item.size, 0);

      for (const file of fileArray) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!allowedExts.includes(ext)) {
          showToast(`Format "${file.name}" tidak didukung. Didukung: Gambar (JPG, PNG, WebP) & Dokumen (PDF, Word, Excel, PPT).`, 'error');
          continue;
        }

        if (file.size > MAX_SINGLE_FILE_BYTES) {
          showToast(`Berkas "${file.name}" melebihi batas 10 MB.`, 'error');
          continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_FILES_BYTES) {
          showToast('Total ukuran berkas melebihi batas maksimal 25 MB.', 'error');
          break;
        }

        currentTotalSize += file.size;
        const fileType = detectFileType(file.name, file.type);
        const previewUrl = fileType === 'image' ? URL.createObjectURL(file) : undefined;

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          name: file.name,
          size: file.size,
          type: fileType,
          previewUrl,
        });
      }

      if (newItems.length > 0) {
        showToast(`${newItems.length} berkas berhasil ditambahkan.`, 'success');
      }

      return [...prev, ...newItems];
    });
  }, [showToast]);

  // Handle remove individual attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Handle Drag & Drop
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Handle OS clipboard paste (Ctrl+V) for images/files
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // If user is typing in input, don't hijack
      if (target && target.tagName === 'INPUT') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        handleAddFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAddFiles]);

  // Randomize Slug
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
      showToast(slugValidation.error || 'Harap periksa format Custom URL Anda.', 'error');
      return;
    }

    const hasText = Boolean(textContent && textContent.trim().length > 0);
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) {
      setErrorMessage('Harap masukkan teks atau tambahkan lampiran untuk membuat clipboard.');
      showToast('Harap masukkan teks atau tambahkan lampiran berkas.', 'error');
      return;
    }

    if (isTextTooLarge) {
      setErrorMessage('Ukuran teks melebihi batas maksimal 100 KB.');
      showToast('Ukuran teks melebihi batas 100 KB.', 'error');
      return;
    }

    if (passwordProtection && !password.trim()) {
      setErrorMessage('Harap masukkan kata sandi perlindungan atau nonaktifkan Kunci Sandi.');
      showToast('Kata sandi perlindungan belum diisi.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('slug', slug.trim().toLowerCase());
      if (hasText) formData.append('textContent', textContent);

      // Append multi-attachments
      attachments.forEach((att) => {
        formData.append('files', att.file);
      });

      formData.append('expiry', expiry);
      formData.append('burnAfterRead', burnAfterRead ? 'true' : 'false');
      if (passwordProtection && password.trim()) {
        formData.append('password', password.trim());
      }

      const res = await fetch('/api/clipboard/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat clipboard.');
      }

      // Save management token locally so user can delete their clip from this browser
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
        confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
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
          width: 170,
          height: 170,
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

  // Helper to render attachment icon badge
  const renderAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        return <FileImage className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'powerpoint':
        return <Presentation className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <File className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  const getFormatBadge = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'pdf':
        return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'word':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'excel':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'powerpoint':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* 1. HEADER BADGE */}
      <div className="flex justify-center pt-2 animate-in fade-in duration-300">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-400 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Nextbyte Clip • Berbagi Instan Lintas Perangkat</span>
        </div>
      </div>

      {/* ERROR ALERT BOX */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="p-1 hover:text-rose-900 dark:hover:text-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TWO-COLUMN LAYOUT: MAIN CLIPBOARD (LEFT ~70%) vs SETTINGS SIDEBAR (RIGHT ~30%) */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* KOLOM KIRI: MAIN CLIPBOARD (AREA UTAMA ~70-75%) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* TEXT EDITOR CARD (DOMINANT COMPONENT) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Clipboard className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Main Clipboard (Teks &amp; Catatan)
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  {textContent && (
                    <button
                      type="button"
                      onClick={() => setTextContent('')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                    >
                      Hapus Teks
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMonospace(!isMonospace)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isMonospace
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{isMonospace ? 'Mode Kode Aktif' : 'Monospace'}</span>
                  </button>
                </div>
              </div>

              {/* Textarea Area */}
              <div className="space-y-2">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Ketik catatan, pesan, tautan, atau tempelkan cuplikan kode di sini... Anda juga bisa langsung menempelkan gambar atau file (Ctrl+V) ke clipboard."
                  rows={11}
                  className={`w-full p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y min-h-[220px] ${
                    isMonospace ? 'font-mono' : 'font-sans'
                  }`}
                />

                <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                  <span>Mendukung teks multibaris &amp; baris kosong</span>
                  <span className={`font-mono ${isTextTooLarge ? 'text-rose-500 font-bold' : ''}`}>
                    {(textBytes / 1024).toFixed(1)} KB / 100 KB
                  </span>
                </div>
              </div>
            </div>

            {/* ATTACHMENT CARD (EXPANDED FOR IMAGES & DOCUMENTS) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Paperclip className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Lampiran Berkas (Gambar &amp; Dokumen)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Lampiran dapat diunduh oleh penerima tautan
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {attachments.length}/{MAX_FILES} berkas
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                id="clipboard-multi-file-input"
              />

              {/* Dropzone Area */}
              {attachments.length < MAX_FILES && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed cursor-pointer text-center space-y-2.5 transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-950/30'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Klik untuk memilih berkas atau seret berkas ke sini
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Mendukung <strong>Gambar</strong> (JPG, PNG, WebP) &amp; <strong>Dokumen</strong> (PDF, Word, Excel, PPT)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Maks. 10 MB per berkas • Total maks. 25 MB • Bisa juga tekan <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd>
                    </p>
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Daftar lampiran ({attachments.length} berkas):</span>
                    <span className="font-mono">{formatBytes(totalAttachmentsSize)} / 25 MB</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        {/* File Thumbnail or Colored Icon */}
                        <div className="flex items-center gap-3 min-w-0">
                          {item.type === 'image' && item.previewUrl ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                              {renderAttachmentIcon(item.type)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getFormatBadge(
                                  item.type
                                )}`}
                              >
                                {item.name.split('.').pop() || item.type}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatBytes(item.size)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Attachment Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(item.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                          title="Hapus lampiran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KOLOM KANAN: CLIPBOARD SETTINGS (SIDEBAR KECIL ~25-30%) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              {/* Header Sidebar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Settings2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengaturan Clip
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">Sidebar</span>
              </div>

              {/* 1. CUSTOM URL SETTING */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Custom URL
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizeSlug}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak</span>
                  </button>
                </div>

                {/* Input with Fixed Prefix */}
                <div className="rounded-2xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden transition-all flex items-center">
                  <span className="pl-3 pr-0.5 text-xs text-slate-400 font-mono select-none truncate">
                    nextbyte.biz.id/clip/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(sanitizeSlug(e.target.value));
                      setSlugTouched(true);
                    }}
                    onBlur={() => setSlugTouched(true)}
                    placeholder="nama-kamu"
                    maxLength={30}
                    required
                    className="w-full py-2.5 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                  />
                </div>

                {/* Slug Validation Feedback */}
                {slugTouched && slug.length > 0 && (
                  <div className="text-[11px] px-1">
                    {isSlugValid ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>URL valid ({slug.length}/30)</span>
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{slugValidation.error}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. EXPIRY TIME SETTING */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pt-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Masa Berlaku</span>
                </label>

                {/* Compact 4-option Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExpiry(opt.value)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        expiry === opt.value
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. BURN AFTER READ TOGGLE */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Burn After Read
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBurnAfterRead(!burnAfterRead)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      burnAfterRead ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label="Toggle Burn After Read"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        burnAfterRead ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Dihapus permanen dari server setelah pertama kali dibuka oleh penerima.
                </p>
              </div>

              {/* 4. PASSWORD PROTECTION TOGGLE */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Kunci Sandi
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !passwordProtection;
                      setPasswordProtection(next);
                      if (!next) setPassword('');
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      passwordProtection ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label="Toggle Password Protection"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        passwordProtection ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {passwordProtection && (
                  <div className="relative pt-1 animate-in fade-in duration-200">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full py-2 pl-3 pr-9 text-xs rounded-xl border bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* 5. PRIMARY ACTION BUTTON */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading || !isSlugValid || (!textContent.trim() && attachments.length === 0)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Clipboard...</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" />
                      <span>Buat Clipboard Baru</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Koneksi HTTPS aman &amp; kedaluwarsa otomatis</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 3. SUCCESS MODAL POPUP */}
      {createdData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900/60 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Clipboard Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buka tautan ini dari komputer, laptop, atau HP Anda yang lain:
              </p>
            </div>

            {/* Link Copy Box */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
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
            <div className="space-y-1.5 pt-1">
              <div className="p-2.5 bg-white rounded-2xl inline-block shadow-inner border border-slate-100 dark:border-slate-800">
                <div ref={qrContainerRef} className="w-[170px] h-[170px] flex items-center justify-center" />
              </div>
              <p className="text-[10px] text-slate-400">
                Pindai kode QR untuk membuka di smartphone
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link
                href={`/clip/${createdData.slug}`}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Buka Halaman Clip</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCreatedData(null);
                  setSlug('');
                  setTextContent('');
                  setAttachments([]);
                  setPassword('');
                  setPasswordProtection(false);
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors"
              >
                Buat Clipboard Baru Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
