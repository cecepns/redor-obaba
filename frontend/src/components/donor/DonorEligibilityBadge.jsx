import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export const DonorEligibilityBadge = ({ eligibility, status }) => {
  if (!eligibility && !status) return null;

  if (status === 'tidak_tersedia') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-rose-50/90 border border-rose-200/90 rounded-2xl">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-900 truncate">Status: Tidak Tersedia</p>
            <p className="text-[11px] text-rose-700 truncate">Sedang masa istirahat medis / non-aktif sementara.</p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 bg-rose-600 text-white rounded-lg flex-shrink-0 whitespace-nowrap shadow-xs">
          Non-Aktif
        </span>
      </div>
    );
  }

  if (eligibility?.isEligible) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide truncate">
              Siap Donor Darah
            </p>
            <p className="text-[11px] text-emerald-700 font-medium truncate">
              Kondisi jeda waktu 3 bulan telah terpenuhi.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-lg flex-shrink-0 whitespace-nowrap shadow-xs">
          Siap Donor
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl">
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-950 truncate">
            Masa Pemulihan Tubuh
          </p>
          <p className="text-[11px] text-amber-800 font-medium truncate">
            Boleh donor kembali: <strong className="font-bold text-amber-950">{eligibility?.formattedNextDate || '-'}</strong>
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-200 text-amber-950 rounded-lg whitespace-nowrap border border-amber-300/80 shadow-xs">
          {eligibility?.daysLeft || 0} Hari Lagi
        </span>
      </div>
    </div>
  );
};

export default DonorEligibilityBadge;
