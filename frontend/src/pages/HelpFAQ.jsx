import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldCheck, HeartHandshake, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpFAQ = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'Apa itu Komunitas Donor Darah Redor OBABA?',
      a: 'Redor OBABA adalah komunitas relawan kemanusiaan yang berfokus menghubungkan pendonor darah yang siap donor dengan pasien/keluarga yang membutuhkan transfusi darah secara cepat, transparan, dan 100% gratis.',
    },
    {
      q: 'Apakah ada biaya untuk donor atau meminta darah di aplikasi ini?',
      a: 'Sama sekali TIDAK ADA BIAYA (Gratis 100%). Komunitas Redor OBABA melarang keras segala bentuk jual beli darah atau pungutan liar. Seluruh aksi donor adalah sedekah kemanusiaan sukarela.',
    },
    {
      q: 'Berapa lama masa jeda antar donor darah?',
      a: 'Sesuai standar medis PMI dan Permenkes, jarak jeda antar donor darah minimal adalah 90 hari (3 bulan). Sistem aplikasi Redor OBABA otomatis menghitung mundur sisa hari hingga Anda dinyatakan Siap Donor kembali.',
    },
    {
      q: 'Apa saja syarat umum untuk dapat mendonorkan darah?',
      a: 'Syarat umum: Usia 17–60 tahun, berat badan minimal 45 kg, tekanan darah sistole 100-160 mmHg & diastole 70-100 mmHg, kadar hemoglobin (Hb) minimal 12.5 g/dl, tidak sedang konsumsi obat keras/antibiotik, dan tidur cukup minimal 5 jam malam sebelumnya.',
    },
    {
      q: 'Bagaimana alur saat ada permintaan darah darurat?',
      a: '1. Pemohon mengajukan data pasien & RS.\n2. Sistem mencocokkan golongan darah dengan donor siap.\n3. Pesan broadcast resmi terkirim ke WhatsApp donor.\n4. Donor mengklik tautan konfirmasi kesediaan.\n5. Pemohon berkoordinasi langsung dengan donor untuk bertemu di lab PMI / RS.',
    },
    {
      q: 'Bagaimana cara mendapatkan Kartu Donor Digital?',
      a: 'Setelah Anda mendaftar sebagai anggota dan mengisi golongan darah serta riwayat donor, Kartu Donor Digital lengkap dengan ID anggota dan status eligibility akan otomatis aktif di menu Profil > Kartu Donor.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link
        to="/profile"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Profil</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Pusat Bantuan & FAQ</h1>
            <p className="text-xs text-slate-500">Pertanyaan umum dan aturan penting Komunitas Redor OBABA.</p>
          </div>
        </div>

        {/* Community Golden Rules Box */}
        <div className="p-4 bg-gradient-to-r from-blood-900 to-slate-900 text-white rounded-2xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
            📌 Aturan Penting Komunitas OBABA
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200 pt-1">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Gratis 100% — Tanpa Tarif
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Hanya untuk Medis yang Sah
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Donor Wajib Sehat & Lolos Skrining
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Data Pribadi Aman & Terjaga
            </p>
          </div>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-800 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transform transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Hotline */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">Butuh bantuan darurat atau konsultasi relawan?</span>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Redor%20OBABA,%20saya%20butuh%20informasi%20bantuan."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Chat Helpdesk WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;
