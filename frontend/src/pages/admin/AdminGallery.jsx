import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { Camera, Search, PlusCircle, Edit, Trash2, Calendar, MapPin, ImageOff, Upload, Sparkles, User, Droplet } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

export const AdminGallery = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [categoryFilter, setCategoryFilter] = useState('semua');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'kegiatan',
    date: '',
    location: '',
    description: '',
    donor_name: '',
    blood_type: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGalleries();
  }, [debouncedSearch, categoryFilter, page, limit]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        category: categoryFilter !== 'semua' ? categoryFilter : undefined,
      };
      const res = await api.get(API_ENDPOINTS.GALLERIES.LIST, { params });
      if (res.data?.success) {
        setGalleries(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching galleries:', err);
      toast.error('Gagal memuat galeri.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'kegiatan',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      location: '',
      description: '',
      donor_name: '',
      blood_type: 'A+',
      image_url: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      category: item.category || 'kegiatan',
      date: item.date || '',
      location: item.location || '',
      description: item.description || '',
      donor_name: item.donor_name || '',
      blood_type: item.blood_type || '',
      image_url: item.image || '',
    });
    setImageFile(null);
    setImagePreview(item.image || null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      toast.error('Judul dokumentasi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      if (formData.date) data.append('date', formData.date.trim());
      if (formData.location) data.append('location', formData.location.trim());
      if (formData.description) data.append('description', formData.description.trim());
      if (formData.donor_name) data.append('donor_name', formData.donor_name.trim());
      if (formData.blood_type) data.append('blood_type', formData.blood_type.trim());

      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image_url) {
        data.append('image_url', formData.image_url.trim());
      }

      let res;
      if (editingId) {
        res = await api.put(API_ENDPOINTS.GALLERIES.UPDATE(editingId), data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post(API_ENDPOINTS.GALLERIES.CREATE, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data?.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchGalleries();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan foto galeri.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.GALLERIES.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchGalleries();
      }
    } catch (err) {
      toast.error('Gagal menghapus foto galeri.');
    } finally {
      setDeleting(false);
    }
  };

  const categories = [
    { id: 'semua', label: 'Semua Kategori' },
    { id: 'kegiatan', label: 'Aksi Lapangan' },
    { id: 'relawan', label: 'Pahlawan Donor' },
    { id: 'penghargaan', label: 'Apresiasi Relawan' },
    { id: 'lainnya', label: 'Lainnya' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>Kelola Dokumentasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Galeri Foto & Relawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola dokumentasi foto kegiatan donor darah, pahlawan kemanusiaan, dan momen komunitas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blood-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Foto Galeri</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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
              placeholder="Cari judul dokumentasi, lokasi, nama relawan..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gallery Grid / Table */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <Skeleton className="h-56" count={6} />
          </div>
        ) : galleries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Image or ImageOff Fallback */}
                <div className="relative aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="flex flex-col items-center justify-center text-slate-400 p-4"
                    style={{ display: item.image ? 'none' : 'flex' }}
                  >
                    <ImageOff className="w-10 h-10 stroke-1 text-slate-300 mb-1" />
                    <span className="text-[11px] font-medium text-slate-400">Belum ada foto</span>
                  </div>

                  {/* Category Badge Overlay */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  {item.blood_type && (
                    <div className="absolute top-2.5 right-2.5 bg-blood-600 text-white font-black text-xs px-2 py-0.5 rounded-lg shadow-sm">
                      {item.blood_type}
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    {item.date && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                    {item.donor_name && (
                      <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-blood-500" />
                        <span className="truncate">{item.donor_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Foto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tidak Ada Foto Galeri"
            description="Belum ada foto dokumentasi yang sesuai dengan kriteria pencarian."
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

      {/* Modal Tambah / Edit Galeri */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Foto Dokumentasi' : 'Tambah Foto Dokumentasi Galeri'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Judul Dokumentasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Aksi Donor Darah Relawan OBABA Balaraja"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="kegiatan">Aksi Lapangan</option>
                <option value="relawan">Pahlawan Donor</option>
                <option value="penghargaan">Apresiasi Relawan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Golongan Darah (Jika ada)</label>
              <input
                type="text"
                placeholder="Contoh: O+ / AB+"
                value={formData.blood_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, blood_type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: 15 Agustus 2026"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Lokasi Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Balaraja, Tangerang"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Nama Relawan / Pendonor</label>
            <input
              type="text"
              placeholder="Contoh: Ahmad Fauzi & Tim Relawan"
              value={formData.donor_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, donor_name: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Deskripsi Singkat</label>
            <textarea
              rows="2"
              placeholder="Tuliskan cerita atau keterangan momen foto ini..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Upload Foto Dokumentasi
            </label>
            <div className="mt-1 flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Pilih Foto dari Komputer</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">atau masukkan URL gambar di bawah</span>
            </div>

            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.image_url}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, image_url: e.target.value }));
                if (!imageFile) setImagePreview(e.target.value);
              }}
              className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
            />

            {/* Preview Box */}
            {imagePreview ? (
              <div className="mt-3 relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mt-3 aspect-[16/9] w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-[11px]">Belum ada gambar yang dipilih (icon ImageOff akan tampil sebagai default)</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Foto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Hapus Foto Galeri"
        message="Apakah Anda yakin ingin menghapus foto dokumentasi ini dari galeri publik? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default AdminGallery;
