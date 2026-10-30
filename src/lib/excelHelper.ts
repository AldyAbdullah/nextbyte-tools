import * as XLSX from 'xlsx';
import { BulkRowData, ColumnMappingConfig } from '@/types/bulkQr';

/**
 * Download template Excel (.xlsx) untuk generate QR Code massal
 */
export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    {
      id: '001',
      name: 'Website Resmi',
      content: 'https://nextbyte.biz.id',
      description: 'Landing page platform NextByte Tools',
      filename: 'website-resmi',
    },
    {
      id: '002',
      name: 'Instagram Akun',
      content: 'https://instagram.com/nextbyte.id',
      description: 'Media sosial Instagram resmi',
      filename: 'instagram-nextbyte',
    },
    {
      id: '003',
      name: 'WhatsApp CS',
      content: 'https://wa.me/6281234567890',
      description: 'Layanan pelanggan WhatsApp',
      filename: 'whatsapp-cs',
    },
    {
      id: '004',
      name: 'Wi-Fi Tamu',
      content: 'WIFI:S:NextByte-Guest;T:WPA;P:koneksicepat123;;',
      description: 'Akses Wi-Fi kantor untuk tamu',
      filename: 'wifi-tamu',
    },
    {
      id: '005',
      name: 'Email Support',
      content: 'mailto:support@nextbyte.biz.id?subject=Pertanyaan',
      description: 'Kontak tim teknis via email',
      filename: 'email-support',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(headers);

  // Set column widths for better readability in Excel & Google Sheets
  ws['!cols'] = [
    { wch: 8 },  // id
    { wch: 22 }, // name
    { wch: 45 }, // content
    { wch: 35 }, // description
    { wch: 22 }, // filename
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template QR');

  // Trigger browser download
  XLSX.writeFile(wb, 'template-bulk-qrcode-nextbyte.xlsx');
}

/**
 * Membersihkan nama file dari karakter terlarang Windows / Linux / macOS
 */
export function sanitizeFilename(input: string): string {
  if (!input) return '';
  return input
    .replace(/\.[^/.]+$/, '') // remove extension if user included .png / .jpg
    .replace(/[\\/:*?"<>|\r\n\t]/g, '_') // replace invalid characters with underscore
    .replace(/\s+/g, '-') // replace spaces with dash
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/-+/g, '-') // collapse multiple dashes
    .trim();
}

/**
 * Susun string konten QR Code untuk sebuah baris berdasarkan konfigurasi pemetaan kolom
 */
export function buildRowContent(
  rawRow: Record<string, string>,
  mapping: ColumnMappingConfig
): string {
  if (mapping.contentMode === 'single') {
    return (rawRow[mapping.singleContentColumn] ?? '').trim();
  }

  if (mapping.contentMode === 'multi') {
    const selectedCols = mapping.selectedMultiColumns || [];
    if (selectedCols.length === 0) return '';

    if (mapping.multiFormat === 'label-value') {
      return selectedCols
        .map((col) => {
          const val = (rawRow[col] ?? '').trim();
          return val ? `${col}: ${val}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }

    if (mapping.multiFormat === 'value-only') {
      return selectedCols
        .map((col) => (rawRow[col] ?? '').trim())
        .filter(Boolean)
        .join('\n');
    }

    if (mapping.multiFormat === 'csv') {
      return selectedCols
        .map((col) => (rawRow[col] ?? '').trim())
        .filter(Boolean)
        .join(', ');
    }
  }

  if (mapping.contentMode === 'template') {
    let result = mapping.customTemplate || '';
    // Gantikan tag {kolom} dengan nilai riil dari baris
    Object.keys(rawRow).forEach((col) => {
      const regex = new RegExp(`\\{${col}\\}`, 'gi');
      result = result.replace(regex, rawRow[col] ?? '');
    });
    return result.trim();
  }

  return '';
}

/**
 * Terapkan pemetaan kolom ke seluruh baris data Excel mentah
 */
export function applyColumnMapping(
  rawRows: Record<string, string>[],
  mapping: ColumnMappingConfig
): {
  rows: BulkRowData[];
  validCount: number;
  invalidCount: number;
} {
  const seenFilenames = new Map<string, number>();
  const rows: BulkRowData[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowIndex = index + 2; // Line 1 is header in Excel

    // 1. Ekstrak nama
    const name = (rawRow[mapping.nameColumn] ?? '').trim();

    // 2. Ekstrak konten sesuai mode pemetaan
    const content = buildRowContent(rawRow, mapping);

    // 3. Ekstrak deskripsi (jika kolom dipilih)
    const description = mapping.descriptionColumn ? (rawRow[mapping.descriptionColumn] ?? '').trim() : '';

    // 4. Ekstrak ID (jika ada kolom ID atau default ke nomor baris)
    const id = rawRow['id'] || rawRow['ID'] || rawRow['No'] || rawRow['no'] || String(index + 1).padStart(3, '0');

    // 5. Ekstrak / buat nama file
    const rawFilename = mapping.filenameColumn ? (rawRow[mapping.filenameColumn] ?? '').trim() : '';
    let filename = sanitizeFilename(rawFilename || name || `qr-${id || rowIndex}`);
    if (!filename) {
      filename = `qr-code-${rowIndex}`;
    }

    // Hindari nama file duplikat dalam ZIP
    if (seenFilenames.has(filename)) {
      const count = seenFilenames.get(filename)! + 1;
      seenFilenames.set(filename, count);
      filename = `${filename}-${count}`;
    } else {
      seenFilenames.set(filename, 1);
    }

    // Validasi
    const errors: string[] = [];
    if (!name) {
      errors.push(`Kolom nama (${mapping.nameColumn}) kosong.`);
    }
    if (!content) {
      errors.push('Konten QR Code kosong.');
    }

    rows.push({
      rowIndex,
      rawRow,
      id,
      name,
      content,
      description,
      filename,
      isValid: errors.length === 0,
      errors,
    });
  });

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return { rows, validCount, invalidCount };
}

export interface ParseResult {
  rawRows: Record<string, string>[];
  availableColumns: string[];
  initialMapping: ColumnMappingConfig;
  rows: BulkRowData[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  fileName: string;
  fileSize: number;
  error?: string;
}

/**
 * Membaca dan memvalidasi file Excel (.xlsx, .xls, .csv) serta mendeteksi seluruh kolom
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return createEmptyParseResult(file, 'File Excel tidak memiliki lembar kerja (worksheet).');
    }

    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];

    // Convert to JSON with string defaults
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    if (!rawData || rawData.length === 0) {
      return createEmptyParseResult(file, 'File Excel kosong atau tidak memiliki data baris.');
    }

    // Extract all available column names from first row
    const availableColumns = Object.keys(rawData[0] || {}).map((k) => k.trim()).filter(Boolean);

    if (availableColumns.length === 0) {
      return createEmptyParseResult(file, 'Tidak ditemukan kolom header pada file Excel.');
    }

    // Convert raw objects to clean string maps
    const rawRows: Record<string, string>[] = rawData.map((row) => {
      const cleanMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        cleanMap[k.trim()] = String(v ?? '').trim();
      }
      return cleanMap;
    });

    // Auto-detect best column matches
    const autoNameCol = availableColumns.find((c) => /^(nama|name|title|judul|label|produk)$/i.test(c)) || availableColumns[0];
    let autoContentCol = availableColumns.find((c) => /^(content|isi|url|link|data|qr|qrcode)$/i.test(c));
    const autoDescCol = availableColumns.find((c) => /^(description|deskripsi|keterangan|desc|catatan|detail)$/i.test(c)) || '';
    const autoFilenameCol = availableColumns.find((c) => /^(filename|nama_file|file_name|file)$/i.test(c)) || '';

    // If no obvious content column, pick the second column if available
    if (!autoContentCol) {
      autoContentCol = availableColumns.length > 1 ? availableColumns[1] : availableColumns[0];
    }

    const initialMapping: ColumnMappingConfig = {
      nameColumn: autoNameCol,
      contentMode: 'single',
      singleContentColumn: autoContentCol,
      selectedMultiColumns: availableColumns.slice(0, 3),
      multiFormat: 'label-value',
      customTemplate: availableColumns.map((c) => `${c}: {${c}}`).join('\n'),
      descriptionColumn: autoDescCol,
      filenameColumn: autoFilenameCol,
    };

    const { rows, validCount, invalidCount } = applyColumnMapping(rawRows, initialMapping);

    return {
      rawRows,
      availableColumns,
      initialMapping,
      rows,
      totalRows: rows.length,
      validCount,
      invalidCount,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err) {
    console.error('Error parsing Excel file:', err);
    return createEmptyParseResult(file, `Gagal membaca file: ${(err as Error).message || 'Format tidak valid'}`);
  }
}

function createEmptyParseResult(file: File, errorMsg: string): ParseResult {
  return {
    rawRows: [],
    availableColumns: [],
    initialMapping: {
      nameColumn: '',
      contentMode: 'single',
      singleContentColumn: '',
      selectedMultiColumns: [],
      multiFormat: 'label-value',
      customTemplate: '',
      descriptionColumn: '',
      filenameColumn: '',
    },
    rows: [],
    totalRows: 0,
    validCount: 0,
    invalidCount: 0,
    fileName: file.name,
    fileSize: file.size,
    error: errorMsg,
  };
}

/**
 * Buat file Excel ringkasan hasil generate untuk disertakan di dalam ZIP
 */
export function generateReportExcelBuffer(
  rows: BulkRowData[],
  results: Record<number, { success: boolean; error?: string }>
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const reportData = rows.map((r, i) => {
    const res = results[i];
    return {
      No: i + 1,
      'Baris Excel': r.rowIndex,
      ID: r.id,
      'Nama QR': r.name,
      'Isi / Content QR': r.content,
      Deskripsi: r.description || '-',
      'Nama File Hasil': `${r.filename}.png`,
      Status: res?.success ? 'BERHASIL' : 'GAGAL',
      Keterangan: res?.error || (res?.success ? 'QR Code sukses digenerate' : 'Gagal diproses'),
      'Waktu Proses': new Date().toLocaleString('id-ID'),
    };
  });

  const ws = XLSX.utils.json_to_sheet(reportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 22 },
    { wch: 45 },
    { wch: 30 },
    { wch: 25 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Generate QR');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buffer);
}
