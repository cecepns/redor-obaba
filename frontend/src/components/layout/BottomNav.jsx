import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Droplets, HeartHandshake, Calendar, User, Newspaper } from 'lucide-react';

export const BottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1 shadow-lg pb-safe">
      <div className="grid grid-cols-5 gap-1 items-center max-w-lg mx-auto">
        {/* 1. Beranda */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-blood-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
            </>
          )}
        </NavLink>

        {/* 2. Stok Darah */}
        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-blood-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Droplets className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Stok</span>
            </>
          )}
        </NavLink>

        {/* 3. Permintaan Darah (Center Highlighted Action) */}
        <NavLink
          to="/requests"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center -mt-4 transition-all ${
              isActive ? 'scale-105' : 'hover:scale-105'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all ${
                  isActive
                    ? 'bg-blood-700 text-white shadow-blood-600/40 ring-2 ring-blood-400'
                    : 'bg-blood-600 text-white shadow-blood-600/30'
                }`}
              >
                <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-tight ${
                  isActive ? 'text-blood-700' : 'text-slate-600'
                }`}
              >
                Permintaan
              </span>
            </>
          )}
        </NavLink>

        {/* 4. Agenda & Info */}
        <NavLink
          to="/activities"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-blood-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Newspaper className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Kegiatan</span>
            </>
          )}
        </NavLink>

        {/* 5. Profil */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-blood-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <User className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Profil</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
