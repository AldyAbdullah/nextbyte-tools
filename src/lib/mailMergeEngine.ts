import JSZip from 'jszip';
import {
  MailMergeTemplateInfo,
  RecipientRow,
  AutoNumberConfig,
  ImageDimensionConfig,
  UploadedPhoto,
  GeneratedDocResult,
} from '@/types/mailMerge';
import { generateSingleDocx } from './docxHelper';
import { sanitizeFilename } from './excelHelper';

/**
 * Match a photo filename or person name to uploaded photos
 */
export function findMatchingPhoto(
  targetNameOrFile: string,
  uploadedPhotos: UploadedPhoto[]
): UploadedPhoto | undefined {
  if (!targetNameOrFile || uploadedPhotos.length === 0) return undefined;

  const target = targetNameOrFile.trim().toLowerCase();
  const targetClean = target.replace(/\.[^/.]+$/, ''); // remove extension

  // 1. Exact match with filename (e.g. "andi.jpg" === "andi.jpg")
  const exact = uploadedPhotos.find((p) => p.name.toLowerCase() === target);
  if (exact) return exact;

  // 2. Clean name match (e.g. "andi" === "andi")
  const cleanMatch = uploadedPhotos.find((p) => p.cleanName.toLowerCase() === targetClean);
  if (cleanMatch) return cleanMatch;

  // 3. Substring match (e.g. photo "foto_andi_1.jpg" contains "andi")
  const subMatch = uploadedPhotos.find((p) => {
    const pClean = p.cleanName.toLowerCase();
    return pClean === targetClean || pClean.includes(targetClean) || targetClean.includes(pClean);
  });
  if (subMatch) return subMatch;

  return undefined;
}

/**
 * Build document file name for a recipient row based on a pattern
 */
export function buildDocumentFileName(
  pattern: string,
  rowData: Record<string, string>,
  rowIndex: number,
  fallbackName: string
): string {
  let result = pattern || 'Dokumen_{{nama}}';

  // Replace {{var}} in filename pattern
  result = result.replace(/\{\{([^{}]+)\}\}/g, (_, k) => {
    const cleanKey = k.trim();
    return rowData[cleanKey] || rowData[cleanKey.toLowerCase()] || '';
  });

  result = sanitizeFilename(result);

  if (!result || result.trim().length === 0) {
    result = sanitizeFilename(fallbackName) || `Dokumen-${rowIndex}`;
  }

  return `${result}.docx`;
}

/**
 * Process a recipient row with column mappings, auto-numbering, and default values
 */
export function prepareRowData(
  rawRow: Record<string, string>,
  rowIndex: number,
  columnMapping: Record<string, string>, // templateVar -> excelCol
  autoNumber: AutoNumberConfig,
  emptyFallback: string = ''
): Record<string, string> {
  const data: Record<string, string> = {};

  // Apply mapped Excel columns
  for (const [tplVar, excelCol] of Object.entries(columnMapping)) {
    if (excelCol && excelCol !== '__none__') {
      const val = (rawRow[excelCol] ?? '').trim();
      data[tplVar] = val || emptyFallback;
      data[tplVar.toLowerCase()] = val || emptyFallback;
    } else {
      data[tplVar] = emptyFallback;
      data[tplVar.toLowerCase()] = emptyFallback;
    }
  }

  // Also include all raw row fields for convenience
  for (const [k, v] of Object.entries(rawRow)) {
    if (!(k in data)) {
      data[k] = (v ?? '').trim();
      data[k.toLowerCase()] = (v ?? '').trim();
    }
  }

  // Auto document numbering
  if (autoNumber.enabled && autoNumber.variableName) {
    const docNum = autoNumber.startNumber + (rowIndex - 1);
    const paddedNum = String(docNum).padStart(autoNumber.padding, '0');
    const fullNumber = `${autoNumber.prefix}${paddedNum}${autoNumber.suffix}`;
    data[autoNumber.variableName] = fullNumber;
    data[autoNumber.variableName.toLowerCase()] = fullNumber;
  }

  return data;
}

/**
 * Execute batch mail merge generation with live progress reporting
 */
export async function executeBatchMailMerge(
  templateInfo: MailMergeTemplateInfo,
  rows: RecipientRow[],
  columnMapping: Record<string, string>,
  imageMapping: Record<string, string>, // imageVar -> excelCol
  uploadedPhotos: UploadedPhoto[],
  autoNumber: AutoNumberConfig,
  imageDimensions: ImageDimensionConfig,
  fileNamePattern: string,
  emptyFallback: string,
  onProgress?: (progress: { current: number; total: number; percent: number; currentName: string }) => void
): Promise<GeneratedDocResult[]> {
  const templateArrayBuffer = await templateInfo.file.arrayBuffer();
  const results: GeneratedDocResult[] = [];
  const seenFileNames = new Map<string, number>();

  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    const recipientName =
      row.raw['nama'] || row.raw['name'] || row.raw['Nama'] || row.raw['Name'] || `Penerima ${i + 1}`;

    if (onProgress) {
      const percent = Math.round(((i + 1) / total) * 100);
      onProgress({
        current: i + 1,
        total,
        percent,
        currentName: recipientName,
      });
    }

    try {
      const data = prepareRowData(row.raw, i + 1, columnMapping, autoNumber, emptyFallback);
      const imageFiles = new Map<string, ArrayBuffer>();

      for (const [imgVar, colName] of Object.entries(imageMapping)) {
        if (!colName || colName === '__none__') continue;

        const photoTargetName = (row.raw[colName] ?? '').trim();
        const matchedPhoto = findMatchingPhoto(photoTargetName || recipientName, uploadedPhotos);

        if (matchedPhoto) {
          const buffer = await matchedPhoto.file.arrayBuffer();
          imageFiles.set(imgVar, buffer);
        } else {
          if (imageDimensions.missingAction === 'placeholder_text') {
            data[imgVar] = '[Foto tidak tersedia]';
          } else {
            data[imgVar] = '';
          }
        }
      }

      let fileName = buildDocumentFileName(fileNamePattern, data, i + 1, recipientName);
      if (seenFileNames.has(fileName)) {
        const count = seenFileNames.get(fileName)! + 1;
        seenFileNames.set(fileName, count);
        fileName = fileName.replace(/\.docx$/, `-${count}.docx`);
      } else {
        seenFileNames.set(fileName, 1);
      }

      const docxBlob = await generateSingleDocx(
        templateArrayBuffer,
        data,
        imageFiles,
        imageDimensions,
        i + 1
      );

      results.push({
        rowIndex: i + 1,
        recipientName,
        fileName,
        blob: docxBlob,
        size: docxBlob.size,
        status: 'success',
      });
    } catch (err) {
      console.error(`Error generating document for row ${i + 1}:`, err);
      results.push({
        rowIndex: i + 1,
        recipientName,
        fileName: `Error_Row_${i + 1}.docx`,
        status: 'failed',
        error: (err as Error)?.message || 'Gagal memproses dokumen',
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  return results;
}

/**
 * Pack all successfully generated DOCX blobs into a single ZIP archive
 */
export async function createBatchZip(
  results: GeneratedDocResult[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const doc of results) {
    if (doc.status === 'success' && doc.blob) {
      zip.file(doc.fileName, doc.blob);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
