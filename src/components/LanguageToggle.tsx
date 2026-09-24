import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2 } from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { Language } from '../types';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'button' | 'compact';
  id?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  variant = 'pill',
  id = 'language-toggle-btn'
}) => {
  const { i18n, t } = useTranslation();
  const { language, toggleLanguage } = useInspection();

  const currentLang = (i18n.language?.startsWith('hi') ? 'hi' : 'en') as Language;

  const handleLanguageChange = (newLang: Language) => {
    if (newLang === currentLang) return;
    i18n.changeLanguage(newLang);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('onionvision_language', newLang);
    }
  };

  // Compact button variant (matches existing minimal button header layout)
  if (variant === 'button') {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    return (
      <button
        onClick={() => handleLanguageChange(nextLang)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/70 hover:border-emerald-500/50 shadow-sm transition-all active:scale-95 group ${className}`}
        title={currentLang === 'en' ? 'हिन्दी में बदलें (Switch to Hindi)' : 'Switch to English (अंग्रेजी में बदलें)'}
        id={id}
        aria-label="Toggle language"
      >
        <Globe2 className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-mono uppercase font-bold tracking-wide">
          {currentLang === 'en' ? 'हिन्दी' : 'EN'}
        </span>
      </button>
    );
  }

  // Premium Segmented Pill Variant (EN | हिन्दी) with smooth active indicator
  return (
    <div 
      className={`inline-flex items-center bg-slate-850/90 backdrop-blur-md rounded-xl p-0.5 border border-slate-700/80 shadow-inner text-xs ${className}`}
      role="group"
      aria-label="Language selection"
      id={id}
    >
      <div className="pl-1.5 pr-1 flex items-center justify-center text-slate-400">
        <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      {/* English Option */}
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold tracking-tight transition-all duration-200 ${
          currentLang === 'en'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-950 scale-100 ring-1 ring-emerald-400/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-pressed={currentLang === 'en'}
        title="Switch to English"
        id={`${id}-en`}
      >
        EN
      </button>

      {/* Hindi Option */}
      <button
        type="button"
        onClick={() => handleLanguageChange('hi')}
        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-tight transition-all duration-200 ${
          currentLang === 'hi'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-950 scale-100 ring-1 ring-emerald-400/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-pressed={currentLang === 'hi'}
        title="हिन्दी में बदलें (Hindi)"
        id={`${id}-hi`}
      >
        हिन्दी
      </button>
    </div>
  );
};

export default LanguageToggle;
