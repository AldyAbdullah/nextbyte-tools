'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DownloadCloud,
  File,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  FileTransferItem,
  TransferStatus,
  TransferMetrics,
  SignalingMessage,
} from '@/types/nextbyteSend';
import {
  formatBytes,
  getDeviceInfo,
  getStorageRecommendation,
} from '@/lib/webrtc/deviceDetection';
import { DeviceBadge } from './DeviceBadge';
import { TransferProgressCard } from './TransferProgressCard';
import { setupDataChannelReceiver } from '@/lib/webrtc/dataChannelTransfer';
import { createSignalingSession, SignalingSession } from '@/lib/webrtc/signalingClient';
import { useToast } from '@/components/common/Toast';

export function ReceiveStudio() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [status, setStatus] = useState<TransferStatus>('idle');
  const [incomingFiles, setIncomingFiles] = useState<FileTransferItem[]>([]);
  const [senderDevice, setSenderDevice] = useState<SignalingMessage['deviceInfo'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingRef = useRef<SignalingSession | null>(null);
  const receiverCancelRef = useRef<(() => void) | null>(null);

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

  const storageRec = getStorageRecommendation();
  const totalIncomingSize = incomingFiles.reduce((acc, f) => acc + f.size, 0);

  const cleanupConnections = useCallback(() => {
    if (receiverCancelRef.current) {
      receiverCancelRef.current();
      receiverCancelRef.current = null;
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

  // Connect to sender room
  const handleConnect = useCallback(
    async (codeToUse?: string) => {
      const code = (codeToUse || inputCode).trim().toUpperCase();
      if (!code) {
        showToast('Mohon masukkan kode transfer terlebih dahulu.', 'error');
        return;
      }

      cleanupConnections();
      setStatus('connecting');
      setErrorMessage('');

      try {
        // 1. Fetch ICE servers
        const iceRes = await fetch('/api/turn-credentials');
        const { iceServers } = await iceRes.json();

        // 2. Initialize PeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // 3. Connect to signaling session & Candidate Queue
        const iceCandidateQueue: RTCIceCandidateInit[] = [];

        const signaling = createSignalingSession(code, 'receiver', async (msg) => {
          if (msg.type === 'file-list') {
            setSenderDevice(msg.deviceInfo || null);
            setIncomingFiles(
              (msg.files || []).map((f) => ({
                id: f.id,
                name: f.name,
                size: f.size,
                type: f.type,
              }))
            );
            setStatus('approval_pending');
          } else if (msg.type === 'offer') {
            if (msg.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              while (iceCandidateQueue.length > 0) {
                const cand = iceCandidateQueue.shift();
                if (cand) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {
                    console.warn('[Receiver] Queued candidate warning:', e);
                  }
                }
              }
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              signaling.send({
                type: 'answer',
                senderId: 'receiver',
                sdp: answer,
              });
            }
          } else if (msg.type === 'ice-candidate') {
            if (msg.candidate) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                } catch (e) {
                  console.warn('[Receiver] addIceCandidate warning:', e);
                }
              } else {
                iceCandidateQueue.push(msg.candidate);
              }
            }
          } else if (msg.type === 'cancel-transfer') {
            setStatus('cancelled');
            cleanupConnections();
            showToast('Pengirim membatalkan transfer berkas.', 'info');
          }
        });
        signalingRef.current = signaling;

        // Notify sender that receiver has joined
        signaling.send({
          type: 'peer-joined',
          senderId: 'receiver',
          deviceInfo: getDeviceInfo(),
        });

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
              senderId: 'receiver',
              candidate: event.candidate.toJSON(),
            });
          }
        };

        // Listen for DataChannel from sender
        pc.ondatachannel = (event) => {
          setStatus('transferring');
          const dc = event.channel;

          const receiverHandle = setupDataChannelReceiver(
            dc,
            totalIncomingSize,
            incomingFiles.length,
            (newMetrics) => {
              setMetrics(newMetrics);
            },
            () => {
              setStatus('completed');
              try {
                confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
              } catch {
                // ignore
              }
              showToast('Seluruh berkas berhasil diterima & disimpan!', 'success');
            },
            (err) => {
              setErrorMessage(err.message || 'Gagal menerima berkas.');
              setStatus('error');
            }
          );

          receiverCancelRef.current = receiverHandle.cancel;
        };
      } catch (err: unknown) {
        const errText = err instanceof Error ? err.message : 'Gagal menghubungkan ke sesi pengirim.';
        setErrorMessage(errText);
        setStatus('error');
      }
    },
    [cleanupConnections, incomingFiles.length, inputCode, showToast, totalIncomingSize]
  );

  // Auto-connect if code parameter is present in URL
  useEffect(() => {
    if (initialCode && status === 'idle') {
      setInputCode(initialCode);
      handleConnect(initialCode);
    }
  }, [initialCode, status, handleConnect]);

  // Handle Accept Transfer
  const handleAcceptTransfer = () => {
    if (signalingRef.current) {
      signalingRef.current.send({
        type: 'accept-transfer',
        senderId: 'receiver',
      });
      setStatus('connecting');
      setMetrics({
        bytesTransferred: 0,
        totalBytes: totalIncomingSize,
        speedBps: 0,
        timeRemainingSec: 0,
        progressPercent: 0,
        currentFileIndex: 1,
        totalFiles: incomingFiles.length,
        currentFileName: incomingFiles[0]?.name || '',
        elapsedSeconds: 0,
      });
      showToast('Transfer disetujui. Menghubungkan jalur P2P...', 'info');
    }
  };

  // Handle Reject Transfer
  const handleRejectTransfer = () => {
    if (signalingRef.current) {
      signalingRef.current.send({
        type: 'reject-transfer',
        senderId: 'receiver',
        reason: 'Penerima menolak transfer berkas.',
      });
    }
    cleanupConnections();
    setStatus('rejected');
  };

  const handleCancelTransfer = () => {
    if (signalingRef.current) {
      signalingRef.current.send({
        type: 'cancel-transfer',
        senderId: 'receiver',
        reason: 'Transfer dibatalkan oleh penerima.',
      });
    }
    cleanupConnections();
    setStatus('idle');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. STATE: IDLE - INPUT TRANSFER CODE */}
      {status === 'idle' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-14 shadow-xl text-center space-y-8 animate-in fade-in">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <DownloadCloud className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Terima Berkas Langsung
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Masukkan 6 karakter kode transfer yang tertera pada layar pengirim untuk memulai koneksi.
            </p>
          </div>

          {/* Code Input Form */}
          <div className="max-w-sm mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: NB-9281"
                maxLength={9}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="w-full text-center px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 font-mono font-extrabold text-2xl tracking-widest text-slate-900 dark:text-white outline-none transition-colors uppercase placeholder:text-slate-400 placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => handleConnect()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Hubungkan ke Pengirim</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Storage Capability Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 max-w-md mx-auto text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 text-left">
            <HardDrive className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Kapasitas Penyimpanan:</strong> {storageRec.notice}
            </span>
          </div>
        </div>
      )}

      {/* 2. STATE: CONNECTING */}
      {status === 'connecting' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Menghubungkan ke Pengirim...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sedang menyiapkan jalur peer-to-peer terenkripsi DTLS.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelTransfer}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* 3. STATE: APPROVAL PENDING (Incoming Files Modal/Card) */}
      {status === 'approval_pending' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Permintaan Transfer Masuk
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Terima Berkas dari Pengirim?
            </h3>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Perangkat Pengirim:</span>
              {senderDevice && <DeviceBadge device={senderDevice} />}
            </div>
          </div>

          {/* Files List Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Daftar Berkas ({incomingFiles.length}):</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                Total: {formatBytes(totalIncomingSize)}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {incomingFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="truncate text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Accept / Reject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleRejectTransfer}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4 text-red-500" />
              Tolak Transfer
            </button>
            <button
              type="button"
              onClick={handleAcceptTransfer}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terima & Simpan Berkas
            </button>
          </div>
        </div>
      )}

      {/* 4. STATE: TRANSFERRING */}
      {status === 'transferring' && (
        <TransferProgressCard
          metrics={metrics}
          onCancel={handleCancelTransfer}
          title="Sedang Mengunduh Berkas dari Pengirim..."
        />
      )}

      {/* 5. STATE: COMPLETED */}
      {status === 'completed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Berkas Berhasil Diterima!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seluruh berkas telah tersimpan aman di perangkat Anda tanpa melalui perantara server.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-xs space-y-1.5 text-left">
            <div className="flex justify-between text-slate-500">
              <span>Jumlah Berkas:</span>
              <strong className="text-slate-900 dark:text-white">{incomingFiles.length} berkas</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Ukuran:</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {formatBytes(totalIncomingSize)}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Kecepatan Rata-rata:</span>
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
                setIncomingFiles([]);
                setInputCode('');
                setStatus('idle');
              }}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Terima Berkas Lain
            </button>
          </div>
        </div>
      )}

      {/* 6. STATE: ERROR, REJECTED, OR CANCELLED */}
      {(status === 'error' || status === 'rejected' || status === 'cancelled') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {status === 'rejected'
                ? 'Transfer Telah Ditolak'
                : status === 'cancelled'
                ? 'Transfer Dibatalkan'
                : 'Koneksi Terputus'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {errorMessage || 'Sesi transfer telah berakhir atau dibatalkan.'}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                cleanupConnections();
                setStatus('idle');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow transition-all"
            >
              Kembali ke Halaman Terima
            </button>
          </div>
        </div>
      )}

      {/* Quick Switch to Send Mode */}
      <div className="text-center pt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ingin mengirim berkas ke perangkat lain?{' '}
          <Link href="/send" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Buka Halaman Kirim (Send) ➔
          </Link>
        </span>
      </div>
    </div>
  );
}
