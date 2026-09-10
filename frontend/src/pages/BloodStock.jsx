import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import {
  Droplets,
  Search,
  Filter,
  PhoneCall,
  Award,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
  Lock,
  Sparkles,
} from 'lucide-react';
import BloodStockCard from '../components/donor/BloodStockCard';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

export const BloodStock = () => {
  const { user, isAdmin } = useAuth();
  const [stockSummary, setStockSummary] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDonors, setLoadingDonors] = useState(false);

  // Filters & Search (Only for Admin)
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [rhesusFilter, setRhesusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('siap');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  useEffect(() => {
    fetchStockSummary();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDonors();
    }
  }, [isAdmin, debouncedSearch, bloodTypeFilter, rhesusFilter, statusFilter, page, limit]);

  const fetchStockSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get(API_ENDPOINTS.DONORS.STOCK_SUMMARY);
      if (res.data?.success) {
        setStockSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetch stock summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchDonors = async () => {
    try {
      setLoadingDonors(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        blood_type: bloodTypeFilter,
        rhesus: rhesusFilter,
        status: statusFilter,
      };
      const res = await api.get(API_ENDPOINTS.DONORS.LIST, { params });
      if (res.data?.success) {
        setDonors(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetch donors:', err);
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleQuickGroupSelect = (stock) => {
    if (isAdmin) {
      setBloodTypeFilter(stock.blood_type);
      setRhesusFilter(stock.rhesus);
      setStatusFilter('siap');
      setPage(1);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Droplets className="w-4 h-4" />
          <span>Real-time Monitoring</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Ketersediaan Stok Darah Relawan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Pantau ketersediaan donor aktif yang berstatus siap mendonorkan darah sukarela untuk 8 golongan darah utama di Tangerang & sekitarnya.
        </p>
      </div>

      {/* Stock Cards Grid (8 Groups) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            {isAdmin ? 'Pilih Golongan Darah untuk Filter Admin:' : 'Status Ketersediaan 8 Golongan Darah:'}
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            🟢 Update Real-time
          </span>
        </div>

        {loadingSummary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-32" count={8} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stockSummary.map((st) => (
              <div
                key={`${st.blood_type}${st.rhesus}`}
                className={`transition-all ${
                  isAdmin && bloodTypeFilter === st.blood_type && rhesusFilter === st.rhesus
                    ? 'ring-2 ring-blood-600 rounded-2xl scale-102'
                    : ''
                }`}
                onClick={() => handleQuickGroupSelect(st)}
              >
                <BloodStockCard stock={st} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRIVACY & SECURITY SECTION (FOR PUBLIC / REGULAR USERS) */}
      {!isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Perlindungan Privasi Data Relawan Pendonor
                </h3>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Aman & Terverifikasi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Demi menjaga privasi relawan dan mencegah praktik komersialisasi/jual beli darah ilegal, database kontak pendonor hanya dikelola dan dihubungi langsung oleh Tim Pengurus Komunitas Redor OBABA.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm">
                <HeartHandshake className="w-4 h-4 text-blood-600 flex-shrink-0" />
                <span>Membutuhkan Darah Mendesak?</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Silakan buat pengajuan butuh darah melalui form permintaan. Sistem dan tim relawan kami akan segera memvalidasi dan mencarikan pendonor yang sesuai.
              </p>
              <div className="pt-2">
                <Link
                  to="/requests"
                  className="inline-flex items-center space-x-1.5 py-2 px-4 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Ajukan Kebutuhan Darah</span>
                </Link>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Prinsip Aksi Kemanusiaan 100% Gratis</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seluruh relawan donor mendonorkan darah secara sukarela. Dilarang keras meminta atau memberikan imbalan uang dalam bentuk apapun terkait darah donor.
              </p>
              <div className="pt-2">
                <Link
                  to="/help"
                  className="inline-flex items-center space-x-1.5 py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <span>Baca Aturan & Panduan Bantuan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ONLY: FULL DONOR DATABASE TABLE & SEARCH */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blood-600" />
                  Database Relawan Pendonor (Panel Admin)
                </h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Total {total} relawan terdaftar dalam kriteria filter saat ini
              </p>
            </div>

            {/* Reset filter if active */}
            {(bloodTypeFilter || rhesusFilter || statusFilter !== 'siap' || search) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setBloodTypeFilter('');
                  setRhesusFilter('');
                  setStatusFilter('siap');
                  setPage(1);
                }}
                className="text-xs font-bold text-blood-600 hover:text-blood-800 bg-blood-50 px-3 py-1.5 rounded-xl self-start sm:self-auto"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Filter & Search Bar (Realtime Debounce 350ms) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama relawan, nomor WA, domisili..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            {/* Golongan Darah Selector */}
            <div>
              <select
                value={bloodTypeFilter}
                onChange={(e) => {
                  setBloodTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              >
                <option value="">Semua Golongan Darah</option>
                <option value="A">Golongan A</option>
                <option value="B">Golongan B</option>
                <option value="AB">Golongan AB</option>
                <option value="O">Golongan O</option>
              </select>
            </div>

            {/* Status Kesiapan Selector */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="siap">🟢 Siap Donor (Eligible)</option>
                <option value="belum_bisa">⏳ Belum Bisa (Jeda 3 Bulan)</option>
                <option value="tidak_tersedia">🔴 Tidak Tersedia</option>
              </select>
            </div>
          </div>

          {/* Donors Table */}
          {loadingDonors ? (
            <div className="space-y-3">
              <Skeleton className="h-16" count={5} />
            </div>
          ) : donors.length > 0 ? (
            <div className="space-y-2.5">
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded-xl">
                <span className="col-span-4">Nama Relawan & ID</span>
                <span className="col-span-2 text-center">Golongan Darah</span>
                <span className="col-span-2 text-center">Status Kesiapan</span>
                <span className="col-span-2 text-center">Riwayat Donasi</span>
                <span className="col-span-2 text-right">Aksi Kontak</span>
              </div>

              {donors.map((donor) => (
                <div
                  key={donor.id}
                  className="flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-colors"
                >
                  {/* Name & ID */}
                  <div className="col-span-4 flex items-center space-x-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                      {donor.blood_type}{donor.rhesus}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{donor.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {donor.city || '-'} • ID: {donor.donor_card_no || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div className="col-span-2 text-left md:text-center w-full flex md:block items-center justify-between">
                    <span className="text-xs text-slate-500 md:hidden">Golongan:</span>
                    <span className="text-xs font-black px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800">
                      {donor.blood_type} ({donor.rhesus === '-' ? 'Rh-' : 'Rh+'})
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-left md:text-center w-full flex md:block items-center justify-between">
                    <span className="text-xs text-slate-500 md:hidden">Status:</span>
                    <Badge variant={donor.status} size="sm" dot>
                      {donor.status === 'siap' ? 'Siap Donor' : donor.status === 'belum_bisa' ? 'Belum Bisa' : 'Tidak Tersedia'}
                    </Badge>
                  </div>

                  {/* Total Donations */}
                  <div className="col-span-2 text-left md:text-center w-full flex md:block items-center justify-between">
                    <span className="text-xs text-slate-500 md:hidden">Total Donasi:</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center md:justify-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {donor.total_donations || 0} Kali
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-2 text-right w-full flex justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <a
                      href={`https://wa.me/${donor.phone.replace(/\D/g, '').startsWith('0') ? '62' + donor.phone.replace(/\D/g, '').slice(1) : donor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kak ${donor.name}, salam kemanusiaan dari Tim Admin Komunitas Donor Darah Redor OBABA.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Tidak Ada Pendonor Ditemukan"
              description="Tidak ada data pendonor yang sesuai dengan pencarian atau filter yang Anda pilih."
            />
          )}

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={changeLimit}
          />
        </div>
      )}
    </div>
  );
};

export default BloodStock;
