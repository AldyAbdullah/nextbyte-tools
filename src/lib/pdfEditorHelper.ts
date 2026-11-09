import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface PdfAnnotationItem {
  id: string;
  pageIndex: number;
  type: 'whiteout' | 'text' | 'replace' | 'signature' | 'highlight';
  x: number; // in PDF points (from top-left)
  y: number; // in PDF points (from top-left)
  width: number;
  height: number;
  text?: string;
  originalText?: string;
  fontSize?: number;
  fontFamily?: 'Helvetica' | 'TimesRoman' | 'Courier';
  color?: string; // hex #000000
  bgColor?: string; // hex #ffffff for whiteout
  imageDataUrl?: string; // base64 PNG data URL for signature/stamp
  opacity?: number;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Apply all edits and modifications onto the PDF document using pdf-lib
 * and return the modified PDF bytes.
 */
export async function applyPdfModifications(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  annotations: PdfAnnotationItem[],
  deletedPages: number[] = [],
  rotations: Record<number, number> = {} // pageIndex -> rotation angle
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);

  // Load standard fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

  const getFont = (family?: string) => {
    switch (family) {
      case 'TimesRoman':
        return timesFont;
      case 'Courier':
        return courierFont;
      default:
        return helveticaFont;
    }
  };

  const pages = pdfDoc.getPages();

  // Apply page rotations
  Object.entries(rotations).forEach(([pIdxStr, angle]) => {
    const pIdx = parseInt(pIdxStr, 10);
    if (pIdx >= 0 && pIdx < pages.length && angle !== 0) {
      const page = pages[pIdx];
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + angle) % 360));
    }
  });

  // Apply annotations per page
  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex];
    const pageHeight = page.getHeight();

    // In PDF coordinates, (0, 0) is at bottom-left.
    // In our UI (top-left origin), y starts from top.
    // So pdfBottomY = pageHeight - ann.y - ann.height
    const pdfY = pageHeight - ann.y - ann.height;

    switch (ann.type) {
      case 'whiteout': {
        const bg = hexToRgb(ann.bgColor || '#ffffff');
        page.drawRectangle({
          x: ann.x,
          y: pdfY,
          width: Math.max(1, ann.width),
          height: Math.max(1, ann.height),
          color: rgb(bg.r, bg.g, bg.b),
        });
        break;
      }

      case 'replace': {
        // 1. Draw solid background covering the old text
        const bg = hexToRgb(ann.bgColor || '#ffffff');
        page.drawRectangle({
          x: ann.x,
          y: pdfY,
          width: Math.max(1, ann.width),
          height: Math.max(1, ann.height),
          color: rgb(bg.r, bg.g, bg.b),
        });

        // 2. Draw the new replacement text
        if (ann.text) {
          const fg = hexToRgb(ann.color || '#000000');
          const font = getFont(ann.fontFamily);
          const fSize = ann.fontSize || Math.max(8, Math.min(32, ann.height * 0.75));
          // Text baseline in PDF is slightly above bottom of bounding box
          const textY = pdfY + Math.max(1, (ann.height - fSize) / 2);
          page.drawText(ann.text, {
            x: ann.x + 1,
            y: textY,
            size: fSize,
            font,
            color: rgb(fg.r, fg.g, fg.b),
          });
        }
        break;
      }

      case 'text': {
        if (ann.text) {
          const fg = hexToRgb(ann.color || '#000000');
          const font = getFont(ann.fontFamily);
          const fSize = ann.fontSize || 12;
          page.drawText(ann.text, {
            x: ann.x,
            y: pdfY + Math.max(1, (ann.height - fSize) / 2),
            size: fSize,
            font,
            color: rgb(fg.r, fg.g, fg.b),
          });
        }
        break;
      }

      case 'signature': {
        if (ann.imageDataUrl) {
          try {
            const dataParts = ann.imageDataUrl.split(',');
            const base64Data = dataParts.length > 1 ? dataParts[1] : dataParts[0];
            const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const embeddedImage = ann.imageDataUrl.includes('image/jpeg') || ann.imageDataUrl.includes('image/jpg')
              ? await pdfDoc.embedJpg(imgBytes)
              : await pdfDoc.embedPng(imgBytes);

            page.drawImage(embeddedImage, {
              x: ann.x,
              y: pdfY,
              width: Math.max(10, ann.width),
              height: Math.max(10, ann.height),
            });
          } catch (imgErr) {
            console.warn('Failed to embed signature image:', imgErr);
          }
        }
        break;
      }

      case 'highlight': {
        const hColor = hexToRgb(ann.color || '#ffff00');
        page.drawRectangle({
          x: ann.x,
          y: pdfY,
          width: Math.max(1, ann.width),
          height: Math.max(1, ann.height),
          color: rgb(hColor.r, hColor.g, hColor.b),
          opacity: ann.opacity || 0.35,
        });
        break;
      }
    }
  }

  // Delete pages in descending order to avoid index shifts
  if (deletedPages.length > 0) {
    const sortedUniquePages = Array.from(new Set(deletedPages)).sort((a, b) => b - a);
    for (const pIdx of sortedUniquePages) {
      if (pIdx >= 0 && pIdx < pdfDoc.getPageCount()) {
        pdfDoc.removePage(pIdx);
      }
    }
  }

  return await pdfDoc.save();
}
