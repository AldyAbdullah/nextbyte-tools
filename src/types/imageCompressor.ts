export type CompressionMode = 'quality' | 'target-size';
export type OutputFormat = 'original' | 'image/webp' | 'image/jpeg' | 'image/png';
export type ResizeMode = 'none' | 'scale' | 'dimensions';

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number;         // 1 - 100
  targetSizeKb: number;    // e.g. 200 KB
  format: OutputFormat;
  resizeMode: ResizeMode;
  scalePercent: number;    // 25, 50, 75, 100
  maxWidth: number;        // e.g. 1920
  maxHeight: number;       // e.g. 1080
  applySharpen: boolean;   // Smart edge sharpening
}

export interface CompressedImageItem {
  id: string;
  name: string;
  originalFile: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  originalFormat: string;
  compressedBlob: Blob | null;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  compressedUrl: string | null;
  compressedFormat: string;
  reductionPercent: number;
  status: 'idle' | 'compressing' | 'done' | 'error';
  error?: string;
}
