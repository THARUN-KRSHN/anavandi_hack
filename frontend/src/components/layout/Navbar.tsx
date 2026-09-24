import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../ui/LanguageToggle';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const isDepot = location.pathname.startsWith('/depot');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-white border-b border-[#EAECF0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Bus Sahayi Logo" className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-[#EAECF0] shadow-sm shadow-emerald-100" />
            <div>
              <span className="font-extrabold text-xl text-[#171717] tracking-tight block leading-none">
                {t('app.title')}
              </span>
              <span className="text-[10px] text-[#667085] uppercase tracking-wider font-semibold">
                {t('app.subtitle')}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {!isDepot && !isAdmin && (
              <>
                <Link
                  to="/"
                  className={`transition-colors ${
                    location.pathname === '/' ? 'text-[#D92D20] font-bold' : 'text-[#475467] hover:text-[#171717]'
                  }`}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to="/report"
                  className={`transition-colors ${
                    location.pathname === '/report' ? 'text-[#D92D20] font-bold' : 'text-[#475467] hover:text-[#171717]'
                  }`}
                >
                  {t('nav.report')}
                </Link>
                <Link
                  to="/track"
                  className={`transition-colors ${
                    location.pathname.startsWith('/track') ? 'text-[#D92D20] font-bold' : 'text-[#475467] hover:text-[#171717]'
                  }`}
                >
                  {t('nav.track')}
                </Link>
              </>
            )}

            {isDepot && (
              <>
                <Link to="/depot" className="text-[#475467] hover:text-[#171717]">{t('nav.depot_dashboard')}</Link>
                <Link to="/depot/complaints" className="text-[#475467] hover:text-[#171717]">{t('nav.case_queue')}</Link>
                <Link to="/depot/escalations" className="text-[#475467] hover:text-[#171717]">{t('nav.escalations')}</Link>
                <Link to="/depot/crew" className="text-[#475467] hover:text-[#171717]">{t('nav.crew_directory')}</Link>
                <Link to="/depot/buses" className="text-[#475467] hover:text-[#171717]">{t('nav.fleet_master')}</Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link to="/admin" className="text-[#475467] hover:text-[#171717]">{t('nav.admin_overview')}</Link>
                <Link to="/admin/analytics" className="text-[#475467] hover:text-[#171717]">{t('nav.analytics')}</Link>
                <Link to="/admin/complaints" className="text-[#475467] hover:text-[#171717]">{t('nav.all_cases')}</Link>
                <Link to="/admin/depots" className="text-[#475467] hover:text-[#171717]">{t('nav.depot_index')}</Link>
                <Link to="/admin/routes" className="text-[#475467] hover:text-[#171717]">{t('nav.route_hotspots')}</Link>
              </>
            )}
          </div>

          {/* Right Action CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            {!isDepot && !isAdmin && (
              <Link to="/report">
                <Button variant="primary" icon={<FileText className="w-4 h-4" />}>
                  {t('nav.report')}
                </Button>
              </Link>
            )}
            {isDepot && (
              <span className="text-xs font-semibold text-white bg-[#171717] px-3 py-1.5 rounded-xl border border-gray-700">
                Depot Desk
              </span>
            )}
            {isAdmin && (
              <span className="text-xs font-semibold text-white bg-[#D92D20] px-3 py-1.5 rounded-xl">
                System Admin Mode
              </span>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#475467] hover:text-[#171717] min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#EAECF0] p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {!isDepot && !isAdmin && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-xl hover:bg-[#F9FAFB] text-sm font-medium text-[#171717]"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-xl bg-red-50 text-sm font-bold text-[#D92D20]"
              >
                {t('nav.report')}
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-xl hover:bg-[#F9FAFB] text-sm font-medium text-[#171717]"
              >
                {t('nav.track')}
              </Link>
            </>
          )}

          {isDepot && (
            <>
              <Link to="/depot" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.depot_dashboard')}</Link>
              <Link to="/depot/complaints" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.case_queue')}</Link>
              <Link to="/depot/escalations" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.escalations')}</Link>
              <Link to="/depot/crew" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.crew_directory')}</Link>
              <Link to="/depot/buses" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.fleet_master')}</Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.admin_overview')}</Link>
              <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.analytics')}</Link>
              <Link to="/admin/complaints" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.all_cases')}</Link>
              <Link to="/admin/depots" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.depot_index')}</Link>
              <Link to="/admin/routes" onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl hover:bg-[#F9FAFB]">{t('nav.route_hotspots')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
