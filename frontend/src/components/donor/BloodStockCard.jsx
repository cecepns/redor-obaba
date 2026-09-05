import React from 'react';
import { Droplet } from 'lucide-react';

export const BloodStockCard = ({ stock, onClick }) => {
  const { blood_type, rhesus, ready_count, total_registered, stock_status } = stock;

  const getStatusConfig = () => {
    switch (stock_status) {
      case 'tersedia':
        return {
          label: 'Tersedia',
          dotColor: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          cardBorder: 'border-slate-200/90 hover:border-emerald-300',
        };
      case 'sedikit':
        return {
          label: 'Sedikit',
          dotColor: 'bg-amber-500',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          cardBorder: 'border-slate-200/90 hover:border-amber-300',
        };
      default:
        return {
          label: 'Habis / Butuh',
          dotColor: 'bg-rose-500',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          cardBorder: 'border-slate-200/90 hover:border-rose-300',
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-3.5 sm:p-4 border ${status.cardBorder} shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full min-h-[128px] sm:min-h-[140px]`}
    >
      {/* Top row: Blood avatar & status badge */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blood-600 to-rose-500 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
          {blood_type}
          <span className="text-[10px] sm:text-xs ml-0.5">{rhesus}</span>
        </div>

        <div className={`inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.badgeBg} truncate`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor} flex-shrink-0`} />
          <span className="truncate">{status.label}</span>
        </div>
      </div>

      {/* Middle/Bottom: Ready count and total */}
      <div className="pt-2 sm:pt-3 mt-2 border-t border-slate-100 flex items-end justify-between">
        <div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {ready_count}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Siap</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Total {total_registered} Anggota
          </p>
        </div>

        <div className="w-5 h-5 rounded-lg bg-slate-50 group-hover:bg-blood-50 text-slate-400 group-hover:text-blood-600 flex items-center justify-center transition-colors">
          <Droplet className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export default BloodStockCard;
