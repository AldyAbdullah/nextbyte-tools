import { FileTransferItem, TransferMetrics } from '@/types/nextbyteSend';
import { createFileReceiverHandle, FileReceiverHandle } from './streamingStorage';

export const CHUNK_SIZE = 64 * 1024; // 64 KiB
const BUFFER_HIGH_WATERMARK = 8 * 1024 * 1024; // 8 MB
const BUFFER_LOW_WATERMARK = 2 * 1024 * 1024; // 2 MB

export interface TransferProgressCallback {
  (metrics: TransferMetrics): void;
}

/**
 * Sender: Streams multiple files over RTCDataChannel with flow control and two-way ACK synchronization.
 */
export async function streamFilesOverDataChannel(
  dataChannel: RTCDataChannel,
  files: FileTransferItem[],
  onProgress: TransferProgressCallback,
  checkCancelled: () => boolean
): Promise<void> {
  dataChannel.binaryType = 'arraybuffer';
  dataChannel.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  let bytesSent = 0;
  let acknowledgedBytes = 0;
  const startTime = Date.now();
  let lastSpeedCheckTime = startTime;
  let lastSpeedCheckBytes = 0;
  let currentSpeedBps = 0;
  let isAllCompleteAcked = false;

  // Listen for receiver ACKs to keep progress strictly synchronized
  const handleAckMessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ack-progress' && typeof msg.bytesReceived === 'number') {
          acknowledgedBytes = Math.max(acknowledgedBytes, msg.bytesReceived);
        } else if (msg.type === 'ack-all-complete') {
          isAllCompleteAcked = true;
          acknowledgedBytes = totalBytes;
        }
      } catch {}
    }
  };

  dataChannel.addEventListener('message', handleAckMessage);

  try {
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      if (checkCancelled()) throw new Error('Transfer dibatalkan oleh pengguna.');

      const item = files[fileIndex];
      if (!item.file) continue;

      const file = item.file;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 1. Send file-start metadata message
      dataChannel.send(
        JSON.stringify({
          type: 'file-start',
          index: fileIndex,
          id: item.id,
          name: item.name,
          size: item.size,
          mimeType: item.type || 'application/octet-stream',
          totalChunks,
        })
      );

      let offset = 0;

      // 2. Stream file chunks sequentially
      while (offset < file.size) {
        if (checkCancelled()) throw new Error('Transfer dibatalkan oleh pengguna.');

        // Flow control: Wait if buffer is full
        if (dataChannel.bufferedAmount > BUFFER_HIGH_WATERMARK) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              dataChannel.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            dataChannel.addEventListener('bufferedamountlow', onLow);
          });
        }

        const end = Math.min(offset + CHUNK_SIZE, file.size);
        const slice = file.slice(offset, end);
        const buffer = await slice.arrayBuffer();

        dataChannel.send(buffer);

        offset = end;
        bytesSent += buffer.byteLength;

        // Calculate speed & ETA based on confirmed progress or OS buffer-adjusted bytes
        const now = Date.now();
        const timeDiffSec = (now - lastSpeedCheckTime) / 1000;
        if (timeDiffSec >= 0.25) {
          const effectiveTransferred = Math.max(
            acknowledgedBytes,
            bytesSent - (dataChannel.bufferedAmount || 0)
          );
          const bytesDiff = effectiveTransferred - lastSpeedCheckBytes;
          currentSpeedBps = timeDiffSec > 0 ? Math.max(0, bytesDiff / timeDiffSec) : 0;
          lastSpeedCheckTime = now;
          lastSpeedCheckBytes = effectiveTransferred;

          const remainingBytes = Math.max(0, totalBytes - effectiveTransferred);
          const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;
          // Cap sender progress at 99% until receiver confirms all complete!
          const rawPercent = totalBytes > 0 ? Math.round((effectiveTransferred / totalBytes) * 100) : 0;
          const progressPercent = Math.min(99, rawPercent);

          onProgress({
            bytesTransferred: effectiveTransferred,
            totalBytes,
            speedBps: currentSpeedBps,
            timeRemainingSec: eta,
            progressPercent,
            currentFileIndex: fileIndex + 1,
            totalFiles: files.length,
            currentFileName: item.name,
            elapsedSeconds: (now - startTime) / 1000,
          });
        }
      }

      // 3. Send file-end metadata message
      dataChannel.send(
        JSON.stringify({
          type: 'file-end',
          index: fileIndex,
          name: item.name,
        })
      );
    }

    // 4. Flow control drain: Wait for local OS buffer to completely transmit over network
    while (dataChannel.bufferedAmount > 0) {
      if (checkCancelled()) throw new Error('Transfer dibatalkan oleh pengguna.');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 100);
        const onLow = () => {
          clearTimeout(timer);
          dataChannel.removeEventListener('bufferedamountlow', onLow);
          resolve();
        };
        dataChannel.addEventListener('bufferedamountlow', onLow);
      });

      const effectiveTransferred = Math.max(
        acknowledgedBytes,
        bytesSent - (dataChannel.bufferedAmount || 0)
      );
      const rawPercent = totalBytes > 0 ? Math.round((effectiveTransferred / totalBytes) * 100) : 0;
      onProgress({
        bytesTransferred: effectiveTransferred,
        totalBytes,
        speedBps: currentSpeedBps,
        timeRemainingSec: 1,
        progressPercent: Math.min(99, rawPercent),
        currentFileIndex: files.length,
        totalFiles: files.length,
        currentFileName: 'Menyelesaikan pengiriman ke penerima...',
        elapsedSeconds: (Date.now() - startTime) / 1000,
      });
    }

    // 5. Send all files completed message
    dataChannel.send(JSON.stringify({ type: 'transfer-complete' }));

    // 6. Wait for Receiver's 'ack-all-complete' (with 35s safety fallback timeout)
    const drainWaitStart = Date.now();
    while (!isAllCompleteAcked && Date.now() - drainWaitStart < 35000) {
      if (checkCancelled()) break;
      if (dataChannel.readyState !== 'open') break;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Final progress update 100% confirmed
    const totalElapsed = (Date.now() - startTime) / 1000;
    onProgress({
      bytesTransferred: totalBytes,
      totalBytes,
      speedBps: totalElapsed > 0 ? totalBytes / totalElapsed : 0,
      timeRemainingSec: 0,
      progressPercent: 100,
      currentFileIndex: files.length,
      totalFiles: files.length,
      currentFileName: 'Semua berkas berhasil diterima',
      elapsedSeconds: totalElapsed,
    });
  } finally {
    dataChannel.removeEventListener('message', handleAckMessage);
  }
}

