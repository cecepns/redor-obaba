import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogIn, Menu, X, PlusCircle, HeartHandshake } from 'lucide-react';

export const Navbar = ({ onOpenMobileMenu, isMobileMenuOpen }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Stok Darah', path: '/stock' },
    { name: 'Permintaan Darah', path: '/requests' },
    { name: 'Kegiatan & Berita', path: '/activities' },
    { name: 'Jadwal Donor', path: '/schedules' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo Brand (Enlarged logo, removed 'Komunitas' badge) */}
          <div className="flex items-center space-x-3">
            {isAdmin && onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-xs border border-slate-200/90 bg-white flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                <img
                  src="/obaba-logo.jpeg"
                  alt="Redor OBABA"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-blood-600 transition-colors">
                  REDOR <span className="text-blood-600">OBABA</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium leading-none">
                  Aksi Donor Darah Relawan
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  isActive(item.path)
                    ? 'text-blood-600 bg-blood-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions: Clean single action button */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Request Button (Desktop) */}
            <Link
              to="/requests"
              className="hidden lg:inline-flex items-center space-x-1.5 py-2 px-3.5 bg-blood-50 hover:bg-blood-100 text-blood-700 text-xs font-bold rounded-xl border border-blood-200 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blood-600" />
              <span>Butuh Darah</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.blood_type ? `${user.blood_type}${user.rhesus || '+'}` : user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </Link>
              </div>
            ) : (
              /* Single Clean Button for Login / Register */
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-blood-600 hover:bg-blood-700 shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
