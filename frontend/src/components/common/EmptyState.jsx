import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Tidak Ada Data Ditemukan',
  description = 'Saat ini belum ada data yang sesuai dengan kriteria pencarian atau filter Anda.',
  actionText = '',
  onAction = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 bg-white border border-dashed border-slate-200 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="py-2.5 px-5 rounded-xl bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold shadow-md shadow-blood-600/20 transition-all focus:outline-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
