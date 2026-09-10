import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Newspaper,
  Calendar,
  Camera,
  Building2,
  MessageSquare,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Data Anggota / Donor', path: '/admin/donors', icon: Users },
    { name: 'Permintaan Darah', path: '/admin/requests', icon: HeartHandshake },
    { name: 'Berita & Kegiatan', path: '/admin/activities', icon: Newspaper },
    { name: 'Galeri Kegiatan', path: '/admin/gallery', icon: Camera },
    { name: 'Jadwal Aksi Donor', path: '/admin/schedules', icon: Calendar },
    { name: 'Faskes & Ambulans', path: '/admin/hospitals', icon: Building2 },
    { name: 'Kritik & Saran', path: '/admin/feedback', icon: MessageSquare },
    { name: 'WhatsApp Gateway', path: '/admin/wa-gateway', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const active = navItems.find((item) => (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)));
    return active ? active.name : 'Panel Administrator';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex antialiased">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Clean White Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-sm md:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/admin" className="flex items-center space-x-2.5" onClick={() => setIsSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-xs">
              <img src="/obaba-logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-md" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                REDOR <span className="text-blood-600 font-extrabold">OBABA</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">Admin Panel</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blood-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
              {user?.blood_type ? `${user.blood_type}+` : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-medium">Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Menu Utama</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blood-50 text-blood-700 font-bold border border-blood-100 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Lihat Website</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Admin</span>
              <span className="text-xs text-slate-300 hidden sm:inline">/</span>
              <h1 className="text-sm sm:text-base font-bold text-slate-800">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blood-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Website</span>
            </Link>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {user?.name ? user.name.charAt(0) : 'A'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
