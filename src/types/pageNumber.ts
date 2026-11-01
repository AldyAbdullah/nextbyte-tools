export type PageNumberPosition = 'header' | 'footer';
export type PageNumberAlignment = 'left' | 'center' | 'right';
export type PageNumberFormat = 'decimal' | 'lowerRoman' | 'upperRoman' | 'none';
export type PageNumberTextStyle = 'number-only' | 'page-x' | 'x-of-y' | 'x-slash-y';
export type PresetType = 'academic' | 'standard' | 'custom';

export interface SectionNumberingConfig {
  sectionIndex: number;
  name: string;
  enabled: boolean;
  differentFirstPage: boolean; // Menghilangkan nomor pada sampul / halaman pertama section
  format: PageNumberFormat; // decimal, lowerRoman, upperRoman, none
  startNumber: number; // Mulai nomor: 1
  restartNumbering: boolean; // Reset ke startNumber atau lanjutkan nomor sebelumnya
  position: PageNumberPosition; // header / footer
  alignment: PageNumberAlignment; // left, center, right
  textStyle: PageNumberTextStyle; // 1, Halaman 1, 1 dari 10, 1 / 10
}

export interface SectionInfo {
  index: number;
  hasHeader: boolean;
  hasFooter: boolean;
  differentFirstPage: boolean;
  isLandscape: boolean;
  pgNumType?: {
    fmt?: string;
    start?: number;
  };
}

export interface DocxInspectionResult {
  file: File;
  fileName: string;
  fileSize: number;
  totalSections: number;
  sections: SectionInfo[];
  hasExistingHeader: boolean;
  hasExistingFooter: boolean;
  detectedPageBreaks: number;
  detectedParagraphs: number;
  previewHeadings: string[];
}

export interface PageNumberJobConfig {
  preset: PresetType; // 'academic' | 'standard' | 'custom'
  // Pengaturan Global / Standard
  position: PageNumberPosition;
  alignment: PageNumberAlignment;
  format: PageNumberFormat;
  textStyle: PageNumberTextStyle;
  startNumber: number;
  differentFirstPage: boolean; // Hilangkan nomor di halaman sampul
  // Pengaturan Khusus Preset Akademik (Skripsi / Tesis)
  academic: {
    coverNoNumber: boolean; // Sampul tanpa nomor
    frontMatterFormat: 'lowerRoman'; // Romawi kecil (i, ii, iii)
    frontMatterPosition: 'footer' | 'header';
    frontMatterAlignment: 'center' | 'left' | 'right';
    bodyFormat: 'decimal'; // Arab (1, 2, 3)
    bodyPosition: 'footer' | 'header';
    bodyAlignment: 'right' | 'center' | 'left';
    bodyStartNumber: number; // Mulai dari 1
    insertSectionBreakIfMissing: boolean; // Jika dokumen belum punya section break
    splitMode: 'auto' | 'heading' | 'page'; // Mode pemisahan section otomatis
    splitPageNumber: number; // Halaman awal bab isi jika hanya 1 section
    selectedHeading?: string; // Judul heading yang dipilih untuk awal Bab Isi
  };
  // Pengaturan Khusus Kustom Format (Per Section)
  customSplit: {
    enabled: boolean;
    method: 'page' | 'heading' | 'auto';
    targetPage: number;
    targetHeading?: string;
  };
  customSections: SectionNumberingConfig[];
}
