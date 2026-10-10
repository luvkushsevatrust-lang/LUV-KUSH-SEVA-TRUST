import React from 'react';
import { useTrust } from '../context/TrustContext';
import { MapPin, Phone, Heart } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeColorSwitcher } from './ThemeColorSwitcher';
import { SafeImage } from './SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';

export const TrustBannerHeader: React.FC = () => {
  const { settings, setCurrentPage, language, t } = useTrust();

  const activeLogoSrc = settings.logoUrl || TRUST_EMBLEM_LOGO;

  return (
    <div className="w-full bg-slate-900 border-b border-amber-300/40 select-none shadow-md overflow-hidden">
      {/* Top Red Tagline Ribbon with Theme Color Switcher & Language Switcher */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-1.5 px-3 text-center shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left spacer / mobile indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-amber-200 text-xs font-semibold">
            <span>{t.banner.govtRegd}</span>
          </div>

          {/* Center Tagline */}
          <div className="flex-1 flex items-center justify-center gap-2 text-white font-semibold text-xs sm:text-sm tracking-wide">
            <Heart className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
            <span>{language === 'en' ? 'Dedicated to Service, Education, Health and Humanity' : settings.tagline}</span>
            <Heart className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
          </div>

          {/* Right: Theme Color & Language Switchers */}
          <div className="shrink-0 flex items-center gap-2">
            <ThemeColorSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Banner Visual Frame - Faithful to uploaded reference */}
      <div className="bg-gradient-to-b from-sky-50 via-white to-blue-50 py-3 px-3 sm:px-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left: Luv Kush Divine Emblem - Perfect Round Crest */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              onClick={() => setCurrentPage('home')}
              className="cursor-pointer group flex items-center transition-transform hover:scale-105"
              title={language === 'en' ? 'Luv Kush Seva Trust - Home' : 'लव कुश सेवा ट्रस्ट - मुख्य पृष्ठ'}
            >
              <div className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full border-4 border-amber-400 p-1 bg-white shadow-xl overflow-hidden flex items-center justify-center ring-4 ring-blue-900/10">
                <SafeImage
                  src={activeLogoSrc}
                  alt="Luv Kush Seva Trust Emblem"
                  className="w-full h-full object-contain rounded-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Center: Main Trust Typography in Red & Royal Blue */}
          <div className="text-center flex-1 px-2">
            <div 
              onClick={() => setCurrentPage('home')}
              className="cursor-pointer inline-block"
            >
              <div className="flex flex-wrap items-center justify-center gap-x-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none drop-shadow-sm">
                <span className="text-red-600 font-extrabold hover:text-red-700 transition-colors">
                  LUV KUSH
                </span>
                <span className="text-blue-900 font-black hover:text-blue-950 transition-colors">
                  SEVA TRUST
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-1 tracking-wide">
                ( {language === 'en' ? 'Luv Kush Seva Trust, Rajgir' : settings.nameHi} )
              </p>
            </div>

            {/* Reg No Badge & Tagline Pill for Mobile / Desktop */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-sm border border-red-500 font-mono tracking-wide">
                {t.banner.regNumberLabel} : {settings.registrationNumber}
              </span>
              <span className="bg-amber-400 text-slate-900 font-bold text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-sm">
                {language === 'en' ? 'Selfless Service is the Highest Duty' : settings.secondaryTagline}
              </span>
            </div>
          </div>

          {/* Right: Office & Chairperson Badge + Green Tree / Seva Seal */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Chairperson Badge */}
            <div className="bg-gradient-to-b from-red-50 to-white border-2 border-red-600 rounded-xl p-2 text-center shadow-md min-w-[140px]">
              <div className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-t tracking-wider">
                {language === 'en' ? 'OFFICE' : 'कार्यालय'}
              </div>
              <div className="bg-red-100 text-red-800 text-xs font-bold py-0.5 px-2 my-0.5 rounded-sm">
                {language === 'en' ? 'Chairperson' : 'अध्यक्ष'}
              </div>
              <div className="bg-blue-900 text-white font-bold text-sm sm:text-base px-2.5 py-1 rounded shadow-inner">
                {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
              </div>
            </div>

            {/* Secondary Green Nature/Seva Icon Emblem */}
            <div className="hidden md:flex w-16 h-16 rounded-full border-2 border-emerald-500 bg-emerald-50 items-center justify-center p-1 shadow-md">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-emerald-600" fill="currentColor">
                <path d="M50 15 C35 15, 25 30, 30 45 C20 48, 15 60, 25 70 C35 80, 45 80, 50 90 C55 80, 65 80, 75 70 C85 60, 80 48, 70 45 C75 30, 65 15, 50 15 Z" fill="#15803d" opacity="0.85" />
                <path d="M48 90 L52 90 L52 55 L48 55 Z" fill="#854d0e" />
                <path d="M42 65 C45 60, 55 60, 58 65" stroke="#ffffff" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>

        </div>

        {/* Address and Contact Yellow & Green Footer Strips */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Address Strip */}
          <div className="flex items-center gap-1.5 bg-amber-100/90 text-slate-900 font-semibold px-3 py-1.5 rounded-lg border border-amber-300 w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-bold text-red-700 shrink-0">{language === 'en' ? 'Address:' : 'पता :'}</span>
            <span className="truncate">{language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir (Nalanda) Bihar - 803116' : settings.address}</span>
          </div>

          {/* Green WhatsApp / Contact Strip */}
          <a
            href={`tel:${settings.phone}`}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors shrink-0 w-full sm:w-auto justify-center"
          >
            <Phone className="w-4 h-4 text-yellow-300" />
            <span>{language === 'en' ? 'Contact:' : 'संपर्क करें :'}</span>
            <span className="tracking-wider font-mono text-sm sm:text-base text-yellow-200">
              {settings.phone}
            </span>
          </a>
        </div>
      </div>

      {/* Bottom Royal Blue Calling Ribbon */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 py-1 px-4 text-center border-t border-amber-300/30">
        <p className="text-amber-200 text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2">
          <span>❧</span>
          <span>{language === 'en' ? "Let's join hands in this noble mission of selfless service and humanity." : 'आइए, मिलकर सेवा के इस पवित्र कार्य में अपना सहयोग दें।'}</span>
          <span>❧</span>
        </p>
      </div>
    </div>
  );
};

