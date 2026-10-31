export interface FileReceiverResult {
  blob?: Blob;
  url?: string;
  name: string;
  size: number;
}

export interface FileReceiverHandle {
  writeChunk: (chunk: ArrayBuffer | Uint8Array) => Promise<void>;
  finish: () => Promise<FileReceiverResult>;
  cancel: () => Promise<void>;
}

/**
 * Creates a reliable storage handle for incoming files.
 * Collects incoming binary chunks into memory and generates an accessible Blob URL.
 */
export async function createFileReceiverHandle(
  fileName: string,
  fileType: string
): Promise<FileReceiverHandle> {
  const chunks: BlobPart[] = [];
  let totalBytes = 0;

  return {
    writeChunk: async (chunk: ArrayBuffer | Uint8Array) => {
      chunks.push(chunk as BlobPart);
      totalBytes += chunk.byteLength;
    },
    finish: async () => {
      const mime = fileType || 'application/octet-stream';
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);

      // Attempt automatic download trigger (may be blocked by browser popup blocker)
      try {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 1000);
      } catch (e) {
        console.warn('Auto-click download prevented by browser policy:', e);
      }

      return {
        name: fileName,
        size: totalBytes,
        blob,
        url,
      };
    },
    cancel: async () => {
      chunks.length = 0;
    },
  };
}
