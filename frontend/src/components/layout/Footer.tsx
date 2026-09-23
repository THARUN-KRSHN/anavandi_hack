import React from 'react';
import { Bus, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#171717] text-white pt-10 pb-8 border-t border-gray-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#D92D20] text-white flex items-center justify-center font-bold">
                <Bus className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">{t('appName', 'BUS സഹായി')}</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Public Transport Grievance & Depot Accountability Platform. Built for rapid passenger feedback, traceable duty roster lookup, and depot resolution transparency.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-gray-200 uppercase tracking-wider mb-3">
              Privacy & Data Ethics
            </h4>
            <div className="flex items-start gap-2 bg-gray-900 p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Zero Personal Data Storage:</strong> No personal identity or exact GPS location is required to submit a grievance or exposed in public analytics.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-gray-200 uppercase tracking-wider mb-3">
              System Specification
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Responsive React + Vite + TypeScript</li>
              <li>• Three.js (React Three Fiber) supporting 3D layer</li>
              <li>• Accessible rounded controls (`12px` / `16px` / `24px`)</li>
              <li>• PEN Roster Trace & Role-Protected Records</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <span>© 2026 {t('appName', 'BUS സഹായി')} — Public Transport Governance Platform</span>
          <span>Designed & Built with White-First Red/Green Design Tokens</span>
        </div>
      </div>
    </footer>
  );
};
