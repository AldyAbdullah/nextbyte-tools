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
 * Downscale image if it exceeds max dimension (e.g. 1920px) to prevent browser/RAM crashes on mobile
 * and ensure blazing-fast inference speeds.
 */
async function optimizeImageForProcessing(
  fileOrBlob: File | Blob,
  maxDimension: number = 1920
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
 * Remove image background locally in browser using @imgly/background-removal (Quantized ISNet model)
 */
export async function removeImageBackground(
  imageSource: File | Blob,
  onProgress?: (progress: ProcessProgress) => void
): Promise<Blob> {
  // 1. Optimize input size if image is extraordinarily large
  onProgress?.({ stage: 'Menyiapkan gambar...', percent: 5 });
  const optimizedBlob = await optimizeImageForProcessing(imageSource, 1920);

  // 2. Dynamically import library to prevent SSR conflicts
  onProgress?.({ stage: 'Inisialisasi modul AI...', percent: 10 });
  const { removeBackground } = await import('@imgly/background-removal');

  // 3. Track progress with accurate real-time megabytes & percentage
  const handleLibProgress = (key: string, current: number, total: number) => {
    let stage = 'Memproses pemisahan background...';
    let percent = 20;
    let details: string | undefined = undefined;

    if (key.startsWith('fetch:')) {
      const resourceName = key.replace('fetch:', '');
      const currentMb = (current / (1024 * 1024)).toFixed(1);
      const totalMb = total > 0 ? (total / (1024 * 1024)).toFixed(1) : '?';
      const ratio = total > 0 ? current / total : 0;

      if (resourceName.includes('wasm') || resourceName.includes('onnxruntime')) {
        stage = 'Mengunduh Mesin WebAssembly AI...';
        percent = Math.min(10 + Math.round(ratio * 20), 30);
        details = `${currentMb} MB / ${totalMb} MB`;
      } else if (resourceName.includes('model') || resourceName.includes('isnet')) {
        stage = 'Mengunduh Model AI ISNet (~44 MB)...';
        percent = Math.min(30 + Math.round(ratio * 45), 75);
        details = `${currentMb} MB / ${totalMb} MB`;
      } else {
        stage = 'Memuat modul AI...';
        percent = Math.min(10 + Math.round(ratio * 60), 70);
        details = `${currentMb} MB / ${totalMb} MB`;
      }
    } else if (key === 'compute:decode') {
      stage = 'Mendekode gambar...';
      percent = 78;
    } else if (key === 'compute:inference') {
      stage = 'AI sedang membedakan objek & rambut...';
      percent = 85;
    } else if (key === 'compute:mask') {
      stage = 'Menyusun mask transparansi halus...';
      percent = 92;
    } else if (key.startsWith('compute:encode')) {
      stage = 'Mengekspor PNG transparan...';
      percent = 97;
    }

    onProgress?.({ stage, percent, details });
  };

  try {
    // We use isnet_quint8 (44.3 MB instead of 88.1 MB) for 2x faster loading and 50% less RAM
    const resultBlob = await removeBackground(optimizedBlob, {
      model: 'isnet_quint8',
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
    console.warn('Initial inference attempt notice, evaluating fallback:', err);
    // If WebGPU failed or threw, fallback cleanly to CPU
    onProgress?.({ stage: 'Memproses dengan mesin CPU WebAssembly...', percent: 40 });
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
