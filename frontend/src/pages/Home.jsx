import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getAssetUrl } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import {
  Calendar,
  Camera,
  Users,
  HeartHandshake,
  Droplets,
  ChevronRight,
  ChevronLeft,
  Award,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Heart,
  PlusCircle,
  Newspaper,
  LogIn,
  CheckCircle2,
  ImageOff,
} from 'lucide-react';
import DonorEligibilityBadge from '../components/donor/DonorEligibilityBadge';
import Skeleton from '../components/common/Skeleton';
import RequestWizardModal from '../components/request/RequestWizardModal';
import WhatsAppBroadcastModal from '../components/request/WhatsAppBroadcastModal';

export const Home = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel Banner State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [broadcastModalData, setBroadcastModalData] = useState({
    isOpen: false,
    request: null,
    matchingDonors: [],
    broadcastText: '',
  });

  // Fallback initial banners
  const DEFAULT_BANNERS = [
    {
      id: 1,
      tag: 'HUT & Semangat Kemanusiaan',
      title: 'Dirgahayu Republik Indonesia Ke-81',
      subtitle: 'Indonesia Berdaulat, Adil dan Makmur Bersama Aksi Donor Darah Relawan Redor OBABA',
      location: 'Kab. Tangerang',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
      gradient: 'from-blood-950/95 via-blood-900/80 to-slate-950/85',
      link_text: 'Jadwal Donor',
      link_url: '/schedules',
    },
    {
      id: 2,
      tag: 'Layanan Cepat Relawan',
      title: 'Layanan Pengantaran & Respons Darah JEKDON',
      subtitle: 'Jejaring respon cepat butuh darah darurat berbasis komunitas siaga 24 jam gratis.',
      location: 'Unit OBABA',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
      gradient: 'from-slate-950/95 via-blood-950/80 to-slate-900/85',
      link_text: 'Butuh Darah',
      link_url: '/requests',
    },
    {
      id: 3,
      tag: 'Galeri Pahlawan Donor',
      title: 'Setetes Darah Kita, Sejuta Harapan Sesama',
      subtitle: 'Terima kasih atas ketulusan hati para pendonor sukarela yang telah menyelamatkan ribuan pasien.',
      location: 'UDD PMI',
      image: 'https://images.unsplash.com/photo-1579152276508-410a56249be5?auto=format&fit=crop&w=1200&q=80',
      gradient: 'from-amber-950/95 via-slate-950/80 to-blood-950/85',
      link_text: 'Galeri Foto',
      link_url: '/gallery',
    },
    {
      id: 4,
      tag: 'Edukasi Kesehatan',
      title: 'Ayo Donor Darah Rutin Setiap 3 Bulan',
      subtitle: 'Tubuh lebih sehat, regenerasi sel darah baru, dan pahala kebaikan yang terus mengalir.',
      location: 'Sentra Tangerang',
      image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
      gradient: 'from-sky-950/95 via-slate-950/80 to-slate-900/85',
      link_text: 'Edukasi Donor',
      link_url: '/activities',
    },
  ];

  const [banners, setBanners] = useState(DEFAULT_BANNERS);

  useEffect(() => {
    fetchHomeBanners();
    fetchHomeActivities();
  }, []);

  const fetchHomeBanners = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.BANNERS.LIST);
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setBanners(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  // Auto-play timer for banner slider
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const fetchHomeActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_ENDPOINTS.ACTIVITIES.LIST}?limit=4`);
      if (res.data?.success) {
        setActivities(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleBannerAction = (banner) => {
    const targetUrl = banner.link_url || banner.linkUrl;
    if (banner.action === 'request') {
      setIsRequestModalOpen(true);
    } else if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank');
      } else {
        navigate(targetUrl);
      }
    }
  };

  const handleRequestSuccess = async (data) => {
    if (isAdmin) {
      try {
        const bRes = await api.get(API_ENDPOINTS.BLOOD_REQUESTS.MATCHING_DONORS(data.id));
        if (bRes.data?.success) {
          setBroadcastModalData({
            isOpen: true,
            request: bRes.data.request,
            matchingDonors: bRes.data.matchingDonors,
            broadcastText: bRes.data.broadcastText,
          });
        }
      } catch (err) {
        navigate('/requests');
      }
    } else {
      navigate('/requests');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-14">
      {/* 1. STATE SEBELUM LOGIN VS SESUDAH LOGIN */}
      {isAuthenticated && user ? (
        /* --- SESUDAH LOGIN: USER MEMBER IDENTITY CARD --- */
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          {/* Top Row: Avatar & Profile Info + Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blood-600 to-blood-700 text-white flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0 tracking-tight">
                {user.blood_type || '-'}{user.rhesus || '+'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                    {user.name}
                  </h3>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex-shrink-0">
                    {user.role === 'admin' ? 'Admin' : 'Anggota'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  ID: <span className="font-semibold text-slate-700">{user.donor_card_no || '-'}</span> • <span className="font-semibold text-blood-600">{user.total_donations || 0}x</span> Donor
                </p>
              </div>
            </div>

            <Link
              to="/donor-card"
              className="inline-flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex-shrink-0 shadow-xs"
            >
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="hidden sm:inline">Kartu Donor</span>
              <span className="sm:hidden text-[11px]">Kartu</span>
            </Link>
          </div>

          {/* Integrated Full-Width Eligibility Status */}
          <DonorEligibilityBadge eligibility={user.eligibility} status={user.status} />
        </div>
      ) : (
        /* --- SEBELUM LOGIN: WELCOMING GUEST HERO BANNER --- */
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-blood-950 text-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-800/80">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blood-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md text-amber-300 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aksi Kemanusiaan Relawan Donor Darah</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight text-white">
                Setetes Darah Kita, <br className="hidden sm:inline" />
                <span className="text-blood-400">Sejuta Harapan</span> Bagi Sesama
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Bergabunglah bersama komunitas relawan Redor OBABA. Pantau ketersediaan stok darah secara berkala, dapatkan jadwal donor keliling, dan bantu sesama yang membutuhkan darah darurat.
              </p>

              {/* Action Buttons for Guest */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 py-2.5 px-4 sm:px-5 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blood-600/30 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Daftar / Masuk Pendonor</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center space-x-2 py-2.5 px-4 sm:px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold border border-white/20 backdrop-blur-sm transition-all"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-300" />
                  <span>Ajukan Butuh Darah</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Highlights */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3 flex-shrink-0 lg:w-56">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center lg:text-left">
                <p className="text-base sm:text-lg font-black text-amber-400 leading-none">24 Jam</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1">Respon Cepat Siaga</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center lg:text-left">
                <p className="text-base sm:text-lg font-black text-emerald-400 leading-none">100%</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1">Sukarela & Gratis</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center lg:text-left">
                <p className="text-base sm:text-lg font-black text-sky-400 leading-none">JEKDON</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1">Pengantaran Darah</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Quick Action Menu (Mobile: Col 2, Tablet/Desktop: Col 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Menu 1: Jadwal Donor */}
        <Link
          to="/schedules"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blood-50 border border-blood-100/80 text-blood-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <Droplets className="w-6 h-6 fill-blood-600 text-blood-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
            Jadwal Donor
          </span>
        </Link>

        {/* Menu 2: Donasi */}
        <Link
          to="/donations"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <HeartHandshake className="w-6 h-6 text-sky-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
            Donasi
          </span>
        </Link>

        {/* Menu 3: Galeri Donor */}
        <Link
          to="/gallery"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <Camera className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
            Galeri Donor
          </span>
        </Link>

        {/* Menu 4: Komunitas */}
        <Link
          to="/help"
          className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
            Komunitas
          </span>
        </Link>
      </div>

      {/* 3. Section Promo & Informasi Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight min-w-0 truncate">
            Promo & Informasi
          </h2>
          <Link
            to="/schedules"
            className="text-xs font-bold text-slate-500 hover:text-blood-600 transition-colors flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Banner Carousel Container */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900 group select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides */}
          <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image */}
                {banner.image ? (
                  <img
                    src={getAssetUrl(banner.image)}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500"
                  style={{ display: banner.image ? 'none' : 'flex' }}
                >
                  <ImageOff className="w-12 h-12 stroke-1 text-slate-600 mb-1" />
                </div>
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />

                {/* Banner Content */}
                <div className="absolute inset-0 p-4 sm:p-7 flex flex-col justify-between text-white z-20 overflow-hidden">
                  <div className="space-y-1.5 sm:space-y-2 max-w-xl">
                    <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{banner.tag}</span>
                    </div>

                    <h3 className="text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm line-clamp-2">
                      {banner.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 font-normal leading-relaxed drop-shadow-xs">
                      {banner.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-slate-300 font-medium min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{banner.location}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBannerAction(banner)}
                      className="py-1.5 px-3 sm:py-2 sm:px-5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex items-center space-x-1 flex-shrink-0 whitespace-nowrap"
                    >
                      <span>{banner.link_text || banner.linkText || 'Lihat Detail'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows (Desktop Only) */}
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous Slide"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next Slide"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center space-x-1.5 pt-1">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all rounded-full ${
                idx === currentSlide
                  ? 'w-6 h-2 bg-blood-600 shadow-xs'
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Section Berita dan Edukasi */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
              Berita dan Edukasi
            </h2>
            <p className="text-xs text-slate-500 truncate">
              Dokumentasi aksi kemanusiaan & kegiatan relawan donor darah
            </p>
          </div>
          <Link
            to="/activities"
            className="text-xs font-bold text-blood-600 hover:text-blood-700 transition-colors flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-56 rounded-2xl" count={4} />
          </div>
        ) : activities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activities.map((act) => {
              const displayDate = act.event_date || act.created_at;
              const formattedDate = displayDate
                ? new Date(displayDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';
              const imageUrl = getAssetUrl(act.image);

              return (
                <Link
                  key={act.id}
                  to={`/activities/${act.slug || act.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image with ImageOff Placeholder */}
                    <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={act.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      {/* Clean light fallback with ImageOff icon */}
                      <div
                        className={`w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 space-y-1 ${
                          imageUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400">
                          <ImageOff className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Tidak ada gambar</span>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs">
                          {act.category || 'Berita'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div className="p-3.5 space-y-1.5">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formattedDate}
                        </span>
                        {act.location && (
                          <span className="truncate max-w-[110px]">
                            • {act.location}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blood-600 transition-colors line-clamp-2 leading-snug uppercase">
                        {act.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {act.summary || 'Dokumentasi kegiatan dan informasi aksi relawan donor darah.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blood-600 group-hover:text-blood-700 bg-slate-50/50">
                    <span>Baca Berita</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Fallback Sample Activities matching community activities */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/activities"
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80"
                  alt="Layanan Pengantaran Darah"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs">
                    Layanan Relawan
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-black text-slate-900 text-xs sm:text-sm group-hover:text-blood-600 transition-colors leading-snug uppercase">
                  LAYANAN PENGANTARAN DARAH BERBASIS APLIKASI JEKDON
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Komunitas Redor OBABA memperkuat jejaring antar faskes dan respons cepat butuh darah darurat.
                </p>
              </div>
            </Link>

            <Link
              to="/activities"
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
                  alt="PMI Banten Perkuat Jejaring"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs">
                    Aksi Kemanusiaan
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-black text-slate-900 text-xs sm:text-sm group-hover:text-blood-600 transition-colors leading-snug uppercase">
                  RELAWAN REDOR OBABA PERKUAT JEJARING LAYANAN DARAH KABUPATEN TANGERANG
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Sosialisasi dan koordinasi bersama relawan untuk ketersediaan darah pasien darurat.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 3-Step Wizard Modal for Creating Blood Request */}
      <RequestWizardModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />

      {/* WhatsApp Broadcast Format Modal */}
      <WhatsAppBroadcastModal
        isOpen={broadcastModalData.isOpen}
        onClose={() => setBroadcastModalData((prev) => ({ ...prev, isOpen: false }))}
        request={broadcastModalData.request}
        matchingDonors={broadcastModalData.matchingDonors}
        broadcastText={broadcastModalData.broadcastText}
      />
    </div>
  );
};

export default Home;
