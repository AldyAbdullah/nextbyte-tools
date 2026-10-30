import JSZip from 'jszip';
import { CompressionSettings } from '@/types/imageCompressor';

/**
 * Format bytes to readable string (B, KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Load a File into HTMLImageElement
 */
export function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar. Pastikan file tidak rusak.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Calculate scaled dimensions
 */
export function calculateNewDimensions(
  origW: number,
  origH: number,
  settings: CompressionSettings
): { width: number; height: number } {
  let w = origW;
  let h = origH;

  // Scale percentage mode
  if (settings.resizeMode === 'scale' && settings.scalePercent < 100) {
    const factor = settings.scalePercent / 100;
    w = Math.round(w * factor);
    h = Math.round(h * factor);
  }

  // Max dimensions bounding box mode
  if (settings.resizeMode === 'dimensions') {
    if (settings.maxWidth > 0 && w > settings.maxWidth) {
      const ratio = settings.maxWidth / w;
      w = settings.maxWidth;
      h = Math.round(h * ratio);
    }
    if (settings.maxHeight > 0 && h > settings.maxHeight) {
      const ratio = settings.maxHeight / h;
      h = settings.maxHeight;
      w = Math.round(w * ratio);
    }
  }

  return {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  };
}

/**
 * Apply a subtle unsharp mask sharpening filter via Canvas 2D
 */
export function applySharpeningFilter(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);

    // Subtle 3x3 unsharp mask kernel:
    // [  0, -0.2,  0 ]
    // [ -0.2, 1.8, -0.2 ]
    // [  0, -0.2,  0 ]
    const weight = 0.2;
    const center = 1 + 4 * weight;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = copy[((y - 1) * width + x) * 4 + c];
          const bottom = copy[((y + 1) * width + x) * 4 + c];
          const left = copy[(y * width + (x - 1)) * 4 + c];
          const right = copy[(y * width + (x + 1)) * 4 + c];
          const curr = copy[idx + c];

          const val = curr * center - (top + bottom + left + right) * weight;
          data[idx + c] = Math.min(255, Math.max(0, val));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Sharpening filter skipped:', err);
  }
}

/**
 * Helper to convert canvas to Blob with quality parameter
 */
function canvasToBlobAsync(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengonversi gambar ke Blob.'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Determine the output MIME type
 */
export function resolveMimeType(originalFile: File, requestedFormat: string): string {
  if (requestedFormat !== 'original') {
    return requestedFormat;
  }
  const orig = originalFile.type.toLowerCase();
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(orig)) {
    return orig === 'image/jpg' ? 'image/jpeg' : orig;
  }
  return 'image/jpeg';
}

/**
 * Main compression worker function
 */
export async function compressSingleImage(
  file: File,
  settings: CompressionSettings
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}> {
  const img = await loadImageElement(file);
  const mimeType = resolveMimeType(file, settings.format);

  // 1. Initial dimensions
  let { width, height } = calculateNewDimensions(img.naturalWidth, img.naturalHeight, settings);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D Context tidak didukung oleh browser.');

  // Fill solid white background if exporting to JPEG to prevent black transparent areas
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw scaled image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Apply optional subtle sharpening
  if (settings.applySharpen) {
    applySharpeningFilter(ctx, width, height);
  }

  // Mode 1: Manual Quality Slider (1 - 100)
  if (settings.mode === 'quality') {
    const q = Math.max(0.05, Math.min(1, settings.quality / 100));
    const blob = await canvasToBlobAsync(canvas, mimeType, q);
    return { blob, width, height, mimeType };
  }

  // Mode 2: Target File Size (e.g. 200 KB) using binary search
  const targetBytes = settings.targetSizeKb * 1024;
  let minQ = 0.05;
  let maxQ = 0.95;
  let bestBlob: Blob | null = null;

  // 5 iterations binary search on quality
  for (let i = 0; i < 5; i++) {
    const midQ = (minQ + maxQ) / 2;
    const testBlob = await canvasToBlobAsync(canvas, mimeType, midQ);

    if (testBlob.size <= targetBytes) {
      bestBlob = testBlob;
      minQ = midQ; // Try to get higher quality that still fits
    } else {
      maxQ = midQ; // File still too big, lower quality
    }
  }

  // If even at minQ the file exceeds target size (common with huge 20MP photos),
  // progressively downscale canvas until it fits under the target!
  let currentBlob = bestBlob || (await canvasToBlobAsync(canvas, mimeType, 0.2));
  let scaleDownLoop = 0;

  while (currentBlob.size > targetBytes && scaleDownLoop < 4) {
    scaleDownLoop++;
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);

    canvas.width = width;
    canvas.height = height;
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    if (settings.applySharpen) {
      applySharpeningFilter(ctx, width, height);
    }

    currentBlob = await canvasToBlobAsync(canvas, mimeType, 0.4);
  }

  return {
    blob: currentBlob,
    width,
    height,
    mimeType,
  };
}

/**
 * Trigger browser file download
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a ZIP file containing all compressed images
 */
export async function createCompressedZip(
  items: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('compressed-images') || zip;

  items.forEach((item) => {
    folder.file(item.name, item.blob);
  });

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
