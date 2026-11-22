// Screen WakeLock helper to keep device screen awake during active file transfers
class ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested: boolean = false;

  public async request(): Promise<boolean> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      this.isRequested = true;
      this.sentinel = await navigator.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  }

  public release() {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }
  }

  public isActive(): boolean {
    return this.sentinel !== null || this.isRequested;
  }
}

export const screenWakeLock = new ScreenWakeLock();
