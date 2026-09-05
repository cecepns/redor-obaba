import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Newspaper,
  Calendar,
  Building2,
  MessageSquare,
  LogOut,
  ArrowLeft,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Data Anggota / Donor', path: '/admin/donors', icon: Users },
    { name: 'Permintaan Darah', path: '/admin/requests', icon: HeartHandshake },
    { name: 'Berita & Kegiatan', path: '/admin/activities', icon: Newspaper },
    { name: 'Jadwal Aksi Donor', path: '/admin/schedules', icon: Calendar },
    { name: 'Faskes & Ambulans', path: '/admin/hospitals', icon: Building2 },
    { name: 'Kritik & Saran', path: '/admin/feedback', icon: MessageSquare },
    { name: 'WhatsApp Gateway', path: '/admin/wa-gateway', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link to="/admin" className="flex items-center space-x-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 shadow-sm">
              <img src="/obaba-logo.jpeg" alt="OBABA Logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                REDOR <span className="text-blood-500">OBABA</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Panel Administrator</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 mx-4 my-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user?.blood_type ? `${user.blood_type}+` : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-emerald-400 font-medium">Online (Super Admin)</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Menu Kelola</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blood-600 text-white shadow-lg shadow-blood-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
