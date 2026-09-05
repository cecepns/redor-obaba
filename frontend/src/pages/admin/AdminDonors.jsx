import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { Users, Search, Edit, Trash2, ShieldCheck, CheckCircle2, Phone, MapPin, Award } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

export const AdminDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Edit status modal
  const [editDonor, setEditDonor] = useState(null);
  const [editStatus, setEditStatus] = useState('siap');
  const [editVerified, setEditVerified] = useState(1);
  const [editTotalDonations, setEditTotalDonations] = useState(0);
  const [savingStatus, setSavingStatus] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [debouncedSearch, bloodTypeFilter, statusFilter, page, limit]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: debouncedSearch,
        blood_type: bloodTypeFilter,
        status: statusFilter,
      };
      const res = await api.get(API_ENDPOINTS.DONORS.LIST, { params });
      if (res.data?.success) {
        setDonors(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (donor) => {
    setEditDonor(donor);
    setEditStatus(donor.status);
    setEditVerified(donor.is_verified ? 1 : 0);
    setEditTotalDonations(donor.total_donations || 0);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editDonor) return;
    setSavingStatus(true);
    try {
      const res = await api.put(API_ENDPOINTS.DONORS.UPDATE_STATUS(editDonor.id), {
        status: editStatus,
        is_verified: editVerified,
        total_donations: Number(editTotalDonations),
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setEditDonor(null);
        fetchDonors();
      }
    } catch (err) {
      toast.error('Gagal memperbarui data donor.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.DONORS.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchDonors();
      }
    } catch (err) {
      toast.error('Gagal menghapus data donor.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          <span>Kelola Anggota</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Database Anggota & Pendonor
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verifikasi identitas anggota, kelola status ketersediaan, dan pantau riwayat donasi.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama anggota, no WA, domisili..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

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
              <option value="siap">🟢 Siap Donor</option>
              <option value="belum_bisa">⏳ Belum Bisa</option>
              <option value="tidak_tersedia">🔴 Tidak Tersedia</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-16" count={5} />
          </div>
        ) : donors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">Nama & ID Anggota</th>
                  <th className="py-3 px-4">Kontak WhatsApp</th>
                  <th className="py-3 px-4 text-center">Golongan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Total Donasi</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blood-600 text-white flex items-center justify-center font-bold text-xs">
                          {donor.blood_type}{donor.rhesus}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{donor.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{donor.donor_card_no || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {donor.phone}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {donor.blood_type} ({donor.rhesus === '-' ? 'Rh-' : 'Rh+'})
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={donor.status} size="sm" dot>
                        {donor.status === 'siap' ? 'Siap' : donor.status === 'belum_bisa' ? 'Belum Bisa' : 'Tidak Tersedia'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      {donor.total_donations || 0}x
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditOpen(donor)}
                          className="p-1.5 text-slate-600 hover:text-blood-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(donor.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Anggota"
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
            title="Tidak Ada Anggota Ditemukan"
            description="Tidak ada data anggota atau donor yang sesuai dengan filter pencarian."
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

      {/* Edit Status Modal */}
      <Modal
        isOpen={!!editDonor}
        onClose={() => setEditDonor(null)}
        title={`Ubah Status Anggota: ${editDonor?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Status Ketersediaan Donor
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="siap">🟢 Siap Donor (Kondisi Sehat / Layak)</option>
              <option value="belum_bisa">⏳ Belum Bisa (Masa Jeda / Pemulihan)</option>
              <option value="tidak_tersedia">🔴 Tidak Tersedia (Off Medis / Luar Kota)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Verifikasi Keanggotaan
            </label>
            <select
              value={editVerified}
              onChange={(e) => setEditVerified(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value={1}>✅ Terverifikasi (Aktif)</option>
              <option value={0}>⏳ Menunggu Verifikasi</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Total Riwayat Donasi (Kali)
            </label>
            <input
              type="number"
              min="0"
              value={editTotalDonations}
              onChange={(e) => setEditTotalDonations(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              placeholder="0"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Jumlah total kantong/kali donor yang telah dilakukan oleh anggota ini.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditDonor(null)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingStatus}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {savingStatus ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Anggota"
        message="Apakah Anda yakin ingin menghapus anggota ini dari sistem?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminDonors;
