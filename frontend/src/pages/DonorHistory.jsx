import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { useAuth } from '../context/AuthContext';
import { usePagination } from '../hooks/usePagination';
import { History, PlusCircle, Award, Calendar, MapPin, Droplet, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const DonorHistory = () => {
  const { user, fetchProfile } = useAuth();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Modal create
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    donation_date: new Date().toISOString().split('T')[0],
    location: '',
    bags: 1,
    blood_component: 'WB',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHistories();
  }, [page, limit]);

  const fetchHistories = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.DONATION_HISTORIES.LIST, {
        params: { page, limit },
      });
      if (res.data?.success) {
        setHistories(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.donation_date) {
      toast.error('Lokasi dan tanggal donor wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(API_ENDPOINTS.DONATION_HISTORIES.CREATE, formData);
      if (res.data?.success) {
        toast.success(res.data.message);
        setIsAddModalOpen(false);
        setFormData({
          donation_date: new Date().toISOString().split('T')[0],
          location: '',
          bags: 1,
          blood_component: 'WB',
          notes: '',
        });
        fetchHistories();
        fetchProfile(); // update donor last date & count
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan riwayat donor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.DONATION_HISTORIES.DELETE(deleteId));
      if (res.data?.success) {
        toast.success('Riwayat donor berhasil dihapus.');
        setDeleteId(null);
        fetchHistories();
        fetchProfile();
      }
    } catch (err) {
      toast.error('Gagal menghapus riwayat.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Profil</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 py-2 px-4 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blood-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Donor Baru</span>
        </button>
      </div>

      {/* Header Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-blood-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blood-200 bg-white/10 px-2.5 py-1 rounded-md">
            Rekapitulasi Donasi
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Riwayat Donor Darah</h1>
          <p className="text-xs text-slate-300">Setiap tetes darah Anda adalah kebaikan yang tak ternilai harganya.</p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 self-start sm:self-auto">
          <Award className="w-8 h-8 text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-300">Total Berdonor</span>
            <p className="text-xl font-black text-white">{user?.total_donations || 0} Kali</p>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" count={4} />
          </div>
        ) : histories.length > 0 ? (
          <div className="space-y-3">
            {histories.map((hist) => {
              const formattedDate = new Date(hist.donation_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={hist.id}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl hover:bg-slate-100/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      <Droplet className="w-5 h-5 fill-white" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{hist.location}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blood-100 text-blood-700 rounded-md">
                          {hist.blood_component || 'WB'} ({hist.bags || 1} Kantong)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </p>
                      {hist.certificate_number && (
                        <p className="text-[11px] font-mono text-slate-400">
                          No. Sertifikat: {hist.certificate_number}
                        </p>
                      )}
                      {hist.notes && (
                        <p className="text-xs text-slate-600 italic mt-1">"{hist.notes}"</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteId(hist.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors self-end sm:self-auto"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Belum Ada Riwayat Donor"
            description="Catat aksi donor darah pertama Anda untuk mendapatkan kartu digital dan apresiasi komunitas."
            actionText="Catat Riwayat Sekarang"
            onAction={() => setIsAddModalOpen(true)}
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

      {/* Add Donation History Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Riwayat Donor Darah"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Tanggal Donor Darah <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.donation_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, donation_date: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Lokasi / Tempat Donor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: UDD PMI Kab. Tangerang / Bakti Sosial Mall Ciputra"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Jumlah Kantong</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.bags}
                onChange={(e) => setFormData((prev) => ({ ...prev, bags: parseInt(e.target.value) || 1 }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Komponen Darah</label>
              <select
                value={formData.blood_component}
                onChange={(e) => setFormData((prev) => ({ ...prev, blood_component: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="WB">WB (Whole Blood)</option>
                <option value="PRC">PRC (Sel Darah Merah)</option>
                <option value="TC">TC (Trombosit)</option>
                <option value="FFP">FFP (Plasma)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Catatan Tambahan</label>
            <textarea
              rows="2"
              placeholder="Catatan event, tensi, atau nomor registrasi..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Riwayat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Riwayat Donor"
        message="Apakah Anda yakin ingin menghapus data riwayat donor ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default DonorHistory;
