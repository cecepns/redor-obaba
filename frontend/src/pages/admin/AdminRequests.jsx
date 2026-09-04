import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { HeartHandshake, Search, Edit, Trash2, CheckCircle2, Hospital, Phone, Users, ExternalLink } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Edit status modal
  const [editItem, setEditItem] = useState(null);
  const [editStatus, setEditStatus] = useState('mendesak');
  const [editBagsFulfilled, setEditBagsFulfilled] = useState(0);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [debouncedSearch, statusFilter, page, limit]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = { page, limit, search: debouncedSearch, status: statusFilter };
      const res = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.LIST, { params });
      if (res.data?.success) {
        setRequests(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (req) => {
    setEditItem(req);
    setEditStatus(req.status);
    setEditBagsFulfilled(req.bags_fulfilled || 0);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await api.patch(API_ENDPOINTS.BLOOD_REQUESTS.UPDATE_STATUS(editItem.id), {
        status: editStatus,
        bags_fulfilled: editBagsFulfilled,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setEditItem(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error('Gagal memperbarui status permintaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.BLOOD_REQUESTS.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error('Gagal menghapus permintaan darah.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <HeartHandshake className="w-4 h-4" />
          <span>Kelola Transfusi Darah</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Manajemen Permintaan Darah Pasien
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Pantau status pemenuhan kantong darah, update status darurat, dan tutup permintaan yang selesai.
        </p>
      </div>

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
              placeholder="Cari pasien, RS, penanggung jawab..."
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
              <option value="">Semua Status</option>
              <option value="mendesak">🔴 Mendesak</option>
              <option value="berjalan">🔵 Sedang Berjalan</option>
              <option value="selesai">🟢 Selesai</option>
              <option value="dibatalkan">⚪ Dibatalkan</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16" count={5} />
          </div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Pasien & RS</th>
                  <th className="py-3 px-4 text-center">Golongan</th>
                  <th className="py-3 px-4 text-center">Kebutuhan Kantong</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Kontak CP</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{req.patient_name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Hospital className="w-3 h-3 text-slate-400" />
                        {req.hospital_name}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black px-2 py-0.5 bg-blood-100 text-blood-700 rounded-md">
                        {req.blood_type}{req.rhesus} ({req.blood_component})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {req.bags_fulfilled} / {req.bags_needed} Kantong
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={req.status} size="sm">
                        {req.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{req.cp_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{req.cp_phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          to={`/requests/${req.id}`}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Detail Pasien & Matching"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEditOpen(req)}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ubah Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(req.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Permintaan"
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
            title="Tidak Ada Permintaan Darah"
            description="Tidak ada data permohonan darah yang sesuai dengan kriteria filter."
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

      {/* Edit Status Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Update Permintaan Pasien: ${editItem?.patient_name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Status Kebutuhan</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="mendesak">🔴 Mendesak (Urgent - Kirim Notifikasi)</option>
              <option value="berjalan">🔵 Sedang Berjalan (Pendonor Merapat)</option>
              <option value="selesai">🟢 Selesai (Kantong Terpenuhi Penuh)</option>
              <option value="dibatalkan">⚪ Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Jumlah Kantong Terpenuhi (dari {editItem?.bags_needed} Dibutuhkan)
            </label>
            <input
              type="number"
              min="0"
              max={editItem?.bags_needed || 10}
              value={editBagsFulfilled}
              onChange={(e) => setEditBagsFulfilled(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {saving ? 'Menyimpan...' : 'Simpan Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Permintaan Darah"
        message="Apakah Anda yakin ingin menghapus data permohonan darah ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminRequests;
