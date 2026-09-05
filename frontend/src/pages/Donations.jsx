import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Sparkles, ArrowRight, PhoneCall } from 'lucide-react';

export const Donations = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <HeartHandshake className="w-4 h-4" />
          <span>Aksi Kemanusiaan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Program Donasi & Bantuan Kemanusiaan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
          Penyaluran dukungan moral, operasional respon cepat butuh darah, dan kepedulian bersama bagi pasien yang membutuhkan.
        </p>
      </div>

      {/* Placeholder Card (Sesuai Permintaan Klien: Kosongkan Sementara) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-blood-50 text-blood-600 flex items-center justify-center mx-auto shadow-xs">
          <HeartHandshake className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sedang Dipersiapkan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Halaman Donasi Segera Hadir
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Program donasi resmi Komunitas Redor OBABA saat ini sedang dalam proses finalisasi kebijakan transparansi dan pengelolaan program kemanusiaan.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-lg mx-auto text-left space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Prinsip Utama Komunitas Redor OBABA</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seluruh darah donor dari relawan diberikan secara <strong>100% GRATIS dan Sukarela</strong> tanpa pungutan biaya darah apapun.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="py-2.5 px-5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Kembali ke Beranda
          </Link>
          <Link
            to="/requests"
            className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Lihat Permintaan Darah
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Donations;
