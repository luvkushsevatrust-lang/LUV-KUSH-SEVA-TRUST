import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { CORE_SERVICES_DATA } from '../data/mockData';
import { ShieldCheck, Heart, Users, Award, CheckCircle, Info } from 'lucide-react';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import { SafeImage } from '../components/SafeImage';
import { HERO_TRUST_SEVA } from '../assets';

export const AboutPage: React.FC = () => {
  const { settings, setCurrentPage, language, t } = useTrust();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      
      {/* Top Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {t.aboutPage.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900">
          {language === 'en' ? 'Luv Kush Seva Trust, Rajgir (Nalanda)' : 'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा)'}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          “{t.banner.tagline}” — {t.aboutPage.subtitle}
        </p>
      </div>

      {/* Main Vision Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-6 relative aspect-video lg:aspect-auto min-h-[300px]">
          <SafeImage
            src={HERO_TRUST_SEVA}
            alt="Luv Kush Seva Trust"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
            <div className="text-white">
              <span className="bg-red-600 font-bold text-xs px-2.5 py-1 rounded shadow">
                {t.banner.govtRegd}
              </span>
              <h3 className="text-xl font-bold mt-2">
                {t.banner.secondaryTagline}
              </h3>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 sm:p-10 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{t.banner.regNumberLabel}: {settings.registrationNumber}</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {t.aboutPage.storyTitle}
          </h2>

          <p className="text-sm text-slate-700 leading-relaxed">
            {t.aboutPage.storyText1}
          </p>

          <p className="text-sm text-slate-700 leading-relaxed">
            {t.aboutPage.storyText2}
          </p>

          <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">
                {language === 'en' ? 'Headquarters:' : 'मुख्यालय:'}
              </strong>
              <span className="text-slate-600">
                {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">
                {language === 'en' ? 'Chairperson:' : 'अध्यक्ष:'}
              </strong>
              <span className="text-slate-600">
                {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Heart className="w-6 h-6 fill-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.aboutPage.missionTitle}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.aboutPage.missionText}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.aboutPage.visionTitle}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.aboutPage.visionText}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.aboutPage.value2Title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.aboutPage.value2Desc}
          </p>
        </div>
      </div>

      {/* Official Credentials Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              {language === 'en' ? 'Statutory Details' : 'वैधानिक विवरण'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {language === 'en' ? 'Registered Public Charitable Trust' : 'पंजीकृत सामाजिक सेवा न्यास'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/10 p-4 rounded-xl border border-white/15">
              <span className="text-slate-400 block mb-1">
                {language === 'en' ? 'Trust Name:' : 'संस्था का नाम:'}
              </span>
              <strong className="text-sm text-white font-bold">{settings.name}</strong>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/15">
              <span className="text-slate-400 block mb-1">
                {language === 'en' ? 'Registration Number:' : 'पंजीकरण संख्या:'}
              </span>
              <strong className="text-sm text-amber-300 font-mono font-bold">{settings.registrationNumber}</strong>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/15">
              <span className="text-slate-400 block mb-1">
                {language === 'en' ? 'Chairperson:' : 'अध्यक्ष:'}
              </span>
              <strong className="text-sm text-white font-bold">
                {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
              </strong>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/15 sm:col-span-2">
              <span className="text-slate-400 block mb-1">
                {language === 'en' ? 'Registered Office:' : 'कार्यालय का पता:'}
              </span>
              <span className="text-slate-200">
                {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
              </span>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/15">
              <span className="text-slate-400 block mb-1">
                {language === 'en' ? 'Helpline:' : 'हेल्पलाइन नंबर:'}
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">+91 {settings.phone}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              onClick={() => setCurrentPage('services')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              {t.nav.services}
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors cursor-pointer"
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
  const { setCurrentPage, language, t } = useTrust();
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
                    src={srv.imageUrl}
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
