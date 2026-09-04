import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { MessageSquare, Search, Reply, Trash2, CheckCircle2, Phone, Star } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

export const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { page, limit, total, totalPages, setPage, changeLimit, updatePagination } = usePagination(10);

  // Reply modal
  const [replyItem, setReplyItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [debouncedSearch, page, limit]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.FEEDBACK.LIST, {
        params: { page, limit, search: debouncedSearch },
      });
      if (res.data?.success) {
        setFeedbacks(res.data.data);
        updatePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = (item) => {
    setReplyItem(item);
    setReplyText(item.reply || '');
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyItem) return;
    setSaving(true);
    try {
      const res = await api.patch(API_ENDPOINTS.FEEDBACK.REPLY(replyItem.id), {
        reply: replyText,
        status: 'dibalas',
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setReplyItem(null);
        fetchFeedbacks();
      }
    } catch (err) {
      toast.error('Gagal menyimpan balasan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(API_ENDPOINTS.FEEDBACK.DELETE(deleteId));
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchFeedbacks();
      }
    } catch (err) {
      toast.error('Gagal menghapus feedback.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Aspirasi & Suara Anggota</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kritik, Saran & Aspirasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tinjau pesan masukan dari anggota dan berikan tanggapan resmi pengurus komunitas.
        </p>
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
            placeholder="Cari pengirim, isi kritik & saran..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20" count={4} />
          </div>
        ) : feedbacks.length > 0 ? (
          <div className="space-y-3 pt-2">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between space-y-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blood-100 text-blood-700">
                        {fb.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{fb.name}</h4>
                      <span className="text-xs font-mono text-slate-500">({fb.phone})</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      "{fb.message}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 self-start sm:self-auto">
                    <Badge variant={fb.status === 'dibalas' ? 'selesai' : 'sedikit'} size="sm">
                      {fb.status === 'dibalas' ? 'Dibalas' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                {fb.reply && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-emerald-800 space-y-1">
                    <p className="font-bold text-[11px] text-emerald-950">💬 Tanggapan Admin:</p>
                    <p className="text-slate-600 italic leading-relaxed">{fb.reply}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-400">
                  <span>{new Date(fb.created_at).toLocaleString('id-ID')}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReply(fb)}
                      className="inline-flex items-center space-x-1 py-1 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{fb.reply ? 'Edit Balasan' : 'Balas'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(fb.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Hapus"
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
            title="Tidak Ada Pesan Feedback"
            description="Belum ada kritik dan saran yang masuk dari anggota."
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

      {/* Reply Modal */}
      <Modal
        isOpen={!!replyItem}
        onClose={() => setReplyItem(null)}
        title={`Balas Pesan dari: ${replyItem?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveReply} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic">
            "{replyItem?.message}"
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Tulis Balasan / Tanggapan Resmi
            </label>
            <textarea
              rows="3"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
              placeholder="Tulis tanggapan untuk anggota..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReplyItem(null)}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl shadow"
            >
              {saving ? 'Menyimpan...' : 'Simpan Balasan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pesan Feedback"
        message="Apakah Anda yakin ingin menghapus pesan kritik & saran ini?"
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminFeedback;
