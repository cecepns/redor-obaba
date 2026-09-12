import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { LogIn, Lock, Phone, Mail, ArrowRight, ShieldCheck, HeartHandshake, KeyRound, CheckCircle2, RotateCw } from 'lucide-react';
import Modal from '../components/common/Modal';
import PWAInstallFloating from '../components/common/PWAInstallFloating';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.identifier, formData.password);
    setLoading(false);
    if (result.success) {
      const explicitRedirect = searchParams.get('redirect');
      if (explicitRedirect) {
        navigate(explicitRedirect);
      } else if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      toast.error('Mohon masukkan email yang terdaftar.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: forgotEmail.trim() });
      if (res.data?.success) {
        toast.success(res.data.message || 'Kode OTP telah dikirim ke email Anda!');
        setForgotStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim kode verifikasi ke email.';
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      toast.error('Mohon lengkapi kode OTP dan kata sandi baru.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setResettingPassword(true);
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Kata sandi berhasil direset! Silakan login.');
        setIsForgotModalOpen(false);
        setFormData((prev) => ({ ...prev, identifier: forgotEmail.trim(), password: '' }));
        // Reset state
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mereset kata sandi.';
      toast.error(msg);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* App Header Logo */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-slate-200/80 mx-auto flex items-center justify-center">
          <img src="/obaba-logo.jpeg" alt="Redor OBABA" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Masuk ke Akun Redor OBABA
        </h1>
        <p className="text-xs text-slate-500">
          Gunakan Nomor WhatsApp atau Email yang telah terdaftar.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nomor WhatsApp / Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Contoh: 081234567890 / admin@redorobaba.org"
                value={formData.identifier}
                onChange={(e) => setFormData((prev) => ({ ...prev, identifier: e.target.value }))}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotStep(1);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] font-bold text-blood-600 hover:text-blood-700 hover:underline"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blood-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Belum terdaftar sebagai anggota?{' '}
          <Link to="/register" className="font-bold text-blood-600 hover:underline">
            Daftar Donor Sekarang
          </Link>
        </div>
      </div>

      {/* Modal Lupa & Reset Kata Sandi Anggota */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotStep(1);
        }}
        title="Reset Kata Sandi Anggota"
        maxWidth="max-w-md"
      >
        {forgotStep === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4 py-1 text-xs">
            <div className="text-center space-y-2 pb-2">
              <div className="w-12 h-12 rounded-2xl bg-blood-50 text-blood-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-medium">
                Masukkan alamat email yang terdaftar pada akun anggota Anda. Kami akan mengirimkan kode verifikasi 6 digit.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Alamat Email Anggota
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={sendingOtp}
                className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold rounded-xl shadow-md shadow-blood-600/20 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {sendingOtp ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengirim Kode...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Kode OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 py-1 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                Kode OTP telah dikirimkan ke <strong className="font-bold">{forgotEmail}</strong>. Masukkan kode 6 digit dan buat kata sandi baru.
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kode Verifikasi (OTP 6 Digit)
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="Contoh: 123456"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full text-center tracking-[8px] font-mono text-xl font-black py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                placeholder="Ketik ulang kata sandi baru"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="text-slate-500 hover:text-slate-700 font-bold text-xs flex items-center space-x-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Ganti Email / Kirim Ulang</span>
              </button>

              <button
                type="submit"
                disabled={resettingPassword}
                className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold rounded-xl shadow-md shadow-blood-600/20 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {resettingPassword ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Kata Sandi</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Floating PWA Install Widget */}
      <PWAInstallFloating />
    </div>
  );
};

export default Login;

