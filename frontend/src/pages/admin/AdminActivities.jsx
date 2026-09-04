import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { Newspaper, Search, PlusCircle, Edit, Trash2, Calendar, MapPin, Image, ImageOff } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link',
];

export const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'kegiatan',
    summary: '',
    content: '',
    event_date: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [debouncedSearch, page, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.ACTIVITIES.LIST, {
        params: { page, limit, search: debouncedSearch },
      });
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'kegiatan',
      summary: '',
      content: '',
      event_date: '',
      location: '',
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (act) => {
    setEditingId(act.id);
    try {
      const res = await api.get(API_ENDPOINTS.ACTIVITIES.DETAIL(act.slug || act.id));
      if (res.data?.success) {
        const item = res.data.data;
        setFormData({
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          event_date: item.event_date ? item.event_date.split('T')[0] : '',
          location: item.location || '',
        });
        setImageFile(null);
        setIsModalOpen(true);
      }
    } catch (err) {
      toast.error('Gagal mengambil data kegiatan.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.summary || !formData.content) {
      toast.error('Judul, ringkasan, dan konten wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('summary', formData.summary);
      data.append('content', formData.content);
      if (formData.event_date) data.append('event_date', formData.event_date);
      if (formData.location) data.append('location', formData.location);
      if (imageFile) data.append('image', imageFile);

      let res;
      if (editingId) {
        res = await api.put(API_ENDPOINTS.ACTIVITIES.UPDATE(editingId), data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post(API_ENDPOINTS.ACTIVITIES.CREATE, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data?.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchActivities();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan artikel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.ACTIVITIES.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchActivities();
      }
    } catch (err) {
      toast.error('Gagal menghapus artikel.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Publikasi Komunitas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Berita, Edukasi & Kegiatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publikasikan artikel sosialisasi, dokumentasi aksi kemanusiaan, dan edukasi donor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 py-3 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blood-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Tambah Berita / Kegiatan</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul berita atau artikel..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16" count={4} />
          </div>
        ) : activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Judul & Kategori</th>
                  <th className="py-3 px-4">Tanggal & Lokasi</th>
                  <th className="py-3 px-4 text-center">Dilihat</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start space-x-3">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blood-100 text-blood-700 flex-shrink-0 mt-0.5">
                          {act.category}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-sm line-clamp-1">{act.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{act.summary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium">
                        {act.event_date ? new Date(act.event_date).toLocaleDateString('id-ID') : '-'}
                      </p>
                      <p className="text-[11px] text-slate-400">{act.location || 'Online'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {act.views_count || 0}x
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(act)}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Artikel"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(act.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Artikel"
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
        ) : (
          <EmptyState
            title="Tidak Ada Berita / Kegiatan"
            description="Belum ada artikel publikasi yang ditambahkan."
            actionText="Tambah Berita Sekarang"
            onAction={handleOpenCreate}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      </div>

      {/* Create / Edit Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Publikasi Berita / Kegiatan' : 'Tambah Berita / Kegiatan Baru'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Judul Artikel / Berita <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Contoh: Aksi Bakti Sosial Donor Darah Peduli Sesama di Tangerang"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="kegiatan">Kegiatan</option>
                <option value="berita">Berita</option>
                <option value="edukasi">Edukasi</option>
                <option value="pengumuman">Pengumuman</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal Acara</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Lokasi Kegiatan</label>
              <input
                type="text"
                value={formData.location}
                placeholder="Contoh: Aula Kantor PMI"
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Ringkasan Singkat (Lead Summary) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="2"
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              required
              placeholder="Ringkasan 1-2 kalimat pengantar..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Konten Lengkap Berita / Artikel <span className="text-red-500">*</span>
            </label>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Tuliskan berita atau artikel lengkap di sini..."
                className="min-h-[160px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Upload Foto Dokumentasi (Opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Publikasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Artikel"
        message="Apakah Anda yakin ingin menghapus artikel atau kegiatan ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminActivities;
