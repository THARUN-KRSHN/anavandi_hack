import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Search, User, LogOut, Shield, Building2 } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { LanguageToggle } from '../ui/LanguageToggle';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#E2F1E7]/90 via-[#F4F9F5]/90 to-[#E5F3EB]/90 backdrop-blur-md border-b border-[#EAECF0]/80 py-3 px-4 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group" title="Bus Sahayi Home">
            <img
              src="/logo.png"
              alt="Bus Sahayi Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl bg-white p-0.5 border border-[#EAECF0] shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-[#171717] tracking-tight leading-none group-hover:text-[#D92D20] transition-colors">
                {t('app.title')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] mt-0.5">
                {role === 'depot_head'
                  ? 'Depot Head Portal'
                  : role === 'admin'
                  ? 'Admin Governance'
                  : t('app.subtitle')}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <LanguageToggle />

          {isAuthenticated ? (
            <>
              {role === 'user' && (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-full border border-[#EAECF0] text-xs font-semibold text-[#475467]">
                    <span>Hi, {user?.name ? user.name.split(' ')[0] : 'Passenger'} 👋</span>
                  </div>

                  <Link
                    to="/track"
                    className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    title={t('nav.track')}
                  >
                    <Search className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/profile"
                    className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    title={t('nav.profile')}
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                  </Link>
                </>
              )}

              {role === 'depot_head' && (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-200 text-xs font-bold text-[#D92D20]">
                    <Building2 className="w-4 h-4" />
                    <span>{user?.depotName || 'Depot Desk'}</span>
                  </div>
                </div>
              )}

              {role === 'admin' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-bold text-emerald-800">
                  <Shield className="w-4 h-4" />
                  <span>State Admin</span>
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#667085] hover:text-[#D92D20] hover:bg-red-50 hover:scale-105 active:scale-95 transition-all"
                title={t('nav.sign_out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 bg-[#171717] text-white text-xs font-bold rounded-full shadow-md hover:bg-black transition-all"
            >
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
