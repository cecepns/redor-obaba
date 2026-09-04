import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import {
  Users,
  HeartHandshake,
  Droplets,
  Award,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28" count={4} />
      </div>
    );
  }

  const { stats, topDonors, distribution } = data || {
    stats: {},
    topDonors: [],
    distribution: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-blood-600 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Panel Administrator Redor OBABA</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Ringkasan & Statistik Komunitas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Pantau seluruh aktivitas donor, ketersediaan darah, dan permintaan darurat.
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Donor Siap Aktif</span>
            <span className="text-2xl font-black text-slate-900">{stats.ready_donors || 0}</span>
            <span className="text-[11px] text-slate-400 block">dari {stats.total_members || 0} anggota</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Permintaan Darah</span>
            <span className="text-2xl font-black text-slate-900">{stats.total_requests || 0}</span>
            <span className="text-[11px] text-rose-500 font-bold block">{stats.urgent_requests || 0} mendesak</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Kantong Terkumpul</span>
            <span className="text-2xl font-black text-slate-900">{stats.total_bags_donated || 0}</span>
            <span className="text-[11px] text-slate-400 block">Total donasi tercatat</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Anggota</span>
            <span className="text-2xl font-black text-slate-900">{stats.total_members || 0}</span>
            <span className="text-[11px] text-emerald-600 font-bold block">100% Relawan</span>
          </div>
        </div>
      </div>

      {/* Grid: Top Donors Leaderboard & Blood Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors Leaderboard */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Peringkat Relawan Donor Terbanyak
            </h3>
            <Link to="/admin/donors" className="text-xs font-bold text-blood-600 hover:underline">
              Kelola Semua
            </Link>
          </div>

          <div className="space-y-2.5">
            {topDonors.map((donor, idx) => (
              <div
                key={donor.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-900 shadow-sm'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-600/30 text-amber-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{donor.name}</h5>
                    <p className="text-slate-500 text-[11px]">{donor.city} • ID: {donor.donor_card_no}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-black px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800">
                    {donor.blood_type}{donor.rhesus}
                  </span>
                  <span className="font-extrabold text-blood-600 bg-blood-50 px-2.5 py-1 rounded-lg">
                    {donor.total_donations}x Donor
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blood Type Group Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blood-600" />
              Distribusi Golongan Darah Anggota
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {distribution.map((dist) => (
              <div
                key={dist.blood_group}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {dist.blood_group}
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{dist.count}</span>
                  <span className="text-[11px] text-slate-500 block font-medium">Relawan</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
