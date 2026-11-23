import { createWorker, Worker } from 'tesseract.js';

export interface OcrLineResult {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
  fontsize: number;
}

let cachedWorker: Worker | null = null;
let currentWorkerLang: string = '';

/**
 * Mendapatkan atau menginisialisasi Tesseract Web Worker di browser (Client-Side)
 * Menggunakan model bahasa lokal dari /tessdata/ untuk kecepatan maksimal dan offline capability.
 */
export async function getClientOcrWorker(
  lang: string = 'ind+eng',
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  // Jika worker sudah aktif dengan bahasa yang sama, gunakan kembali (Reuse untuk kecepatan 1.5 detik per halaman!)
  if (cachedWorker && currentWorkerLang === lang) {
    return cachedWorker;
  }

  // Jika bahasa berbeda, hentikan worker lama
  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch {}
    cachedWorker = null;
  }

  const langs = lang.includes('+') ? lang.split('+') : [lang];

  // Konfigurasi opsi worker client-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerOptions: Record<string, any> = {
    logger: (m: { status?: string; progress?: number }) => {
      if (onProgress && typeof m.progress === 'number') {
        const pct = Math.round(m.progress * 100);
        if (m.status === 'recognizing text') {
          onProgress(pct, `Mengenali teks (${pct}%)...`);
        } else if (m.status === 'loading language traineddata') {
          onProgress(Math.round(pct * 0.6), 'Memuat kamus bahasa...');
        } else if (m.status === 'initializing api') {
          onProgress(75, 'Menginisialisasi modul OCR...');
        } else if (m.status === 'loading tesseract core') {
          onProgress(20, 'Memuat mesin WebAssembly...');
        }
      }
    },
  };

  // Prioritaskan file kamus lokal di /tessdata/ dari origin web sendiri
  if (typeof window !== 'undefined') {
    workerOptions.langPath = `${window.location.origin}/tessdata`;
    workerOptions.gzip = false;
  }

  try {
    const worker = await createWorker(langs, 1, workerOptions);
    cachedWorker = worker;
    currentWorkerLang = lang;
    return worker;
  } catch (err) {
    console.warn(`Inisialisasi OCR lokal "${lang}" gagal, mencoba fallback CDN/eng:`, err);

    // Fallback: hapus langPath kustom agar menggunakan CDN bawaan tesseract.js
    delete workerOptions.langPath;
    delete workerOptions.gzip;

    try {
      const fallbackWorker = await createWorker('eng', 1, workerOptions);
      cachedWorker = fallbackWorker;
      currentWorkerLang = 'eng';
      return fallbackWorker;
    } catch (fallbackErr) {
      console.error('Semua inisialisasi OCR client-side gagal:', fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Menjalankan OCR berkecepatan tinggi langsung di browser tanpa ketergantungan server
 */
export async function runClientOcr(
  imageSource: HTMLCanvasElement | Blob | ImageData | string,
  scaleX: number,
  scaleY: number,
  onProgress?: (progress: number, status: string) => void,
  lang: string = 'ind+eng'
): Promise<OcrLineResult[]> {
  const worker = await getClientOcrWorker(lang, onProgress);

  if (onProgress) {
    onProgress(10, 'Mempersiapkan gambar untuk pemindaian...');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = await worker.recognize(imageSource as any, {}, { blocks: true });

  const lines: OcrLineResult[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (ret.data as any).blocks || [];

  for (const block of blocks) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const text = line.text?.trim();
        if (text) {
          const x0 = Math.round(line.bbox.x0 / scaleX);
          const y0 = Math.round(line.bbox.y0 / scaleY);
          const x1 = Math.round(line.bbox.x1 / scaleX);
          const y1 = Math.round(line.bbox.y1 / scaleY);
          const fontsize = Math.max(9, Math.round((y1 - y0) * 0.82));

          lines.push({
            x0,
            y0,
            x1,
            y1,
            text,
            fontsize,
          });
        }
      }
    }
  }

  // Fallback ke individual words jika blok kalimat tidak terstruktur rapi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (lines.length === 0 && Array.isArray((ret.data as any).words)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const word of (ret.data as any).words) {
      const text = word.text?.trim();
      if (text && word.bbox) {
        const x0 = Math.round(word.bbox.x0 / scaleX);
        const y0 = Math.round(word.bbox.y0 / scaleY);
        const x1 = Math.round(word.bbox.x1 / scaleX);
        const y1 = Math.round(word.bbox.y1 / scaleY);
        const fontsize = Math.max(9, Math.round((y1 - y0) * 0.82));

        lines.push({
          x0,
          y0,
          x1,
          y1,
          text,
          fontsize,
        });
      }
    }
  }

  return lines;
}

/**
 * Membersihkan memori worker saat pengguna meninggalkan halaman
 */
export async function terminateClientOcrWorker(): Promise<void> {
  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch {}
    cachedWorker = null;
    currentWorkerLang = '';
  }
}
