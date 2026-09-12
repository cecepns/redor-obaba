import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, getAssetUrl } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import toast from 'react-hot-toast';
import {
  Megaphone,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Image as ImageIcon,
  ImageOff,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  X,
  Upload,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

const GRADIENT_PRESETS = [
  {
    name: 'Red Blood / Marun (Default)',
    value: 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
    colorClass: 'bg-blood-900',
  },
  {
    name: 'Dark Slate / Elegan',
    value: 'from-slate-950/95 via-blood-950/80 to-slate-900/85',
    colorClass: 'bg-slate-900',
  },
  {
    name: 'Warm Amber / Gold',
    value: 'from-amber-950/95 via-slate-950/80 to-blood-950/85',
    colorClass: 'bg-amber-900',
  },
  {
    name: 'Sky Blue / Bahari',
    value: 'from-sky-950/95 via-slate-950/80 to-slate-900/85',
    colorClass: 'bg-sky-900',
  },
  {
    name: 'Emerald Green / Segar',
    value: 'from-emerald-950/95 via-slate-950/80 to-slate-900/85',
    colorClass: 'bg-emerald-900',
  },
];

const TAG_PRESETS = [
  'HUT & Semangat Kemanusiaan',
  'Layanan Cepat Relawan',
  'Galeri Pahlawan Donor',
  'Edukasi Kesehatan',
  'Aksi Donor Darah',
  'Promo & Apresiasi',
  'Info Penting',
];

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', '1', '0'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tag: 'Info OBABA',
    title: '',
    subtitle: '',
    location: 'Kab. Tangerang',
    imageUrl: '',
    gradient: 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
    link_text: 'Lihat Detail',
    link_url: '/schedules',
    is_active: 1,
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Banners from API
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== 'all') {
        params.is_active = statusFilter;
      }

      const res = await api.get(API_ENDPOINTS.BANNERS.LIST, { params });
      if (res.data.success) {
        setBanners(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      toast.error('Gagal memuat data promo & banner.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  // Debounced search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBanners();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchBanners]);

  // Reset page when search or filter changes
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedBanner(null);
    setFormData({
      tag: 'Info OBABA',
      title: '',
      subtitle: '',
      location: 'Kab. Tangerang',
      imageUrl: '',
      gradient: 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
      link_text: 'Lihat Detail',
      link_url: '/schedules',
      is_active: 1,
      sort_order: banners.length + 1,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner) => {
    setModalMode('edit');
    setSelectedBanner(banner);
    setFormData({
      tag: banner.tag || 'Info OBABA',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      location: banner.location || 'Kab. Tangerang',
      imageUrl: banner.image && banner.image.startsWith('http') ? banner.image : '',
      gradient: banner.gradient || 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
      link_text: banner.link_text || 'Lihat Detail',
      link_url: banner.link_url || '/schedules',
      is_active: banner.is_active !== undefined ? banner.is_active : 1,
      sort_order: banner.sort_order || 0,
    });
    setImageFile(null);
    setImagePreview(banner.image ? getAssetUrl(banner.image) : null);
    setIsModalOpen(true);
  };

  // Image Upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Judul banner promo wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('tag', formData.tag);
      data.append('title', formData.title.trim());
      data.append('subtitle', formData.subtitle || '');
      data.append('location', formData.location || '');
      data.append('gradient', formData.gradient);
      data.append('link_text', formData.link_text || 'Lihat Detail');
      data.append('link_url', formData.link_url || '/schedules');
      data.append('is_active', formData.is_active ? 1 : 0);
      data.append('sort_order', formData.sort_order || 0);

      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.imageUrl.trim()) {
        data.append('imageUrl', formData.imageUrl.trim());
      }

      if (modalMode === 'create') {
        const res = await api.post(API_ENDPOINTS.BANNERS.CREATE, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          toast.success('Banner promo berhasil ditambahkan!');
          setIsModalOpen(false);
          fetchBanners();
        }
      } else {
        const res = await api.put(API_ENDPOINTS.BANNERS.UPDATE(selectedBanner.id), data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          toast.success('Banner promo berhasil diperbarui!');
          setIsModalOpen(false);
          fetchBanners();
        }
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data banner.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleActive = async (banner) => {
    try {
      const res = await api.patch(API_ENDPOINTS.BANNERS.TOGGLE(banner.id));
      if (res.data.success) {
        toast.success(res.data.message);
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: res.data.is_active } : b))
        );
      }
    } catch (err) {
      console.error('Error toggling banner status:', err);
      toast.error('Gagal mengubah status aktif banner.');
    }
  };

  // Delete Action
  const handleDeleteClick = (banner) => {
    setBannerToDelete(banner);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      setDeleting(true);
      const res = await api.delete(API_ENDPOINTS.BANNERS.DELETE(bannerToDelete.id));
      if (res.data.success) {
        toast.success('Banner promo berhasil dihapus.');
        setDeleteConfirmOpen(false);
        setBannerToDelete(null);
        fetchBanners();
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      toast.error('Gagal menghapus banner promo.');
    } finally {
      setDeleting(false);
    }
  };

  // Stats Count
  const stats = useMemo(() => {
    const total = pagination.total || banners.length;
    const active = banners.filter((b) => b.is_active === 1).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [banners, pagination.total]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blood-50 border border-blood-100 flex items-center justify-center text-blood-600 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Promo & Informasi Slider
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Kelola konten carousel banner yang tampil di halaman Beranda aplikasi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBanners}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blood-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 py-2.5 px-4 sm:px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-blood-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Banner Baru</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Limit Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari judul, tag, atau lokasi banner..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs & Limit */}
          <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === '1'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif di Beranda
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('0')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === '0'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nonaktif
              </button>
            </div>

            {/* Per Page Limit */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Per halaman:</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blood-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Grid Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blood-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Memuat data banner...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
              <Megaphone className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Tidak ada banner promo</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Tidak ditemukan banner dengan kriteria pencarian saat ini.'
                : 'Belum ada banner promo yang dibuat. Klik tombol di atas untuk menambahkan.'}
            </p>
            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-2 text-xs font-bold text-blood-600 hover:underline"
              >
                Reset Filter Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Urutan</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Banner & Teks</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Aksi & Link Tombol</th>
                  <th className="py-3.5 px-4 text-center">Status Beranda</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right w-28">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {banners.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Urutan */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 font-mono font-black text-xs text-slate-700">
                        {item.sort_order || idx + 1}
                      </span>
                    </td>

                    {/* Banner & Preview */}
                    <td className="py-4 px-4">
                      <div className="flex items-start space-x-3.5">
                        {/* Mini Preview Box */}
                        <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative border border-slate-200">
                          {item.image ? (
                            <img
                              src={getAssetUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-1"
                            style={{ display: item.image ? 'none' : 'flex' }}
                          >
                            <ImageOff className="w-5 h-5 text-slate-300" />
                          </div>
                          <div className="absolute inset-0 bg-slate-950/40" />
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blood-50 text-blood-700 border border-blood-200/60">
                              <Sparkles className="w-2.5 h-2.5 text-blood-600" />
                              {item.tag || 'Info'}
                            </span>
                            {item.location && (
                              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                {item.location}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.subtitle || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tombol & Link */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="inline-block font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {item.link_text || 'Lihat Detail'}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                          {item.link_url || '/schedules'}
                        </p>
                      </div>
                    </td>

                    {/* Toggle Status Aktif */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          item.is_active === 1
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Klik untuk mengubah status tayang di beranda"
                      >
                        {item.is_active === 1 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tayang</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mati</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-500 hover:text-blood-600 hover:bg-blood-50 rounded-xl transition-colors"
                          title="Edit Banner"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Hapus Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && banners.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
            <div>
              Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} dari {pagination.total} banner
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages || 1 }).map((_, i) => {
                const pageNumber = i + 1;
                // Only show around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`w-8 h-8 rounded-xl font-bold transition-all ${
                        page === pageNumber
                          ? 'bg-blood-600 text-white shadow-xs'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === page - 2 ||
                  pageNumber === page + 2
                ) {
                  return <span key={pageNumber} className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Tambah / Edit Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blood-50 text-blood-600 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {modalMode === 'create' ? 'Tambah Banner Promo Baru' : 'Edit Banner Promo'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi informasi banner yang akan ditampilkan di slider beranda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Row 1: Tag & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tag / Label Kategori
                  </label>
                  <input
                    type="text"
                    list="tagPresets"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Contoh: HUT RI, Info Penting"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                  />
                  <datalist id="tagPresets">
                    {TAG_PRESETS.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lokasi / Penyelenggara
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Kab. Tangerang, UDD PMI"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                  />
                </div>
              </div>

              {/* Row 2: Judul Banner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Banner Promo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Dirgahayu Republik Indonesia Ke-81"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                />
              </div>

              {/* Row 3: Subtitle / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi Singkat (Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Deskripsi pendukung yang muncul di bawah judul..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                />
              </div>

              {/* Row 4: Gambar Banner (Upload File atau URL) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Gambar / Foto Banner
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Input */}
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-blood-400 rounded-2xl bg-slate-50 cursor-pointer transition-colors group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blood-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload File Gambar</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* URL Input */}
                  <div>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        if (e.target.value) {
                          setImageFile(null);
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="Atau masukkan Link URL Gambar..."
                      className="w-full h-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                    />
                  </div>
                </div>
              </div>



              {/* Row 6: Tombol Aksi & Link URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teks Tombol Aksi
                  </label>
                  <input
                    type="text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="Contoh: Jadwal Donor, Lihat Detail"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tautan Tujuan (Link URL)
                  </label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="Contoh: /schedules, /gallery, https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                  />
                </div>
              </div>

              {/* Row 7: Urutan & Status Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Urutan Slide (Angka lebih kecil tampil duluan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blood-500/20 focus:border-blood-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Status Aktif di Beranda</span>
                    <span className="text-[11px] text-slate-400">Tampilkan banner ini di slider</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 accent-blood-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Preview Tampilan di Slider Beranda (Overlay Tipis):
                </span>
                <div className="relative rounded-2xl overflow-hidden aspect-[16/8] sm:aspect-[21/9] bg-slate-950 border border-slate-300 shadow-md">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                      <span className="text-xs">Foto Banner</span>
                    </div>
                  )}
                  {/* Thin Clean Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white z-10">
                    <div className="space-y-1.5 max-w-sm">
                      <div className="inline-flex items-center space-x-1 bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>{formData.tag || 'Info OBABA'}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {formData.title || 'Judul Banner Promo Anda'}
                      </h4>
                      <p className="text-[11px] text-slate-100 line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {formData.subtitle || 'Deskripsi singkat banner promo...'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-200 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {formData.location || 'Kab. Tangerang'}
                      </span>
                      <span className="bg-white text-slate-900 text-[11px] font-black px-3 py-1 rounded-lg shadow-sm">
                        {formData.link_text || 'Lihat Detail'} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blood-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modalMode === 'create' ? 'Simpan Banner' : 'Perbarui Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center">Hapus Banner Promo?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Apakah Anda yakin ingin menghapus banner{' '}
              <strong className="text-slate-800">"{bannerToDelete?.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
