import { PDFDocument, degrees } from 'pdf-lib';

export interface MergePdfFileItem {
  id: string;
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  pageRange: string; // 'all' or '1-3, 5'
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
}

/**
 * Parses user input page range like "1-3, 5, 8-10" or "all"
 * and returns zero-indexed array of page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const trimmed = rangeStr.trim().toLowerCase();
  if (!trimmed || trimmed === 'all' || trimmed === '*') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const resultIndices = new Set<number>();
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          resultIndices.add(i - 1);
        }
      }
    } else {
      const single = parseInt(part, 10);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        resultIndices.add(single - 1);
      }
    }
  }

  // If input format was invalid, default to all pages
  if (resultIndices.size === 0) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  return Array.from(resultIndices).sort((a, b) => a - b);
}

/**
 * Merge multiple PDF files directly in the browser using pdf-lib.
 * 100% Client-Side: zero bytes sent to server, zero privacy risks.
 */
export async function mergePdfDocuments(files: MergePdfFileItem[]): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('Tidak ada file PDF yang dipilih untuk digabungkan.');
  }

  const mergedDoc = await PDFDocument.create();

  for (const item of files) {
    try {
      const srcDoc = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();
      const pageIndices = parsePageRange(item.pageRange, totalPages);

      if (pageIndices.length === 0) continue;

      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

      for (const page of copiedPages) {
        if (item.rotation && item.rotation !== 0) {
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + item.rotation) % 360));
        }
        mergedDoc.addPage(page);
      }
    } catch (docErr) {
      console.warn(`Gagal memproses file "${item.file.name}":`, docErr);
      throw new Error(`Gagal membaca atau memproses file "${item.file.name}".`);
    }
  }

  if (mergedDoc.getPageCount() === 0) {
    throw new Error('Dokumen hasil penggabungan tidak memiliki halaman.');
  }

  return await mergedDoc.save();
}

/**
 * Format bytes to human readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
