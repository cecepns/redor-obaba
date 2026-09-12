import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldCheck, HeartHandshake, Download } from 'lucide-react';
import DigitalDonorCard from '../components/donor/DigitalDonorCard';
import toast from 'react-hot-toast';

export const DonorCardPage = () => {
  const { user } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Silakan Masuk Terlebih Dahulu</h2>
        <Link to="/login" className="text-blood-600 font-bold text-sm mt-2 inline-block">
          Masuk Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/profile"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-blood-600" />
          <span>Cetak Kartu Saja</span>
        </button>
      </div>

      {/* Header Info (Hidden on Print) */}
      <div className="no-print">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Kartu Tanda Anggota Donor
        </h1>
        <p className="text-xs text-slate-500">
          Tunjukkan kartu digital ini saat proses donor di UDD PMI atau aksi bakti sosial OBABA.
        </p>
      </div>

      {/* Main Digital Donor Card (Target of Print) */}
      <div className="print-wrapper shadow-2xl rounded-3xl">
        <div className="printable-card">
          <DigitalDonorCard user={user} />
        </div>
      </div>

      {/* Card Terms & Information (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
        <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Ketentuan Pemilik Kartu Donor:
        </h3>
        <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
          <li>Kartu ini adalah bukti keanggotaan sukarela Komunitas Redor OBABA.</li>
          <li>Kartu tidak dapat diperjualbelikan atau dipindahtangankan.</li>
          <li>Pendonor tetap wajib mengikuti prosedur skrining kesehatan & Hb dari tim medis PMI.</li>
          <li>Masa jeda donor darah standar adalah minimal 90 hari (3 bulan) sejak donor terakhir.</li>
        </ul>
      </div>
    </div>
  );
};

export default DonorCardPage;
