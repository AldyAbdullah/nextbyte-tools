import JSZip from 'jszip';
import { SharpenSettings, SharpenImageItem } from '@/types/imageSharpener';

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
      reject(new Error('Gagal membaca gambar. Pastikan file valid dan tidak rusak.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Fast separable 1D horizontal box blur pass
 */
function boxBlurHorizontal(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const windowSize = radius * 2 + 1;
  const invSize = 1 / windowSize;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    for (let i = -radius; i <= radius; i++) {
      const col = Math.min(Math.max(i, 0), width - 1);
      const idx = rowOffset + col * 4;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
    }

    // Sliding window
    for (let x = 0; x < width; x++) {
      const dstIdx = rowOffset + x * 4;
      dst[dstIdx] = Math.round(sumR * invSize);
      dst[dstIdx + 1] = Math.round(sumG * invSize);
      dst[dstIdx + 2] = Math.round(sumB * invSize);
      dst[dstIdx + 3] = src[dstIdx + 3]; // Preserve alpha

      // Slide window
      const leftCol = Math.max(x - radius, 0);
      const rightCol = Math.min(x + radius + 1, width - 1);

      const leftIdx = rowOffset + leftCol * 4;
      const rightIdx = rowOffset + rightCol * 4;

      sumR += src[rightIdx] - src[leftIdx];
      sumG += src[rightIdx + 1] - src[leftIdx + 1];
      sumB += src[rightIdx + 2] - src[leftIdx + 2];
    }
  }
}

/**
 * Fast separable 1D vertical box blur pass
 */
function boxBlurVertical(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const windowSize = radius * 2 + 1;
  const invSize = 1 / windowSize;

  for (let x = 0; x < width; x++) {
    const colOffset = x * 4;

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    for (let i = -radius; i <= radius; i++) {
      const row = Math.min(Math.max(i, 0), height - 1);
      const idx = row * width * 4 + colOffset;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
    }

    for (let y = 0; y < height; y++) {
      const dstIdx = y * width * 4 + colOffset;
      dst[dstIdx] = Math.round(sumR * invSize);
      dst[dstIdx + 1] = Math.round(sumG * invSize);
      dst[dstIdx + 2] = Math.round(sumB * invSize);
      dst[dstIdx + 3] = src[dstIdx + 3];

      const topRow = Math.max(y - radius, 0);
      const bottomRow = Math.min(y + radius + 1, height - 1);

      const topIdx = topRow * width * 4 + colOffset;
      const bottomIdx = bottomRow * width * 4 + colOffset;

      sumR += src[bottomIdx] - src[topIdx];
      sumG += src[bottomIdx + 1] - src[topIdx + 1];
      sumB += src[bottomIdx + 2] - src[topIdx + 2];
    }
  }
}

/**
 * Apply 2D fast box blur
 */
function fastBoxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const temp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);
  boxBlurHorizontal(data, temp, width, height, radius);
  boxBlurVertical(temp, out, width, height, radius);
  return out;
}

/**
 * Apply Unsharp Mask & Clarity Enhancer on ImageData
 */
export function enhanceImageData(
  imageData: ImageData,
  settings: SharpenSettings
): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const length = data.length;

  // 1. Calculate Unsharp Mask blur
  const sharpenRadius = Math.max(1, Math.min(5, Math.round(settings.radius)));
  const blurredData = fastBoxBlur(data, width, height, sharpenRadius);

  // 2. Clarity blur (wide radius for midtone local micro-contrast)
  let clarityBlurredData: Uint8ClampedArray | null = null;
  if (settings.clarity > 0) {
    const clarityRadius = Math.max(8, Math.min(24, Math.round(width / 120)));
    clarityBlurredData = fastBoxBlur(data, width, height, clarityRadius);
  }

  const sharpenStrength = (settings.amount / 100) * 1.5; // Scale strength
  const threshold = settings.threshold;
  const clarityStrength = (settings.clarity / 100) * 0.8;

  // Precompute contrast & brightness factors
  const contrastFactor = settings.contrast !== 0
    ? (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
    : 1;
  const brightness = settings.brightness;

  for (let i = 0; i < length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const br = blurredData[i];
    const bg = blurredData[i + 1];
    const bb = blurredData[i + 2];

    // High frequency difference
    const diffR = r - br;
    const diffG = g - bg;
    const diffB = b - bb;

    // Check threshold (avoid amplifying flat surfaces / sensor noise)
    if (Math.abs(diffR) >= threshold) {
      r = r + diffR * sharpenStrength;
    }
    if (Math.abs(diffG) >= threshold) {
      g = g + diffG * sharpenStrength;
    }
    if (Math.abs(diffB) >= threshold) {
      b = b + diffB * sharpenStrength;
    }

    // Apply Clarity (local contrast)
    if (clarityBlurredData && clarityStrength > 0) {
      const crDiff = r - clarityBlurredData[i];
      const cgDiff = g - clarityBlurredData[i + 1];
      const cbDiff = b - clarityBlurredData[i + 2];

      r = r + crDiff * clarityStrength;
      g = g + cgDiff * clarityStrength;
      b = b + cbDiff * clarityStrength;
    }

    // Apply Contrast & Brightness if adjusted
    if (settings.contrast !== 0 || brightness !== 0) {
      r = contrastFactor * (r - 128) + 128 + brightness;
      g = contrastFactor * (g - 128) + 128 + brightness;
      b = contrastFactor * (b - 128) + 128 + brightness;
    }

    // Clamp 0..255
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

/**
 * Process a single image file with sharpening settings
 */
export async function processImageSharpening(
  file: File,
  settings: SharpenSettings
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImageElement(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  // Determine export MIME type
  let targetMime = file.type || 'image/jpeg';
  if (settings.format === 'image/webp') targetMime = 'image/webp';
  else if (settings.format === 'image/jpeg') targetMime = 'image/jpeg';
  else if (settings.format === 'image/png') targetMime = 'image/png';

  // Draw white background if converting to JPEG to prevent black transparent areas
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Extract pixel data and enhance
  const imageData = ctx.getImageData(0, 0, width, height);
  enhanceImageData(imageData, settings);
  ctx.putImageData(imageData, 0, 0);

  // Convert to Blob
  const quality = targetMime === 'image/png' ? undefined : (settings.quality || 0.95);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal menghasilkan blob gambar yang dipertajam.'));
      },
      targetMime,
      quality
    );
  });

  return { blob, width, height };
}

/**
 * Generate a ZIP containing all processed images
 */
export async function createSharpenedZip(items: SharpenImageItem[]): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('nextbyte-sharpened-images');

  for (const item of items) {
    if (item.processedBlob && folder) {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      let ext = 'jpg';
      if (item.processedBlob.type === 'image/png') ext = 'png';
      else if (item.processedBlob.type === 'image/webp') ext = 'webp';

      const fileName = `${baseName}-sharpened.${ext}`;
      folder.file(fileName, item.processedBlob);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
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
