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
  SignalingMessage,
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
import { streamFilesOverDataChannel, setupDataChannelReceiver } from '@/lib/webrtc/dataChannelTransfer';
import { useToast } from '@/components/common/Toast';

export function SendStudio() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Room pairing: random 4-digit PIN for this device, or joined room from URL
  const [roomPin] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Local Peer identification
  const [myPeer, setMyPeer] = useState<LocalPeer | null>(null);
  const [nearbyPeers, setNearbyPeers] = useState<LocalPeer[]>([]);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Transfer states
  const [targetPeer, setTargetPeer] = useState<LocalPeer | null>(null);
  const [filesToSend, setFilesToSend] = useState<FileTransferItem[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<{
    senderId: string;
    senderName: string;
    files: Array<{ id: string; name: string; size: number; type: string }>;
  } | null>(null);

  const [status, setStatus] = useState<TransferStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
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

  // Check URL room param (from QR scan)
  useEffect(() => {
    const urlRoom = searchParams.get('room');
    if (urlRoom) {
      setActiveRoom(urlRoom.toUpperCase());
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

  // Cleanup WebRTC connection
  const cleanupConnections = useCallback(() => {
    if (receiverCancelRef.current) {
      receiverCancelRef.current();
      receiverCancelRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidateQueueRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  // 2. Heartbeat to discover peers on the same Wi-Fi or Room PIN
  useEffect(() => {
    if (!myPeer) return;

    let isMounted = true;
    const currentRoomToSync = activeRoom || roomPin;

    const syncPeers = async () => {
      try {
        const res = await fetch('/api/send/peers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peer: myPeer,
            roomId: currentRoomToSync,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.peers)) {
            setNearbyPeers(data.peers);
          }
        }
      } catch {
        // silent transient network glitch
      }
    };

    syncPeers();
    const interval = setInterval(syncPeers, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      fetch(`/api/send/peers?peerId=${myPeer.id}&roomId=${currentRoomToSync}`, {
        method: 'DELETE',
      }).catch(() => {});
    };
  }, [myPeer, activeRoom, roomPin]);

  // 3. Signaling Polling for incoming signals
  useEffect(() => {
    if (!myPeer) return;

    let isMounted = true;
    let lastTs = Date.now();

    const pollSignals = async () => {
      try {
        const res = await fetch(`/api/send/signal?peerId=${myPeer.id}&since=${lastTs}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.messages) && data.messages.length > 0) {
            lastTs = data.latestTimestamp || lastTs;
            for (const msg of data.messages) {
              await handleSignalingMessage(msg);
            }
          }
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(pollSignals, 300);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [myPeer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send signaling packet to target peer
  const sendSignal = async (targetId: string, message: SignalingMessage) => {
    if (!myPeer) return;
    try {
      await fetch('/api/send/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPeerId: targetId,
          fromPeerId: myPeer.id,
          message,
        }),
      });
    } catch (err) {
      console.warn('Failed to dispatch signaling message:', err);
    }
  };

  // 4. Handle incoming signaling messages
  const handleSignalingMessage = async (msg: SignalingMessage) => {
    if (!myPeer) return;

    if (msg.type === 'file-list') {
      const senderName = msg.deviceInfo ? getFriendlyDeviceName(msg.deviceInfo) : 'Perangkat Wi-Fi';
      setIncomingRequest({
        senderId: msg.senderId,
        senderName,
        files: msg.files || [],
      });
    } else if (msg.type === 'accept-transfer') {
      setStatus('connecting');
      if (peerConnectionRef.current) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          await sendSignal(msg.senderId, {
            type: 'offer',
            senderId: myPeer.id,
            sdp: offer,
          });
        } catch (e) {
          console.error('Failed to create offer:', e);
        }
      }
    } else if (msg.type === 'offer') {
      if (peerConnectionRef.current && msg.sdp) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));

        while (iceCandidateQueueRef.current.length > 0) {
          const cand = iceCandidateQueueRef.current.shift();
          if (cand) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Flushing candidate error:', e);
            }
          }
        }

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        await sendSignal(msg.senderId, {
          type: 'answer',
          senderId: myPeer.id,
          sdp: answer,
        });
      }
    } else if (msg.type === 'answer') {
      if (peerConnectionRef.current && msg.sdp) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));

        while (iceCandidateQueueRef.current.length > 0) {
          const cand = iceCandidateQueueRef.current.shift();
          if (cand) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Flushing candidate error:', e);
            }
          }
        }
      }
    } else if (msg.type === 'ice-candidate') {
      if (msg.candidate) {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            console.warn('addIceCandidate error:', e);
          }
        } else {
          iceCandidateQueueRef.current.push(msg.candidate);
        }
      }
    } else if (msg.type === 'reject-transfer') {
      setStatus('rejected');
      cleanupConnections();
      showToast('Penerima menolak transfer berkas.', 'info');
    } else if (msg.type === 'cancel-transfer') {
      setStatus('cancelled');
      cleanupConnections();
      showToast('Transfer dibatalkan.', 'info');
    }
  };

  // 5. User clicks on a nearby peer to send files
  const handleSelectPeerToTarget = (peer: LocalPeer) => {
    setTargetPeer(peer);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // 6. User selected files from file picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0 || !targetPeer || !myPeer) return;

    cleanupConnections();
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

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
    });
    peerConnectionRef.current = pc;

    const dc = pc.createDataChannel('nextbyteSendChannel', { ordered: true });
    dataChannelRef.current = dc;

    pc.onicecandidate = (event) => {
      if (event.candidate && targetPeer) {
        sendSignal(targetPeer.id, {
          type: 'ice-candidate',
          senderId: myPeer.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        setStatus('error');
        setErrorMessage('Koneksi P2P langsung Wi-Fi gagal tersambung.');
      }
    };

    dc.onopen = async () => {
      setStatus('transferring');
      try {
        await streamFilesOverDataChannel(
          dc,
          fileItems,
          (m) => setMetrics(m),
          () => isCancelledRef.current
        );

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

    // Send transfer request metadata to target peer
    await sendSignal(targetPeer.id, {
      type: 'file-list',
      senderId: myPeer.id,
      deviceInfo: getDeviceInfo(),
      files: fileItems.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });
  };

  // 7. Receiver accepts incoming transfer
  const handleAcceptIncoming = async () => {
    if (!incomingRequest || !myPeer) return;

    cleanupConnections();
    isCancelledRef.current = false;
    const { senderId, files } = incomingRequest;
    setIncomingRequest(null);
    setStatus('connecting');

    const totalExpectedBytes = files.reduce((acc, f) => acc + f.size, 0);

    setMetrics({
      bytesTransferred: 0,
      totalBytes: totalExpectedBytes,
      speedBps: 0,
      timeRemainingSec: 0,
      progressPercent: 0,
      currentFileIndex: 1,
      totalFiles: files.length,
      currentFileName: files[0]?.name || '',
      elapsedSeconds: 0,
    });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(senderId, {
          type: 'ice-candidate',
          senderId: myPeer.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        setStatus('error');
        setErrorMessage('Koneksi P2P langsung Wi-Fi gagal tersambung.');
      }
    };

    pc.ondatachannel = (event) => {
      setStatus('transferring');
      const dc = event.channel;

      const handle = setupDataChannelReceiver(
        dc,
        totalExpectedBytes,
        files.length,
        (m) => setMetrics(m),
        () => {
          setStatus('completed');
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch {}
          showToast('Seluruh berkas berhasil diterima & disimpan!', 'success');
        },
        (err) => {
          setErrorMessage(err.message || 'Gagal menerima berkas.');
          setStatus('error');
        }
      );

      receiverCancelRef.current = handle.cancel;
    };

    await sendSignal(senderId, {
      type: 'accept-transfer',
      senderId: myPeer.id,
    });
  };

  // 8. Receiver rejects incoming transfer
  const handleRejectIncoming = async () => {
    if (!incomingRequest || !myPeer) return;
    const { senderId } = incomingRequest;
    setIncomingRequest(null);
    await sendSignal(senderId, {
      type: 'reject-transfer',
      senderId: myPeer.id,
      reason: 'Penerima menolak transfer.',
    });
  };

  // 9. Cancel ongoing transfer
  const handleCancelTransfer = async () => {
    isCancelledRef.current = true;
    if (myPeer && targetPeer) {
      await sendSignal(targetPeer.id, {
        type: 'cancel-transfer',
        senderId: myPeer.id,
      });
    }
    cleanupConnections();
    setStatus('idle');
    setTargetPeer(null);
    setFilesToSend([]);
    showToast('Transfer dibatalkan.', 'info');
  };

  const handleResetToRadar = () => {
    cleanupConnections();
    setStatus('idle');
    setTargetPeer(null);
    setFilesToSend([]);
  };

  const handleJoinPin = (pin: string) => {
    setActiveRoom(pin);
    showToast(`Bergabung ke grup PIN: ${pin}`, 'success');
  };

  const pairUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/send?room=${activeRoom || roomPin}`
    : '';

  const handleCopyPairLink = () => {
    if (pairUrl) {
      navigator.clipboard.writeText(pairUrl);
      setCopiedLink(true);
      showToast('Tautan pairing berhasil disalin!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Render QR Code in modal pointing directly to active pairing room
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
      {/* Hidden File Input Triggered on Peer Click */}
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

      {/* 1. STATE: RADAR (IDLE) */}
      {status === 'idle' && (
        <LocalWifiRadar
          myPeer={myPeer}
          peers={nearbyPeers}
          roomPin={activeRoom || roomPin}
          activeRoom={activeRoom}
          onSelectPeer={handleSelectPeerToTarget}
          onShowQr={() => setShowQrModal(true)}
          onJoinPin={handleJoinPin}
        />
      )}

      {/* 2. STATE: WAITING FOR RECEIVER TO ACCEPT */}
      {status === 'waiting_for_receiver' && targetPeer && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 max-w-lg mx-auto shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Menunggu Konfirmasi Penerima...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permintaan transfer telah dikirim ke <strong>{targetPeer.name}</strong>. Silakan klik tombol{' '}
              <strong>Terima</strong> di layar penerima.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
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
          title={status === 'connecting' ? 'Menyiapkan Jalur Wi-Fi P2P...' : 'Mentransfer Berkas Lewat Wi-Fi...'}
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
              Seluruh berkas telah terkirim sempurna secara peer-to-peer melalui jaringan Wi-Fi lokal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Total Ukuran:</span>
              <strong className="text-slate-900 dark:text-white">{formatBytes(metrics.totalBytes)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Kecepatan Rata-Rata:</span>
              <strong className="text-slate-900 dark:text-white">{formatBytes(metrics.speedBps)}/s</strong>
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

      {/* 5. STATE: ERROR */}
      {status === 'error' && (
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Koneksi Terputus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {errorMessage || 'Jalur transfer Wi-Fi terputus sebelum berkas selesai dikirim.'}
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

      {/* QR Code Modal for Phone Pairing */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hubungkan Ponsel Hotspot
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                type="button"
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Scan dengan Kamera HP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arahkan kamera HP Anda ke QR Code di bawah untuk menghubungkan langsung:
              </p>
            </div>

            {/* QR Canvas Container */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm inline-block mx-auto">
              <div ref={qrContainerRef} className="flex items-center justify-center" />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Atau ketik PIN 4-digit di HP:</div>
              <div className="text-xl font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400">
                {activeRoom || roomPin}
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
