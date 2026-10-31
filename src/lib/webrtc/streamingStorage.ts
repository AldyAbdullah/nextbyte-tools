import { supportsFileSystemAccess } from './deviceDetection';

export interface FileReceiverResult {
  blob?: Blob;
  url?: string;
  name: string;
  size: number;
}

export interface FileReceiverHandle {
  writeChunk: (chunk: ArrayBuffer) => Promise<void>;
  finish: () => Promise<FileReceiverResult>;
  cancel: () => Promise<void>;
}

/**
 * Creates a storage handle for an incoming file.
 * Automatically chooses between direct disk streaming (via File System Access API)
 * or buffered blob download fallback.
 */
export async function createFileReceiverHandle(
  fileName: string,
  fileType: string,
  preferredMode: 'auto' | 'stream-disk' | 'memory-blob' = 'auto'
): Promise<FileReceiverHandle> {
  const canStream = supportsFileSystemAccess() && preferredMode !== 'memory-blob';

  if (canStream) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const picker = (window as any).showSaveFilePicker;
      if (typeof picker === 'function') {
        const fileHandle = await picker({
          suggestedName: fileName,
        });
        const writable = await fileHandle.createWritable();
        let bytesWritten = 0;

        return {
          writeChunk: async (chunk: ArrayBuffer) => {
            await writable.write(chunk);
            bytesWritten += chunk.byteLength;
          },
          finish: async () => {
            await writable.close();
            return {
              name: fileName,
              size: bytesWritten,
            };
          },
          cancel: async () => {
            try {
              await writable.abort();
            } catch {
              // ignore
            }
          },
        };
      }
    } catch (err: unknown) {
      // User cancelled save file picker dialog or browser blocked it -> fallback to memory buffer
      console.warn('File picker stream unavailable, falling back to memory download:', err);
    }
  }

  // Fallback: Buffered in-memory blob assembly & auto-download
  const chunks: ArrayBuffer[] = [];
  let totalBytes = 0;

  return {
    writeChunk: async (chunk: ArrayBuffer) => {
      chunks.push(chunk);
      totalBytes += chunk.byteLength;
    },
    finish: async () => {
      const blob = new Blob(chunks, { type: fileType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      // Attempt automatic download trigger
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.warn('Auto-click download prevented by browser:', e);
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
