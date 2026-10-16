import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { CORE_SERVICES_DATA } from '../data/mockData';
import { ShieldCheck, Heart, Users, Award, CheckCircle, Info } from 'lucide-react';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import { SafeImage } from '../components/SafeImage';
import { HERO_TRUST_SEVA, CHAIRPERSON_PHOTO } from '../assets';

export const AboutPage: React.FC = () => {
  const { settings, setCurrentPage, language, t } = useTrust();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Top Header */}
      <div className="text-center space-y-1.5">
        <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
          {t.aboutPage.badge}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          {language === 'en' ? 'Luv Kush Seva Trust, Rajgir (Nalanda)' : 'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा)'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
          “{t.banner.tagline}” — {t.aboutPage.subtitle}
        </p>
      </div>

      {/* Main Vision Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 relative aspect-video lg:aspect-auto min-h-[220px]">
          <SafeImage
            src={HERO_TRUST_SEVA}
            alt="Luv Kush Seva Trust Humanitarian & Social Welfare Outreach"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <div className="text-white">
              <span className="bg-red-600 font-bold text-[10px] px-2 py-0.5 rounded shadow">
                {t.banner.govtRegd}
              </span>
              <h3 className="text-sm sm:text-base font-bold mt-1 leading-snug">
                {t.banner.secondaryTagline}
              </h3>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-4 sm:p-6 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.banner.regNumberLabel}: {settings.registrationNumber}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
            {t.aboutPage.storyTitle}
          </h2>

          <p className="text-xs text-slate-700 leading-relaxed">
            {t.aboutPage.storyText1}
          </p>

          <p className="text-xs text-slate-700 leading-relaxed">
            {t.aboutPage.storyText2}
          </p>

          <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-0.5 text-[11px]">
                {language === 'en' ? 'Headquarters:' : 'मुख्यालय:'}
              </strong>
              <span className="text-slate-600 text-[11px] leading-tight block">
                {language === 'en' ? 'Raispar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-amber-400 bg-amber-50 shrink-0 shadow-xs">
                <SafeImage
                  src={settings.chairpersonPhotoUrl || CHAIRPERSON_PHOTO}
                  alt="Satyendra Kumar, Founder & Chairperson, Luv Kush Seva Trust"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <strong className="block text-slate-900 font-bold text-[11px]">
                  {language === 'en' ? 'Chairperson:' : 'अध्यक्ष:'}
                </strong>
                <span className="text-slate-700 font-semibold text-[11px] truncate block">
                  {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
            <Heart className="w-4 h-4 fill-red-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{t.aboutPage.missionTitle}</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {t.aboutPage.missionText}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{t.aboutPage.visionTitle}</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {t.aboutPage.visionText}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{t.aboutPage.value2Title}</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {t.aboutPage.value2Desc}
          </p>
        </div>
      </div>

      {/* Official Credentials Box (Compact & Refined) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {language === 'en' ? 'Statutory Details' : 'वैधानिक विवरण'}
            </span>
            <h2 className="text-base sm:text-lg md:text-xl font-bold">
              {language === 'en' ? 'Registered Public Charitable Trust' : 'पंजीकृत सामाजिक सेवा न्यास'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
                {language === 'en' ? 'Trust Name:' : 'संस्था का नाम:'}
              </span>
              <strong className="text-xs text-white font-bold block">{settings.name}</strong>
            </div>

            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
                {language === 'en' ? 'Registration Number:' : 'पंजीकरण संख्या:'}
              </span>
              <strong className="text-xs text-amber-300 font-mono font-bold block">{settings.registrationNumber}</strong>
            </div>

            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
                {language === 'en' ? 'Chairperson:' : 'अध्यक्ष:'}
              </span>
              <strong className="text-xs text-white font-bold block">
                {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
              </strong>
            </div>

            <div className="bg-white/10 p-3 rounded-lg border border-white/10 sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
                {language === 'en' ? 'Registered Office:' : 'कार्यालय का पता:'}
              </span>
              <span className="text-slate-200 text-[11px] block leading-tight">
                {language === 'en' ? 'Raispar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
              </span>
            </div>

            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">
                {language === 'en' ? 'Helpline:' : 'हेल्पलाइन नंबर:'}
              </span>
              <span className="text-emerald-400 font-mono font-bold text-xs block">+91 {settings.phone}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => setCurrentPage('services')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
            >
              {t.nav.services}
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              {t.nav.contact}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export const ServicesPage: React.FC = () => {
  const { settings, setCurrentPage, language, t } = useTrust();
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<any | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {t.servicesPage.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900">
          {t.servicesPage.title}
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          {t.servicesPage.subtitle}
        </p>
      </div>

      <div className="space-y-8">
        {CORE_SERVICES_DATA.map((srv, idx) => {
          const title = language === 'en' ? srv.titleEn : srv.titleHi;
          const tagline = language === 'en' ? srv.taglineEn : srv.taglineHi;
          const description = language === 'en' ? srv.descriptionEn : srv.description;
          const features = language === 'en' ? srv.featuresEn : srv.features;

          return (
            <div
              key={srv.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 sm:p-8"
            >
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <div>
                    <h2
                      onClick={() => setSelectedServiceForDetail(srv)}
                      className="text-2xl font-black text-slate-900 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      {title}
                    </h2>
                    <p className="text-xs font-bold text-red-600 italic">
                      "{tagline}"
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setSelectedServiceForDetail(srv)}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'en' ? `${title} Full Details` : `${title} की पूरी जानकारी देखें`}</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(srv.registrationRoute)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    {t.common.registerNow}
                  </button>
                  <button
                    onClick={() => setCurrentPage('donation')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {t.common.donateNow}
                  </button>
                </div>
              </div>

              <div className="md:col-span-5">
                <div
                  onClick={() => setSelectedServiceForDetail(srv)}
                  className="rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-sm relative cursor-pointer group"
                >
                  <SafeImage
                    src={settings.serviceImages?.[srv.id] || srv.imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold drop-shadow">
                      {language === 'en' ? 'Click to Read Full Details' : 'पूरी जानकारी पढ़ने के लिए क्लिक करें'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Detail Modal */}
      {selectedServiceForDetail && (
        <ServiceDetailModal
          service={selectedServiceForDetail}
          onClose={() => setSelectedServiceForDetail(null)}
        />
      )}
    </div>
  );
};
