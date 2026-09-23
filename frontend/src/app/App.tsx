import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { AppRouter } from './router';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export const App: React.FC = () => {
  useRealtimeSync();
  const location = useLocation();
  const { role } = useAuth();

  const isAuthPage = location.pathname === '/auth';
  const isConductorPage = location.pathname.startsWith('/u/');
  const isDepot = location.pathname.startsWith('/depot');
  const isAdmin = location.pathname.startsWith('/admin');

  // If on Auth page or conductor update page, render clean layout without Header/Sidebar
  if (isAuthPage || isConductorPage) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB]">
        <AppRouter />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB] text-[#171717] flex flex-col font-sans">
      {/* Top Header */}
      <Header />

      {/* Body Content Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {(isDepot || isAdmin) && <Sidebar role={role as 'depot' | 'admin'} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <AppRouter />
        </main>
      </div>

      {/* Floating Dark Pill Bottom Nav for Mobile Users */}
      <BottomNav />
    </div>
  );
};
