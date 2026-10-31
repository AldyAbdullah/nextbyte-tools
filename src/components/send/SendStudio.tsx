'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  FileTransferItem,
  TransferStatus,
  TransferMetrics,
  LocalPeer,
} from '@/types/nextbyteSend';
import {
  formatBytes,
  getDeviceInfo,
  getFriendlyDeviceName,
} from '@/lib/webrtc/deviceDetection';
import { LocalWifiRadar } from './LocalWifiRadar';
import { IncomingTransferModal } from './IncomingTransferModal';
import { TransferProgressCard } from './TransferProgressCard';
import { CameraScannerModal } from './CameraScannerModal';
import { createFileReceiverHandle, FileReceiverHandle } from '@/lib/webrtc/streamingStorage';
import { useToast } from '@/components/common/Toast';

export function SendStudio() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // 4-digit PIN belonging strictly to THIS device (never overwritten by another device's PIN)
  const [myPin, setMyPin] = useState<string>(() =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );

  // Target PIN if this device is connecting to another device (e.g. from URL ?pin= or scanner)
  const [connectedPin, setConnectedPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Local Peer identification
  const [myPeer, setMyPeer] = useState<LocalPeer | null>(null);
  const myPeerRef = useRef<LocalPeer | null>(null);
  const [nearbyPeers, setNearbyPeers] = useState<LocalPeer[]>([]);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  // Transfer states
  const [targetPeer, setTargetPeer] = useState<LocalPeer | null>(null);
  const [filesToSend, setFilesToSend] = useState<FileTransferItem[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<{
    senderId: string;
    senderName: string;
    files: Array<{ id: string; name: string; size: number; type: string }>;
    totalBytes: number;
  } | null>(null);

  const [status, setStatus] = useState<TransferStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // PeerJS and connection references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionsRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeConnRef = useRef<any>(null);
  const currentHandleRef = useRef<FileReceiverHandle | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const expectedTotalBytesRef = useRef<number>(0);
  const receiverBytesRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<TransferMetrics>({
    bytesTransferred: 0,
    totalBytes: 0,
    speedBps: 0,
    timeRemainingSec: 0,
    progressPercent: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: '',
    elapsedSeconds: 0,
  });

  // Keep myPeerRef in sync
  useEffect(() => {
    myPeerRef.current = myPeer;
  }, [myPeer]);

  // Check URL pin/room param (e.g. from QR scan)
  useEffect(() => {
    const urlPin = searchParams.get('pin') || searchParams.get('room');
    if (urlPin) {
      setConnectedPin(urlPin.toUpperCase());
    }
  }, [searchParams]);

  // 1. Initialize self peer
  useEffect(() => {
    const info = getDeviceInfo();
    const peerId = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const peer: LocalPeer = {
      id: peerId,
      name: getFriendlyDeviceName(info),
      deviceType: info.deviceType,
      os: info.os,
      browser: info.browser,
      lastSeen: Date.now(),
    };
    setMyPeer(peer);
  }, []);

  // Cleanup active file handle
  const cleanupTransfer = useCallback(() => {
    if (currentHandleRef.current) {
      currentHandleRef.current.cancel();
      currentHandleRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupTransfer();
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
        peerInstanceRef.current = null;
      }
    };
  }, [cleanupTransfer]);

  // Setup event listeners on a PeerJS DataConnection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupConnection = useCallback((conn: any) => {
    connectionsRef.current.set(conn.peer, conn);

    conn.on('open', () => {
      // Exchange self device info
      if (myPeerRef.current) {
        conn.send({
          type: 'PEER_INFO',
          peer: myPeerRef.current,
        });
      }
    });

    // Receiver speed calculation references
    let lastSpeedTime = Date.now();
    let lastSpeedBytes = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.on('data', async (data: any) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'PEER_INFO': {
          if (data.peer) {
            const remotePeer: LocalPeer = {
              ...data.peer,
              id: conn.peer,
              lastSeen: Date.now(),
            };
            setNearbyPeers((prev) => {
              const filtered = prev.filter((p) => p.id !== conn.peer);
              return [...filtered, remotePeer];
            });

            // Send back our own peer info if not already sent
            if (myPeerRef.current && !data.isReply) {
              conn.send({
                type: 'PEER_INFO',
                peer: myPeerRef.current,
                isReply: true,
              });
            }
          }
          break;
        }

        case 'TRANSFER_REQUEST': {
          activeConnRef.current = conn;
          expectedTotalBytesRef.current = data.totalBytes || 0;
          receiverBytesRef.current = 0;
          setIncomingRequest({
            senderId: conn.peer,
            senderName: data.senderName || 'Perangkat Pengirim',
            files: data.files || [],
            totalBytes: data.totalBytes || 0,
          });
          break;
        }

        case 'TRANSFER_ACCEPT': {
          // Sender receives acceptance from receiver -> start streaming files!
          activeConnRef.current = conn;
          startSendingFiles(conn);
          break;
        }

        case 'TRANSFER_REJECT': {
          setStatus('rejected');
          showToast('Penerima menolak transfer berkas.', 'info');
          break;
        }

        case 'TRANSFER_CANCEL': {
          isCancelledRef.current = true;
          cleanupTransfer();
          setStatus('cancelled');
          showToast('Transfer dibatalkan.', 'info');
          break;
        }

        case 'FILE_START': {
          setMetrics((prev) => ({
            ...prev,
            currentFileName: data.name,
            currentFileIndex: (data.index || 0) + 1,
          }));
          try {
            currentHandleRef.current = await createFileReceiverHandle(
              data.name,
              data.mimeType || 'application/octet-stream'
            );
          } catch (err) {
            console.warn('Gagal menyiapkan penyimpanan berkas:', err);
          }
          break;
        }

        case 'CHUNK': {
          if (data.chunk) {
            if (currentHandleRef.current) {
              await currentHandleRef.current.writeChunk(data.chunk);
            }
            receiverBytesRef.current += data.chunk.byteLength;
            const total = expectedTotalBytesRef.current || 1;
            const now = Date.now();
            const timeDiffSec = (now - lastSpeedTime) / 1000;
            let currentSpeed = 0;

            if (timeDiffSec >= 0.25) {
              const bytesDiff = receiverBytesRef.current - lastSpeedBytes;
              currentSpeed = bytesDiff / timeDiffSec;
              lastSpeedTime = now;
              lastSpeedBytes = receiverBytesRef.current;
            }

            const remainingBytes = Math.max(0, total - receiverBytesRef.current);
            const eta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;
            const progressPercent = Math.min(
              100,
              Math.round((receiverBytesRef.current / total) * 100)
            );

            setMetrics((prev) => ({
              ...prev,
              bytesTransferred: receiverBytesRef.current,
              totalBytes: total,
              speedBps: currentSpeed || prev.speedBps,
              timeRemainingSec: eta,
              progressPercent,
            }));
          }
          break;
        }

        case 'FILE_END': {
          if (currentHandleRef.current) {
            try {
              await currentHandleRef.current.finish();
            } catch (err) {
              console.warn('Gagal menyelesaikan penulisan berkas:', err);
            }
            currentHandleRef.current = null;
          }
          break;
        }

        case 'TRANSFER_COMPLETE': {
          setMetrics((prev) => ({
            ...prev,
            bytesTransferred: prev.totalBytes,
            progressPercent: 100,
            speedBps: 0,
            timeRemainingSec: 0,
          }));
          setStatus('completed');
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch {}
          showToast('Seluruh berkas berhasil diterima & disimpan!', 'success');
          break;
        }

        default:
          break;
      }
    });

    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      setNearbyPeers((prev) => prev.filter((p) => p.id !== conn.peer));
    });

    conn.on('error', (err: unknown) => {
      console.warn('Peer connection error:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupTransfer, showToast]);

  // Connect to another peer by PeerJS ID (e.g. 'nb_4821')
  const connectToPeer = useCallback(
    (targetPeerId: string) => {
      if (!peerInstanceRef.current || peerInstanceRef.current.destroyed) return;
      const existing = connectionsRef.current.get(targetPeerId);
      if (existing && existing.open) return existing;

      try {
        const conn = peerInstanceRef.current.connect(targetPeerId, { reliable: true });
        setupConnection(conn);
        return conn;
      } catch (err) {
        console.warn('Failed to connect to peer:', err);
      }
    },
    [setupConnection]
  );

  // 2. Initialize PeerJS client instance
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    async function initPeer() {
      try {
        const { Peer } = await import('peerjs');
        if (!isMounted) return;

        // Peer ID is always tied to this device's own PIN
        const myPeerId = `nb_${myPin}`;

        const peer = new Peer(myPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
              { urls: 'stun:openrelay.metered.ca:80' },
              {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject',
              },
              {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject',
              },
              {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject',
              },
            ],
          },
        });

        peerInstanceRef.current = peer;

        peer.on('open', (id: string) => {
          if (!isMounted) return;
          console.log('[PeerJS] Ready with ID:', id);

          // If URL had a target PIN (from QR scan), connect immediately
          if (connectedPin) {
            connectToPeer(`nb_${connectedPin}`);
          }
        });

        peer.on('connection', (conn) => {
          if (!isMounted) return;
          setupConnection(conn);
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          if (!isMounted) return;
          console.warn('[PeerJS] Error:', err);

          // If ID collision happened, regenerate our PIN and try again
          if (err.type === 'unavailable-id') {
            const nextPin = Math.floor(1000 + Math.random() * 9000).toString();
            setMyPin(nextPin);
          }
        });
      } catch (err) {
        console.error('Failed to initialize PeerJS:', err);
      }
    }

    initPeer();

    return () => {
      isMounted = false;
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
        peerInstanceRef.current = null;
      }
    };
  }, [myPin, connectedPin, connectToPeer, setupConnection]);

  // Sender: Stream files chunk-by-chunk to receiver
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startSendingFiles = async (conn: any) => {
    isCancelledRef.current = false;
    setStatus('transferring');
    const totalBytes = filesToSend.reduce((acc, f) => acc + f.size, 0);
    let bytesTransferred = 0;
    const startTime = Date.now();
    let lastSpeedCheckTime = startTime;
    let lastSpeedCheckBytes = 0;

    try {
      for (let fileIndex = 0; fileIndex < filesToSend.length; fileIndex++) {
        if (isCancelledRef.current) throw new Error('Transfer dibatalkan.');
        const item = filesToSend[fileIndex];
        const file = item.file;
        if (!file) continue;

        conn.send({
          type: 'FILE_START',
          index: fileIndex,
          id: item.id,
          name: item.name,
          size: item.size,
          mimeType: item.type || 'application/octet-stream',
        });

        const chunkSize = 32 * 1024; // 32 KB chunk
        let offset = 0;

        while (offset < file.size) {
          if (isCancelledRef.current) throw new Error('Transfer dibatalkan.');

          // Flow control with RTCDataChannel bufferedAmount
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dc = (conn as any).dataChannel as RTCDataChannel;
          if (dc && dc.bufferedAmount > 3 * 1024 * 1024) {
            await new Promise<void>((resolve) => {
              const onLow = () => {
                dc.removeEventListener('bufferedamountlow', onLow);
                resolve();
              };
              dc.addEventListener('bufferedamountlow', onLow);
              setTimeout(resolve, 50); // safety fallback
            });
          }

          const end = Math.min(offset + chunkSize, file.size);
          const slice = file.slice(offset, end);
          const buffer = await slice.arrayBuffer();

          conn.send({
            type: 'CHUNK',
            fileIndex,
            chunk: buffer,
          });

          offset = end;
          bytesTransferred += buffer.byteLength;

          const now = Date.now();
          const timeDiffSec = (now - lastSpeedCheckTime) / 1000;
          if (timeDiffSec >= 0.25) {
            const bytesDiff = bytesTransferred - lastSpeedCheckBytes;
            const currentSpeedBps = bytesDiff / timeDiffSec;
            lastSpeedCheckTime = now;
            lastSpeedCheckBytes = bytesTransferred;

            const remainingBytes = Math.max(0, totalBytes - bytesTransferred);
            const eta = currentSpeedBps > 0 ? remainingBytes / currentSpeedBps : 0;
            const progressPercent =
              totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0;

            setMetrics({
              bytesTransferred,
              totalBytes,
              speedBps: currentSpeedBps,
              timeRemainingSec: eta,
              progressPercent: Math.min(100, progressPercent),
              currentFileIndex: fileIndex + 1,
              totalFiles: filesToSend.length,
              currentFileName: item.name,
              elapsedSeconds: (now - startTime) / 1000,
            });
          }
        }

        conn.send({
          type: 'FILE_END',
          index: fileIndex,
          name: item.name,
        });
      }

      conn.send({ type: 'TRANSFER_COMPLETE' });
      setStatus('completed');
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch {}
      showToast('Seluruh berkas berhasil dikirimkan!', 'success');
    } catch (err: unknown) {
      if (!isCancelledRef.current) {
        const errText = err instanceof Error ? err.message : 'Koneksi transfer terputus.';
        setErrorMessage(errText);
        setStatus('error');
      }
    }
  };

  // User clicks on a nearby peer in radar
  const handleSelectPeerToTarget = (peer: LocalPeer) => {
    setTargetPeer(peer);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // User selected files from native file picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0 || !targetPeer) return;

    cleanupTransfer();
    isCancelledRef.current = false;

    const fileItems: FileTransferItem[] = Array.from(selected).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));

    setFilesToSend(fileItems);
    setStatus('waiting_for_receiver');
    const totalBytes = fileItems.reduce((acc, f) => acc + f.size, 0);

    setMetrics({
      bytesTransferred: 0,
      totalBytes,
      speedBps: 0,
      timeRemainingSec: 0,
      progressPercent: 0,
      currentFileIndex: 1,
      totalFiles: fileItems.length,
      currentFileName: fileItems[0].name,
      elapsedSeconds: 0,
    });

    // Ensure connection is established
    let conn = connectionsRef.current.get(targetPeer.id);
    if (!conn || !conn.open) {
      conn = connectToPeer(targetPeer.id);
      if (conn) {
        await new Promise<void>((res) => {
          conn.once('open', res);
          setTimeout(res, 2500);
        });
      }
    }

    activeConnRef.current = conn;
    if (conn && conn.open) {
      conn.send({
        type: 'TRANSFER_REQUEST',
        senderName: myPeer?.name || 'Perangkat Pengirim',
        files: fileItems.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
        })),
        totalBytes,
      });
    } else {
      setStatus('error');
      setErrorMessage('Gagal menghubungi perangkat penerima.');
    }
  };

  // Receiver accepts incoming transfer
  const handleAcceptIncoming = async () => {
    if (!incomingRequest || !activeConnRef.current) return;
    const { files, totalBytes } = incomingRequest;
    setIncomingRequest(null);
    setStatus('transferring');
    isCancelledRef.current = false;

    const total = totalBytes || files.reduce((acc, f) => acc + f.size, 0);
    expectedTotalBytesRef.current = total;
    receiverBytesRef.current = 0;

    setMetrics({
      bytesTransferred: 0,
      totalBytes: total,
      speedBps: 0,
      timeRemainingSec: 0,
      progressPercent: 0,
      currentFileIndex: 1,
      totalFiles: files.length,
      currentFileName: files[0]?.name || '',
      elapsedSeconds: 0,
    });

    activeConnRef.current.send({
      type: 'TRANSFER_ACCEPT',
    });
  };

  // Receiver rejects incoming transfer
  const handleRejectIncoming = async () => {
    if (!incomingRequest || !activeConnRef.current) return;
    activeConnRef.current.send({
      type: 'TRANSFER_REJECT',
    });
    setIncomingRequest(null);
  };

  // Cancel ongoing transfer
  const handleCancelTransfer = async () => {
    isCancelledRef.current = true;
    if (activeConnRef.current && activeConnRef.current.open) {
      activeConnRef.current.send({
        type: 'TRANSFER_CANCEL',
      });
    }
    cleanupTransfer();
    setStatus('idle');
    setTargetPeer(null);
    setFilesToSend([]);
    showToast('Transfer dibatalkan.', 'info');
  };

  const handleResetToRadar = () => {
    cleanupTransfer();
    setStatus('idle');
    setTargetPeer(null);
    setFilesToSend([]);
  };

  // User entered target PIN manually
  const handleJoinPin = (pin: string) => {
    setConnectedPin(pin);
    connectToPeer(`nb_${pin}`);
    showToast(`Menghubungkan ke PIN: ${pin}`, 'info');
  };

  // User scanned QR code with in-browser camera
  const handleCameraScanSuccess = (scannedPin: string) => {
    setShowCameraScanner(false);
    setConnectedPin(scannedPin);
    connectToPeer(`nb_${scannedPin}`);
    showToast(`QR Code Terdeteksi! Menghubungkan ke PIN: ${scannedPin}`, 'success');
  };

  // Tautan pairing selalu mengacu ke PIN milik perangkat INI
  const pairUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/send?pin=${myPin}`
    : '';

  const handleCopyPairLink = () => {
    if (pairUrl) {
      navigator.clipboard.writeText(pairUrl);
      setCopiedLink(true);
      showToast('Tautan pairing berhasil disalin!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Render QR Code in modal pointing directly to THIS device's PIN
  useEffect(() => {
    if (!showQrModal || !qrContainerRef.current || !pairUrl) return;

    let isMounted = true;
    async function renderQr() {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        if (!isMounted || !qrContainerRef.current) return;
        qrContainerRef.current.innerHTML = '';

        const qr = new QRCodeStyling({
          width: 200,
          height: 200,
          data: pairUrl,
          dotsOptions: {
            color: '#2563eb',
            type: 'rounded',
          },
          cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#1d4ed8',
          },
          backgroundOptions: {
            color: 'transparent',
          },
        });

        qr.append(qrContainerRef.current);
      } catch (err) {
        console.warn('Gagal merender QR Code:', err);
      }
    }

    renderQr();
    return () => {
      isMounted = false;
    };
  }, [showQrModal, pairUrl]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="send-studio-file-input"
      />

      {/* Incoming Transfer Prompt Modal */}
      {incomingRequest && (
        <IncomingTransferModal
          senderName={incomingRequest.senderName}
          files={incomingRequest.files}
          onAccept={handleAcceptIncoming}
          onReject={handleRejectIncoming}
        />
      )}

      {/* Camera Scanner Modal (for scanning QR from screen) */}
      {showCameraScanner && (
        <CameraScannerModal
          onScan={handleCameraScanSuccess}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* 1. STATE: RADAR (IDLE) */}
      {status === 'idle' && (
        <LocalWifiRadar
          myPeer={myPeer}
          peers={nearbyPeers}
          myPin={myPin}
          connectedPin={connectedPin}
          onSelectPeer={handleSelectPeerToTarget}
          onShowQr={() => setShowQrModal(true)}
          onOpenScanner={() => setShowCameraScanner(true)}
          onJoinPin={handleJoinPin}
        />
      )}

      {/* 2. STATE: WAITING FOR RECEIVER TO ACCEPT */}
      {status === 'waiting_for_receiver' && targetPeer && (
        <div className="p-6 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 sm:space-y-6 max-w-lg mx-auto shadow-xl animate-in zoom-in-95 max-w-full overflow-hidden">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shrink-0">
            <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Menunggu Konfirmasi Penerima...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permintaan transfer telah dikirim ke <strong>{targetPeer.name}</strong>. Silakan klik tombol{' '}
              <strong>Terima</strong> di layar penerima.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 truncate">
            {filesToSend.length} berkas dipilih ({formatBytes(metrics.totalBytes)})
          </div>

          <button
            type="button"
            onClick={handleCancelTransfer}
            className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            Batalkan Pengiriman
          </button>
        </div>
      )}

      {/* 3. STATE: CONNECTING & TRANSFERRING */}
      {(status === 'connecting' || status === 'transferring') && (
        <TransferProgressCard
          metrics={metrics}
          onCancel={handleCancelTransfer}
          title={
            incomingRequest || (status === 'transferring' && filesToSend.length === 0)
              ? 'Sedang Menerima Berkas...'
              : 'Sedang Mengirim Berkas...'
          }
        />
      )}

      {/* 4. STATE: COMPLETED */}
      {status === 'completed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 max-w-full overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner shrink-0">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Transfer Berhasil Selesai!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Seluruh berkas telah terkirim sempurna secara peer-to-peer tanpa perantara server.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Total Ukuran:</span>
              <strong className="text-slate-900 dark:text-white">{formatBytes(metrics.totalBytes)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Status:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">100% Selesai</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetToRadar}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all"
          >
            Kirim Berkas Lainnya
          </button>
        </div>
      )}

      {/* 5. STATE: REJECTED */}
      {status === 'rejected' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4 max-w-lg mx-auto max-w-full overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Transfer Ditolak</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perangkat penerima menolak permintaan transfer berkas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetToRadar}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Kembali ke Radar
          </button>
        </div>
      )}

      {/* 6. STATE: ERROR */}
      {status === 'error' && (
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4 max-w-lg mx-auto max-w-full overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Koneksi Terputus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {errorMessage || 'Jalur transfer terputus sebelum berkas selesai dikirim.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetToRadar}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Kembali ke Radar
          </button>
        </div>
      )}

      {/* QR Code Modal for Showing THIS device's QR code */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                QR Code Perangkat Ini
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                type="button"
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Scan dari Kamera HP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buka kamera HP Anda atau klik <strong>Scan Kamera</strong> di HP untuk memindai kode ini:
              </p>
            </div>

            {/* QR Canvas Container */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm inline-block mx-auto max-w-full overflow-hidden">
              <div ref={qrContainerRef} className="flex items-center justify-center" />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Atau ketik PIN perangkat ini di HP:</div>
              <div className="text-xl font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400">
                {myPin}
              </div>
            </div>

            <button
              onClick={handleCopyPairLink}
              type="button"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Pairing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
