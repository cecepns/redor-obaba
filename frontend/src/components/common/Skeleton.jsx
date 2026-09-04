import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-6 bg-slate-200 rounded-lg flex-1"
              style={{ opacity: 1 - rIdx * 0.15 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
