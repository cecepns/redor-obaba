import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Hospital, PhoneCall, Truck, MapPin, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

export const HospitalsDirectory = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [typeFilter, setTypeFilter] = useState(initialType);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  useEffect(() => {
    fetchHospitals();
  }, [debouncedSearch, typeFilter, page, limit]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const params = { page, limit, search: debouncedSearch, type: typeFilter };
      const res = await api.get(API_ENDPOINTS.HOSPITALS.LIST, { params });
      if (res.data?.success) {
        setHospitals(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'pmi':
        return 'UDD PMI (Unit Donor Darah)';
      case 'ambulance':
        return 'Layanan Ambulans & Jenazah Siaga';
      case 'rsud':
        return 'Rumah Sakit Umum Daerah';
      case 'klinik':
        return 'Klinik / Faskes';
      default:
        return 'Rumah Sakit Umum';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Hospital className="w-4 h-4" />
          <span>Direktori Fasilitas Kesehatan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Rumah Sakit, UDD PMI & Ambulans Siaga
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Kontak darurat fasilitas kesehatan terdekat, Unit Transfusi Darah PMI, dan armada ambulans siaga 24 jam.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama rumah sakit, PMI, ambulans..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            >
              <option value="">Semua Kategori Fasilitas</option>
              <option value="pmi">UDD Palang Merah Indonesia</option>
              <option value="ambulance">Ambulans & Mobil Jenazah</option>
              <option value="rsud">RSUD (Negeri)</option>
              <option value="rs_umum">Rumah Sakit Swasta / Umum</option>
            </select>
          </div>
        </div>

        {/* Directory List */}
        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-28" count={4} />
          </div>
        ) : hospitals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                      {getTypeName(hosp.type)}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {hosp.name}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{hosp.address}, {hosp.city}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {hosp.emergency_phone && (
                      <a
                        href={`tel:${hosp.emergency_phone.replace(/\D/g, '')}`}
                        className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>IGD: {hosp.emergency_phone}</span>
                      </a>
                    )}

                    {hosp.ambulance_phone && (
                      <a
                        href={`tel:${hosp.ambulance_phone.replace(/\D/g, '')}`}
                        className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ambulans: {hosp.ambulance_phone}</span>
                      </a>
                    )}

                    <a
                      href={`tel:${hosp.phone.replace(/\D/g, '')}`}
                      className="inline-flex items-center space-x-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Telp: {hosp.phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Data Fasilitas Tidak Ditemukan"
            description="Tidak ada data rumah sakit atau faskes yang sesuai dengan pencarian Anda."
          />
        )}

        {/* Pagination */}
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

export default HospitalsDirectory;
