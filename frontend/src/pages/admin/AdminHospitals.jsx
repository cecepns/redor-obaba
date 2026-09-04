import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { Building2, Search, PlusCircle, Edit, Trash2, Hospital, Phone, Truck } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

export const AdminHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'rs_umum',
    address: '',
    city: 'Kab. Tangerang',
    phone: '',
    emergency_phone: '',
    ambulance_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, [debouncedSearch, page, limit]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.HOSPITALS.LIST, {
        params: { page, limit, search: debouncedSearch },
      });
      if (res.data?.success) {
        setHospitals(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'rs_umum',
      address: '',
      city: 'Kab. Tangerang',
      phone: '',
      emergency_phone: '',
      ambulance_phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hosp) => {
    setEditingId(hosp.id);
    setFormData({
      name: hosp.name,
      type: hosp.type,
      address: hosp.address,
      city: hosp.city,
      phone: hosp.phone,
      emergency_phone: hosp.emergency_phone || '',
      ambulance_phone: hosp.ambulance_phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.phone) {
      toast.error('Nama faskes, alamat, dan nomor telepon wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(API_ENDPOINTS.HOSPITALS.UPDATE(editingId), formData);
      } else {
        res = await api.post(API_ENDPOINTS.HOSPITALS.CREATE, formData);
      }
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        fetchHospitals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan fasilitas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.HOSPITALS.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchHospitals();
      }
    } catch (err) {
      toast.error('Gagal menghapus data faskes.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Fasilitas Kesehatan & Ambulans</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Direktori Rumah Sakit & Ambulans Siaga
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola kontak darurat IGD RSUD, UDD PMI, dan armada ambulans siaga.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 py-3 px-5 bg-blood-600 hover:bg-blood-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blood-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Tambah Fasilitas</span>
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
            placeholder="Cari faskes, kota, telepon..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16" count={4} />
          </div>
        ) : hospitals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Nama Fasilitas & Kategori</th>
                  <th className="py-3 px-4">Alamat & Kota</th>
                  <th className="py-3 px-4">Kontak Darurat / Telepon</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((hosp) => (
                  <tr key={hosp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 text-sm">{hosp.name}</p>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {hosp.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium">{hosp.address}</p>
                      <p className="text-[11px] text-slate-400">{hosp.city}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      <p className="font-bold">{hosp.phone}</p>
                      {hosp.emergency_phone && (
                        <p className="text-rose-600 text-[11px]">IGD: {hosp.emergency_phone}</p>
                      )}
                      {hosp.ambulance_phone && (
                        <p className="text-amber-600 text-[11px]">Ambulans: {hosp.ambulance_phone}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(hosp)}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Fasilitas"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(hosp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Fasilitas"
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
            title="Tidak Ada Data Fasilitas"
            description="Belum ada data fasilitas kesehatan yang terdaftar."
            actionText="Tambah Faskes"
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
        title={editingId ? 'Edit Fasilitas Kesehatan' : 'Tambah Fasilitas / Ambulans'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nama Fasilitas / Layanan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Contoh: RSUD Balaraja Tangerang"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="rs_umum">RS Umum</option>
                <option value="rsud">RSUD</option>
                <option value="pmi">UDD PMI</option>
                <option value="ambulance">Layanan Ambulans</option>
                <option value="klinik">Klinik</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kota / Wilayah</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              required
              placeholder="Alamat jalan, nomor, kecamatan..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Telepon Kantor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Telepon IGD
              </label>
              <input
                type="text"
                value={formData.emergency_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, emergency_phone: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                No Ambulans
              </label>
              <input
                type="text"
                value={formData.ambulance_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, ambulance_phone: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
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
              {submitting ? 'Menyimpan...' : 'Simpan Faskes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Fasilitas"
        message="Apakah Anda yakin ingin menghapus data faskes ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminHospitals;
