import React from 'react';
import { useTrust } from '../context/TrustContext';
import { Languages, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'header' | 'badge' | 'nav' | 'minimal';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { language, setLanguage } = useTrust();

  if (variant === 'nav') {
    return (
      <div
        className={`inline-flex items-center rounded-lg bg-orange-100/80 p-0.5 border border-orange-200/90 shadow-2xs ${className}`}
        role="group"
        aria-label="Language Switcher"
      >
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
            language === 'hi'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-orange-700'
          }`}
          title="हिंदी में देखें"
        >
          हिंदी
        </button>
        <span className="text-orange-300 font-bold px-0.5 select-none">|</span>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:text-orange-700'
          }`}
          title="Switch to English"
        >
          English
        </button>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/50 text-white text-xs font-bold shadow-xs ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-amber-300" />
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
            language === 'hi'
              ? 'text-amber-300 font-extrabold underline underline-offset-2'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          हिंदी
        </button>
        <span className="text-slate-500 font-semibold select-none">|</span>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
            language === 'en'
              ? 'text-amber-300 font-extrabold underline underline-offset-2'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          English
        </button>
      </div>
    );
  }

  // Default 'header' style — very clear "हिंदी | English"
  return (
    <div
      className={`inline-flex items-center bg-white/20 hover:bg-white/25 backdrop-blur-xs border border-white/30 rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow-2xs transition-all ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Languages className="w-3.5 h-3.5 text-amber-200 mr-1.5 shrink-0" />
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
          language === 'hi'
            ? 'bg-white text-orange-700 font-extrabold shadow-xs'
            : 'text-white/90 hover:text-white hover:bg-white/10'
        }`}
        title="हिंदी भाषा चुनें"
      >
        हिंदी
      </button>
      <span className="text-white/50 px-1 font-bold select-none">|</span>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-white text-orange-700 font-extrabold shadow-xs'
            : 'text-white/90 hover:text-white hover:bg-white/10'
        }`}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
};
