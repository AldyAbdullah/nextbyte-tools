import {
  ProcessProgress,
  BackgroundCompositeOptions,
} from '@/types/backgroundRemover';

/**
 * Helper to get image natural dimensions
 */
export function getImageDimensions(fileOrBlob: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca dimensi gambar.'));
    };
    img.src = url;
  });
}

/**
 * Downscale image if it exceeds max dimension (e.g. 2560px) to prevent browser/RAM crashes on mobile
 */
async function optimizeImageForProcessing(
  fileOrBlob: File | Blob,
  maxDimension: number = 2560
): Promise<Blob> {
  const { width, height } = await getImageDimensions(fileOrBlob);
  if (width <= maxDimension && height <= maxDimension) {
    return fileOrBlob;
  }

  // Calculate scaled dimensions
  const scale = Math.min(maxDimension / width, maxDimension / height);
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(fileOrBlob);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else resolve(fileOrBlob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal mengoptimasi gambar.'));
    };
    img.src = url;
  });
}

/**
 * Remove image background locally in browser using @imgly/background-removal (ISNet model)
 */
export async function removeImageBackground(
  imageSource: File | Blob,
  onProgress?: (progress: ProcessProgress) => void
): Promise<Blob> {
  // 1. Optimize input size if image is extraordinarily large
  onProgress?.({ stage: 'Menyiapkan gambar...', percent: 5 });
  const optimizedBlob = await optimizeImageForProcessing(imageSource, 2560);

  // 2. Dynamically import library to prevent SSR conflicts
  onProgress?.({ stage: 'Memuat modul AI WebAssembly...', percent: 15 });
  const { removeBackground } = await import('@imgly/background-removal');

  // 3. Track progress smoothly
  let currentEstimatedPercent = 20;

  const handleLibProgress = (key: string, current: number, total: number) => {
    let stage = 'Memproses pemisahan background...';
    const progressRatio = total > 0 ? current / total : 0;

    if (key.includes('fetch:wasm') || key.includes('fetch:model')) {
      stage = 'Mengunduh Model AI ISNet (~25MB)...';
      currentEstimatedPercent = Math.min(20 + Math.round(progressRatio * 40), 60);
    } else if (key.includes('compute') || key.includes('inference')) {
      stage = 'Menganalisis objek, tepian, dan rambut dengan AI...';
      currentEstimatedPercent = Math.min(60 + Math.round(progressRatio * 30), 90);
    } else if (key.includes('encode')) {
      stage = 'Menyusun hasil transparansi PNG...';
      currentEstimatedPercent = 95;
    }

    onProgress?.({ stage, percent: currentEstimatedPercent });
  };

  try {
    const resultBlob = await removeBackground(optimizedBlob, {
      model: 'isnet_fp16',
      device: 'gpu',
      proxyToWorker: true,
      progress: handleLibProgress,
      output: {
        format: 'image/png',
        quality: 1.0,
      },
    });

    onProgress?.({ stage: 'Selesai!', percent: 100 });
    return resultBlob;
  } catch (err: unknown) {
    console.error('Background removal failed:', err);
    // If WebGPU failed, fallback to CPU
    const errorMessage = err instanceof Error ? err.message : '';
    if (errorMessage.includes('gpu') || errorMessage.includes('WebGPU')) {
      onProgress?.({ stage: 'WebGPU gagal, beralih ke CPU fallback...', percent: 30 });
      const fallbackBlob = await removeBackground(optimizedBlob, {
        model: 'isnet_quint8',
        device: 'cpu',
        proxyToWorker: true,
        progress: handleLibProgress,
        output: {
          format: 'image/png',
        },
      });
      onProgress?.({ stage: 'Selesai!', percent: 100 });
      return fallbackBlob;
    }
    throw err;
  }
}

/**
 * Composite transparent foreground with new background color or image
 */
export async function compositeImageWithBackground(
  foregroundBlob: Blob,
  options: BackgroundCompositeOptions
): Promise<Blob> {
  if (options.mode === 'transparent') {
    return foregroundBlob;
  }

  const { width, height } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia.');
  }

  // 1. Draw Background
  if (options.mode === 'color') {
    ctx.fillStyle = options.color || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else if (options.mode === 'image' && options.bgImageUrl) {
    // Draw background image with object-fit: cover math
    await new Promise<void>((resolve, reject) => {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        const bgW = bgImg.naturalWidth;
        const bgH = bgImg.naturalHeight;
        const hRatio = width / bgW;
        const vRatio = height / bgH;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (width - bgW * ratio) / 2;
        const centerShiftY = (height - bgH * ratio) / 2;

        ctx.drawImage(bgImg, 0, 0, bgW, bgH, centerShiftX, centerShiftY, bgW * ratio, bgH * ratio);
        resolve();
      };
      bgImg.onerror = () => reject(new Error('Gagal memuat gambar latar belakang.'));
      bgImg.src = options.bgImageUrl!;
    });
  }

  // 2. Draw Foreground Transparent Object
  await new Promise<void>((resolve, reject) => {
    const fgUrl = URL.createObjectURL(foregroundBlob);
    const fgImg = new Image();
    fgImg.onload = () => {
      ctx.drawImage(fgImg, 0, 0, width, height);
      URL.revokeObjectURL(fgUrl);
      resolve();
    };
    fgImg.onerror = () => {
      URL.revokeObjectURL(fgUrl);
      reject(new Error('Gagal menggambar objek transparan.'));
    };
    fgImg.src = fgUrl;
  });

  // 3. Export to PNG Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal mengekspor gambar hasil.'));
    }, 'image/png');
  });
}
