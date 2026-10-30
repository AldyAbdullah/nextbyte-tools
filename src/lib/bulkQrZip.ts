import JSZip from 'jszip';
import { BulkRowData, BulkDesignConfig, BulkGeneratedItem } from '@/types/bulkQr';
import { CompleteQrConfig } from '@/types/qrcode';
import { renderCompositeCanvas } from './exportQrCanvas';
import { generateReportExcelBuffer } from './excelHelper';

/**
 * Buat konfigurasi individual untuk sebuah baris data Excel
 */
export function buildRowQrConfig(row: BulkRowData, design: BulkDesignConfig): CompleteQrConfig {
  const base = design.qrConfig;

  // Tentukan sub-text di bawah QR Code sesuai preferensi pengguna
  let subTextContent = '';
  let subTextEnabled = false;

  if (design.subTextMode === 'row-name') {
    subTextEnabled = true;
    subTextContent = row.name;
    if (design.includeDescription && row.description) {
      subTextContent = `${row.name} • ${row.description}`;
    }
  } else if (design.subTextMode === 'custom-text') {
    subTextEnabled = true;
    subTextContent = design.customText;
    if (design.includeDescription && row.description) {
      subTextContent = `${design.customText} • ${row.description}`;
    }
  }

  // Tentukan payload QR Code
  // Jika konten berupa URL valid atau umum, gunakan type 'url', selain itu gunakan 'text'
  const isUrl = /^https?:\/\//i.test(row.content) || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(row.content);
  
  return {
    ...base,
    content: {
      ...base.content,
      type: isUrl ? 'url' : 'text',
      url: row.content,
      text: row.content,
    },
    subText: {
      ...base.subText,
      enabled: subTextEnabled,
      text: subTextContent,
    },
  };
}

/**
 * Render satu canvas QR Code lengkap (QR + Logo + Frame + Text) untuk satu baris data
 */
export async function renderSingleBulkCanvas(
  row: BulkRowData,
  design: BulkDesignConfig
): Promise<HTMLCanvasElement> {
  const rowConfig = buildRowQrConfig(row, design);
  const QRCodeStyling = (await import('qr-code-styling')).default;

  const resolution = design.resolution || 2;
  const qrSize = 300 * resolution;

  const rawPayload = row.content;

  // 1. Buat instance QR code dengan resolusi asli
  const instance = new QRCodeStyling({
    width: qrSize,
    height: qrSize,
    data: rawPayload,
    dotsOptions: {
      type: rowConfig.design.dotsType,
      color: rowConfig.colors.foregroundColor,
    },
    cornersSquareOptions: {
      type: rowConfig.design.cornersSquareType,
      color: rowConfig.colors.customCorners ? rowConfig.colors.cornersSquareColor : rowConfig.colors.foregroundColor,
    },
    cornersDotOptions: {
      type: rowConfig.design.cornersDotType,
      color: rowConfig.colors.customCorners ? rowConfig.colors.cornersDotColor : rowConfig.colors.foregroundColor,
    },
    backgroundOptions: {
      color: rowConfig.colors.isBackgroundTransparent ? 'rgba(0,0,0,0)' : rowConfig.colors.backgroundColor,
    },
    image: rowConfig.logo.logoDataUrl || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: rowConfig.logo.logoMargin * resolution,
      imageSize: rowConfig.logo.logoSize,
      hideBackgroundDots: rowConfig.logo.logoBackground !== 'transparent',
    },
    qrOptions: {
      errorCorrectionLevel: rowConfig.logo.logoDataUrl ? 'H' : rowConfig.design.errorCorrectionLevel,
    },
  });

  const blob = await instance.getRawData('png');
  if (!blob) throw new Error('Gagal menghasilkan blob QR Code');

  const img = new Image();
  const url = URL.createObjectURL(blob as Blob);
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  URL.revokeObjectURL(url);

  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = qrSize;
  qrCanvas.height = qrSize;
  const ctx = qrCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, qrSize, qrSize);
  }

  // 2. Render komposit utuh (dengan piringan logo putih, frame banner, subtext)
  const compositeCanvas = await renderCompositeCanvas({
    qrCanvas,
    config: rowConfig,
    resolution,
    transparentBackground: rowConfig.colors.isBackgroundTransparent,
  });

  return compositeCanvas;
}

