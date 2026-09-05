import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  Hospital,
  MapPin,
  PhoneCall,
  User,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  MessageSquare,
  AlertCircle,
  Copy,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import WhatsAppBroadcastModal from '../components/request/WhatsAppBroadcastModal';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [request, setRequest] = useState(null);
  const [matchingDonors, setMatchingDonors] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Response modal / action
  const [isResponding, setIsResponding] = useState(false);
  const [responseStatus, setResponseStatus] = useState('bisa');
  const [responseNote, setResponseNote] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Broadcast modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id, isAdmin]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.DETAIL(id));
      if (res.data?.success) {
        setRequest(res.data.data);
        setResponses(res.data.data.responses || []);
      }

      // Fetch broadcast text format & matching donors only if Admin (for donor privacy)
      if (isAdmin) {
        try {
          const bRes = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.MATCHING_DONORS(id));
          if (bRes.data?.success) {
            setBroadcastText(bRes.data.broadcastText);
            setMatchingDonors(bRes.data.matchingDonors || []);
          }
        } catch (bErr) {
          console.error('Error fetching matching donors:', bErr);
        }
      }
    } catch (err) {
      console.error('Error fetching request detail:', err);
      toast.error('Gagal memuat detail permintaan darah.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu untuk konfirmasi kesediaan donor.');
      navigate('/login');
      return;
    }

    setSubmittingResponse(true);
    try {
      const res = await api.post(API_ENDPOINTS.BLOOD_REQUESTS.RESPOND(id), {
        response_status: responseStatus,
        note: responseNote,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsResponding(false);
        setResponseNote('');
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim konfirmasi.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCloseRequest = async () => {
    if (!window.confirm('Tutup dan tandai permintaan darah ini sebagai selesai?')) return;
    try {
      const res = await api.patch(API_ENDPOINTS.BLOOD_REQUESTS.UPDATE_STATUS(id), {
        status: 'selesai',
        bags_fulfilled: request.bags_needed,
      });
      if (res.data?.success) {
        toast.success('Permintaan darah berhasil ditutup.');
        fetchDetail();
      }
    } catch (err) {
      toast.error('Gagal menutup permintaan darah.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Permintaan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Data permintaan darah mungkin telah dihapus atau tidak tersedia.</p>
        <Link to="/requests" className="inline-block py-2 px-4 bg-blood-600 text-white font-bold rounded-xl text-xs">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const isFulfilled = request.bags_fulfilled >= request.bags_needed;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button & Admin Broadcast Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/requests"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </Link>

        {/* Format Broadcast WA (Hanya Ada di Dashboard / Tampilan Admin untuk Privasi Pendonor) */}
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Format Broadcast WA (Admin)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Request Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blood-700 to-rose-500 text-white flex flex-col items-center justify-center font-black text-2xl shadow-lg shadow-blood-600/30">
              <span>{request.blood_type}</span>
              <span className="text-xs">{request.rhesus === '-' ? 'Rh-' : 'Rh+'}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Permintaan Darah Darurat #{request.id}
                </span>
                <Badge variant={request.status} size="sm">
                  {request.status.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{request.patient_name}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Usia: {request.patient_age} Tahun • Komponen: <strong>{request.blood_component}</strong>
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center sm:text-right">
            <span className="text-xs text-slate-500 font-semibold block">Kebutuhan Kantong</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {request.bags_fulfilled} / {request.bags_needed} <span className="text-xs font-bold text-slate-500">Kantong</span>
            </div>
            {isFulfilled && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center sm:justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terpenuhi Penuh
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-1.5">
              <Hospital className="w-4 h-4 text-blood-600" />
              Lokasi Perawatan Medis
            </h4>
            <p className="font-extrabold text-slate-900 text-base">{request.hospital_name}</p>
            {request.hospital_room && (
              <p className="text-slate-600 font-medium">Ruang: {request.hospital_room}</p>
            )}
            {request.patient_address && (
              <p className="text-slate-500 text-xs">Alamat: {request.patient_address}</p>
            )}
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blood-600" />
              Kontak Penanggung Jawab (CP)
            </h4>
            <p className="font-extrabold text-slate-900 text-base">{request.cp_name}</p>
            <p className="text-slate-600 font-medium">Hubungan: {request.cp_relation}</p>
            <div className="pt-1">
              <a
                href={`https://wa.me/${request.cp_phone.replace(/\D/g, '').startsWith('0') ? '62' + request.cp_phone.replace(/\D/g, '').slice(1) : request.cp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${request.cp_name}, saya melihat informasi kebutuhan darah untuk pasien ${request.patient_name} di aplikasi Redor OBABA.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Hubungi CP ({request.cp_phone})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Diagnosis & Emergency Notes */}
        <div className="p-4 bg-blood-50/50 border border-blood-100 rounded-2xl space-y-1.5">
          <span className="text-xs font-bold text-blood-800 uppercase tracking-wider block">
            Diagnosa Medis & Catatan Kebutuhan:
          </span>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {request.diagnosis}
          </p>
          {request.emergency_note && (
            <p className="text-xs text-blood-700 pt-1 border-t border-blood-100/60 font-medium">
              ⚠️ Catatan Darurat: {request.emergency_note}
            </p>
          )}
        </div>

        {/* Donor Response Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsResponding(true)}
            className="inline-flex items-center space-x-2 py-3 px-6 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blood-600/30 transition-all hover:scale-102"
          >
            <HeartHandshake className="w-5 h-5" />
            <span>Konfirmasi Kesediaan Donor Anda</span>
          </button>

          {(user?.role === 'admin' || user?.id === request.user_id) && request.status !== 'selesai' && (
            <button
              type="button"
              onClick={handleCloseRequest}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Tandai Permintaan Selesai
            </button>
          )}
        </div>
      </div>

      {/* Matching Ready Donors Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blood-600" />
              Calon Pendonor Cocok Berstatus Siap ({matchingDonors.length})
            </h3>
            <p className="text-xs text-slate-500">
              Daftar relawan yang memenuhi syarat kecocokan darah ({request.blood_type}{request.rhesus}) dan jeda 3 bulan.
            </p>
          </div>
        </div>

        {matchingDonors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingDonors.map((donor) => (
              <div
                key={donor.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blood-600 text-white flex items-center justify-center font-bold text-xs">
                      {donor.blood_type}{donor.rhesus}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{donor.name}</h5>
                      <span className="text-[11px] text-slate-500">{donor.city || 'Kab. Tangerang'}</span>
                    </div>
                  </div>
                  <Badge variant="siap" size="sm">Siap</Badge>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200">
                  <a
                    href={`https://wa.me/${donor.phone.replace(/\D/g, '').startsWith('0') ? '62' + donor.phone.replace(/\D/g, '').slice(1) : donor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(broadcastText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm transition-all"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Kirim WA</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">
            Belum ada donor cocok berstatus siap di sistem untuk golongan ini.
          </p>
        )}
      </div>

      {/* Responses Log */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blood-600" />
          Log Respon Pendonor ({responses.length})
        </h3>

        {responses.length > 0 ? (
          <div className="space-y-2">
            {responses.map((resp) => (
              <div
                key={resp.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                    {resp.blood_type}{resp.rhesus}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{resp.donor_name}</p>
                    {resp.note && <p className="text-slate-600 italic">"{resp.note}"</p>}
                  </div>
                </div>

                <div className="text-right">
                  <Badge
                    variant={resp.response_status === 'bisa' || resp.response_status === 'sudah_donor' ? 'selesai' : 'dibatalkan'}
                    size="sm"
                  >
                    {resp.response_status === 'bisa'
                      ? 'Bisa Donor'
                      : resp.response_status === 'sudah_donor'
                      ? 'Sudah Donor'
                      : 'Belum Bisa'}
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(resp.responded_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">
            Belum ada respon masuk dari pendonor.
          </p>
        )}
      </div>

      {/* Modal: Donor Response Confirmation */}
      <Modal
        isOpen={isResponding}
        onClose={() => setIsResponding(false)}
        title="Konfirmasi Kesiapan Bantuan Donor"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRespondSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Pilih Status Kesediaan Anda:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResponseStatus('bisa')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  responseStatus === 'bisa'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                <span>Bisa Hadir</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStatus('sudah_donor')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  responseStatus === 'sudah_donor'
                    ? 'bg-blood-600 text-white border-blood-600 shadow-md shadow-blood-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <HeartHandshake className="w-5 h-5 mx-auto mb-1" />
                <span>Sudah Donor</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStatus('tidak_bisa')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  responseStatus === 'tidak_bisa'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <XCircle className="w-5 h-5 mx-auto mb-1" />
                <span>Belum Bisa</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Catatan untuk Pemohon / Keluarga:
            </label>
            <textarea
              rows="2"
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Contoh: Saya sedang meluncur ke RSUD jam 15:00..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResponding(false)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingResponse}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
            >
              {submittingResponse ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Broadcast WhatsApp Modal */}
      <WhatsAppBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        request={request}
        matchingDonors={matchingDonors}
        broadcastText={broadcastText}
      />
    </div>
  );
};

export default RequestDetail;