/**
 * Receiver: Listens on RTCDataChannel, writes chunks progressively, and emits ACKs to sender.
 */
export function setupDataChannelReceiver(
  dataChannel: RTCDataChannel,
  totalExpectedBytes: number,
  totalFiles: number,
  onProgress: TransferProgressCallback,
  onComplete: () => void,
  onError: (err: Error) => void
): { cancel: () => void } {
  dataChannel.binaryType = 'arraybuffer';

  let currentHandle: FileReceiverHandle | null = null;
  let bytesTransferred = 0;
  const startTime = Date.now();
  let lastSpeedCheckTime = startTime;
  let lastSpeedCheckBytes = 0;
  let currentSpeedBps = 0;
  let currentFileName = '';
  let currentFileIndex = 0;
  let isCancelled = false;

  const handleMessage = async (event: MessageEvent) => {
    if (isCancelled) return;

    // Control message (JSON)
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'file-start') {
          currentFileName = msg.name;
          currentFileIndex = msg.index + 1;
          currentHandle = await createFileReceiverHandle(msg.name, msg.mimeType);
        } else if (msg.type === 'file-end') {
          if (currentHandle) {
            await currentHandle.finish();
            currentHandle = null;
          }
          // Acknowledge file completion back to sender
          if (dataChannel.readyState === 'open') {
            try {
              dataChannel.send(JSON.stringify({ type: 'ack-file-complete', fileIndex: msg.index }));
            } catch {}
          }
        } else if (msg.type === 'transfer-complete') {
          if (currentHandle) {
            await currentHandle.finish();
            currentHandle = null;
          }
          // Acknowledge all files received & stored back to sender
          if (dataChannel.readyState === 'open') {
            try {
              dataChannel.send(JSON.stringify({ type: 'ack-all-complete' }));
            } catch {}
          }
          const totalElapsed = (Date.now() - startTime) / 1000;
          onProgress({
            bytesTransferred: totalExpectedBytes,
            totalBytes: totalExpectedBytes,
            speedBps: totalElapsed > 0 ? totalExpectedBytes / totalElapsed : 0,
            timeRemainingSec: 0,
            progressPercent: 100,
            currentFileIndex: totalFiles,
            totalFiles,
            currentFileName: 'Selesai',
            elapsedSeconds: totalElapsed,
          });
          onComplete();
        }
      } catch (err: unknown) {
        onError(err instanceof Error ? err : new Error('Gagal memproses pesan transfer.'));
      }
      return;
    }

    // Binary Chunk (ArrayBuffer)
    if (event.data instanceof ArrayBuffer && currentHandle) {
      try {
        await currentHandle.writeChunk(event.data);
        bytesTransferred += event.data.byteLength;

        const now = Date.now();
        const timeDiffSec = (now - lastSpeedCheckTime) / 1000;
        if (timeDiffSec >= 0.25) {
          const bytesDiff = bytesTransferred - lastSpeedCheckBytes;
          currentSpeedBps = bytesDiff / timeDiffSec;
          lastSpeedCheckTime = now;
          lastSpeedCheckBytes = bytesTransferred;

          // Send progress ACK back to sender
          if (dataChannel.readyState === 'open') {
            try {
              dataChannel.send(
                JSON.stringify({
                  type: 'ack-progress',
                  bytesReceived: bytesTransferred,
                  currentFileIndex,
                })
              );
            } catch {}
          }

          const remainingBytes = Math.max(0, totalExpectedBytes - bytesTransferred);
          const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;
          const progressPercent =
            totalExpectedBytes > 0 ? Math.round((bytesTransferred / totalExpectedBytes) * 100) : 0;

          onProgress({
            bytesTransferred,
            totalBytes: totalExpectedBytes,
            speedBps: currentSpeedBps,
            timeRemainingSec: eta,
            progressPercent: Math.min(100, progressPercent),
            currentFileIndex,
            totalFiles,
            currentFileName,
            elapsedSeconds: (now - startTime) / 1000,
          });
        }
      } catch (err: unknown) {
        onError(err instanceof Error ? err : new Error('Gagal menulis data berkas ke penyimpanan.'));
      }
    }
  };

  dataChannel.addEventListener('message', handleMessage);

  return {
    cancel: () => {
      isCancelled = true;
      dataChannel.removeEventListener('message', handleMessage);
      if (currentHandle) {
        currentHandle.cancel();
        currentHandle = null;
      }
    },
  };
}
