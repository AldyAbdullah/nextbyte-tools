import JSZip from 'jszip';
import { getPdfJs } from './pdfClientLoader';

export interface RenderedPageImage {
  pageIndex: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export type ImageFormat = 'jpeg' | 'png';

/**
 * Render all pages of a PDF to images with specified scale and format.
 */
export async function renderPdfPagesToImages(
  pdfBytes: Uint8Array,
  scale: number,
  format: ImageFormat,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPageImage[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js tidak tersedia di browser.');

  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  const results: RenderedPageImage[] = [];
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.92;

  for (let i = 0; i < numPages; i++) {
    if (onProgress) {
      onProgress(i + 1, numPages);
    }

    const page = await doc.getPage(i + 1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal menginisialisasi canvas context.');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) throw new Error(`Gagal merender halaman ${i + 1} ke format ${format}`);

    const dataUrl = canvas.toDataURL(mimeType, quality);

    results.push({
      pageIndex: i,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
    });
  }

  return results;
}

/**
 * Package rendered page images into a single ZIP archive.
 */
export async function packageImagesToZip(
  images: RenderedPageImage[],
  baseFileName: string,
  format: ImageFormat
): Promise<Blob> {
  const zip = new JSZip();
  const ext = format === 'png' ? 'png' : 'jpg';
  const cleanBase = baseFileName.replace(/\.pdf$/i, '');

  for (const img of images) {
    const fileName = `${cleanBase}_hal_${img.pageIndex + 1}.${ext}`;
    zip.file(fileName, img.blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}
