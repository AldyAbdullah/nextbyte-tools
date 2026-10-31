import { DeviceInfo, DeviceType } from '@/types/nextbyteSend';

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { browser: 'Browser', os: 'Unknown', deviceType: 'desktop' };
  }

  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let deviceType: DeviceType = 'desktop';

  // Detect OS
  if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS';
    deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/Android/.test(ua)) {
    os = 'Android';
    deviceType = /Mobile/.test(ua) ? 'mobile' : 'tablet';
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  // Detect Browser
  let browser = 'Browser';
  if (/Edg\//.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
  } else if (/OPR\//.test(ua)) {
    browser = 'Opera';
  }

  return { browser, os, deviceType };
}

/**
 * Check if the browser supports File System Access API streaming directly to disk
 */
export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Get safe storage recommendation based on browser capabilities
 */
export function getStorageRecommendation(): {
  canStreamToDisk: boolean;
  maxRecommendedSizeGb: number;
  notice: string;
} {
  const isDiskStreaming = supportsFileSystemAccess();
  const info = getDeviceInfo();

  if (isDiskStreaming) {
    return {
      canStreamToDisk: true,
      maxRecommendedSizeGb: 10,
      notice: 'Dukungan penyimpanan langsung ke disk aktif (Hingga 10 GB+ tanpa membebani RAM).',
    };
  }

  if (info.os === 'iOS') {
    return {
      canStreamToDisk: false,
      maxRecommendedSizeGb: 1.5,
      notice: 'Browser iOS menyimpan berkas di memori aplikasi sebelum disimpan. Disarankan berkas < 1.5 GB agar tab tidak tertutup sistem.',
    };
  }

  return {
    canStreamToDisk: false,
    maxRecommendedSizeGb: 3,
    notice: 'Berkas akan dikumpulkan di memori peramban lalu diunduh otomatis setelah selesai.',
  };
}

/**
 * Format bytes to readable string (B, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatTimeRemaining(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'Menghitung...';
  if (seconds < 60) return `${Math.ceil(seconds)} dtk`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (mins < 60) return `${mins} mnt ${secs} dtk`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} jam ${remMins} mnt`;
}
