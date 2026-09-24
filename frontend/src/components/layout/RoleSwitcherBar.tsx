import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Building2, Shield, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../ui/LanguageToggle';

export const RoleSwitcherBar: React.FC<{ onStartDemoFlow?: () => void }> = ({ onStartDemoFlow }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const getCurrentRole = () => {
    if (location.pathname.startsWith('/depot')) return 'depot';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'passenger';
  };

  const activeRole = getCurrentRole();

  return (
    <div className="bg-[#111827] text-white py-1.5 px-4 border-b border-gray-800 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Demo Pill */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Bus Sahayi" className="w-3.5 h-3.5 object-contain rounded-full" />
          </div>
          <span className="font-black tracking-wider text-red-400 uppercase text-[11px]">{t('app.title')}</span>
          <span className="text-gray-400 hidden sm:inline text-[11px]">| {t('role.switcher_label')}:</span>
        </div>

        {/* Role Selector Pill Container */}
        <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-full border border-gray-800 shadow-inner">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-bold text-[11px] cursor-pointer ${
              activeRole === 'passenger'
                ? 'bg-[#D92D20] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('role.passenger')}</span>
          </button>

          <button
            onClick={() => navigate('/depot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-bold text-[11px] cursor-pointer ${
              activeRole === 'depot'
                ? 'bg-[#D92D20] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('role.depot_officer')}</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-bold text-[11px] cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-[#D92D20] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('role.admin')}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <LanguageToggle className="py-1 px-2.5 text-[11px]" />
          {onStartDemoFlow && (
            <Button
              size="sm"
              variant="success"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={onStartDemoFlow}
              className="text-[11px] py-1 px-3 rounded-full"
            >
              {t('role.guided_demo')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
