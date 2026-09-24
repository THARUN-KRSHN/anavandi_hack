import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { AppRouter } from './router';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { DynamicDotBackground } from '../components/ui/DynamicDotBackground';

import { AILabDemoConsole } from '../components/demo/AILabDemoConsole';

export const App: React.FC = () => {
  useRealtimeSync();
  const location = useLocation();
  const { role } = useAuth();

  const isAuthPage = location.pathname === '/auth';
  const isConductorPage = location.pathname.startsWith('/u/');
  const isDepot = location.pathname.startsWith('/depot');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB] text-[#171717] flex flex-col font-sans overflow-x-hidden">
      {/* Interactive Halftone Dot Background Canvas */}
      <DynamicDotBackground />

      {/* Floating AI & Security Lab Console */}
      <AILabDemoConsole />

      {/* Clean layout for Auth / Conductor update screens */}
      {isAuthPage || isConductorPage ? (
        <main className="relative z-10 min-h-screen flex flex-col">
          <AppRouter />
        </main>
      ) : (
        <>
          {/* Top Header */}
          <Header />

          {/* Body Content Layout */}
          <div className="relative z-10 flex-1 flex max-w-7xl w-full mx-auto">
            {(isDepot || isAdmin) && <Sidebar role={role === 'admin' ? 'admin' : 'depot'} />}

            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              <AppRouter />
            </main>
          </div>

          {/* Floating Dark Pill Bottom Nav for Mobile Users */}
          <BottomNav />
        </>
      )}
    </div>
  );
};
