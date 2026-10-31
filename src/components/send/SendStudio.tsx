'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  File,
  Trash2,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  FileTransferItem,
  TransferStatus,
  TransferMetrics,
  SignalingMessage,
} from '@/types/nextbyteSend';
import { formatBytes, getDeviceInfo } from '@/lib/webrtc/deviceDetection';
import { DeviceBadge } from './DeviceBadge';
import { TransferProgressCard } from './TransferProgressCard';
import { streamFilesOverDataChannel } from '@/lib/webrtc/dataChannelTransfer';
import { createSignalingSession, SignalingSession } from '@/lib/webrtc/signalingClient';
import { useToast } from '@/components/common/Toast';

function generateRandomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${p1}-${p2}`;
}

export function SendStudio() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<FileTransferItem[]>([]);
  const [status, setStatus] = useState<TransferStatus>('selecting');
  const [roomCode, setRoomCode] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [receiverDevice, setReceiverDevice] = useState<SignalingMessage['deviceInfo'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // WebRTC & Transfer states
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const signalingRef = useRef<SignalingSession | null>(null);
  const isCancelledRef = useRef<boolean>(false);

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

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  // Add files from input / dropzone
  const handleAddFiles = useCallback((incomingFiles: FileList | File[]) => {
    const newItems: FileTransferItem[] = Array.from(incomingFiles).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    setFiles((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  // Cleanup WebRTC and signaling
  const cleanupConnections = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (signalingRef.current) {
      signalingRef.current.close();
      signalingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  // Cancel transfer
  const handleCancelTransfer = useCallback(() => {
    isCancelledRef.current = true;
    if (signalingRef.current) {
      signalingRef.current.send({
        type: 'cancel-transfer',
        senderId: 'sender',
        reason: 'Transfer dibatalkan oleh pengirim.',
      });
    }
    cleanupConnections();
    setStatus('selecting');
    showToast('Transfer dibatalkan.', 'info');
  }, [cleanupConnections, showToast]);

  // Render QR Code when roomCode is active
  useEffect(() => {
    if (status !== 'waiting_for_receiver' || !roomCode || !qrContainerRef.current) return;

    let isMounted = true;
    const directUrl = `${window.location.origin}/receive?code=${roomCode}`;

    async function renderQr() {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        if (!isMounted || !qrContainerRef.current) return;
        qrContainerRef.current.innerHTML = '';

        const qr = new QRCodeStyling({
          width: 180,
          height: 180,
          data: directUrl,
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
        console.warn('Gagal merender QR Code styling:', err);
      }
    }

    renderQr();

    return () => {
      isMounted = false;
    };
  }, [status, roomCode]);

  // Initialize transfer room & signaling
  const handleStartTransfer = async () => {
    if (files.length === 0) {
      showToast('Mohon pilih setidaknya 1 berkas untuk dikirim.', 'error');
      return;
    }

    cleanupConnections();
    isCancelledRef.current = false;
    const newCode = generateRandomCode();
    setRoomCode(newCode);
    setStatus('waiting_for_receiver');
    setReceiverDevice(null);
    setErrorMessage('');

    try {
      // 1. Fetch ICE servers
      const iceRes = await fetch('/api/turn-credentials');
      const { iceServers } = await iceRes.json();

      // 2. Initialize PeerConnection
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      // 3. Create DataChannel
      const dc = pc.createDataChannel('nextbyteSendChannel', {
        ordered: true,
      });
      dataChannelRef.current = dc;

      // 4. Create Signaling Session & Candidate Queue
      const iceCandidateQueue: RTCIceCandidateInit[] = [];

      const signaling = createSignalingSession(newCode, 'sender', async (msg) => {
        if (msg.type === 'peer-joined') {
          setReceiverDevice(msg.deviceInfo || null);
          setStatus('receiver_connected');

          // Send file metadata list to receiver for approval
          signaling.send({
            type: 'file-list',
            senderId: 'sender',
            deviceInfo: getDeviceInfo(),
            files: files.map((f) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          });
        } else if (msg.type === 'accept-transfer') {
          setStatus('connecting');
          setMetrics({
            bytesTransferred: 0,
            totalBytes: totalSize,
            speedBps: 0,
            timeRemainingSec: 0,
            progressPercent: 0,
            currentFileIndex: 1,
            totalFiles: files.length,
            currentFileName: files[0]?.name || '',
            elapsedSeconds: 0,
          });

          // Create offer and send to receiver
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signaling.send({
            type: 'offer',
            senderId: 'sender',
            sdp: offer,
          });
        } else if (msg.type === 'answer') {
          if (msg.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            while (iceCandidateQueue.length > 0) {
              const cand = iceCandidateQueue.shift();
              if (cand) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn('[Sender] Queued candidate warning:', e);
                }
              }
            }
          }
        } else if (msg.type === 'ice-candidate') {
          if (msg.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
              } catch (e) {
                console.warn('[Sender] addIceCandidate warning:', e);
              }
            } else {
              iceCandidateQueue.push(msg.candidate);
            }
          }
        } else if (msg.type === 'reject-transfer') {
          setStatus('rejected');
          cleanupConnections();
        } else if (msg.type === 'cancel-transfer') {
          setStatus('cancelled');
          cleanupConnections();
        }
      });
      signalingRef.current = signaling;

      // Listen for ICE and connection state changes
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          setStatus('error');
          setErrorMessage('Koneksi P2P langsung gagal tersambung. Pastikan kedua perangkat berada di jaringan yang sama atau tidak terhalang firewall/VPN.');
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          setStatus('error');
          setErrorMessage('Jalur koneksi WebRTC terputus.');
        }
      };

      // Listen for ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signaling.send({
            type: 'ice-candidate',
            senderId: 'sender',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // When DataChannel opens, begin file transmission
      dc.onopen = async () => {
        setStatus('transferring');
        try {
          await streamFilesOverDataChannel(
            dc,
            files,
            (newMetrics) => {
              setMetrics(newMetrics);
            },
            () => isCancelledRef.current
          );

          setStatus('completed');
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
          showToast('Transfer seluruh berkas berhasil diselesaikan!', 'success');
        } catch (err: unknown) {
          if (!isCancelledRef.current) {
            const errText = err instanceof Error ? err.message : 'Koneksi transfer terputus.';
            setErrorMessage(errText);
            setStatus('error');
          }
        }
      };

      dc.onerror = () => {
        if (!isCancelledRef.current) {
          setErrorMessage('Terjadi kendala pada jalur data channel.');
          setStatus('error');
        }
      };
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Gagal memulai sesi transfer.';
      setErrorMessage(errText);
      setStatus('error');
    }
  };

  const handleCopyLink = () => {
    const directUrl = `${window.location.origin}/receive?code=${roomCode}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    showToast('Tautan terima berkas berhasil disalin!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. STATE: SELECTING FILES */}
      {status === 'selecting' && (
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 shadow-sm backdrop-blur-sm ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/60 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            />

            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-transform duration-300 shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                Pilih Berkas atau <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">Tarik ke Sini</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Mendukung semua format berkas (Video, Dokumen, Foto, ZIP, dll.) • Hingga 10 GB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Langsung Antarperangkat (P2P)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Tanpa Simpan di Server
              </span>
            </div>
          </div>

          {/* Selected Files List & Action Panel */}
          {files.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Berkas Terpilih ({files.length})
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold font-mono">
                    Total: {formatBytes(totalSize)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    + Tambah Berkas
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Scrollable File Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <File className="w-4 h-4" />
                      </div>
                      <div className="truncate text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatBytes(item.size)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus berkas ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Start Transfer Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartTransfer}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Mulai Transfer Berkas ({files.length} Berkas • {formatBytes(totalSize)})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. STATE: WAITING FOR RECEIVER (Room Code & QR Code) */}
      {(status === 'waiting_for_receiver' || status === 'receiver_connected') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Hubungkan Perangkat Penerima
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Buka <strong className="text-blue-600 dark:text-blue-400">nextbyte.biz.id/receive</strong> pada perangkat penerima, lalu masukkan kode berikut:
            </p>
          </div>

          {/* Big Transfer Code Display */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="px-6 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-500/30 text-3xl sm:text-4xl font-extrabold font-mono tracking-widest text-blue-600 dark:text-blue-400 shadow-inner select-all">
              {roomCode}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Penerima'}
            </button>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 shadow-md">
              <div ref={qrContainerRef} className="w-[180px] h-[180px] flex items-center justify-center" />
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> Pindai dengan kamera smartphone untuk langsung terhubung
            </span>
          </div>

          {/* Connection Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            {status === 'waiting_for_receiver' ? (
              <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span>Menunggu perangkat penerima memasukkan kode...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Penerima terhubung!</span>
                {receiverDevice && <DeviceBadge device={receiverDevice} />}
                <span className="text-slate-500 font-normal">Menunggu persetujuan penerima...</span>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCancelTransfer}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Batalkan Sesi Transfer
            </button>
          </div>
        </div>
      )}

      {/* 3. STATE: CONNECTING & TRANSFERRING */}
      {(status === 'connecting' || status === 'transferring') && (
        <TransferProgressCard
          metrics={metrics}
          onCancel={handleCancelTransfer}
          title={status === 'connecting' ? 'Menyiapkan Jalur P2P...' : 'Mentransfer Berkas ke Penerima...'}
        />
      )}

      {/* 4. STATE: COMPLETED */}
      {status === 'completed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Transfer Berhasil Selesai!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seluruh berkas telah terkirim sempurna ke perangkat penerima secara peer-to-peer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>Jumlah Berkas:</span>
              <strong className="text-slate-900 dark:text-white">{files.length} berkas</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Ukuran:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{formatBytes(totalSize)}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Rata-rata Kecepatan:</span>
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {formatBytes(metrics.speedBps)}/s
              </strong>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                cleanupConnections();
                setFiles([]);
                setStatus('selecting');
              }}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
            >
              Kirim Berkas Lain
            </button>
          </div>
        </div>
      )}

      {/* 5. STATE: ERROR, CANCELLED, OR REJECTED */}
      {(status === 'error' || status === 'cancelled' || status === 'rejected') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {status === 'rejected'
                ? 'Penerima Menolak Transfer'
                : status === 'cancelled'
                ? 'Transfer Dibatalkan'
                : 'Terjadi Kendala Koneksi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {errorMessage ||
                (status === 'rejected'
                  ? 'Perangkat penerima tidak menyetujui transfer berkas ini.'
                  : 'Sesi transfer telah dihentikan.')}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                cleanupConnections();
                setStatus('selecting');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Quick Switch to Receive Mode */}
      <div className="text-center pt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ingin menerima berkas dari perangkat lain?{' '}
          <Link
            href="/receive"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Masuk ke Halaman Terima (Receive) ➔
          </Link>
        </span>
      </div>
    </div>
  );
}
