import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import {
  User,
  CreditCard,
  History,
  Lock,
  MessageSquare,
  HelpCircle,
  LogOut,
  Edit,
  ShieldCheck,
  Calendar,
  Award,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import DigitalDonorCard from '../components/donor/DigitalDonorCard';
import DonorEligibilityBadge from '../components/donor/DonorEligibilityBadge';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, logout, updateProfileState, fetchProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Edit Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    blood_type: user?.blood_type || 'A',
    rhesus: user?.rhesus || '+',
    birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
    gender: user?.gender || 'L',
    address: user?.address || '',
    city: user?.city || 'Kab. Tangerang',
    last_donation_date: user?.last_donation_date ? user.last_donation_date.split('T')[0] : '',
    status: user?.status || 'siap',
  });

  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blood-100 text-blood-600 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Masuk ke Akun Anggota</h2>
        <p className="text-xs text-slate-500">
          Masuk untuk melihat kartu donor digital, riwayat donor darah, dan status kesiapan Anda.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/login"
            className="w-full py-3 bg-blood-600 hover:bg-blood-700 text-white rounded-xl font-bold text-sm shadow transition-colors"
          >
            Masuk Sekarang
          </Link>
          <Link
            to="/register"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
          >
            Daftar Anggota Baru
          </Link>
        </div>
      </div>
    );
  }

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    try {
      const res = await api.put(API_ENDPOINTS.AUTH.PROFILE, profileForm);
      if (res.data?.success) {
        toast.success(res.data.message || 'Profil berhasil diperbarui!');
        updateProfileState(res.data.data);
        setIsEditProfileOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoadingUpdate(true);
    try {
      const res = await api.put(API_ENDPOINTS.AUTH.PASSWORD, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Kata sandi berhasil diubah!');
        setIsChangePasswordOpen(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah kata sandi.');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Profile Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Profil Saya</h1>
          <p className="text-xs text-slate-500">Kelola identitas, kartu donor digital, dan status kesiapan Anda.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setProfileForm({
              name: user?.name || '',
              email: user?.email || '',
              blood_type: user?.blood_type || 'A',
              rhesus: user?.rhesus || '+',
              birth_date: user?.birth_date ? user.birth_date.split('T')[0] : '',
              gender: user?.gender || 'L',
              address: user?.address || '',
              city: user?.city || 'Kab. Tangerang',
              last_donation_date: user?.last_donation_date ? user.last_donation_date.split('T')[0] : '',
              status: user?.status || 'siap',
            });
            setIsEditProfileOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Data</span>
        </button>
      </div>

      {/* 1. Digital Donor Card Component */}
      <DigitalDonorCard user={user} />

      {/* 2. Donor Eligibility Status */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
          Status Kesiapan & Masa Jeda Donor:
        </h3>
        <DonorEligibilityBadge eligibility={user?.eligibility} status={user?.status} />
      </div>

      {/* 3. Detailed Profile Info Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          Informasi Identitas Anggota
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Nama Lengkap</span>
            <span className="text-slate-800 font-bold text-sm">{user?.name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Nomor WhatsApp</span>
            <span className="text-slate-800 font-bold text-sm">{user?.phone}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Golongan Darah & Rhesus</span>
            <span className="text-slate-800 font-bold text-sm">
              {user?.blood_type} ({user?.rhesus === '-' ? 'Rh-' : 'Rh+'})
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Nomor ID Kartu Donor</span>
            <span className="text-slate-800 font-bold text-sm">{user?.donor_card_no || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Tanggal Lahir / Usia</span>
            <span className="text-slate-800 font-semibold text-xs">
              {user?.birth_date ? new Date(user.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Kota Domisili & Alamat</span>
            <span className="text-slate-800 font-semibold text-xs">
              {user?.address ? `${user.address}, ` : ''}{user?.city || 'Kab. Tangerang'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Menu Navigasi Profil (Sesuai request client: Kartu donor, Riwayat donor, Kata sandi, Kritik & saran, Bantuan) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
        <Link
          to="/donor-card"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blood-50 text-blood-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">1. Kartu Donor Digital</p>
              <p className="text-xs text-slate-500">Lihat kartu tanda anggota & barcode resmi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/history"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">2. Riwayat Donor Darah</p>
              <p className="text-xs text-slate-500">Catatan riwayat, lokasi, dan tanggal donasi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <button
          type="button"
          onClick={() => setIsChangePasswordOpen(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">3. Kata Sandi Akun</p>
              <p className="text-xs text-slate-500">Ubah kata sandi keamanan akun Anda</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <Link
          to="/feedback"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">4. Kritik & Saran</p>
              <p className="text-xs text-slate-500">Kirim aspirasi untuk perbaikan komunitas</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/help"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">5. Panduan & Bantuan (FAQ)</p>
              <p className="text-xs text-slate-500">Syarat donor, aturan komunitas, dan panduan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* 5. Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-colors flex items-center justify-center space-x-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun</span>
      </button>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Data Anggota / Donor"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Golongan Darah</label>
              <select
                value={profileForm.blood_type}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, blood_type: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="A">Golongan A</option>
                <option value="B">Golongan B</option>
                <option value="AB">Golongan AB</option>
                <option value="O">Golongan O</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Rhesus</label>
              <select
                value={profileForm.rhesus}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, rhesus: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="+">Positif (+)</option>
                <option value="-">Negatif (-)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={profileForm.birth_date}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, birth_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Donor Terakhir (Tgl)</label>
              <input
                type="date"
                value={profileForm.last_donation_date}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, last_donation_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Status Ketersediaan</label>
            <select
              value={profileForm.status}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="siap">🟢 Siap Donor (Kondisi Sehat)</option>
              <option value="belum_bisa">⏳ Belum Bisa (Masa Pemulihan / Obat)</option>
              <option value="tidak_tersedia">🔴 Tidak Tersedia (Off Sementara)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Kota / Domisili</label>
            <input
              type="text"
              value={profileForm.city}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingUpdate}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {loadingUpdate ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Ubah Kata Sandi"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Kata Sandi Saat Ini</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Kata Sandi Baru</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingUpdate}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {loadingUpdate ? 'Memproses...' : 'Ubah Kata Sandi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
