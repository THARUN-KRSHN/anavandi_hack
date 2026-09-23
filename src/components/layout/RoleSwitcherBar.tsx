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
    <div className="bg-[#171717] text-white py-2 px-4 border-b border-gray-800 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Bus Sahayi" className="w-4 h-4 object-contain rounded-xs" />
          <span className="font-bold tracking-wider text-red-500 uppercase">{t('app.title')}</span>
          <span className="text-gray-400 hidden sm:inline">| {t('role.switcher_label')}:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
              activeRole === 'passenger'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('role.passenger')}</span>
          </button>

          <button
            onClick={() => navigate('/depot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
              activeRole === 'depot'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('role.depot_officer')}</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('role.admin')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle className="py-1" />
          {onStartDemoFlow && (
            <Button
              size="sm"
              variant="success"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={onStartDemoFlow}
              className="text-xs py-1"
            >
              {t('role.guided_demo')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
