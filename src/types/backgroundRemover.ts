export type BgMode = 'transparent' | 'color' | 'image';

export type RemovalStatus = 'idle' | 'loading-model' | 'processing' | 'done' | 'error';

export interface ProcessProgress {
  stage: string;
  percent: number;
  details?: string;
}

export interface ProcessedImageResult {
  originalFile: File;
  originalUrl: string;
  transparentBlob: Blob;
  transparentUrl: string;
  width: number;
  height: number;
}

export interface BackgroundCompositeOptions {
  mode: BgMode;
  color?: string; // hex color e.g. '#ffffff'
  bgImageUrl?: string;
  width: number;
  height: number;
}
