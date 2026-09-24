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
    <header className="sticky top-2 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all">
      {/* Floating Pill Header Module */}
      <div className="bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-full shadow-lg shadow-emerald-950/5 px-4 sm:px-6 py-2 flex items-center justify-between gap-4 transition-all">
        
        {/* Brand Logo & Pill Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group" title="Bus Sahayi Home">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 group-hover:scale-105 transition-transform shadow-xs">
              <img
                src="/logo.png"
                alt="Bus Sahayi Logo"
                className="w-8 h-8 object-contain rounded-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-[#171717] tracking-tight leading-none group-hover:text-[#D92D20] transition-colors">
                {t('app.title')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/70 text-emerald-800 border border-emerald-300/60 hidden sm:inline-block">
                {role === 'depot_head'
                  ? t('header.depot_head_portal')
                  : role === 'admin'
                  ? t('header.admin_governance')
                  : t('app.subtitle')}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Controls (Pill Design) */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Pill */}
          <LanguageToggle />

          {isAuthenticated ? (
            <>
              {role === 'user' && (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 rounded-full border border-gray-200 text-xs font-semibold text-[#475467]">
                    <span>{t('header.hello', `Hi, ${user?.name ? user.name.split(' ')[0] : 'Passenger'}`)} 👋</span>
                  </div>

                  <Link
                    to="/track"
                    className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-[#171717] hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all"
                    title={t('nav.track')}
                  >
                    <Search className="w-4 h-4 text-gray-700" />
                  </Link>

                  <Link
                    to="/profile"
                    className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 shadow-xs flex items-center justify-center text-emerald-800 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all"
                    title={t('nav.profile')}
                  >
                    <User className="w-4 h-4 text-emerald-700" />
                  </Link>
                </>
              )}

              {role === 'depot_head' && (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 rounded-full border border-red-200 text-xs font-bold text-[#D92D20] shadow-xs">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="max-w-[140px] truncate">{user?.depotName || t('header.depot_desk')}</span>
                  </div>
                </div>
              )}

              {role === 'admin' && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('header.state_admin')}</span>
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-[#D92D20] hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={t('nav.sign_out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-1.5 bg-[#171717] text-white text-xs font-extrabold rounded-full shadow-md hover:bg-black hover:scale-105 transition-all"
            >
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
