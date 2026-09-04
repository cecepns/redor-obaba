import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
