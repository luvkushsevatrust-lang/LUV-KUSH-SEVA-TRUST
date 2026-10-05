import React from 'react';
import { useTrust } from '../context/TrustContext';
import { BG_THEMES } from '../data/bgThemeConfig';
import { BgTheme } from '../types';
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Shield,
  CreditCard,
  UserCheck,
  CheckCircle,
  Palette,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, language, t, settings, bgTheme, setBgTheme } = useTrust();

  const handleNav = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8 border-t-4 border-orange-500 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Organization Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white p-1 flex items-center justify-center shadow-md">
                <img
                  src="/src/assets/images/trust_emblem_logo_1790500141646.jpg"
                  alt="Luv Kush Seva Trust Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">
                  {language === 'en' ? 'Luv Kush Seva Trust' : 'लव कुश सेवा ट्रस्ट'}
                </h3>
                <p className="text-xs text-orange-400 font-medium">LUV KUSH SEVA TRUST</p>
              </div>
            </div>

            <p className="text-sm text-stone-400 leading-relaxed">
              "{language === 'en' ? 'Selfless Service is our Mission, Humanity is our Religion' : 'सेवा ही संकल्प, मानवता ही हमारा धर्म'}"<br />
              {t.footer.trustDesc}
            </p>

            <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/60 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t.banner.govtRegd}</span>
              </div>
              <p className="text-stone-300 font-mono">{t.banner.regNumberLabel}: {settings.registrationNumber}</p>
              <p className="text-stone-400">{t.footer.chairpersonText}: {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}</p>
            </div>
          </div>

          {/* Key Services */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 pb-2 border-b border-stone-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>{t.footer.servicesTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNav('service-orphanage')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.orphanage}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('service-oldage')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.oldAge}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('service-widow')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.widow}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('service-education')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.education}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('service-medical')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.medical}
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 pb-2 border-b border-stone-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>{t.footer.quickLinksTitle}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNav('about')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.about}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('volunteer-registration')}
                  className="hover:text-orange-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-orange-400" />
                  <span>{t.nav.volunteer}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('student-registration')}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  {t.nav.studentRegistration}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('id-card')}
                  className="hover:text-orange-400 transition-colors text-left flex items-center space-x-1.5 font-medium text-amber-300 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>{t.nav.idCard}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('donation')}
                  className="hover:text-orange-400 transition-colors text-left flex items-center space-x-1.5 text-orange-400 font-semibold cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-orange-400" />
                  <span>{t.nav.donate}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('admin-login')}
                  className="hover:text-stone-400 text-stone-500 text-xs flex items-center space-x-1 mt-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.nav.adminLogin}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4 pb-2 border-b border-stone-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>{t.footer.contactTitle}</span>
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-orange-400 font-mono">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="font-mono text-xs">{settings.email}</span>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => handleNav('contact')}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg text-center transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Send Message' : 'संदेश भेजें'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 mt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center text-xs text-stone-500 gap-4">
          <p>© 2026 {language === 'en' ? 'LUV KUSH SEVA TRUST. All rights reserved.' : 'लव कुश सेवा ट्रस्ट (LUV KUSH SEVA TRUST). सर्वाधिकार सुरक्षित।'}</p>
          
          {/* Quick Background Theme Selector in Footer */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'Background Color' : 'पृष्ठभूमि रंग'}:</span>
            </span>
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2 py-1 rounded-full border border-stone-700">
              {(Object.keys(BG_THEMES) as BgTheme[]).map((key) => {
                const theme = BG_THEMES[key];
                const isSelected = bgTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBgTheme(key)}
                    title={language === 'en' ? theme.nameEn : theme.nameHi}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-400 scale-125 border border-white'
                        : 'border border-stone-500 hover:scale-110 opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: theme.bgHex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => handleNav('privacy')} className="hover:text-stone-400 cursor-pointer">
              {t.footer.privacyPolicy}
            </button>
            <button onClick={() => handleNav('terms')} className="hover:text-stone-400 cursor-pointer">
              {t.footer.terms}
            </button>
            <button onClick={() => handleNav('contact')} className="hover:text-stone-400 cursor-pointer">
              {t.nav.contact}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
