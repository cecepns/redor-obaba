import React, { useState } from 'react';
import { Camera, Heart, Users, MapPin, Calendar, X, Sparkles, Award } from 'lucide-react';
import Badge from '../components/common/Badge';

export const DonorGallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState('semua');

  // Curated gallery items with high quality blood donation & volunteer imagery
  const galleryItems = [
    {
      id: 1,
      title: 'Aksi Donor Darah Relawan OBABA Balaraja',
      category: 'kegiatan',
      date: '15 Agustus 2026',
      location: 'Balaraja, Kab. Tangerang',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
      description: 'Pendonor sukarela antusias mendonorkan darah demi menolong pasien darurat di RSUD Balaraja.',
      donorName: 'Relawan Redor OBABA',
      bloodType: 'O+',
    },
    {
      id: 2,
      title: 'Aksi Tanggap Darurat PRC untuk Pasien Anak',
      category: 'relawan',
      date: '28 Juli 2026',
      location: 'Tigaraksa, Kab. Tangerang',
      image: 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=800&q=80',
      description: 'Respons cepat relawan golongan darah A+ langsung mendonorkan darah di Unit Transfusi Darah.',
      donorName: 'Ahmad Fauzi & Tim',
      bloodType: 'A+',
    },
    {
      id: 3,
      title: 'Sosialisasi & Donor Darah Bersama Pemuda Desa',
      category: 'kegiatan',
      date: '10 Juli 2026',
      location: 'Cikupa, Kab. Tangerang',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      description: 'Edukasi pentingnya donor darah rutin dan pendaftaran 50 pendonor darah pemula baru.',
      donorName: 'Komunitas Pemuda Cikupa',
      bloodType: 'B+',
    },
    {
      id: 4,
      title: 'Pemberian Apresiasi Pendonor Rutin Ke-10',
      category: 'penghargaan',
      date: '01 Juni 2026',
      location: 'Sekretariat Redor OBABA',
      image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
      description: 'Penyerahan piagam terima kasih kepada pejuang kemanusiaan yang konsisten donor darah setiap 3 bulan.',
      donorName: 'Budi Santoso',
      bloodType: 'AB+',
    },
    {
      id: 5,
      title: 'Mobil Unit Donor Darah Keliling',
      category: 'kegiatan',
      date: '20 Mei 2026',
      location: 'Pasar Kemis, Kab. Tangerang',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      description: 'Layanan jemput bola mobil donor darah bekerja sama dengan PMI untuk menjangkau masyarakat pelosok.',
      donorName: 'Tim Medis & Relawan',
      bloodType: 'O-',
    },
    {
      id: 6,
      title: 'Relawan Donor Trombosit Apheresis',
      category: 'relawan',
      date: '05 Mei 2026',
      location: 'RSUD Kabupaten Tangerang',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      description: 'Dedikasi luar biasa relawan pendonor TC khusus untuk pasien demam berdarah kondisi kritis.',
      donorName: 'Siti Rahmawati',
      bloodType: 'B+',
    },
  ];

  const categories = [
    { id: 'semua', label: 'Semua Foto' },
    { id: 'relawan', label: 'Pahlawan Donor' },
    { id: 'kegiatan', label: 'Aksi Lapangan' },
    { id: 'penghargaan', label: 'Apresiasi Relawan' },
  ];

  const filteredItems =
    activeCategory === 'semua'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>Dokumentasi Relawan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Galeri Donor & Pejuang Kemanusiaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Potret senyum dan ketulusan para relawan pendonor darah yang telah menyelamatkan nyawa sesama di Tangerang & sekitarnya.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 bg-blood-50 border border-blood-100 text-blood-700 px-3.5 py-2 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-blood-600" />
          <span>{galleryItems.length} Momen Kemanusiaan</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPhoto(item)}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col"
          >
            {/* Image Box */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Top Blood Type Badge */}
              <div className="absolute top-3 left-3 bg-blood-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                Gol. {item.bloodType}
              </div>

              {/* Bottom Meta on Image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[11px] font-semibold flex items-center gap-1 text-slate-200">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>{item.location}</span>
                </p>
                <h3 className="font-bold text-sm text-white line-clamp-1 mt-0.5">{item.title}</h3>
              </div>
            </div>

            {/* Content Bottom */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
                <span className="font-bold text-blood-600 group-hover:underline">Lihat Detail →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-video bg-slate-900">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-blood-600 text-white text-xs font-black px-3 py-1 rounded-xl">
                Golongan {selectedPhoto.bloodType}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-blood-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedPhoto.location}
                </span>
                <span className="text-xs text-slate-400 font-medium">{selectedPhoto.date}</span>
              </div>

              <h3 className="text-lg font-black text-slate-900">{selectedPhoto.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedPhoto.description}</p>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center font-bold text-xs">
                    <Heart className="w-4 h-4 fill-blood-600 text-blood-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Relawan Pendonor</p>
                    <p className="text-xs font-bold text-slate-800">{selectedPhoto.donorName}</p>
                  </div>
                </div>
                <Badge variant="siap" size="sm">Terverifikasi OBABA</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorGallery;
