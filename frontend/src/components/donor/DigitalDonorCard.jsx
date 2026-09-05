import React from 'react';
import { Droplet, ShieldCheck, MapPin, QrCode } from 'lucide-react';

export const DigitalDonorCard = ({ user }) => {
  if (!user) return null;

  const bloodGroup = `${user.blood_type || 'B'}${user.rhesus || '+'}`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blood-950 text-white p-6 sm:p-7 shadow-2xl border border-white/10">
      {/* Background Graphic Watermark */}
      <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
        <Droplet className="w-64 h-64 text-blood-500 fill-blood-500" />
      </div>

      {/* Top Bar of Card */}
      <div className="flex items-center justify-between relative z-10 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center">
            <img src="/obaba-logo.jpeg" alt="OBABA" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-wider text-white uppercase">KARTU DONOR DIGITAL</h4>
            <p className="text-[11px] text-blood-300 font-medium">Komunitas Redor OBABA</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-200">Terverifikasi</span>
        </div>
      </div>

      {/* Main Member Info & Clean Blood Type Badge */}
      <div className="flex items-center justify-between gap-4 relative z-10 my-4">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Nama Anggota</p>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user.name}</h3>
          <p className="text-xs text-slate-300 font-mono tracking-wider">{user.donor_card_no || 'OBABA-DNR-000000'}</p>
        </div>

        {/* Clean, Non-bulky Blood Type Display (e.g. B+) */}
        <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blood-600 to-rose-500 text-white font-black text-2xl sm:text-3xl shadow-lg shadow-blood-600/30 border border-white/20 flex-shrink-0">
          <span>{bloodGroup}</span>
        </div>
      </div>

      {/* Bottom Footer: Domisili on Left, SCAN AT PMI on Right */}
      <div className="flex items-center justify-between pt-4 mt-5 border-t border-white/10 relative z-10 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="font-medium text-xs truncate max-w-[170px] sm:max-w-xs">{user.city || 'Kab. Tangerang'}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
          <QrCode className="w-4 h-4 text-white/80" />
          <span className="text-[11px] font-semibold tracking-wider text-slate-300">SCAN AT PMI</span>
        </div>
      </div>
    </div>
  );
};

export default DigitalDonorCard;
