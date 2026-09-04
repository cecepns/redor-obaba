import React from 'react';
import { Phone, MapPin, Calendar, MessageSquare, CheckCircle, Award } from 'lucide-react';
import Badge from '../common/Badge';

export const DonorMatchList = ({ donors, onRequestDirectWA }) => {
  if (!donors || donors.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-xs font-semibold text-slate-500">
          Belum ada pendonor siap yang cocok secara sistem saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {donors.map((donor) => (
        <div
          key={donor.id}
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-all flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {donor.blood_type}{donor.rhesus}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{donor.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {donor.city || 'Kab. Tangerang'}
                </p>
              </div>
            </div>

            <Badge variant="siap" size="sm">Siap</Badge>
          </div>

          <div className="my-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              {donor.total_donations || 0}x Donasi
            </span>
            <span>
              Donor: {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Baru'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRequestDirectWA && onRequestDirectWA(donor)}
            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hubungi via WhatsApp</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default DonorMatchList;
