export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: DeviceType;
}

export interface LocalPeer {
  id: string;
  name: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  lastSeen: number;
}

export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // available on sender side
}

export type TransferStatus =
  | 'idle'
  | 'selecting'
  | 'waiting_for_receiver'
  | 'receiver_connected'
  | 'approval_pending'
  | 'connecting'
  | 'transferring'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'error';

export interface TransferMetrics {
  bytesTransferred: number;
  totalBytes: number;
  speedBps: number;
  timeRemainingSec: number;
  progressPercent: number;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  elapsedSeconds: number;
}

export interface SignalingMessage {
  type:
    | 'join'
    | 'peer-joined'
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'file-list'
    | 'accept-transfer'
    | 'reject-transfer'
    | 'cancel-transfer'
    | 'complete-transfer'
    | 'error';
  senderId: string;
  targetId?: string;
  deviceInfo?: DeviceInfo;
  files?: Array<{ id: string; name: string; size: number; type: string }>;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: string;
}

export type StorageMode = 'stream-disk' | 'memory-blob';
