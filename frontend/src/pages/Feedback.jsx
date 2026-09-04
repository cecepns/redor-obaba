import React, { useState } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Star, CheckCircle2, ArrowLeft, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Feedback = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    category: 'saran',
    message: '',
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error('Mohon lengkapi nama, nomor WhatsApp, dan isi pesan.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(API_ENDPOINTS.FEEDBACK.CREATE, formData);
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsSuccess(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim kritik & saran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link
        to="/profile"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Profil</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Kritik & Saran Komunitas</h1>
            <p className="text-xs text-slate-500">Sampaikan masukan demi kemajuan layanan Redor OBABA.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Pesan Anda Berhasil Terkirim!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Terima kasih atas aspirasi dan kepedulian Anda. Pengurus komunitas akan menindaklanjuti masukan Anda secepatnya.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setFormData((prev) => ({ ...prev, message: '' }));
              }}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              Kirim Pesan Lainnya
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nama Anda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Nama Lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kategori Pesan</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'saran', label: 'Saran' },
                  { id: 'kritik', label: 'Kritik' },
                  { id: 'apresiasi', label: 'Apresiasi' },
                  { id: 'pertanyaan', label: 'Tanya' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: c.id }))}
                    className={`py-2 rounded-xl font-bold transition-all text-center ${
                      formData.category === c.id
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Isi Pesan / Saran Anda <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="4"
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                required
                placeholder="Tuliskan pengalaman, kendala, atau saran perbaikan untuk aplikasi & kegiatan OBABA..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blood-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Masukan Anda'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;
