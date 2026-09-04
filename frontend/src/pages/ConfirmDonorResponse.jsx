import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Hospital,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import toast from 'react-hot-toast';

export const ConfirmDonorResponse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.DETAIL(id));
      if (res.data?.success) {
        setRequest(res.data.data);
      }
    } catch (err) {
      console.error('Error fetch request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (status) => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk atau daftar terlebih dahulu untuk konfirmasi kesediaan.');
      navigate(`/login?redirect=/confirm-request/${id}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(API_ENDPOINTS.BLOOD_REQUESTS.RESPOND(id), {
        response_status: status,
        note,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSubmittedStatus(status);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim konfirmasi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h3 className="text-lg font-bold text-slate-800">Permintaan tidak ditemukan</h3>
        <Link to="/" className="text-blood-600 font-bold text-sm mt-2 inline-block">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header Badge */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blood-100 text-blood-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <HeartHandshake className="w-3.5 h-3.5 text-blood-600" />
          <span>Konfirmasi Bantuan Relawan</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Permintaan Transfusi Darah
        </h1>
        <p className="text-xs text-slate-500">
          Setiap bantuan Anda sangat berharga bagi kesembuhan pasien.
        </p>
      </div>

      {/* Patient Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blood-600 text-white flex flex-col items-center justify-center font-black text-xl shadow-md shadow-blood-600/20">
              <span>{request.blood_type}</span>
              <span className="text-xs leading-none">{request.rhesus === '-' ? 'Rh-' : 'Rh+'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Pasien
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                {request.patient_name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {request.patient_age} Tahun • {request.blood_component}
              </p>
            </div>
          </div>
          <Badge variant={request.status} size="sm">
            {request.status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <p className="flex items-start gap-2">
            <Hospital className="w-4 h-4 text-blood-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>{request.hospital_name}</strong> {request.hospital_room ? `(${request.hospital_room})` : ''}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <HeartHandshake className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>Kebutuhan: <strong>{request.bags_needed} Kantong</strong> (Terpenuhi: {request.bags_fulfilled})</span>
          </p>
          <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-medium">
            Diagnosa: {request.diagnosis}
          </p>
        </div>

        {/* Contact Info */}
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Kontak Penanggung Jawab</span>
            <p className="font-extrabold text-emerald-950">{request.cp_name} ({request.cp_relation})</p>
            <p className="text-emerald-700 font-mono">{request.cp_phone}</p>
          </div>
          <a
            href={`tel:${request.cp_phone.replace(/\D/g, '')}`}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
        </div>

        {/* Action Confirmation Buttons */}
        {submittedStatus ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Respons Anda Telah Tercatat!</h4>
            <p className="text-xs text-slate-500">
              {submittedStatus === 'bisa'
                ? 'Terima kasih atas kemuliaan hati Anda. Silakan langsung koordinasi dengan keluarga pasien.'
                : 'Terima kasih atas informasinya. Tetap sehat dan siap untuk kesempatan donor berikutnya!'}
            </p>
            <Link
              to="/requests"
              className="inline-block pt-2 text-xs font-bold text-blood-600 hover:underline"
            >
              Lihat Daftar Permintaan Lainnya
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Catatan Opsional:
              </label>
              <input
                type="text"
                placeholder="Contoh: Saya bisa datang jam 14:00 siang..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirm('bisa')}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAYA BERSEDIA</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirm('tidak_bisa')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs border border-slate-200 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Belum Bisa</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmDonorResponse;
