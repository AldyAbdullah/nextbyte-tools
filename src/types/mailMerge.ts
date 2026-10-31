export interface MailMergeTemplateInfo {
  file: File;
  name: string;
  size: number;
  detectedVariables: string[];
  imageVariables: string[];
  rawTextPreview: string;
}

export interface RecipientRow {
  rowIndex: number; // Index baris Excel (misal baris 2, 3...)
  raw: Record<string, string>;
  outputFileName: string;
  isValid: boolean;
  missingVars: string[];
  missingImages: string[];
}

export interface AutoNumberConfig {
  enabled: boolean;
  variableName: string; // Misal: "nomor_surat" atau "no"
  prefix: string; // Misal: "" atau "SRT-"
  suffix: string; // Misal: "/HRD-NB/X/2026"
  startNumber: number; // Misal: 1
  padding: number; // Misal: 3 -> "001"
}

export interface ImageDimensionConfig {
  widthCm: number; // Misal: 3.0 cm
  heightCm: number; // Misal: 4.0 cm
  missingAction: 'blank' | 'placeholder_text'; // Jika foto penerima tidak ada
}

export interface UploadedPhoto {
  file: File;
  name: string;
  cleanName: string; // e.g. "andi" tanpa ekstensi untuk fuzzy matching
  url: string;
  size: number;
  type: string;
}

export interface GenerationProgress {
  isGenerating: boolean;
  current: number;
  total: number;
  percent: number;
  currentName: string;
}

export interface GeneratedDocResult {
  rowIndex: number;
  recipientName: string;
  fileName: string;
  blob?: Blob;
  size?: number;
  status: 'success' | 'failed';
  error?: string;
}
