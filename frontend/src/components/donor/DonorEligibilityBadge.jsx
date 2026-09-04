import React from 'react';
import { CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';
import Badge from '../common/Badge';

export const DonorEligibilityBadge = ({ eligibility, status }) => {
  if (!eligibility) return null;

  if (status === 'tidak_tersedia') {
    return (
      <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl">
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-rose-900">Status: Tidak Tersedia</p>
          <p className="text-[11px] text-rose-700">Sedang masa istirahat medis / non-aktif sementara.</p>
        </div>
      </div>
    );
  }

  if (eligibility.isEligible) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">✅ SIAP DONOR DARAH</p>
            <p className="text-[11px] text-emerald-700 font-medium">Kondisi jeda waktu 3 bulan telah terpenuhi.</p>
          </div>
        </div>
        <Badge variant="siap" size="sm">Siap</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-900">⏳ Masa Pemulihan (Belum Bisa Donor)</p>
          <p className="text-[11px] text-amber-700">
            Boleh donor kembali pada: <strong className="font-bold">{eligibility.formattedNextDate}</strong>
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
        <span className="text-xs font-black px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg">
          {eligibility.daysLeft} Hari Lagi
        </span>
      </div>
    </div>
  );
};

export default DonorEligibilityBadge;
