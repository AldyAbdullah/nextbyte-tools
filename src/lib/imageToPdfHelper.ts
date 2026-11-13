import { PDFDocument } from 'pdf-lib';

export interface ImageToPdfItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
}

export type PageSizeOption = 'a4' | 'f4' | 'letter' | 'fit';
export type PageOrientationOption = 'portrait' | 'landscape' | 'auto';
export type MarginOption = 'none' | 'small' | 'large';

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
  fileName: string;
}

// Dimensions in standard PDF points (72 points = 1 inch)
const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 }, // 210 x 297 mm
  f4: { width: 609.45, height: 935.43 }, // 215 x 330 mm (Indonesian Folio/F4)
  letter: { width: 612.0, height: 792.0 }, // 8.5 x 11 in
};

const MARGIN_POINTS: Record<MarginOption, number> = {
  none: 0,
  small: 20, // ~7 mm
  large: 40, // ~14 mm
};

/**
 * Creates a canvas with rotated and rasterized image data to embed into PDF.
 */
async function processImageForPdf(
  item: ImageToPdfItem
): Promise<{ buffer: ArrayBuffer; isPng: boolean; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const isRotated = item.rotation === 90 || item.rotation === 270;
      const targetWidth = isRotated ? img.naturalHeight : img.naturalWidth;
      const targetHeight = isRotated ? img.naturalWidth : img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal menginisialisasi canvas context.'));
        return;
      }

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      const isPng = item.file.type === 'image/png';
      const mime = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : 0.92;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengekspor gambar dari canvas.'));
          return;
        }
        const buffer = await blob.arrayBuffer();
        resolve({
          buffer,
          isPng,
          width: targetWidth,
          height: targetHeight,
        });
      }, mime, quality);
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar.'));
    img.src = item.previewUrl;
  });
}

/**
 * Converts a list of image items into a high-quality PDF document.
 */
export async function convertImagesToPdf(
  items: ImageToPdfItem[],
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  if (items.length === 0) {
    throw new Error('Pilih minimal satu gambar.');
  }

  const pdfDoc = await PDFDocument.create();
  const margin = MARGIN_POINTS[options.margin];

  for (const item of items) {
    const processed = await processImageForPdf(item);

    let embeddedImage;
    if (processed.isPng) {
      try {
        embeddedImage = await pdfDoc.embedPng(processed.buffer);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(processed.buffer);
      }
    } else {
      embeddedImage = await pdfDoc.embedJpg(processed.buffer);
    }

    let pageWidth = 0;
    let pageHeight = 0;

    if (options.pageSize === 'fit') {
      pageWidth = processed.width + margin * 2;
      pageHeight = processed.height + margin * 2;
    } else {
      const baseDim = PAGE_DIMENSIONS[options.pageSize] || PAGE_DIMENSIONS.a4;
      const isImageLandscape = processed.width > processed.height;

      let isLandscape = false;
      if (options.orientation === 'landscape') {
        isLandscape = true;
      } else if (options.orientation === 'portrait') {
        isLandscape = false;
      } else {
        // Auto
        isLandscape = isImageLandscape;
      }

      pageWidth = isLandscape ? baseDim.height : baseDim.width;
      pageHeight = isLandscape ? baseDim.width : baseDim.height;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image position and scaling within margins
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(
      availableWidth / processed.width,
      availableHeight / processed.height
    );

    const drawWidth = processed.width * scale;
    const drawHeight = processed.height * scale;

    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}
