import React, { useState, useRef, useEffect } from 'react';
import { useTrust } from '../context/TrustContext';
import { BG_THEMES } from '../data/bgThemeConfig';
import { BgTheme } from '../types';
import { Palette, Check, Sparkles } from 'lucide-react';

export const ThemeColorSwitcher: React.FC = () => {
  const { bgTheme, setBgTheme, language } = useTrust();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentTheme = BG_THEMES[bgTheme] || BG_THEMES.sandalwood;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={language === 'en' ? 'Change Website Background Color' : 'वेबसाइट का पृष्ठभूमि रंग बदलें'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
        aria-expanded={isOpen}
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-inner shrink-0"
          style={{ backgroundColor: currentTheme.bgHex }}
        />
        <Palette className="w-3.5 h-3.5 text-amber-200 shrink-0" />
        <span className="hidden sm:inline font-medium">
          {language === 'en' ? 'Theme' : 'रंग'}:
        </span>
        <span className="font-bold text-amber-100 max-w-[85px] sm:max-w-none truncate">
          {language === 'en' ? currentTheme.nameEn.split(' ')[0] : currentTheme.nameHi.split(' ')[0]}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-stone-200 py-3 z-50 text-stone-800 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 pb-2.5 mb-2 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                {language === 'en' ? 'Choose Background Color' : 'वेबसाइट का रंग चुनें'}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium">
              {language === 'en' ? 'Instant Change' : 'तुरंत लागू'}
            </span>
          </div>

          <div className="px-2 space-y-1.5 max-h-80 overflow-y-auto">
            {(Object.keys(BG_THEMES) as BgTheme[]).map((themeKey) => {
              const theme = BG_THEMES[themeKey];
              const isSelected = bgTheme === themeKey;

              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => {
                    setBgTheme(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                      : 'hover:bg-stone-50 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-xl border-2 border-stone-300/80 shadow-inner shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: theme.bgHex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-stone-800 stroke-[3]" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">
                          {language === 'en' ? theme.nameEn : theme.nameHi}
                        </span>
                        {themeKey === 'sandalwood' && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                            {language === 'en' ? 'Default' : 'सुझाया'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                        {language === 'en' ? theme.descEn : theme.descHi}
                      </p>
                    </div>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full border border-stone-300 shrink-0 ml-2"
                    style={{ backgroundColor: theme.subtleHex }}
                    title={theme.bgHex}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 px-4 border-t border-stone-100 text-[10px] text-stone-500 text-center">
            {language === 'en'
              ? 'Selection is saved automatically for your device'
              : 'आपकी पसंद आपके फोन/कंप्यूटर पर सुरक्षित रहती है'}
          </div>
        </div>
      )}
    </div>
  );
};
