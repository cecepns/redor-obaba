import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Calendar, MapPin, Clock, Users, Search, PlusCircle, Phone, Award } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

export const ScheduleEvents = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  useEffect(() => {
    fetchSchedules();
  }, [debouncedSearch, statusFilter, page, limit]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = { page, limit, search: debouncedSearch, status: statusFilter };
      const res = await api.get(API_ENDPOINTS.SCHEDULES.LIST, { params });
      if (res.data?.success) {
        setSchedules(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Calendar className="w-4 h-4" />
          <span>Agenda & Mobil Unit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Jadwal Aksi Donor Darah Keliling
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Temukan lokasi dan waktu mobil unit PMI & aksi bakti sosial donor darah terdekat di wilayah Anda.
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
              placeholder="Cari lokasi kegiatan, penyelenggara..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            >
              <option value="">Semua Jadwal</option>
              <option value="akan_datang">Akan Datang</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-32" count={3} />
          </div>
        ) : schedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {schedules.map((sch) => {
              const formattedDate = new Date(sch.date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={sch.id}
                  className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blood-100 text-blood-700">
                          {sch.organizer}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5 leading-snug">
                          {sch.title}
                        </h3>
                      </div>
                      <Badge variant={sch.status === 'akan_datang' ? 'berjalan' : sch.status} size="sm">
                        {sch.status === 'akan_datang' ? 'Akan Datang' : sch.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="flex items-center gap-2 font-semibold text-slate-800">
                        <Calendar className="w-4 h-4 text-blood-600" />
                        {formattedDate}
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Pukul {sch.start_time} - {sch.end_time} WIB
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {sch.location} {sch.address ? `(${sch.address})` : ''}
                      </p>
                      <p className="flex items-center gap-2 font-medium text-slate-500">
                        <Award className="w-4 h-4 text-amber-500" />
                        Target: {sch.target_bags} Kantong Darah
                      </p>
                    </div>

                    {sch.notes && (
                      <p className="text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                        💡 {sch.notes}
                      </p>
                    )}
                  </div>

                  {sch.contact_person && (
                    <div className="pt-3 border-t border-slate-200 text-xs flex items-center justify-between text-slate-500">
                      <span>CP: <strong>{sch.contact_person}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Jadwal Donor"
            description="Belum ada agenda kegiatan donor darah keliling untuk periode ini."
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

export default ScheduleEvents;
