import React from 'react';
import { Droplet, Award, ShieldCheck, Calendar, MapPin, QrCode } from 'lucide-react';
import Badge from '../common/Badge';

export const DigitalDonorCard = ({ user }) => {
  if (!user) return null;

  const bloodGroup = `${user.blood_type || 'O'}${user.rhesus || '+'}`;
  const totalDonations = user.total_donations || 0;
  
  // Award level based on donations
  let donorLevel = 'Pendonor Pemula';
  let badgeColor = 'bg-slate-100 text-slate-700';
  if (totalDonations >= 25) {
    donorLevel = 'Ksatria Darah Utama (25+ Donor)';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (totalDonations >= 10) {
    donorLevel = 'Pendonor Emas (10+ Donor)';
    badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (totalDonations >= 5) {
    donorLevel = 'Pendonor Perak (5+ Donor)';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  }

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

      {/* Main Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Nama Anggota</p>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user.name}</h3>
          <p className="text-xs text-slate-300 font-mono tracking-wider">{user.donor_card_no || 'OBABA-DNR-000000'}</p>
        </div>

        {/* Large Blood Type Avatar */}
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 self-start sm:self-auto shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blood-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            {bloodGroup}
          </div>
          <div>
            <p className="text-[10px] text-slate-300 uppercase font-semibold">Golongan Darah</p>
            <p className="text-xs font-bold text-white">Rhesus: {user.rhesus === '-' ? 'Negatif (-)' : 'Positif (+)'}</p>
          </div>
        </div>
      </div>

      {/* Card Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 pt-4 border-t border-white/10 text-xs relative z-10">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Donasi</span>
          <span className="font-extrabold text-white text-base flex items-center gap-1.5 mt-0.5">
            <Award className="w-4 h-4 text-amber-400" />
            {totalDonations} Kali
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Donor Terakhir</span>
          <span className="font-semibold text-slate-200 block mt-0.5">
            {user.last_donation_date
              ? new Date(user.last_donation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Belum Ada'}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Domisili</span>
          <span className="font-semibold text-slate-200 block mt-0.5 truncate">{user.city || 'Kab. Tangerang'}</span>
        </div>
      </div>

      {/* Footer Level & QR */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
            {donorLevel}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
          <QrCode className="w-5 h-5 text-white/80" />
          <span className="text-[10px]">SCAN AT PMI</span>
        </div>
      </div>
    </div>
  );
};

export default DigitalDonorCard;
