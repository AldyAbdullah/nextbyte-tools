export interface FileReceiverResult {
  blob?: Blob;
  url?: string;
  name: string;
  size: number;
}

export interface FileReceiverHandle {
  writeChunk: (chunk: ArrayBuffer | Uint8Array) => void;
  finish: () => FileReceiverResult;
  cancel: () => void;
}

/**
 * Creates a synchronous storage handle for incoming files.
 * Collects incoming binary chunks in memory and generates an accessible Blob URL.
 */
export function createFileReceiverHandle(
  fileName: string,
  fileType: string
): FileReceiverHandle {
  const chunks: BlobPart[] = [];
  let totalBytes = 0;

  return {
    writeChunk: (chunk: ArrayBuffer | Uint8Array) => {
      chunks.push(chunk as BlobPart);
      totalBytes += chunk.byteLength;
    },
    finish: () => {
      const mime = fileType || 'application/octet-stream';
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);

      return {
        name: fileName,
        size: totalBytes,
        blob,
        url,
      };
    },
    cancel: () => {
      chunks.length = 0;
    },
  };
}