/**
 * Konversi canvas ke Blob PNG secara asinkron
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal mengonversi canvas ke Blob'));
    }, 'image/png');
  });
}

export interface BulkGenerateZipOptions {
  rows: BulkRowData[];
  design: BulkDesignConfig;
  onProgress: (current: number, total: number, percentage: number, currentName: string) => void;
  checkCancelled: () => boolean;
}

/**
 * Proses generate seluruh QR Code massal, buat folder zip, report Excel, dan file README
 */
export async function generateBulkZip(options: BulkGenerateZipOptions): Promise<{
  zipBlob: Blob;
  results: Record<number, { success: boolean; error?: string }>;
  successCount: number;
  failedCount: number;
  items: BulkGeneratedItem[];
}> {
  const { rows, design, onProgress, checkCancelled } = options;
  const zip = new JSZip();
  const qrFolder = zip.folder('QR-Codes');

  const results: Record<number, { success: boolean; error?: string }> = {};
  const generatedItems: BulkGeneratedItem[] = [];
  let successCount = 0;
  let failedCount = 0;

  const total = rows.length;

  for (let i = 0; i < total; i++) {
    if (checkCancelled()) {
      throw new Error('Proses generate dibatalkan oleh pengguna.');
    }

    const row = rows[i];
    const percentage = Math.round(((i + 1) / total) * 100);
    onProgress(i + 1, total, percentage, row.name);

    // Yield control to UI thread to keep the browser responsive
    await new Promise((r) => setTimeout(r, 10));

    try {
      const canvas = await renderSingleBulkCanvas(row, design);
      const blob = await canvasToPngBlob(canvas);
      const dataUrl = canvas.toDataURL('image/png');

      const fileNameWithExt = `${row.filename}.png`;
      qrFolder?.file(fileNameWithExt, blob);

      results[i] = { success: true };
      successCount++;

      generatedItems.push({
        row,
        canvas,
        dataUrl,
        blob,
        filename: fileNameWithExt,
        success: true,
      });
    } catch (err) {
      console.error(`Gagal membuat QR untuk baris #${row.rowIndex} (${row.name}):`, err);
      const errMsg = (err as Error).message || 'Gagal memproses QR Code';
      results[i] = { success: false, error: errMsg };
      failedCount++;

      generatedItems.push({
        row,
        canvas: document.createElement('canvas'),
        dataUrl: '',
        blob: new Blob(),
        filename: `${row.filename}.png`,
        success: false,
        error: errMsg,
      });
    }
  }

  // 1. Tambahkan report.xlsx ke dalam ZIP
  const reportBuffer = generateReportExcelBuffer(rows, results);
  zip.file('report.xlsx', reportBuffer);

  // 2. Tambahkan README.txt ke dalam ZIP
  const readmeContent = `=====================================================
NEXTBYTE TOOLS - BULK QR CODE GENERATOR SUMMARY REPORT
=====================================================

Tanggal Ekspor    : ${new Date().toLocaleString('id-ID')}
Total Data         : ${total}
Berhasil Dibuat    : ${successCount}
Gagal Dibuat       : ${failedCount}
Tingkat Keberhasilan: ${Math.round((successCount / (total || 1)) * 100)}%

-----------------------------------------------------
STRUKTUR FOLDER ZIP:
-----------------------------------------------------
1. /QR-Codes/
   Berisi seluruh file QR Code individual berformat PNG resolusi tinggi (${design.resolution || 2}x).
   Setiap file dinamai secara aman dan unik berdasarkan nama atau kolom 'filename'.

2. report.xlsx
   Daftar detail status pemrosesan setiap baris data Excel asli, termasuk ID,
   nama, link/konten, dan nama file output.

3. README.txt
   File ringkasan ini.

-----------------------------------------------------
PANDUAN PEMINDAIAN & CETAK:
-----------------------------------------------------
- Seluruh QR Code telah menggunakan Error Correction Level yang disesuaikan
  untuk memastikan dapat dipindai dengan cepat oleh kamera smartphone.
- Untuk keperluan cetak fisik (stiker, label produk, kartu nama, pamflet),
  gunakan resolusi gambar yang tersedia di folder QR-Codes/.

Dibuat secara privat di browser Anda menggunakan:
NextByte Multi Tools (https://nextbyte.biz.id)
© ${new Date().getFullYear()} NextByte. All rights reserved.
`;

  zip.file('README.txt', readmeContent);

  // 3. Generate file ZIP
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (metadata.percent) {
        onProgress(total, total, Math.round(metadata.percent), 'Mengompres file ZIP...');
      }
    }
  );

  return {
    zipBlob,
    results,
    successCount,
    failedCount,
    items: generatedItems,
  };
}

/**
 * Trigger download file Blob di browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
