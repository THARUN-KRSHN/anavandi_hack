import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Search, User, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  // Only render on mobile/tablet user views or public update links
  if (role !== 'user' && !location.pathname.startsWith('/u/')) return null;

  const navItems = [
    { to: '/', label: t('home', 'Home'), icon: <Home className="w-5 h-5" />, end: true },
    { to: '/report', label: t('reportComplaint', 'Report'), icon: <FileText className="w-5 h-5" /> },
    { to: '/track', label: t('trackComplaint', 'Track'), icon: <Search className="w-5 h-5" /> },
    { to: '/profile', label: t('profile', 'Profile'), icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto">
      <nav className="bg-[#171717]/95 backdrop-blur-md text-white rounded-full p-2 shadow-2xl border border-gray-800 flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-white text-[#171717] font-bold shadow-md scale-105'
                  : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Mobile Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-amber-400 hover:text-amber-300 font-bold transition-all min-h-[44px]"
          title="Switch Language (English / മലയാളം)"
        >
          <Globe className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold uppercase">{language === 'en' ? 'മല' : 'EN'}</span>
        </button>
      </nav>
    </div>
  );
};
