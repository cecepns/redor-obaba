import React, { useState } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import Modal from './Modal';
import toast from 'react-hot-toast';

export const PWAInstallFloating = () => {
  const { deferredPrompt, isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or explicitly dismissed or not installable on current environment
  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      toast('Buka menu browser Anda (titik tiga) lalu pilih "Install Aplikasi" atau "Tambahkan ke Layar Utama".', {
        icon: '📲',
        duration: 5000,
      });
    }
  };

  return (
    <>
      {/* Floating PWA Card (Mobile Only) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 animate-bounce-short">
        <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3.5 transition-all hover:border-blood-500/50">
          {/* Logo & Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/obaba-logo.jpeg"
                  alt="Redor OBABA"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blood-600"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-xs font-black text-white truncate">Install Aplikasi OBABA</h4>
                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Akses cepat langsung dari layar HP
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-gradient-to-r from-blood-600 to-blood-700 hover:from-blood-500 hover:to-blood-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blood-900/40 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tutup banner"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      <Modal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        title="Cara Install di iPhone / iPad"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-slate-700">
          <div className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-blood-50 text-blood-600 flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500">
              Ikuti langkah mudah berikut untuk menambahkan aplikasi ke Layar Utama iPhone / iPad Anda:
            </p>
          </div>

          <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                1
              </div>
              <div className="pt-0.5">
                <span className="font-bold text-slate-900">Tekan tombol Bagikan (Share)</span>
                <div className="flex items-center space-x-1.5 text-slate-500 mt-0.5">
                  <span>Ikon</span>
                  <Share className="w-4 h-4 text-blue-600 inline" />
                  <span>di menu bawah browser Safari.</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                2
              </div>
              <div className="pt-0.5">
                <span className="font-bold text-slate-900">Pilih "Tambah ke Layar Utama"</span>
                <div className="flex items-center space-x-1.5 text-slate-500 mt-0.5">
                  <span>(Add to Home Screen)</span>
                  <PlusSquare className="w-4 h-4 text-slate-700 inline" />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                3
              </div>
              <div className="pt-0.5">
                <span className="font-bold text-slate-900">Klik "Tambah" / "Add" di pojok kanan atas</span>
                <p className="text-slate-500 mt-0.5">Aplikasi siap dibuka langsung layaknya aplikasi native!</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PWAInstallFloating;
