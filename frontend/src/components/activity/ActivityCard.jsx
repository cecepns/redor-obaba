import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, MapPin, ChevronRight, Tag, ImageOff } from 'lucide-react';
import Badge from '../common/Badge';
import { getAssetUrl } from '../../utils/api';

export const ActivityCard = ({ activity }) => {
  const { title, slug, category, summary, image, event_date, location, views_count, created_at } = activity;

  const displayDate = event_date || created_at;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const imageUrl = getAssetUrl(image);

  return (
    <Link
      to={`/activities/${slug || activity.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Card Image Thumbnail */}
        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 space-y-1.5 ${
              image ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400">
              <ImageOff className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Tidak ada gambar</span>
          </div>

          {/* Category Badge Floating */}
          <div className="absolute top-3 left-3">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-sm">
              {category}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-medium mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
            {location && (
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {location}
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blood-600 transition-colors line-clamp-2 leading-snug mb-2">
            {title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blood-600 group-hover:text-blood-700 bg-slate-50/50">
        <span className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Eye className="w-3.5 h-3.5" />
          {views_count || 0} Pembaca
        </span>
        <span className="flex items-center gap-1 font-bold">
          Baca Selengkapnya
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
};

export default ActivityCard;
