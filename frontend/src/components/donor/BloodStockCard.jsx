import React from 'react';
import { Droplet, Users, ChevronRight } from 'lucide-react';
import Badge from '../common/Badge';

export const BloodStockCard = ({ stock, onClick }) => {
  const { blood_type, rhesus, ready_count, total_registered, stock_status } = stock;

  const getStatusDetails = () => {
    switch (stock_status) {
      case 'tersedia':
        return {
          label: 'Tersedia',
          variant: 'tersedia',
          bgLight: 'bg-emerald-500/10',
          border: 'border-emerald-200',
          textColor: 'text-emerald-700',
          indicator: '🟢',
        };
      case 'sedikit':
        return {
          label: 'Sedikit',
          variant: 'sedikit',
          bgLight: 'bg-amber-500/10',
          border: 'border-amber-200',
          textColor: 'text-amber-700',
          indicator: '🟡',
        };
      default:
        return {
          label: 'Habis / Butuh',
          variant: 'habis',
          bgLight: 'bg-rose-500/10',
          border: 'border-rose-200',
          textColor: 'text-rose-700',
          indicator: '🔴',
        };
    }
  };

  const status = getStatusDetails();

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-4 sm:p-5 border ${status.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between`}
    >
      {/* Top row: Blood Type and Status Badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-11 h-11 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-blood-600/20 group-hover:scale-105 transition-transform">
            {blood_type}
            <span className="text-xs ml-0.5">{rhesus}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Golongan
            </span>
            <span className="text-sm font-extrabold text-slate-800">
              {blood_type} ({rhesus === '-' ? 'Rh-' : 'Rh+'})
            </span>
          </div>
        </div>

        <Badge variant={status.variant} size="sm" dot>
          {status.label}
        </Badge>
      </div>

      {/* Middle: Ready Donor Count */}
      <div className="my-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {ready_count}
          </span>
          <span className="text-xs font-semibold text-slate-500 ml-1.5">Donor Siap</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Total: {total_registered} Anggota
        </span>
      </div>

      {/* Bottom: Click to view details */}
      <div className="flex items-center justify-between text-xs font-semibold text-blood-600 group-hover:text-blood-700 pt-2 border-t border-slate-50">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          Lihat Kontak Donor
        </span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default BloodStockCard;
