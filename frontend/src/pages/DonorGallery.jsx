import React, { useState, useEffect } from 'react';
import { api, getAssetUrl } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Camera, Heart, Users, MapPin, Calendar, X, Sparkles, Award, ImageOff, User } from 'lucide-react';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';

export const DonorGallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState('semua');
  const [galleryList, setGalleryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.GALLERIES.LIST, { params: { limit: 100 } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setGalleryList(res.data.data);
      } else {
        setGalleryList([]);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setGalleryList([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'semua', label: 'Semua Foto' },
    { id: 'relawan', label: 'Pahlawan Donor' },
    { id: 'kegiatan', label: 'Aksi Lapangan' },
    { id: 'penghargaan', label: 'Apresiasi Relawan' },
    { id: 'lainnya', label: 'Lainnya' },
  ];

  const filteredItems =
    activeCategory === 'semua'
      ? galleryList
      : galleryList.filter((item) => item.category === activeCategory);

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
          <span>{filteredItems.length} Momen Kemanusiaan</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content State: Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 p-4 space-y-3">
              <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
              <Skeleton className="w-3/4 h-5 rounded-lg" />
              <Skeleton className="w-full h-4 rounded-lg" />
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <Skeleton className="w-1/3 h-4 rounded-lg" />
                <Skeleton className="w-1/4 h-4 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Camera}
          title="Belum Ada Dokumentasi Foto"
          description={
            activeCategory === 'semua'
              ? 'Belum ada foto kegiatan relawan yang diunggah ke galeri.'
              : `Belum ada foto untuk kategori "${categories.find((c) => c.id === activeCategory)?.label || activeCategory}".`
          }
        />
      ) : (
        /* Gallery Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              {/* Image Box with Fallback ImageOff */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center">
                {item.image ? (
                  <img
                    src={getAssetUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}

                {/* Placeholder Fallback Icon ImageOff */}
                <div
                  className="flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-50 w-full h-full"
                  style={{ display: item.image ? 'none' : 'flex' }}
                >
                  <ImageOff className="w-12 h-12 stroke-1 text-slate-300 mb-1" />
                  <span className="text-xs font-semibold text-slate-400">Dokumentasi Foto</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

                {/* Top Blood Type Badge */}
                {(item.blood_type || item.bloodType) && (
                  <div className="absolute top-3 left-3 bg-blood-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md z-10">
                    Gol. {item.blood_type || item.bloodType}
                  </div>
                )}

                {/* Bottom Meta on Image */}
                <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                  {item.location && (
                    <p className="text-[11px] font-semibold flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{item.location}</span>
                    </p>
                  )}
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
      )}

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
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
              {selectedPhoto.image ? (
                <img
                  src={getAssetUrl(selectedPhoto.image)}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="flex flex-col items-center justify-center text-slate-400 p-8 w-full h-full"
                style={{ display: selectedPhoto.image ? 'none' : 'flex' }}
              >
                <ImageOff className="w-16 h-16 text-slate-600 mb-2 stroke-1" />
                <span className="text-sm font-semibold text-slate-400">Foto Belum Tersedia</span>
              </div>
              {(selectedPhoto.blood_type || selectedPhoto.bloodType) && (
                <div className="absolute bottom-3 left-3 bg-blood-600 text-white text-xs font-black px-3 py-1 rounded-xl">
                  Golongan {selectedPhoto.blood_type || selectedPhoto.bloodType}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-blood-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedPhoto.location || 'Lokasi Kegiatan'}
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
                    <p className="text-xs font-bold text-slate-800">{selectedPhoto.donor_name || selectedPhoto.donorName || 'Relawan Obaba'}</p>
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
