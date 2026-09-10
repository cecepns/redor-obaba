import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Lock, Droplet, MapPin, Calendar, ArrowRight, ShieldCheck, HeartHandshake, CheckCircle2, Clock } from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    blood_type: 'A',
    rhesus: '+',
    birth_date: '',
    gender: 'L',
    city: '',
    address: '',
    last_donation_date: '',
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password || !formData.blood_type) {
      toast.error('Mohon lengkapi Nama Lengkap, Nomor WhatsApp, Kata Sandi, dan Golongan Darah.');
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);
    if (result.success) {
      setSuccessData(result.user || formData);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-slate-200/80 mx-auto flex items-center justify-center">
          <img src="/obaba-logo.jpeg" alt="Redor OBABA" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pendaftaran Anggota / Pendonor
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Daftarkan diri Anda untuk mendapatkan Kartu Donor Digital & bergabung dalam aksi penyelamatan nyawa sesama.
        </p>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Contoh: Cecep Supriatna"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="0812xxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Email (Opsional)
              </label>
              <input
                type="email"
                name="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Blood Type & Rhesus */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-2">
              Golongan Darah <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['A', 'B', 'AB', 'O'].map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, blood_type: bt }))}
                  className={`py-2.5 rounded-xl font-black text-base border transition-all ${
                    formData.blood_type === bt
                      ? 'bg-blood-600 text-white border-blood-600 shadow-md shadow-blood-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Rhesus <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['+', '-'].map((rh) => (
                  <button
                    key={rh}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rhesus: rh }))}
                    className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                      formData.rhesus === rh
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {rh === '+' ? 'Positif (+)' : 'Negatif (-)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Jenis Kelamin
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Donor Terakhir (Jika ada)
              </label>
              <input
                type="date"
                name="last_donation_date"
                value={formData.last_donation_date}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kota / Wilayah Domisili
              </label>
              <input
                type="text"
                name="city"
                placeholder="Contoh: Kab. Tangerang / Serpong"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Alamat Lengkap
            </label>
            <textarea
              name="address"
              rows="2"
              placeholder="Alamat rumah / domisili Anda..."
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div className="p-3 bg-blood-50 border border-blood-100 rounded-2xl flex items-center space-x-2 text-blood-800 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-blood-600 flex-shrink-0" />
            <span>Sistem akan otomatis menghitung masa jeda donor darah 3 bulan dan membuat Kartu Donor Digital Anda.</span>
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
                <span>Daftar Sekarang & Dapatkan Kartu</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-bold text-blood-600 hover:underline">
            Masuk ke Akun
          </Link>
        </div>
      </div>

      {/* Modal Sukses Pendaftaran & Menunggu ACC Admin */}
      <Modal
        isOpen={!!successData}
        onClose={() => navigate('/login')}
        title="Pendaftaran Berhasil Diajukan"
        maxWidth="max-w-md"
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              Menunggu Persetujuan (ACC) Admin
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Terima kasih <strong className="text-slate-800">{successData?.name}</strong>, formulir pendaftaran Anda telah diterima sistem Redor OBABA.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Nomor Registrasi:</span>
              <span className="font-mono font-bold text-slate-800">{successData?.donor_card_no || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WhatsApp:</span>
              <span className="font-semibold text-slate-800">{successData?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Golongan Darah:</span>
              <span className="font-black text-blood-600">{successData?.blood_type}{successData?.rhesus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Akun:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                Menunggu ACC Admin
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Admin akan memverifikasi keanggotaan Anda segera. Anda dapat melakukan login setelah akun disetujui (ACC).
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blood-600/20 transition-all"
          >
            Menuju Halaman Masuk (Login)
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Register;

