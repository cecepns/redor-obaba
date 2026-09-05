import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Copy, Check, Send, PhoneCall, Users, Sparkles, MessageCircle, ExternalLink, Zap } from 'lucide-react';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import toast from 'react-hot-toast';

export const WhatsAppBroadcastModal = ({ isOpen, onClose, request, matchingDonors, broadcastText }) => {
  const [copied, setCopied] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  if (!request) return null;

  const handleCopyText = () => {
    if (!broadcastText) return;
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    toast.success('Format Pesan Broadcast WA berhasil disalin!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAutoBroadcast = async () => {
    if (!matchingDonors || matchingDonors.length === 0) {
      toast.error('Tidak ada pendonor yang cocok untuk permohonan ini.');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post(API_ENDPOINTS.WA_GATEWAY.BROADCAST_REQUEST(request.id));
      if (res.data?.success) {
        toast.success(res.data.message);
      } else if (res.data?.isWaOffline) {
        toast((t) => (
          <div className="space-y-1 text-xs">
            <p className="font-bold text-amber-400">WhatsApp Gateway Belum Terhubung</p>
            <p className="text-slate-300">Silakan scan QR di menu <strong>Admin WA Gateway</strong>, atau gunakan tombol Kirim WA manual di bawah.</p>
          </div>
        ), { duration: 5000, icon: '⚠️' });
      } else {
        toast.error(res.data?.message || 'Gagal mengirim broadcast otomatis.');
      }
    } catch (err) {
      toast.error('WhatsApp Gateway belum aktif di server. Gunakan tombol Kirim WA manual.');
    } finally {
      setBroadcasting(false);
    }
  };

  const openWhatsAppDirect = (phone) => {
    if (!phone) return;
    // Clean phone number format for WA (convert leading 0 to 62)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const encodedText = encodeURIComponent(broadcastText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Format Broadcast WhatsApp Komunitas"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Banner Alert & Quick Actions */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                {matchingDonors?.length || 0} Calon Pendonor Cocok Ditemukan!
              </p>
              <p className="text-[11px] text-emerald-700">
                Sistem telah memfilter pendonor dengan golongan <strong>{request.blood_type}{request.rhesus}</strong> yang berstatus Siap.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {matchingDonors && matchingDonors.length > 0 && (
              <button
                type="button"
                onClick={handleAutoBroadcast}
                disabled={broadcasting}
                className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                title="Kirim otomatis ke semua WA pendonor via Gateway"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{broadcasting ? 'Mengirim...' : 'Blast Otomatis'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 shadow-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
            </button>
          </div>
        </div>

        {/* Formatted WA Broadcast Message Preview */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Pratinjau Pesan Broadcast WhatsApp (Format Resmi OBABA):
          </label>
          <div className="relative bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-800 shadow-inner whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
            {broadcastText}
          </div>
        </div>

        {/* List of Matched Donors for Direct WA Blast */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blood-600" />
              Kirim Manual ke WhatsApp Donor ({matchingDonors?.length || 0}):
            </label>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {matchingDonors && matchingDonors.length > 0 ? (
              matchingDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blood-600 text-white flex items-center justify-center font-bold text-xs">
                      {donor.blood_type}{donor.rhesus}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{donor.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {donor.phone} • {donor.city || 'Kab. Tangerang'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openWhatsAppDirect(donor.phone)}
                    className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada donor berstatus siap dengan golongan darah ini. Silakan bagikan pesan broadcast ke grup komunitas WhatsApp.
              </p>
            )}
          </div>
        </div>

        {/* Close Modal Button */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppBroadcastModal;
