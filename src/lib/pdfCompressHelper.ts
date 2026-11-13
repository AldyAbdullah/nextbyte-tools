import { PDFDocument } from 'pdf-lib';
import { getPdfJs } from './pdfClientLoader';

export interface CompressPreset {
  id: 'extreme' | 'recommended' | 'high_quality' | 'custom';
  label: string;
  description: string;
  targetSizeHint: string;
  scale: number;
  quality: number; // 0.1 to 1.0
}

export const COMPRESS_PRESETS: CompressPreset[] = [
  {
    id: 'extreme',
    label: 'Kompres Ekstrem',
    description: 'Ukuran file terkecil, cocok untuk kuota upload sangat ketat.',
    targetSizeHint: '< 200 - 300 KB',
    scale: 1.0,
    quality: 0.55,
  },
  {
    id: 'recommended',
    label: 'Direkomendasikan (CPNS/BUMN)',
    description: 'Keseimbangan terbaik antara ukuran file kecil dan teks tetap terbaca jelas.',
    targetSizeHint: '< 500 KB',
    scale: 1.3,
    quality: 0.72,
  },
  {
    id: 'high_quality',
    label: 'Kualitas Tinggi',
    description: 'Kompresi ringan dengan kejernihan teks dan gambar maksimal.',
    targetSizeHint: '< 1 MB - 1.5 MB',
    scale: 1.8,
    quality: 0.85,
  },
];

/**
 * Format bytes into human-readable string (B, KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface CompressProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Compresses a PDF file 100% in-browser by re-encoding pages at optimized raster resolution and JPEG quality.
 */
export async function compressPdfDocument(
  srcBytes: Uint8Array,
  scale: number,
  quality: number,
  onProgress?: CompressProgressCallback
): Promise<Uint8Array> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js tidak tersedia di browser.');

  const loadingTask = pdfjs.getDocument({ data: srcBytes });
  const srcDoc = await loadingTask.promise;
  const numPages = srcDoc.numPages;

  const outDoc = await PDFDocument.create();

  for (let i = 0; i < numPages; i++) {
    if (onProgress) {
      onProgress(i + 1, numPages, `Mengompres halaman ${i + 1} dari ${numPages}...`);
    }

    const page = await srcDoc.getPage(i + 1);
    const origVp = page.getViewport({ scale: 1.0 });
    const renderVp = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(renderVp.width);
    canvas.height = Math.round(renderVp.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal menginisialisasi canvas.');

    await page.render({ canvasContext: ctx, viewport: renderVp }).promise;

    // Convert canvas to compressed JPEG Blob
    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!jpegBlob) throw new Error(`Gagal mengonversi halaman ${i + 1} ke JPEG.`);

    const jpegBuffer = await jpegBlob.arrayBuffer();
    const embeddedImage = await outDoc.embedJpg(jpegBuffer);

    // Create page matching original PDF dimensions (points)
    const newPage = outDoc.addPage([origVp.width, origVp.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: origVp.width,
      height: origVp.height,
    });
  }

  if (onProgress) {
    onProgress(numPages, numPages, 'Menyusun berkas PDF akhir...');
  }

  return await outDoc.save();
}
