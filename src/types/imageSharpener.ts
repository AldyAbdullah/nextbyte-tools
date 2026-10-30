export type SharpenPreset = 'subtle' | 'balanced' | 'ultra' | 'document' | 'custom';

export type OutputFormat = 'original' | 'image/png' | 'image/jpeg' | 'image/webp';

export interface SharpenSettings {
  preset: SharpenPreset;
  amount: number;       // 0 to 100 (strength of edge sharpening)
  radius: number;       // 1 to 5 (edge width)
  threshold: number;    // 0 to 30 (noise protection threshold)
  clarity: number;      // 0 to 100 (local micro-contrast)
  contrast: number;     // -50 to +50
  brightness: number;   // -50 to +50
  format: OutputFormat;
  quality: number;      // 0.8 to 1.0 (for JPEG/WebP export)
}

export interface SharpenImageItem {
  id: string;
  name: string;
  originalFile: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  originalFormat: string;
  processedBlob: Blob | null;
  processedUrl: string | null;
  processedSize: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

export const SHARPEN_PRESETS: Record<Exclude<SharpenPreset, 'custom'>, {
  name: string;
  description: string;
  settings: Omit<SharpenSettings, 'preset' | 'format' | 'quality'>;
}> = {
  subtle: {
    name: 'Lembut / Natural',
    description: 'Cocok untuk potret orang, wajah, atau foto halus tanpa memunculkan bintik noise.',
    settings: {
      amount: 35,
      radius: 1,
      threshold: 6,
      clarity: 15,
      contrast: 5,
      brightness: 0,
    },
  },
  balanced: {
    name: 'Seimbang (Standar)',
    description: 'Optimasi terbaik untuk foto umum, produk, pemandangan, dan media sosial.',
    settings: {
      amount: 60,
      radius: 2,
      threshold: 3,
      clarity: 30,
      contrast: 8,
      brightness: 2,
    },
  },
  ultra: {
    name: 'Ekstra Tajam (Ultra Detail)',
    description: 'Ketajaman maksimal untuk arsitektur, lanskap alam, dan foto makro berdetail tinggi.',
    settings: {
      amount: 90,
      radius: 2,
      threshold: 1,
      clarity: 50,
      contrast: 12,
      brightness: 0,
    },
  },
  document: {
    name: 'Dokumen & Teks (KTP/Struk)',
    description: 'Khusus memperjelas huruf dan angka yang kabur pada foto KTP, dokumen, atau struk.',
    settings: {
      amount: 95,
      radius: 1,
      threshold: 8,
      clarity: 45,
      contrast: 20,
      brightness: 5,
    },
  },
};
