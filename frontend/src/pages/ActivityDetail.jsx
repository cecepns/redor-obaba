import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getAssetUrl } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Calendar, MapPin, Eye, ChevronLeft, Share2, Tag, ArrowLeft } from 'lucide-react';
import Skeleton from '../components/common/Skeleton';
import toast from 'react-hot-toast';

export const ActivityDetail = () => {
  const { slug } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.ACTIVITIES.DETAIL(slug));
      if (res.data?.success) {
        setActivity(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching activity detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activity?.title,
        text: activity?.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan artikel berhasil disalin!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Artikel tidak ditemukan</h2>
        <Link to="/activities" className="text-blood-600 font-bold text-sm mt-3 inline-block">
          Kembali ke daftar berita & kegiatan
        </Link>
      </div>
    );
  }

  const formattedDate = (activity.event_date || activity.created_at)
    ? new Date(activity.event_date || activity.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/activities"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Berita & Kegiatan</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4 text-blood-600" />
          <span>Bagikan</span>
        </button>
      </div>

      {/* Article Content Container */}
      <article className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cover Image */}
        {activity.image && (
          <div className="relative aspect-video sm:aspect-[21/9] w-full bg-slate-100 overflow-hidden">
            <img
              src={getAssetUrl(activity.image)}
              alt={activity.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          {/* Category & Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="bg-blood-100 text-blood-700 font-extrabold px-3 py-1 rounded-lg uppercase text-[10px]">
              {activity.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
            {activity.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {activity.location}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {activity.views_count || 0} Dilihat
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {activity.title}
          </h1>

          {/* Lead Summary */}
          <div className="p-4 bg-slate-50 border-l-4 border-blood-600 rounded-r-2xl text-slate-700 font-medium text-sm leading-relaxed italic">
            "{activity.summary}"
          </div>

          {/* Body Content */}
          <div
            className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 pt-2"
            dangerouslySetInnerHTML={{ __html: activity.content }}
          />
        </div>
      </article>
    </div>
  );
};

export default ActivityDetail;
