'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Hand,
  Type,
  Eraser,
  PenTool,
  Highlighter,
  Undo2,
  Redo2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileEdit,
  Move,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/Toast';
import { SignatureModal } from './SignatureModal';
import { ReplaceTextModal } from './ReplaceTextModal';
import {
  PdfAnnotationItem,
  applyPdfModifications,
} from '@/lib/pdfEditorHelper';

interface OcrBoxItem {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
  fontsize?: number;
}

// Dynamically load PDF.js from public vendor script to prevent Next.js webpack 'canvas' native build errors
async function getPdfJsLib() {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).pdfjsLib) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).pdfjsLib;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('pdfjs-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = '/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat pustaka PDF.js'));
    document.head.appendChild(script);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = (window as any).pdfjsLib;
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
  return pdfjs;
}

export function PdfEditorStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfJsDocRef = useRef<any>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.25);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  // Tools & Mode
  const [activeTool, setActiveTool] = useState<
    'pan' | 'ocr_replace' | 'add_text' | 'whiteout' | 'signature' | 'highlight'
  >('pan');

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>({});

  // Annotations & Modifications
  const [annotations, setAnnotations] = useState<PdfAnnotationItem[]>([]);
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [history, setHistory] = useState<PdfAnnotationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<PdfAnnotationItem[][]>([]);

  // Selected annotation (for dragging, resizing, or editing)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [isResizingSignature, setIsResizingSignature] = useState(false);
  const [dragStartInfo, setDragStartInfo] = useState<{
    pointerX: number;
    pointerY: number;
    annX: number;
    annY: number;
    annWidth: number;
    annHeight: number;
  } | null>(null);

  // OCR state per-page
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrBoxes, setOcrBoxes] = useState<Record<number, OcrBoxItem[]>>({});
  const [ocrType, setOcrType] = useState<Record<number, 'scanned' | 'digital'>>({});

  // Modals
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedOcrBox, setSelectedOcrBox] = useState<OcrBoxItem | null>(null);

  // Canvas Viewport references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  // Selection / Drag state for drawing whiteout/highlight rects
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // 1. Load PDF from File Picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Silakan pilih file berekstensi PDF.', 'error');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfFile(file);
      setPdfBytes(bytes);
      setAnnotations([]);
      setHistory([]);
      setRedoStack([]);
      setDeletedPages([]);
      setRotations({});
      setOcrBoxes({});
      setThumbnailUrls({});
      setCurrentPage(0);
      setActiveTool('pan');
      setSelectedAnnotationId(null);

      // Initialize PDF.js via client loader
      const pdfjs = await getPdfJsLib();
      if (!pdfjs) throw new Error('PDF.js tidak tersedia');
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const doc = await loadingTask.promise;
      pdfJsDocRef.current = doc;
      setPageCount(doc.numPages);

      showToast(`Dokumen "${file.name}" berhasil dimuat!`, 'success');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      showToast('Gagal membaca dokumen PDF.', 'error');
    }
  };

  // 2. Render Active Page onto HTML5 Canvas & Extract Digital Text
  const renderCurrentPage = useCallback(async () => {
    if (!pdfJsDocRef.current || pageCount === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const doc = pdfJsDocRef.current;
      const page = await doc.getPage(currentPage + 1);
      const rotationAngle = rotations[currentPage] || 0;
      const viewport = page.getViewport({ scale: zoom, rotation: rotationAngle });

      setPageDimensions({
        width: viewport.width / zoom,
        height: viewport.height / zoom,
      });

      // Sharp retina display scaling
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;

      // Extract digital text items automatically if not already extracted
      if (!ocrBoxes[currentPage]) {
        try {
          const textContent = await page.getTextContent();
          if (textContent.items && textContent.items.length > 0) {
            const rawBoxes: OcrBoxItem[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            textContent.items.forEach((item: any) => {
              if (item.str && item.str.trim()) {
                const tx = item.transform[4];
                const ty = item.transform[5];
                const w = item.width;
                const h = item.height || Math.abs(item.transform[0]);
                const origHeight = viewport.height / zoom;
                const x0 = tx;
                const y0 = origHeight - ty - h;
                rawBoxes.push({
                  x0: Math.round(x0),
                  y0: Math.round(y0),
                  x1: Math.round(x0 + w),
                  y1: Math.round(y0 + h),
                  text: item.str.trim(),
                  fontsize: Math.round(h * 0.85),
                });
              }
            });

            if (rawBoxes.length > 0) {
              // Group adjacent words on the same line
              const sorted = [...rawBoxes].sort((a, b) => {
                if (Math.abs(a.y0 - b.y0) > 5) return a.y0 - b.y0;
                return a.x0 - b.x0;
              });

              const groupedLines: OcrBoxItem[] = [];
              for (const box of sorted) {
                const last = groupedLines[groupedLines.length - 1];
                if (
                  last &&
                  Math.abs(last.y0 - box.y0) <= 6 &&
                  box.x0 - last.x1 < 25 &&
                  box.x0 >= last.x1 - 5
                ) {
                  last.x1 = Math.max(last.x1, box.x1);
                  last.y1 = Math.max(last.y1, box.y1);
                  last.text = `${last.text} ${box.text}`;
                } else {
                  groupedLines.push({ ...box });
                }
              }

              setOcrBoxes((prev) => ({
                ...prev,
                [currentPage]: groupedLines.length > 0 ? groupedLines : rawBoxes,
              }));
              setOcrType((prev) => ({ ...prev, [currentPage]: 'digital' }));
            }
          }
        } catch (extractErr) {
          console.warn('Text extraction warning:', extractErr);
        }
      }
    } catch (err) {
      console.warn('Render error:', err);
    }
  }, [currentPage, pageCount, zoom, rotations, ocrBoxes]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // 3. Render Thumbnails for Sidebar
  useEffect(() => {
    if (!pdfJsDocRef.current || pageCount === 0) return;
    let isCancelled = false;

    async function loadThumbnails() {
      const doc = pdfJsDocRef.current;
      const newThumbs: Record<number, string> = {};

      for (let i = 0; i < doc.numPages; i++) {
        if (isCancelled) return;
        try {
          const page = await doc.getPage(i + 1);
          const vp = page.getViewport({ scale: 0.25 });
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = vp.width;
          thumbCanvas.height = vp.height;
          const ctx = thumbCanvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            newThumbs[i] = thumbCanvas.toDataURL('image/jpeg', 0.7);
          }
        } catch {}
      }

      if (!isCancelled) {
        setThumbnailUrls(newThumbs);
      }
    }

    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [pageCount, rotations]);

  // 4. On-Demand OCR Trigger (Per-page Server-Side OCR)
  const handleRunPageOcr = async () => {
    // A. If digital text already exists on this page, activate text selection immediately
    if (ocrBoxes[currentPage] && ocrBoxes[currentPage].length > 0) {
      setActiveTool('ocr_replace');
      showToast(
        `Teks digital sudah terdeteksi (${ocrBoxes[currentPage].length} baris). Klik kotak teks untuk mengedit!`,
        'success'
      );
      return;
    }

    // B. If scanned image, run lightweight Server-Side OCR strictly for this single page
    setOcrLoading(true);
    showToast(`Memindai OCR teks pada Halaman ${currentPage + 1} di server...`, 'info');

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas halaman belum siap.');

      // Convert current page canvas to compressed JPEG blob (~150KB)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (!blob) throw new Error('Gagal mengekspor gambar halaman.');

      const fd = new FormData();
      fd.append('image', blob, 'page.jpg');
      fd.append('pageIndex', currentPage.toString());
      fd.append('pageWidth', pageDimensions.width.toString());
      fd.append('pageHeight', pageDimensions.height.toString());
      fd.append('canvasWidth', canvas.width.toString());
      fd.append('canvasHeight', canvas.height.toString());
      fd.append('lang', 'ind+eng');

      const res = await fetch('/api/tools/pdf-editor/ocr', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server OCR gagal (status ${res.status})`);
      }

      const data = await res.json();
      if (data.lines && data.lines.length > 0) {
        setOcrBoxes((prev) => ({ ...prev, [currentPage]: data.lines }));
        setOcrType((prev) => ({ ...prev, [currentPage]: 'scanned' }));
        setActiveTool('ocr_replace');
        showToast(
          `OCR Selesai! Terdeteksi ${data.lines.length} baris teks. Klik kotak teks untuk mengedit.`,
          'success'
        );
      } else {
        showToast('Tidak ada teks terdeteksi pada halaman scan ini.', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala OCR';
      showToast(`OCR gagal: ${msg}`, 'error');
    } finally {
      setOcrLoading(false);
    }
  };

  // Add Annotation Helper with Undo Stack
  const addAnnotation = (ann: PdfAnnotationItem) => {
    setHistory((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations((prev) => [...prev, ann]);
    setSelectedAnnotationId(ann.id);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, annotations]);
    setAnnotations(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, annotations]);
    setAnnotations(next);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleDeleteAnnotation = (id: string) => {
    setHistory((prev) => [...prev, annotations]);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
    showToast('Elemen berhasil dihapus.', 'info');
  };

  // Canvas Mouse / Pointer events for creating Whiteout, Highlight, or Text
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on empty canvas space, deselect active annotation
    if (activeTool === 'pan') {
      setSelectedAnnotationId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (activeTool === 'add_text') {
      // Add text at exact click location and immediately select it for dragging/editing
      const newId = `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAnn: PdfAnnotationItem = {
        id: newId,
        pageIndex: currentPage,
        type: 'text',
        x: Math.round(x),
        y: Math.round(y),
        width: 150,
        height: 28,
        text: 'Teks Baru',
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#000000',
      };
      addAnnotation(newAnn);
      setSelectedAnnotationId(newId);
      setActiveTool('pan');
      showToast('Teks ditaruh! Geser posisinya atau ubah teksnya di toolbar atas.', 'success');
      return;
    }

    if (activeTool === 'whiteout' || activeTool === 'highlight') {
      setIsDrawingRect(true);
      setRectStart({ x, y });
      setCurrentRect({ x, y, w: 0, h: 0 });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRect || !rectStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / zoom;
    const curY = (e.clientY - rect.top) / zoom;

    const x = Math.min(rectStart.x, curX);
    const y = Math.min(rectStart.y, curY);
    const w = Math.abs(curX - rectStart.x);
    const h = Math.abs(curY - rectStart.y);

    setCurrentRect({ x, y, w, h });
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingRect && currentRect && currentRect.w > 4 && currentRect.h > 4) {
      if (activeTool === 'whiteout') {
        const newAnn: PdfAnnotationItem = {
          id: `whiteout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          pageIndex: currentPage,
          type: 'whiteout',
          x: Math.round(currentRect.x),
          y: Math.round(currentRect.y),
          width: Math.round(currentRect.w),
          height: Math.round(currentRect.h),
          bgColor: '#ffffff',
        };
        addAnnotation(newAnn);
        showToast('Area ditutupi (Whiteout)!', 'success');
      } else if (activeTool === 'highlight') {
        const newAnn: PdfAnnotationItem = {
          id: `highlight_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          pageIndex: currentPage,
          type: 'highlight',
          x: Math.round(currentRect.x),
          y: Math.round(currentRect.y),
          width: Math.round(currentRect.w),
          height: Math.round(currentRect.h),
          color: '#facc15',
          opacity: 0.35,
        };
        addAnnotation(newAnn);
        showToast('Teks disorot (Highlight)!', 'success');
      }
    }
    setIsDrawingRect(false);
    setRectStart(null);
    setCurrentRect(null);
  };

  // Window-level drag & resize listener for annotations (smooth, robust, never loses pointer)
  useEffect(() => {
    if (!isDraggingAnnotation && !isResizingSignature) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartInfo || !selectedAnnotationId) return;

      const dx = (e.clientX - dragStartInfo.pointerX) / zoom;
      const dy = (e.clientY - dragStartInfo.pointerY) / zoom;

      if (isDraggingAnnotation) {
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== selectedAnnotationId) return a;
            return {
              ...a,
              x: Math.max(0, Math.min(pageDimensions.width - 20, Math.round(dragStartInfo.annX + dx))),
              y: Math.max(0, Math.min(pageDimensions.height - 10, Math.round(dragStartInfo.annY + dy))),
            };
          })
        );
      } else if (isResizingSignature) {
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== selectedAnnotationId) return a;
            const newW = Math.max(30, Math.round(dragStartInfo.annWidth + dx));
            const newH = Math.max(15, Math.round(dragStartInfo.annHeight + dy));
            return { ...a, width: newW, height: newH };
          })
        );
      }
    };

    const handlePointerUp = () => {
      setIsDraggingAnnotation(false);
      setIsResizingSignature(false);
      setDragStartInfo(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingAnnotation, isResizingSignature, dragStartInfo, selectedAnnotationId, zoom, pageDimensions]);

  // Dragging annotations (moving text, signature, whiteout, replace)
  const handleAnnotationPointerDown = (ann: PdfAnnotationItem, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnnotationId(ann.id);
    setIsDraggingAnnotation(true);
    setIsResizingSignature(false);
    setDragStartInfo({
      pointerX: e.clientX,
      pointerY: e.clientY,
      annX: ann.x,
      annY: ann.y,
      annWidth: ann.width,
      annHeight: ann.height,
    });
  };

  // Resizing signature from corner handle
  const handleResizePointerDown = (ann: PdfAnnotationItem, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnnotationId(ann.id);
    setIsResizingSignature(true);
    setIsDraggingAnnotation(false);
    setDragStartInfo({
      pointerX: e.clientX,
      pointerY: e.clientY,
      annX: ann.x,
      annY: ann.y,
      annWidth: ann.width,
      annHeight: ann.height,
    });
  };

  // Click on OCR detected box to open Replace Modal
  const handleOcrBoxClick = (box: OcrBoxItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOcrBox(box);
    setReplaceModalOpen(true);
  };

  // Apply Signature from Modal
  const handleApplySignature = (imageDataUrl: string) => {
    const w = 150;
    const h = 70;
    const x = Math.max(20, (pageDimensions.width - w) / 2);
    const y = Math.max(20, (pageDimensions.height - h) / 2 + 100);

    const newAnn: PdfAnnotationItem = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageIndex: currentPage,
      type: 'signature',
      x: Math.round(x),
      y: Math.round(y),
      width: w,
      height: h,
      imageDataUrl,
    };
    addAnnotation(newAnn);
    showToast('Tanda tangan disematkan! Klik & geser posisinya, atau tarik sudutnya untuk mengubah ukuran.', 'success');
  };

  // Rotate Page
  const handleRotatePage = (pIdx: number) => {
    setRotations((prev) => {
      const current = prev[pIdx] || 0;
      return { ...prev, [pIdx]: (current + 90) % 360 };
    });
    showToast(`Halaman ${pIdx + 1} diputar 90°!`, 'info');
  };

  // Delete Page
  const handleDeletePage = (pIdx: number) => {
    if (pageCount - deletedPages.length <= 1) {
      showToast('Dokumen harus memiliki minimal 1 halaman.', 'error');
      return;
    }
    setDeletedPages((prev) => [...prev, pIdx]);
    showToast(`Halaman ${pIdx + 1} dihapus dari dokumen hasil.`, 'info');
  };

  // Export Modified PDF
  const handleDownloadPdf = async () => {
    if (!pdfBytes) return;

    try {
      showToast('Menyiapkan dokumen PDF hasil edit...', 'info');
      const modifiedBytes = await applyPdfModifications(
        pdfBytes,
        annotations,
        deletedPages,
        rotations
      );

      const blob = new Blob([modifiedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = pdfFile?.name ? pdfFile.name.replace(/\.[^/.]+$/, '') : 'dokumen';
      a.download = `${baseName}_edited_nextbyte.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch {}

      showToast('PDF berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Gagal memproses ekspor PDF.', 'error');
    }
  };

  // Find currently selected annotation object
  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 text-left">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Modals */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onApplySignature={handleApplySignature}
      />

      <ReplaceTextModal
        isOpen={replaceModalOpen}
        onClose={() => {
          setReplaceModalOpen(false);
          setSelectedOcrBox(null);
        }}
        targetRect={selectedOcrBox}
        pageIndex={currentPage}
        onApplyReplace={(ann) => {
          addAnnotation(ann);
          showToast('Teks berhasil diganti & ditutupi whiteout!', 'success');
        }}
      />

      {/* Top Navbar / Studio Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Document Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <FileEdit className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {pdfFile ? pdfFile.name : 'PDF Editor & OCR Studio'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {pdfFile ? (
                <>
                  <span>
                    {pageCount - deletedPages.length} Halaman Aktif • Hal {currentPage + 1}
                  </span>
                  {ocrType[currentPage] && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ocrType[currentPage] === 'scanned'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {ocrType[currentPage]}
                    </span>
                  )}
                </>
              ) : (
                <span>Edit teks, tanda tangan, redaksi whiteout, dan OCR per halaman</span>
              )}
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>{pdfFile ? 'Ganti File' : 'Buka File PDF'}</span>
          </button>

          {pdfFile && (
            <>
              {/* Undo / Redo */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-all"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-all"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Simpan PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Studio Viewport */}
      {pdfFile ? (
        <div className="space-y-3">
          {/* Editor Tool Palette (Floating Bar) */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
            {/* Primary Editing Modes */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {[
                { id: 'pan', label: 'Geser / Pilih', icon: Hand },
                { id: 'ocr_replace', label: 'Ganti Teks (OCR)', icon: Sparkles },
                { id: 'add_text', label: 'Tambah Teks', icon: Type },
                { id: 'whiteout', label: 'Whiteout / Tutup', icon: Eraser },
                { id: 'signature', label: 'Tanda Tangan', icon: PenTool },
                { id: 'highlight', label: 'Sorot (Highlight)', icon: Highlighter },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      if (tool.id === 'signature') {
                        setSignatureModalOpen(true);
                      } else {
                        setActiveTool(tool.id as typeof activeTool);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* OCR Per-Page Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRunPageOcr}
                disabled={ocrLoading}
                className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                {ocrLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>{ocrLoading ? 'Memindai...' : 'OCR Halaman Ini'}</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  title="Perkecil Zoom"
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-700 dark:text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  title="Perbesar Zoom"
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Selected Annotation Quick Edit Toolbar */}
          {selectedAnnotation && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedAnnotation.type === 'text'
                    ? 'Teks Terpilih (Klik & Geser di Halaman):'
                    : selectedAnnotation.type === 'signature'
                    ? 'Tanda Tangan Terpilih (Geser atau Tarik Sudut):'
                    : 'Elemen Terpilih:'}
                </span>
              </div>

              {selectedAnnotation.type === 'text' && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={selectedAnnotation.text || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedAnnotation.id ? { ...a, text: val } : a))
                      );
                    }}
                    placeholder="Ubah isi teks..."
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Font Size controls */}
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedAnnotation.id
                              ? { ...a, fontSize: Math.max(8, (a.fontSize || 12) - 2) }
                              : a
                          )
                        );
                      }}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                    >
                      A-
                    </button>
                    <span className="text-[11px] font-mono px-1.5 text-slate-600 dark:text-slate-300">
                      {selectedAnnotation.fontSize || 12}pt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnnotations((prev) =>
                          prev.map((a) =>
                            a.id === selectedAnnotation.id
                              ? { ...a, fontSize: Math.min(48, (a.fontSize || 12) + 2) }
                              : a
                          )
                        );
                      }}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                    >
                      A+
                    </button>
                  </div>

                  {/* Color selector */}
                  <div className="flex items-center gap-1">
                    {['#000000', '#1d4ed8', '#b91c1c'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === selectedAnnotation.id ? { ...a, color: c } : a
                            )
                          );
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          selectedAnnotation.color === c ? 'scale-110 border-blue-500' : 'border-white dark:border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnnotationId(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Workspace: Sidebar + Viewport Canvas */}
          <div className="flex gap-4 items-start">
            {/* Left Sidebar: Page Thumbnails */}
            {sidebarOpen && (
              <div className="w-48 sm:w-56 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-3 shrink-0 max-h-[750px] overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>Halaman ({pageCount - deletedPages.length})</span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {Array.from({ length: pageCount }).map((_, idx) => {
                    if (deletedPages.includes(idx)) return null;
                    const isActive = currentPage === idx;
                    const thumbUrl = thumbnailUrls[idx];

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentPage(idx);
                          setSelectedAnnotationId(null);
                        }}
                        className={`p-2 rounded-2xl border transition-all cursor-pointer relative group ${
                          isActive
                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 shadow-md ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-950'
                        }`}
                      >
                        {/* Page Preview Thumbnail */}
                        <div className="aspect-[1/1.414] bg-white rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                          {thumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbUrl}
                              alt={`Thumbnail Hal ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-300 animate-pulse" />
                          )}
                        </div>

                        {/* Page Footer & Actions */}
                        <div className="flex items-center justify-between pt-1.5 px-0.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Hal {idx + 1}
                          </span>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotatePage(idx);
                              }}
                              title="Putar 90°"
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePage(idx);
                              }}
                              title="Hapus Halaman"
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Central Viewport */}
            <div className="flex-1 min-w-0 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-auto min-h-[650px] shadow-inner">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="absolute top-4 left-4 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-50"
                  title="Buka Sidebar Halaman"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Interactive PDF Page Container */}
              <div
                ref={viewportContainerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                style={{
                  width: `${pageDimensions.width * zoom}px`,
                  height: `${pageDimensions.height * zoom}px`,
                }}
                className={`relative bg-white shadow-2xl rounded-sm transition-all select-none ${
                  activeTool === 'pan' ? 'cursor-default' : 'cursor-crosshair'
                }`}
              >
                {/* 1. Underlying Base PDF Canvas */}
                <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

                {/* 2. Interactive SVG Overlay for Annotations & OCR Boxes */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                  viewBox={`0 0 ${pageDimensions.width} ${pageDimensions.height}`}
                >
                  {/* Applied Annotations for Current Page */}
                  {annotations
                    .filter((ann) => ann.pageIndex === currentPage)
                    .map((ann) => {
                      const isSelected = selectedAnnotationId === ann.id;

                      if (ann.type === 'whiteout') {
                        return (
                          <g
                            key={ann.id}
                            onPointerDown={(e) => handleAnnotationPointerDown(ann, e)}
                            className="cursor-move"
                          >
                            <rect
                              x={ann.x}
                              y={ann.y}
                              width={ann.width}
                              height={ann.height}
                              fill={ann.bgColor || '#ffffff'}
                              stroke={isSelected ? '#2563eb' : 'rgba(0,0,0,0.08)'}
                              strokeWidth={isSelected ? '1.5' : '0.5'}
                              strokeDasharray={isSelected ? '3,3' : 'none'}
                            />
                            {isSelected && (
                              <g
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(ann.id);
                                }}
                                className="cursor-pointer"
                              >
                                <circle cx={ann.x + ann.width} cy={ann.y} r="8" fill="#ef4444" />
                                <line x1={ann.x + ann.width - 3} y1={ann.y - 3} x2={ann.x + ann.width + 3} y2={ann.y + 3} stroke="#fff" strokeWidth="1.5" />
                                <line x1={ann.x + ann.width + 3} y1={ann.y - 3} x2={ann.x + ann.width - 3} y2={ann.y + 3} stroke="#fff" strokeWidth="1.5" />
                              </g>
                            )}
                          </g>
                        );
                      }

                      if (ann.type === 'replace') {
                        return (
                          <g
                            key={ann.id}
                            onPointerDown={(e) => handleAnnotationPointerDown(ann, e)}
                            className="cursor-move"
                          >
                            <rect
                              x={ann.x}
                              y={ann.y}
                              width={ann.width}
                              height={ann.height}
                              fill={ann.bgColor || '#ffffff'}
                              stroke={isSelected ? '#2563eb' : 'rgba(59, 130, 246, 0.4)'}
                              strokeWidth={isSelected ? '1.5' : '0.8'}
                              strokeDasharray={isSelected ? '3,3' : 'none'}
                            />
                            <text
                              x={ann.x + 2}
                              y={ann.y + Math.max(1, ann.height * 0.78)}
                              fontSize={ann.fontSize || 12}
                              fill={ann.color || '#000000'}
                              fontFamily={ann.fontFamily || 'Helvetica, Arial, sans-serif'}
                              className="select-none pointer-events-none"
                            >
                              {ann.text}
                            </text>
                            {isSelected && (
                              <g
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(ann.id);
                                }}
                                className="cursor-pointer"
                              >
                                <circle cx={ann.x + ann.width} cy={ann.y} r="8" fill="#ef4444" />
                                <line x1={ann.x + ann.width - 3} y1={ann.y - 3} x2={ann.x + ann.width + 3} y2={ann.y + 3} stroke="#fff" strokeWidth="1.5" />
                                <line x1={ann.x + ann.width + 3} y1={ann.y - 3} x2={ann.x + ann.width - 3} y2={ann.y + 3} stroke="#fff" strokeWidth="1.5" />
                              </g>
                            )}
                          </g>
                        );
                      }

                      if (ann.type === 'text') {
                        const fSize = ann.fontSize || 14;
                        const approxWidth = Math.max(60, (ann.text?.length || 8) * (fSize * 0.65) + 16);
                        const approxHeight = fSize + 10;

                        return (
                          <g
                            key={ann.id}
                            onPointerDown={(e) => handleAnnotationPointerDown(ann, e)}
                            className="cursor-move group"
                          >
                            {/* Draggable Bounding Hit Box */}
                            <rect
                              x={ann.x - 4}
                              y={ann.y - 4}
                              width={approxWidth}
                              height={approxHeight}
                              fill={isSelected ? 'rgba(59, 130, 246, 0.16)' : 'rgba(59, 130, 246, 0.04)'}
                              stroke={isSelected ? '#2563eb' : 'rgba(59, 130, 246, 0.4)'}
                              strokeWidth={isSelected ? '1.5' : '1'}
                              strokeDasharray={isSelected ? '4,4' : '2,2'}
                              rx="4"
                              className="hover:stroke-blue-500 hover:fill-blue-500/20 transition-all cursor-move"
                            />
                            <text
                              x={ann.x}
                              y={ann.y + fSize * 0.82}
                              fontSize={fSize}
                              fill={ann.color || '#000000'}
                              fontFamily={ann.fontFamily || 'Helvetica, Arial, sans-serif'}
                              className="select-none pointer-events-none font-medium"
                            >
                              {ann.text}
                            </text>
                            {isSelected && (
                              <g
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(ann.id);
                                }}
                                className="cursor-pointer"
                              >
                                <circle cx={ann.x + approxWidth - 2} cy={ann.y - 4} r="8" fill="#ef4444" />
                                <line x1={ann.x + approxWidth - 5} y1={ann.y - 7} x2={ann.x + approxWidth + 1} y2={ann.y - 1} stroke="#fff" strokeWidth="1.5" />
                                <line x1={ann.x + approxWidth + 1} y1={ann.y - 7} x2={ann.x + approxWidth - 5} y2={ann.y - 1} stroke="#fff" strokeWidth="1.5" />
                              </g>
                            )}
                          </g>
                        );
                      }

                      if (ann.type === 'highlight') {
                        return (
                          <rect
                            key={ann.id}
                            x={ann.x}
                            y={ann.y}
                            width={ann.width}
                            height={ann.height}
                            fill={ann.color || '#facc15'}
                            opacity={ann.opacity || 0.35}
                            onPointerDown={(e) => handleAnnotationPointerDown(ann, e)}
                            className="cursor-move"
                          />
                        );
                      }

                      if (ann.type === 'signature' && ann.imageDataUrl) {
                        return (
                          <g
                            key={ann.id}
                            onPointerDown={(e) => handleAnnotationPointerDown(ann, e)}
                            className="cursor-move group"
                          >
                            <image
                              href={ann.imageDataUrl}
                              x={ann.x}
                              y={ann.y}
                              width={ann.width}
                              height={ann.height}
                              preserveAspectRatio="xMidYMid meet"
                            />
                            {/* Selection border */}
                            {isSelected && (
                              <>
                                <rect
                                  x={ann.x - 2}
                                  y={ann.y - 2}
                                  width={ann.width + 4}
                                  height={ann.height + 4}
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="1.5"
                                  strokeDasharray="4,4"
                                />
                                {/* Delete button top right */}
                                <g
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAnnotation(ann.id);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <circle cx={ann.x + ann.width + 2} cy={ann.y - 2} r="8" fill="#ef4444" />
                                  <line x1={ann.x + ann.width - 1} y1={ann.y - 5} x2={ann.x + ann.width + 5} y2={ann.y + 1} stroke="#fff" strokeWidth="1.5" />
                                  <line x1={ann.x + ann.width + 5} y1={ann.y - 5} x2={ann.x + ann.width - 1} y2={ann.y + 1} stroke="#fff" strokeWidth="1.5" />
                                </g>
                                {/* Bottom right resize handle */}
                                <circle
                                  cx={ann.x + ann.width + 2}
                                  cy={ann.y + ann.height + 2}
                                  r="7"
                                  fill="#2563eb"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  className="cursor-nwse-resize"
                                  onPointerDown={(e) => handleResizePointerDown(ann, e)}
                                />
                              </>
                            )}
                          </g>
                        );
                      }

                      return null;
                    })}

                  {/* OCR Word & Line Bounding Boxes (visible in 'ocr_replace' mode) */}
                  {activeTool === 'ocr_replace' &&
                    ocrBoxes[currentPage]?.map((box, bIdx) => (
                      <g
                        key={`ocr_${bIdx}`}
                        onClick={(e) => handleOcrBoxClick(box, e)}
                        className="cursor-pointer group"
                      >
                        <rect
                          x={box.x0}
                          y={box.y0}
                          width={box.x1 - box.x0}
                          height={box.y1 - box.y0}
                          fill="rgba(59, 130, 246, 0.08)"
                          stroke="rgba(59, 130, 246, 0.6)"
                          strokeWidth="1.2"
                          strokeDasharray="3,3"
                          rx="2"
                          className="hover:fill-blue-500/30 hover:stroke-blue-600 transition-all"
                        />
                      </g>
                    ))}

                  {/* Live Dragging Rectangle for Whiteout or Highlight */}
                  {isDrawingRect && currentRect && (
                    <rect
                      x={currentRect.x}
                      y={currentRect.y}
                      width={currentRect.w}
                      height={currentRect.h}
                      fill={activeTool === 'whiteout' ? '#ffffff' : '#facc15'}
                      opacity={activeTool === 'whiteout' ? 0.9 : 0.4}
                      stroke="#2563eb"
                      strokeWidth="1"
                    />
                  )}
                </svg>
              </div>

              {/* Viewport Floating Page Navigation */}
              <div className="mt-4 flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(0, p - 1));
                    setSelectedAnnotationId(null);
                  }}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
                  Halaman {currentPage + 1} dari {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(pageCount - 1, p + 1));
                    setSelectedAnnotationId(null);
                  }}
                  disabled={currentPage >= pageCount - 1}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Welcome Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-12 sm:p-20 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 bg-white/50 dark:bg-slate-900/40 text-center space-y-4 cursor-pointer transition-all shadow-sm group"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-inner">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Pilih Dokumen PDF untuk Diedit
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Tarik & lepas file PDF ke sini, atau klik untuk memilih file dari komputer atau HP Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              ✍️ Ganti Teks & Nama
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              ✒️ Tanda Tangan Digital
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              🔍 OCR Per Halaman (Ringan)
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              🛡️ Redaksi Whiteout
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
