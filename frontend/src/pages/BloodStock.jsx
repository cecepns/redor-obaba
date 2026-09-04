import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Droplets, Search, Filter, PhoneCall, Award, Users, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import BloodStockCard from '../components/donor/BloodStockCard';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export const BloodStock = () => {
  const [stockSummary, setStockSummary] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDonors, setLoadingDonors] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [rhesusFilter, setRhesusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('siap');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Modal contact
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    fetchStockSummary();
  }, []);

  useEffect(() => {
    fetchDonors();
  }, [debouncedSearch, bloodTypeFilter, rhesusFilter, statusFilter, page, limit]);

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
    setBloodTypeFilter(stock.blood_type);
    setRhesusFilter(stock.rhesus);
    setStatusFilter('siap');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Droplets className="w-4 h-4" />
          <span>Real-time Monitoring</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Stok Darah & Database Donor Komunitas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Pantau ketersediaan donor aktif yang siap mendonorkan darah secara sukarela untuk 8 golongan darah utama.
        </p>
      </div>

      {/* Stock Cards Grid (8 Groups) */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Pilih Golongan Darah untuk Filter Cepat:
        </h3>
        {loadingSummary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-28" count={8} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stockSummary.map((st) => (
              <div
                key={`${st.blood_type}${st.rhesus}`}
                className={`cursor-pointer transition-all ${
                  bloodTypeFilter === st.blood_type && rhesusFilter === st.rhesus
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

      {/* Donor Database Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blood-600" />
              Daftar Relawan Pendonor
            </h2>
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
              placeholder="Cari nama relawan, nomor WA, kota domisili..."
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

        {/* Donors Table / Cards */}
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
                      {donor.city || 'Kab. Tangerang'} • ID: {donor.donor_card_no || 'OBABA-DNR'}
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
                    href={`https://wa.me/${donor.phone.replace(/\D/g, '').startsWith('0') ? '62' + donor.phone.replace(/\D/g, '').slice(1) : donor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kak ${donor.name}, salam kemanusiaan dari Komunitas Donor Darah Redor OBABA.`)}`}
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
    </div>
  );
};

export default BloodStock;
