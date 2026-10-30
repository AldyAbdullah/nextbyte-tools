import { CompleteQrConfig, ExportResolution } from './qrcode';

export interface ColumnMappingConfig {
  nameColumn: string;
  contentMode: 'single' | 'multi' | 'template';
  singleContentColumn: string;
  selectedMultiColumns: string[];
  multiFormat: 'label-value' | 'value-only' | 'csv';
  customTemplate: string; // e.g. "Nama: {nama}\nJabatan: {jabatan}\nNo HP: {nomor_hp}"
  descriptionColumn: string;
  filenameColumn: string;
}

export interface BulkRowData {
  rowIndex: number; // 1-based index in Excel
  rawRow: Record<string, string>; // original key-value pairs
  id: string;
  name: string;
  content: string;
  description: string;
  filename: string;
  isValid: boolean;
  errors: string[];
}

export type BulkSubTextMode = 'row-name' | 'custom-text' | 'none';

export interface BulkDesignConfig {
  qrConfig: CompleteQrConfig;
  subTextMode: BulkSubTextMode;
  customText: string;
  includeDescription: boolean;
  resolution: ExportResolution;
}

export interface BulkGenerationProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  percentage: number;
  statusText: string;
  isGenerating: boolean;
  isCancelled: boolean;
  isComplete: boolean;
}

export interface BulkGeneratedItem {
  row: BulkRowData;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  filename: string;
  success: boolean;
  error?: string;
}

export interface PdfGridSettings {
  itemsPerPage: 4 | 6 | 9 | 12; // grid layout on A4
  includeName: boolean;
  includeDescription: boolean;
  marginMm: number;
}
