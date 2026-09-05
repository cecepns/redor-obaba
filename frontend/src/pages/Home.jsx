import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import {
  Calendar,
  Camera,
  Users,
  HeartHandshake,
  Droplets,
  PlusCircle,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Info,
  MapPin,
  Gift,
} from 'lucide-react';
import BloodStockCard from '../components/donor/BloodStockCard';
import ActivityCard from '../components/activity/ActivityCard';
import RequestWizardModal from '../components/request/RequestWizardModal';
import WhatsAppBroadcastModal from '../components/request/WhatsAppBroadcastModal';
import DonorEligibilityBadge from '../components/donor/DonorEligibilityBadge';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

export const Home = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedStockGroup, setSelectedStockGroup] = useState(null);
  const [groupDonors, setGroupDonors] = useState([]);
  const [loadingGroupDonors, setLoadingGroupDonors] = useState(false);

  // Broadcast modal state
  const [broadcastModalData, setBroadcastModalData] = useState({
    isOpen: false,
    request: null,
    matchingDonors: [],
    broadcastText: '',
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [stocksRes, activitiesRes, requestsRes, analyticsRes] = await Promise.all([
        api.get(API_ENDPOINTS.DONORS.STOCK_SUMMARY),
        api.get(`${API_ENDPOINTS.ACTIVITIES.LIST}?limit=3`),
        api.get(`${API_ENDPOINTS.BLOOD_REQUESTS.LIST}?status=mendesak&limit=3`),
        api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD),
      ]);

      if (stocksRes.data?.success) setStocks(stocksRes.data.data);
      if (activitiesRes.data?.success) setActivities(activitiesRes.data.data);
      if (requestsRes.data?.success) setUrgentRequests(requestsRes.data.data);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = async (stock) => {
    if (!isAdmin) {
      // Non-admin will navigate to stock summary page for privacy protection
      navigate('/stock');
      return;
    }
    setSelectedStockGroup(stock);
    setLoadingGroupDonors(true);
    try {
      const res = await api.get(
        `${API_ENDPOINTS.DONORS.LIST}?blood_type=${stock.blood_type}&rhesus=${encodeURIComponent(stock.rhesus)}&status=siap&limit=50`
      );
      if (res.data?.success) {
        setGroupDonors(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching group donors:', err);
    } finally {
      setLoadingGroupDonors(false);
    }
  };

  const handleRequestSuccess = async (data) => {
    if (isAdmin) {
      try {
        const bRes = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.MATCHING_DONORS(data.id));
        if (bRes.data?.success) {
          setBroadcastModalData({
            isOpen: true,
            request: bRes.data.request,
            matchingDonors: bRes.data.matchingDonors,
            broadcastText: bRes.data.broadcastText,
          });
        }
      } catch (err) {
        navigate('/requests');
      }
    } else {
      navigate('/requests');
    }
    fetchHomeData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      {/* 1. Clean Minimal Hero Banner (Clean White Card with Subtle Shadow & Location) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 bg-blood-50 border border-blood-100 text-blood-700 text-xs font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-blood-600" />
                <span>Komunitas Siaga Donor Darah Relawan</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Kab. Tangerang & Sekitarnya</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Setetes Darah Kita, <br />
              <span className="text-blood-600">Harapan Nyawa Sesama.</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              Platform respons cepat untuk menghubungkan pendonor sukarela dan pasien yang membutuhkan darah di wilayah Tangerang & sekitarnya. 100% gratis & transparan.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="inline-flex items-center space-x-2 py-3 px-5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Ajukan Butuh Darah</span>
              </button>

              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 py-3 px-5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs sm:text-sm transition-all"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Daftar Pendonor</span>
                </Link>
              ) : (
                <Link
                  to="/donor-card"
                  className="inline-flex items-center space-x-2 py-3 px-5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs sm:text-sm transition-all"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Kartu Donor Digital</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Stat Pill Cards */}
          {analytics && (
            <div className="grid grid-cols-2 gap-3 w-full lg:w-72 flex-shrink-0">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Donor Siap</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics.stats.ready_donors}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">🟢 Siap Donor</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Donasi Tercatat</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics.stats.total_bags_donated}</p>
                <span className="text-[10px] text-slate-400 font-medium">Kantong</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Anggota</span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics.stats.total_members}</p>
                <span className="text-[10px] text-slate-400 font-medium">Relawan</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mendesak</span>
                <p className="text-2xl font-black text-rose-600 mt-0.5">{analytics.stats.urgent_requests}</p>
                <span className="text-[10px] text-rose-600 font-semibold">🔴 Butuh Bantuan</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. User Status Card (If Logged In) */}
      {isAuthenticated && user && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {user.blood_type}{user.rhesus || '+'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">{user.name}</h3>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {user.role === 'admin' ? 'Admin' : 'Anggota'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  ID: {user.donor_card_no || 'OBABA-DNR-001'} • {user.total_donations || 0}x Donor
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <DonorEligibilityBadge eligibility={user.eligibility} status={user.status} />
            </div>
          </div>
        </div>
      )}

      {/* 3. Quick Action Grid Menu (Clean White Cards: Jadwal Donor, Donasi, Galeri Donor, Info Komunitas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/schedules"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-center"
        >
          <div className="w-11 h-11 rounded-xl bg-blood-50 text-blood-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">Jadwal Donor</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Mobil Unit & Agenda</span>
        </Link>

        <Link
          to="/donations"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-center"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">Donasi</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Bantuan Kemanusiaan</span>
        </Link>

        <Link
          to="/gallery"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-center"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">Galeri Donor</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Dokumentasi Relawan</span>
        </Link>

        <Link
          to="/help"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-center"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">Info Komunitas</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Aturan & Bantuan</span>
        </Link>
      </div>

      {/* 4. Notice Banner: Kemanusiaan 100% Gratis */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Aksi Kemanusiaan 100% Gratis & Bebas Biaya</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh pendonor donor darah adalah relawan. Dilarang keras melakukan pungutan biaya apapun dalam proses donor.
            </p>
          </div>
        </div>
        <Link
          to="/requests"
          className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          Lihat Permintaan Darah
        </Link>
      </div>

      {/* 5. Live Blood Stock Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blood-600" />
              Stok & Ketersediaan Donor Darah
            </h2>
            <p className="text-xs text-slate-500">
              Pantauan pendonor aktif berstatus siap donor per golongan darah
            </p>
          </div>
          <Link
            to="/stock"
            className="inline-flex items-center space-x-1 text-xs font-bold text-blood-600 hover:text-blood-700 transition-colors"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-32" count={8} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stocks.map((stock) => (
              <BloodStockCard
                key={`${stock.blood_type}${stock.rhesus}`}
                stock={stock}
                onClick={() => handleStockClick(stock)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Urgent Requests Section */}
      {urgentRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Permintaan Darah Mendesak
              </h2>
            </div>
            <Link
              to="/requests"
              className="text-xs font-bold text-blood-600 hover:text-blood-700 flex items-center gap-0.5"
            >
              Lihat Semua ({urgentRequests.length})
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                        {req.blood_type}{req.rhesus}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{req.patient_name}</h4>
                        <p className="text-xs text-slate-500">{req.patient_age} Th • Komponen {req.blood_component}</p>
                      </div>
                    </div>
                    <Badge variant="mendesak" size="sm">Mendesak</Badge>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mb-1.5 line-clamp-1">
                    🏥 {req.hospital_name}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    Butuh <strong>{req.bags_needed} Kantong</strong> (Terpenuhi: {req.bags_fulfilled}) • {req.diagnosis}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-bold">
                    {req.ready_helpers_count || 0} Relawan Bersedia
                  </span>
                  <Link
                    to={`/requests/${req.id}`}
                    className="py-1.5 px-3.5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    Bantu Pasien
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Berita & Kegiatan Komunitas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Berita & Kegiatan Komunitas
            </h2>
            <p className="text-xs text-slate-500">
              Dokumentasi aksi kemanusiaan, sosialisasi, dan edukasi kesehatan
            </p>
          </div>
          <Link
            to="/activities"
            className="inline-flex items-center space-x-1 text-xs font-bold text-blood-600 hover:text-blood-700 transition-colors"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-56" count={3} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>
        )}
      </div>

      {/* Modal: View Donors for Selected Blood Group */}
      <Modal
        isOpen={!!selectedStockGroup}
        onClose={() => setSelectedStockGroup(null)}
        title={selectedStockGroup ? `Daftar Pendonor Siap: Golongan ${selectedStockGroup.blood_type} (${selectedStockGroup.rhesus === '-' ? 'Rh-' : 'Rh+'})` : ''}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                {selectedStockGroup?.blood_type}{selectedStockGroup?.rhesus}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedStockGroup?.ready_count} Pendonor Siap Donor
                </p>
                <p className="text-[11px] text-slate-500">
                  Status jeda 3 bulan terpenuhi & kontak WhatsApp aktif.
                </p>
              </div>
            </div>
            <Badge variant={selectedStockGroup?.stock_status} size="sm">
              {selectedStockGroup?.stock_status === 'tersedia' ? 'Tersedia' : selectedStockGroup?.stock_status === 'sedikit' ? 'Sedikit' : 'Habis'}
            </Badge>
          </div>

          {loadingGroupDonors ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-16" count={4} />
            </div>
          ) : groupDonors.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {groupDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{donor.name}</h4>
                    <p className="text-xs text-slate-500">
                      {donor.city || 'Kab. Tangerang'} • {donor.total_donations || 0}x Donor
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${donor.phone.replace(/\D/g, '').startsWith('0') ? '62' + donor.phone.replace(/\D/g, '').slice(1) : donor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kak ${donor.name}, salam kemanusiaan dari Komunitas Donor Darah Redor OBABA.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Chat WA</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              Belum ada pendonor berstatus siap untuk golongan ini saat ini.
            </p>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedStockGroup(null)}
              className="py-2 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* 3-Step Wizard Modal for Creating Blood Request */}
      <RequestWizardModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />

      {/* WhatsApp Broadcast Format Modal */}
      <WhatsAppBroadcastModal
        isOpen={broadcastModalData.isOpen}
        onClose={() => setBroadcastModalData((prev) => ({ ...prev, isOpen: false }))}
        request={broadcastModalData.request}
        matchingDonors={broadcastModalData.matchingDonors}
        broadcastText={broadcastModalData.broadcastText}
      />
    </div>
  );
};

export default Home;
