// Shared Client-Side PDF.js Loader for NextByte Tools

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfJsPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  if (!pdfJsPromise) {
    pdfJsPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('pdfjs-script');
      if (existing) {
        existing.addEventListener('load', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resolve((window as any).pdfjsLib);
        });
        return;
      }
      const script = document.createElement('script');
      script.id = 'pdfjs-script';
      script.src = '/pdf.min.js';
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }
        resolve(pdfjs);
      };
      script.onerror = () => {
        pdfJsPromise = null;
        reject(new Error('Gagal memuat PDF.js'));
      };
      document.head.appendChild(script);
    });
  }

  return pdfJsPromise;
}
