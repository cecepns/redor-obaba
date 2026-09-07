import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  Smartphone,
  ShieldCheck,
  Zap,
  Clock,
  Info,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

export const AdminWAGateway = () => {
  const [statusData, setStatusData] = useState({
    status: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    qr: null,
    phone: null,
    connected: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Test message form
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Halo! Ini adalah pesan uji coba dari WhatsApp Gateway Komunitas Redor OBABA.');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchStatus(true);
    // Auto poll status every 2.5 seconds when waiting for QR scan or connecting
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get(API_ENDPOINTS.WA_GATEWAY.STATUS);
      if (res.data?.success) {
        setStatusData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching WA status:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setStatusData((prev) => ({ ...prev, status: 'connecting', qr: null }));
    try {
      const res = await api.post(API_ENDPOINTS.WA_GATEWAY.CONNECT);
      if (res.data?.success) {
        toast.success(res.data.message);
        // Quick burst poll to get QR as soon as generated
        setTimeout(() => fetchStatus(false), 1500);
        setTimeout(() => fetchStatus(false), 3000);
        setTimeout(() => fetchStatus(false), 5000);
      }
    } catch (err) {
      toast.error('Gagal memulai koneksi WhatsApp.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp Gateway ini?')) return;
    setDisconnecting(true);
    try {
      const res = await api.post(API_ENDPOINTS.WA_GATEWAY.DISCONNECT);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchStatus(true);
      }
    } catch (err) {
      toast.error('Gagal memutuskan koneksi.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone || !testMessage) {
      toast.error('Nomor tujuan dan pesan wajib diisi.');
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.post(API_ENDPOINTS.WA_GATEWAY.TEST_SEND, {
        phone: testPhone,
        message: testMessage,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pesan uji coba.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Integrasi & Otomasi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          WhatsApp Gateway (Multi-Device)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Hubungkan nomor WhatsApp resmi Redor OBABA untuk mengirimkan notifikasi panggilan donor darurat secara otomatis kepada relawan yang cocok.
        </p>
      </div>

      {/* Main Connection Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                statusData.connected
                  ? 'bg-emerald-500 text-white'
                  : statusData.status === 'qr_ready'
                  ? 'bg-amber-500 text-white'
                  : statusData.status === 'connecting'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">Status Gateway</h3>
                {statusData.connected ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung
                  </span>
                ) : statusData.status === 'qr_ready' ? (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Scan QR Code
                  </span>
                ) : statusData.status === 'connecting' ? (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-spin" />
                    Menyiapkan QR...
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {statusData.connected
                  ? `Nomor Terhubung: +${statusData.phone}`
                  : statusData.status === 'qr_ready'
                  ? 'Scan QR Code di bawah menggunakan aplikasi WhatsApp Anda.'
                  : statusData.status === 'connecting'
                  ? 'Sedang membuat sesi baru dan menyiapkan QR Code...'
                  : 'Server siap. Klik tombol di kanan untuk menghubungkan WhatsApp.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fetchStatus(true)}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {statusData.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center space-x-1.5 py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{disconnecting ? 'Memutuskan...' : 'Putuskan Sesi'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting || statusData.status === 'connecting'}
                className="inline-flex items-center space-x-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{connecting || statusData.status === 'connecting' ? 'Membuat QR Code...' : 'Hubungkan / Scan QR'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State during Connecting */}
        {statusData.status === 'connecting' && (
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/90 flex flex-col items-center text-center space-y-3 max-w-md mx-auto animate-pulse">
            <div className="w-12 h-12 rounded-full border-3 border-blood-600 border-t-transparent animate-spin flex items-center justify-center" />
            <h4 className="font-bold text-sm text-slate-800">Sedang Membuat QR Code WhatsApp</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Sistem sedang menginisialisasi sesi Baileys multi-device. QR Code akan muncul dalam beberapa detik...
            </p>
          </div>
        )}

        {/* QR Code Display Area */}
        {statusData.status === 'qr_ready' && statusData.qr && (
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/90 flex flex-col items-center text-center space-y-4 max-w-md mx-auto animate-in fade-in zoom-in-95">
            <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-200">
              <img src={statusData.qr} alt="Scan WhatsApp QR" className="w-60 h-60 object-contain" />
            </div>

            <div className="space-y-1.5 w-full">
              <h4 className="font-black text-sm text-slate-900">Cara Menghubungkan:</h4>
              <ol className="text-xs text-slate-600 text-left space-y-1 list-decimal list-inside bg-white p-3.5 rounded-xl border border-slate-200/80">
                <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda.</li>
                <li>Buka <strong>Menu (titik 3)</strong> atau <strong>Setelan</strong>.</li>
                <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                <li>Arahkan kamera ke QR Code di atas.</li>
              </ol>
            </div>

            <p className="text-[11px] text-slate-400">
              QR Code akan diperbarui secara otomatis setiap beberapa detik jika kadaluarsa.
            </p>
          </div>
        )}

        {/* Connected Success Card */}
        {statusData.connected && (
          <div className="p-5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center space-x-3 text-emerald-900">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold">WhatsApp Gateway Aktif & Siap Mengirim Pesan</p>
              <p className="text-emerald-700 mt-0.5">
                Setiap permohonan darah mendesak dapat dikirimkan langsung ke relawan donor yang kompatibel melalui panel broadcast.
              </p>
            </div>
          </div>
        )}

        {/* Fallback Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Sistem Tetap Berjalan Normal Tanpa Gateway:</strong> Jika WhatsApp Gateway sedang terputus atau tidak diaktifkan, seluruh fitur website (pengajuan donor, pencarian, dan tombol manual kirim WhatsApp) tetap berfungsi 100% lancar tanpa gangguan.
          </div>
        </div>
      </div>

      {/* Test Message Form */}
      {statusData.connected && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Kirim Pesan Uji Coba</h3>
            <p className="text-xs text-slate-500">Kirimkan pesan uji coba ke nomor Anda untuk memastikan koneksi gateway berjalan lancar.</p>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Nomor WhatsApp Tujuan
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Isi Pesan
              </label>
              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingTest}
                className="inline-flex items-center space-x-1.5 py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? 'Mengirim...' : 'Kirim Pesan Tes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminWAGateway;
