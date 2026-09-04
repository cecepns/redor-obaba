import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { Calendar, Search, PlusCircle, Edit, Trash2, Clock, MapPin, Award } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

export const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    organizer: 'Komunitas Redor OBABA',
    location: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '14:00',
    target_bags: 50,
    contact_person: '',
    status: 'akan_datang',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [debouncedSearch, page, limit]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.SCHEDULES.LIST, {
        params: { page, limit, search: debouncedSearch },
      });
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      organizer: 'Komunitas Redor OBABA',
      location: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '14:00',
      target_bags: 50,
      contact_person: '',
      status: 'akan_datang',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingId(sch.id);
    setFormData({
      title: sch.title,
      organizer: sch.organizer,
      location: sch.location,
      address: sch.address || '',
      date: sch.date ? sch.date.split('T')[0] : '',
      start_time: sch.start_time,
      end_time: sch.end_time,
      target_bags: sch.target_bags || 50,
      contact_person: sch.contact_person || '',
      status: sch.status || 'akan_datang',
      notes: sch.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.organizer || !formData.location || !formData.date) {
      toast.error('Mohon lengkapi judul, penyelenggara, lokasi, dan tanggal.');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(API_ENDPOINTS.SCHEDULES.UPDATE(editingId), formData);
      } else {
        res = await api.post(API_ENDPOINTS.SCHEDULES.CREATE, formData);
      }
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan jadwal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.SCHEDULES.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchSchedules();
      }
    } catch (err) {
      toast.error('Gagal menghapus jadwal.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Agenda & Mobil Unit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Jadwal Aksi Donor Darah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Jadwal donor keliling bersama UDD PMI, kecamatan, mall, atau posko relawan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 py-3 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blood-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Tambah Jadwal Aksi</span>
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
            placeholder="Cari lokasi, acara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16" count={4} />
          </div>
        ) : schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Nama Acara & Penyelenggara</th>
                  <th className="py-3 px-4">Waktu & Tanggal</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4 text-center">Target Kantong</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 text-sm">{sch.title}</p>
                      <p className="text-[11px] text-slate-500">{sch.organizer}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-bold">{sch.date ? new Date(sch.date).toLocaleDateString('id-ID') : '-'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{sch.start_time} - {sch.end_time} WIB</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-semibold">{sch.location}</p>
                      <p className="text-[11px] text-slate-400">{sch.address || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {sch.target_bags || 50}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={sch.status === 'akan_datang' ? 'berjalan' : sch.status} size="sm">
                        {sch.status === 'akan_datang' ? 'Akan Datang' : sch.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sch)}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(sch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Jadwal"
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
            title="Tidak Ada Jadwal Donor"
            description="Belum ada agenda donor darah keliling yang terdaftar."
            actionText="Tambah Jadwal"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Jadwal Donor' : 'Tambah Jadwal Aksi Donor Darah'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Judul Acara / Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Contoh: Aksi Donor Darah Peduli Sesama OBABA"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Penyelenggara <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData((prev) => ({ ...prev, organizer: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Tanggal Acara <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Jam Mulai</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Jam Selesai</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Kantong</label>
              <input
                type="number"
                value={formData.target_bags}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_bags: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Lokasi Tempat Acara <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Atrium Mall Ciputra Tangerang"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Kontak Person (CP) & Catatan
            </label>
            <input
              type="text"
              placeholder="Contoh: Kang Hendra (081234567890)"
              value={formData.contact_person}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium mb-2"
            />
            <textarea
              rows="2"
              placeholder="Fasilitas / souvenir / info tambahan..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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
              {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Jadwal Donor"
        message="Apakah Anda yakin ingin menghapus jadwal aksi donor darah ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminSchedules;
