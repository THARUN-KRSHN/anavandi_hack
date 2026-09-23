import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, FileText, Menu, X, Globe, UserCheck, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isDepot = location.pathname.startsWith('/depot');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md border border-[#EAECF0] rounded-full shadow-lg shadow-gray-200/50 px-5 py-2.5 flex items-center justify-between pointer-events-auto">
        
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#D92D20] text-white flex items-center justify-center font-black text-sm shadow-md shadow-red-200">
            <Bus className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-lg text-[#171717] tracking-tight block leading-none">
              {t('appName', 'ANAVANDI')}
            </span>
            <span className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">
              KSRTC Grievance
            </span>
          </div>
        </Link>

        {/* Center: Centered Pill Design Nav */}
        <nav className="hidden md:flex items-center bg-[#F9FAFB] border border-[#EAECF0] rounded-full p-1 shadow-inner gap-1">
          {!isDepot && !isAdmin && (
            <>
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  location.pathname === '/'
                    ? 'bg-white text-[#D92D20] shadow-sm'
                    : 'text-[#475467] hover:text-[#171717]'
                }`}
              >
                {t('home', 'Home')}
              </Link>
              <Link
                to="/report"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  location.pathname === '/report'
                    ? 'bg-[#D92D20] text-white shadow-sm'
                    : 'text-[#475467] hover:text-[#171717]'
                }`}
              >
                {t('reportComplaint', 'Report Issue')}
              </Link>
              <Link
                to="/track"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  location.pathname.startsWith('/track')
                    ? 'bg-white text-[#D92D20] shadow-sm'
                    : 'text-[#475467] hover:text-[#171717]'
                }`}
              >
                {t('trackComplaint', 'Track')}
              </Link>
            </>
          )}

          {isDepot && (
            <>
              <Link
                to="/depot"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  location.pathname === '/depot'
                    ? 'bg-white text-[#171717] shadow-sm'
                    : 'text-[#475467] hover:text-[#171717]'
                }`}
              >
                {t('depotDashboard', 'Dashboard')}
              </Link>
              <Link to="/depot/complaints" className="px-3 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                Case Queue
              </Link>
              <Link to="/depot/escalations" className="px-3 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                Escalations
              </Link>
              <Link to="/depot/crew" className="px-3 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                {t('crew', 'Crew')}
              </Link>
              <Link to="/depot/buses" className="px-3 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                {t('buses', 'Buses')}
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin" className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#171717] hover:bg-white">
                Overview
              </Link>
              <Link to="/admin/analytics" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                Analytics
              </Link>
              <Link to="/admin/complaints" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                All Cases
              </Link>
              <Link to="/admin/depots" className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#475467] hover:text-[#171717]">
                Depot Index
              </Link>
            </>
          )}
        </nav>

        {/* Right Action: Language Switcher + CTA / Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bilingual Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAECF0] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 shadow-xs transition-all"
            title="Switch Language (English / മലയാളം)"
          >
            <Globe className="w-3.5 h-3.5 text-[#D92D20]" />
            <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>

          {!isDepot && !isAdmin && (
            <Link to="/report" className="hidden sm:inline-block">
              <Button variant="primary" className="rounded-full px-4 py-1.5 text-xs font-bold shadow-sm" icon={<FileText className="w-3.5 h-3.5" />}>
                {t('reportComplaint', 'Report Issue')}
              </Button>
            </Link>
          )}

          {isDepot && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#171717] px-3.5 py-1.5 rounded-full">
              <UserCheck className="w-3.5 h-3.5 text-green-400" />
              {user?.depotName || 'Depot HQ'}
            </span>
          )}

          {isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#D92D20] px-3.5 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </span>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#475467] hover:text-[#171717] rounded-full hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white/95 backdrop-blur-md border border-[#EAECF0] rounded-3xl p-4 shadow-xl space-y-2 pointer-events-auto animate-in slide-in-from-top-2 duration-200">
          {!isDepot && !isAdmin && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-bold text-[#171717]">
                {t('home', 'Home')}
              </Link>
              <Link to="/report" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl bg-red-50 text-xs font-bold text-[#D92D20]">
                {t('reportComplaint', 'Report Issue')}
              </Link>
              <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-bold text-[#171717]">
                {t('trackComplaint', 'Track Status')}
              </Link>
            </>
          )}

          {isDepot && (
            <>
              <Link to="/depot" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-bold">Depot Dashboard</Link>
              <Link to="/depot/complaints" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-medium">Case Queue</Link>
              <Link to="/depot/escalations" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-medium">Escalations</Link>
              <Link to="/depot/crew" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-2xl hover:bg-gray-50 text-xs font-medium">Crew Directory</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
