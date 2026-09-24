import React from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../ui/LanguageToggle';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#171717] text-white pt-10 pb-8 border-t border-gray-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.png" alt="Bus Sahayi" className="w-9 h-9 object-contain rounded-xl bg-white p-0.5" />
              <span className="font-extrabold text-lg tracking-tight">{t('app.title')}</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              {t('app.tagline')}. {t('home.hero_desc')}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-gray-200 uppercase tracking-wider mb-3">
              Privacy & Data Protection
            </h4>
            <div className="flex items-start gap-2 bg-gray-900 p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Secure & Transparent:</strong> Complete grievance tracking with SLA auto-escalation, SMS/Email notifications, and depot accountability.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-gray-200 uppercase tracking-wider mb-3">
              Quick Language Selection
            </h4>
            <div className="flex items-center gap-3">
              <LanguageToggle />
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <span>© 2026 {t('app.title')} — KSRTC Grievance Redressal Portal</span>
          <span>Kerala Public Transport Accountability Platform</span>
        </div>
      </div>
    </footer>
  );
};
