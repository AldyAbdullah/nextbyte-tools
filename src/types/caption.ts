export type DocxElementKind = 'image' | 'table';
export type CaptionPosition = 'above' | 'below';
export type CaptionNumberingMode = 'chapter' | 'consecutive';
export type CaptionAlignment = 'center' | 'left' | 'right';
export type ListOfPosition = 'after-toc' | 'before-chapters' | 'end-of-doc';

export interface DocxCaptionItem {
  id: string; // Unique ID, e.g. "img-0", "tbl-1"
  kind: DocxElementKind;
  rawIndex: number;
  chapterNumber: number; // 1, 2, 3...
  chapterTitle: string; // "BAB I PENDAHULUAN"
  itemNumber: number; // Index within chapter (1, 2, 3...)
  fullNumber: string; // "1.1", "1.2", "2.1" or "1", "2"
  customTitle: string; // "Arsitektur Sistem"
  enabled: boolean; // Whether to add caption
  position: CaptionPosition; // 'below' for images, 'above' for tables
  existingCaption?: string; // Text of detected existing caption if any
  hasExistingCaption: boolean;
  thumbnailDataUrl?: string; // Base64 data URL for images
  tableSummary?: {
    rows: number;
    cols: number;
    sampleHeader: string;
  };
}

export interface DocxCaptionInspectionResult {
  file: File;
  fileName: string;
  fileSize: number;
  totalImages: number;
  totalTables: number;
  totalHeadings: number;
  chapters: { number: number; title: string }[];
  items: DocxCaptionItem[];
}

export interface CaptionJobConfig {
  imagePrefix: string; // "Gambar"
  tablePrefix: string; // "Tabel"
  separator: string; // "." or "-"
  numberingMode: CaptionNumberingMode; // 'chapter' | 'consecutive'
  imagePosition: CaptionPosition; // 'below' | 'above'
  tablePosition: CaptionPosition; // 'above' | 'below'
  alignment: CaptionAlignment; // 'center' | 'left' | 'right'
  replaceExistingCaptions: boolean; // Overwrite detected captions or keep
  // Daftar Gambar & Daftar Tabel
  includeListOfFigures: boolean;
  listOfFiguresTitle: string; // "DAFTAR GAMBAR"
  includeListOfTables: boolean;
  listOfTablesTitle: string; // "DAFTAR TABEL"
  listOfPosition: ListOfPosition;
  // Per-item configuration overrides
  items: DocxCaptionItem[];
}
