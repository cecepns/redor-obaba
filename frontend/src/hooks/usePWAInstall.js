import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS device (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not standalone, it can be added to homescreen manually
    if (isIosDevice && !isStandalone) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default banner
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success('Aplikasi Redor OBABA berhasil diinstall!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          toast.success('Menginstall aplikasi Redor OBABA...');
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          return { success: true, outcome: 'accepted' };
        } else {
          toast('Instalasi dibatalkan', { icon: 'ℹ️' });
          return { success: false, outcome: 'dismissed' };
        }
      } catch (err) {
        console.error('PWA prompt error:', err);
        return { success: false, error: err };
      }
    }
    return { success: false, outcome: 'unavailable' };
  };

  return {
    deferredPrompt,
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  };
};

export default usePWAInstall;
