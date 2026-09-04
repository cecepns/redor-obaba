import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { Newspaper, Search, Tag, Filter } from 'lucide-react';
import ActivityCard from '../components/activity/ActivityCard';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(9);

  const categories = [
    { id: '', label: 'Semua' },
    { id: 'berita', label: 'Berita' },
    { id: 'kegiatan', label: 'Kegiatan Donor' },
    { id: 'edukasi', label: 'Edukasi Kesehatan' },
    { id: 'pengumuman', label: 'Pengumuman' },
  ];

  useEffect(() => {
    fetchActivities();
  }, [debouncedSearch, categoryFilter, page, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        category: categoryFilter,
      };
      const res = await api.get(API_ENDPOINTS.ACTIVITIES.LIST, { params });
      if (res.data?.success) {
        setActivities(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Newspaper className="w-4 h-4" />
          <span>Informasi & Publikasi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kegiatan & Berita Komunitas OBABA
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Seputar aksi donor darah keliling, edukasi pola hidup sehat, sosialisasi, dan kabar terkini jejaring relawan.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari artikel atau kegiatan..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Activity Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <Skeleton className="h-56" count={6} />
          </div>
        ) : activities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Artikel Ditemukan"
            description="Belum ada berita atau kegiatan yang sesuai dengan filter atau kata kunci pencarian Anda."
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

export default Activities;
