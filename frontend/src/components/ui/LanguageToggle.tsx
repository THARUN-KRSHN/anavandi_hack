import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer shadow-xs ${
        language === 'ml'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      } ${className}`}
      title={language === 'en' ? 'Switch to Malayalam' : 'Switch to English'}
    >
      <Globe className="w-3.5 h-3.5 text-emerald-600" />
      <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
    </button>
  );
};
