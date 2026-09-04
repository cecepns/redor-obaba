import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    // Status Stok & Donor
    tersedia: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    siap: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    sedikit: 'bg-amber-50 text-amber-700 border-amber-200/80',
    belum_bisa: 'bg-amber-50 text-amber-700 border-amber-200/80',
    habis: 'bg-rose-50 text-rose-700 border-rose-200/80',
    tidak_tersedia: 'bg-rose-50 text-rose-700 border-rose-200/80',
    
    // Status Permintaan Darah
    mendesak: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
    berjalan: 'bg-sky-50 text-sky-700 border-sky-200',
    selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dibatalkan: 'bg-slate-100 text-slate-600 border-slate-200',

    // Role
    admin: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    member: 'bg-blue-50 text-blue-700 border-blue-200',

    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    tersedia: 'bg-emerald-500',
    siap: 'bg-emerald-500',
    sedikit: 'bg-amber-500',
    belum_bisa: 'bg-amber-500',
    habis: 'bg-rose-500',
    tidak_tersedia: 'bg-rose-500',
    mendesak: 'bg-rose-600',
    berjalan: 'bg-sky-500',
    selesai: 'bg-emerald-500',
    dibatalkan: 'bg-slate-400',
    admin: 'bg-purple-500',
    member: 'bg-blue-500',
    default: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const chosenVariant = variantStyles[variant] || variantStyles.default;
  const chosenDot = dotColors[variant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${chosenVariant} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${chosenDot}`} />}
      {children}
    </span>
  );
};

export default Badge;
