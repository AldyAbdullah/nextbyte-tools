'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BeforeInstallPromptEvent, PlatformType } from '@/types/pwa';
import { useToast } from '@/components/common/Toast';

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: PlatformType;
  showGuideModal: boolean;
  setShowGuideModal: (val: boolean) => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('android');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Detect Platform & Standalone Mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect user platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check if user dismissed banner this session
    const dismissed = sessionStorage.getItem('nextbyte_pwa_banner_dismissed') === 'true';
    if (dismissed) {
      setIsBannerDismissed(true);
    }

    // Register Service Worker in production or localhost
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Check for updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Versi baru NextByte Tools tersedia!');
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('Gagal mendaftarkan Service Worker:', err);
          });
      });
    }

    // Listen for the native beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showToast('NextByte Tools berhasil dipasang di perangkat Anda! 🎉', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('nextbyte_pwa_banner_dismissed', 'true');
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          showToast('Menginstal NextByte Tools...', 'info');
        } else {
          showToast('Instalasi dibatalkan.', 'info');
        }
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        setShowGuideModal(true);
      }
    } else {
      // If native prompt is not directly available (e.g. iOS or already prompted), show interactive guide
      setShowGuideModal(true);
    }
  }, [deferredPrompt, showToast]);

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        platform,
        showGuideModal,
        setShowGuideModal,
        isBannerDismissed,
        dismissBanner,
        installApp,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
