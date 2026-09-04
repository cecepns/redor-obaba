import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import {
  HeartHandshake,
  Search,
  PlusCircle,
  Hospital,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Share2,
} from 'lucide-react';
import RequestWizardModal from '../components/request/RequestWizardModal';
import WhatsAppBroadcastModal from '../components/request/WhatsAppBroadcastModal';
import Pagination from '../components/common/Pagination';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export const BloodRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    isOpen: false,
    request: null,
    matchingDonors: [],
    broadcastText: '',
  });

  useEffect(() => {
    fetchRequests();
  }, [debouncedSearch, statusFilter, bloodTypeFilter, page, limit]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        blood_type: bloodTypeFilter,
      };
      const res = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.LIST, { params });
      if (res.data?.success) {
        setRequests(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = async (createdData) => {
    try {
      const bRes = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.MATCHING_DONORS(createdData.id));
      if (bRes.data?.success) {
        setBroadcastData({
          isOpen: true,
          request: bRes.data.request,
          matchingDonors: bRes.data.matchingDonors,
          broadcastText: bRes.data.broadcastText,
        });
      }
    } catch (err) {
      // Fallback reload
    }
    fetchRequests();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header & Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Pusat Tanggap Darurat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Permintaan Darah Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Daftar pengajuan kebutuhan darah yang sedang dicarikan pendonor siap donor di komunitas Redor OBABA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center justify-center space-x-2 py-3 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blood-600/30 hover:scale-102 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Ajukan Permintaan Darah</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama pasien, RS, diagnosa penyakit..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            >
              <option value="">Semua Status Permintaan</option>
              <option value="mendesak">🔴 Mendesak (Urgent)</option>
              <option value="berjalan">🔵 Sedang Berjalan</option>
              <option value="selesai">🟢 Selesai Terpenuhi</option>
              <option value="dibatalkan">⚪ Dibatalkan</option>
            </select>
          </div>

          {/* Blood Type Filter */}
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
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-28" count={4} />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4 pt-2">
            {requests.map((item) => {
              const progress = Math.min(100, Math.round((item.bags_fulfilled / item.bags_needed) * 100));

              return (
                <div
                  key={item.id}
                  className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Patient Info & Blood Badge */}
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blood-600 text-white flex flex-col items-center justify-center font-black text-lg shadow-md shadow-blood-600/20 flex-shrink-0">
                        <span>{item.blood_type}</span>
                        <span className="text-[10px] leading-none">{item.rhesus}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{item.patient_name}</h3>
                          <Badge variant={item.status} size="sm">
                            {item.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {item.blood_component}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <Hospital className="w-3.5 h-3.5 text-blood-600 flex-shrink-0" />
                          <span>{item.hospital_name}</span>
                          {item.hospital_room && (
                            <span className="text-slate-400">({item.hospital_room})</span>
                          )}
                        </p>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          Keperluan: <strong>{item.diagnosis}</strong> • Pasien usia {item.patient_age} th
                        </p>
                      </div>
                    </div>

                    {/* Right: Progress of Blood Bags */}
                    <div className="sm:text-right bg-white p-3 rounded-xl border border-slate-200/80 min-w-[200px]">
                      <div className="flex sm:justify-end items-baseline space-x-1.5 mb-1.5">
                        <span className="text-lg font-black text-slate-900">
                          {item.bags_fulfilled} / {item.bags_needed}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">Kantong</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.bags_fulfilled >= item.bags_needed ? 'bg-emerald-500' : 'bg-blood-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.ready_helpers_count || 0} relawan bersedia
                      </span>
                    </div>
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">
                      CP: {item.cp_name} ({item.cp_relation}) • {item.cp_phone}
                    </span>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/requests/${item.id}`}
                        className="inline-flex items-center space-x-1.5 py-2 px-4 bg-blood-600 hover:bg-blood-700 text-white rounded-xl font-bold shadow-sm transition-all"
                      >
                        <span>Bantu & Detail Pasien</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Permintaan Darah"
            description="Saat ini belum ada pengajuan kebutuhan darah yang aktif atau sesuai dengan filter pencarian."
            actionText="Ajukan Permintaan Darah"
            onAction={() => setIsWizardOpen(true)}
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

      {/* 3-Step Wizard Modal */}
      <RequestWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Broadcast WhatsApp Modal */}
      <WhatsAppBroadcastModal
        isOpen={broadcastData.isOpen}
        onClose={() => setBroadcastData((prev) => ({ ...prev, isOpen: false }))}
        request={broadcastData.request}
        matchingDonors={broadcastData.matchingDonors}
        broadcastText={broadcastData.broadcastText}
      />
    </div>
  );
};

export default BloodRequests;
