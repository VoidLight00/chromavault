'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  install: () => Promise<void>;
  isSupported: boolean;
}

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if PWA is supported
    const checkSupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = 'manifest' in document.documentElement;
      setIsSupported(hasServiceWorker && hasManifest);
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    console.log('New version available');
                  } else {
                    // Content is cached for offline use
                    console.log('Content is cached for offline use');
                  }
                }
              });
            }
          });

          // Check for updates
          registration.update();
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check for PWA on Android
      const isAndroidPWA = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isAndroidPWA);
    };

    checkSupport();
    registerServiceWorker();
    checkIfInstalled();

    // Set initial offline state
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setIsInstallable(false);
      setInstallPrompt(null);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    installPrompt,
    install,
    isSupported,
  };
}

// Hook for managing offline storage
export function useOfflineStorage() {
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  const addPendingAction = (action: any) => {
    const pending = JSON.parse(localStorage.getItem('pendingPalettes') || '[]');
    const updated = [...pending, action];
    localStorage.setItem('pendingPalettes', JSON.stringify(updated));
    setPendingActions(updated);
  };

  const clearPendingActions = () => {
    localStorage.removeItem('pendingPalettes');
    setPendingActions([]);
  };

  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem('pendingPalettes') || '[]');
    setPendingActions(pending);
  }, []);

  return {
    pendingActions,
    addPendingAction,
    clearPendingActions,
  };
}