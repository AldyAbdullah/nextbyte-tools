import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export interface SplitPageItem {
  pageIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed
  selected: boolean;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parses user page input like "1-3, 5, 8-10" into a list of 0-indexed page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim() || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const result = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          result.add(p - 1);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        result.add(page - 1);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Extract selected pages into a single combined PDF document.
 */
export async function extractPagesToSinglePdf(
  srcBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error('Pilih minimal satu halaman untuk diekstrak.');
  }

  const srcDoc = await PDFDocument.load(srcBytes);
  const outDoc = await PDFDocument.create();

  const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
  for (const page of copiedPages) {
    outDoc.addPage(page);
  }

  return await outDoc.save();
}

/**
 * Split each selected page into its own individual PDF and package into a ZIP file.
 */
export async function splitPagesToZip(
  srcBytes: Uint8Array,
  pageIndices: number[],
  baseFileName: string
): Promise<Blob> {
  if (pageIndices.length === 0) {
    throw new Error('Pilih minimal satu halaman untuk dipisahkan.');
  }

  const srcDoc = await PDFDocument.load(srcBytes);
  const zip = new JSZip();
  const cleanBase = baseFileName.replace(/\.pdf$/i, '');

  for (const pageIdx of pageIndices) {
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
    singleDoc.addPage(copiedPage);
    const pdfData = await singleDoc.save();

    const fileName = `${cleanBase}_halaman_${pageIdx + 1}.pdf`;
    zip.file(fileName, pdfData);
  }

  return await zip.generateAsync({ type: 'blob' });
}
