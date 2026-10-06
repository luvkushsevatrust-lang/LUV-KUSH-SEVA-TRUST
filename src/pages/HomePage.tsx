import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { CORE_SERVICES_DATA } from '../data/mockData';
import { Announcement } from '../types';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import { SafeImage } from '../components/SafeImage';
import { HERO_TRUST_SEVA, COMMUNITY_WELFARE, CHAIRPERSON_PHOTO } from '../assets';
import {
  Heart,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Calendar,
  Phone,
  Building,
  Quote,
  Sparkles,
  CreditCard,
  Eye,
  Image as ImageIcon,
  X,
  Info,
  Upload,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { settings, updateSettings, announcements, setCurrentPage, language, t } = useTrust();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<any | null>(null);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);

  const handleChairpersonPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateSettings({ chairpersonPhotoUrl: result });
        setPhotoUploadSuccess(true);
        setTimeout(() => setPhotoUploadSuccess(false), 5000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white py-12 md:py-20 px-4 sm:px-6">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-luminosity">
          <SafeImage
            src={HERO_TRUST_SEVA}
            alt="Luv Kush Seva Trust"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 text-xs sm:text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t.home.heroBadge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight text-balance">
              “{t.home.heroTitlePart1}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200">{t.home.heroTitleHighlight}</span>{t.home.heroTitlePart2}”
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t.home.heroSub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => setCurrentPage('services')}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span>{t.common.registerNow}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage('donation')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-slate-950" />
                <span>{t.common.donateNow}</span>
              </button>

              <button
                onClick={() => setCurrentPage('volunteer-registration')}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                {t.common.becomeVolunteer}
              </button>

              <button
                onClick={() => setCurrentPage('about')}
                className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-sm sm:text-base rounded-xl transition-colors cursor-pointer"
              >
                {t.common.learnMore}
              </button>
            </div>

            {/* Micro Trust markers */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{language === 'en' ? 'Transparent Social Welfare' : 'पारदर्शी समाज सेवा'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{language === 'en' ? 'Free Education & Healthcare' : 'निःशुल्क शिक्षा व चिकित्सा'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{language === 'en' ? 'Chairperson: Satyendra Kumar' : `अध्यक्ष: ${settings.chairpersonName}`}</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl relative">
              <div
                onClick={() => setSelectedServiceForDetail(CORE_SERVICES_DATA.find((s) => s.id === 'social_welfare') || null)}
                className="rounded-xl overflow-hidden shadow-lg border border-white/20 aspect-video relative cursor-pointer group"
              >
                <SafeImage
                  src={COMMUNITY_WELFARE}
                  alt="Community Welfare Camp"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white text-xs font-semibold">
                      {language === 'en' ? 'Community Welfare & Relief Camp at Rajgir, Nalanda' : 'राजगीर, नालंदा में आयोजित जनसेवा व सहायता कार्य'}
                    </span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Eye className="w-3 h-3" />
                      <span>{language === 'en' ? 'Details' : 'विवरण'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Action Tiles */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <button
                  onClick={() => setCurrentPage('student-registration')}
                  className="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="block text-xs font-bold text-white">
                    {language === 'en' ? 'Student Registration' : 'छात्र पंजीकरण'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'en' ? 'Free Education Support' : 'निःशुल्क शिक्षा सहायता'}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentPage('id-card')}
                  className="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="block text-xs font-bold text-white">
                    {t.nav.idCard}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'en' ? 'Verify & Download' : 'सत्यापन व डाउनलोड'}
                  </span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main 6 Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold tracking-wider uppercase text-red-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full">
            {t.nav.services}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
            {t.home.servicesHeading}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            {t.home.servicesSub}
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_SERVICES_DATA.map((service, idx) => {
            const title = language === 'en' ? service.titleEn : service.titleHi;
            const tagline = language === 'en' ? service.taglineEn : service.taglineHi;
            const description = language === 'en' ? service.descriptionEn : service.description;
            const features = language === 'en' ? service.featuresEn : service.features;

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Colored Top Header Strip */}
                <div
                  className={`py-3 px-4 text-center border-b cursor-pointer ${
                    idx === 0
                      ? 'bg-emerald-600 text-white'
                      : idx === 1
                      ? 'bg-blue-800 text-white'
                      : idx === 2
                      ? 'bg-rose-600 text-white'
                      : idx === 3
                      ? 'bg-teal-700 text-white'
                      : idx === 4
                      ? 'bg-sky-700 text-white'
                      : 'bg-red-700 text-white'
                  }`}
                  onClick={() => setSelectedServiceForDetail(service)}
                >
                  <h3 className="text-lg font-black tracking-wide flex items-center justify-center gap-1.5">
                    <span>{title}</span>
                  </h3>
                  <p className="text-xs font-medium text-amber-200 mt-0.5">
                    "{tagline}"
                  </p>
                </div>

                {/* Service Image Preview */}
                <div
                  onClick={() => setSelectedServiceForDetail(service)}
                  className="relative h-44 w-full overflow-hidden bg-slate-100 cursor-pointer group/img"
                >
                  <SafeImage
                    src={service.imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3">
                    <span className="text-white text-xs font-bold flex items-center gap-1 drop-shadow">
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>{language === 'en' ? 'Click for Full Details' : 'पूरी जानकारी देखें'}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-900 shadow">
                      {service.id === 'orphanage' ? (language === 'en' ? 'Full Details' : 'विस्तृत विवरण') : (language === 'en' ? 'Service Info' : 'सेवा विवरण')}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Links */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => setSelectedServiceForDetail(service)}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-700" />
                      <span>{language === 'en' ? `${title} Full Details` : `${title} की पूरी जानकारी देखें`}</span>
                    </button>

                    <button
                      onClick={() => setCurrentPage(service.registrationRoute)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 group-hover:bg-red-600 group-hover:text-white cursor-pointer"
                    >
                      <span>{t.common.registerNow}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Join Us / "हमारे साथ जुड़ें" Section */}
      <section className="bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-y border-amber-200 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              {language === 'en' ? 'Get Involved' : 'सहयोग और सहभागिता'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {language === 'en' ? 'Join Hands with Us' : 'हमारे साथ जुड़ें'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              {language === 'en'
                ? 'Support our humanitarian initiatives in any way — as a beneficiary, volunteer, student or donor.'
                : 'आप किसी भी रूप में लव कुश सेवा ट्रस्ट से जुड़कर समाज कल्याण में सहभागी बन सकते हैं।'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Box 1: Register for Support */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Service Support' : 'सेवा सहायता'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Apply for orphanage, elder care, widow relief, healthcare, or student aid.'
                  : 'अनाथ, वृद्ध, विधवा, चिकित्सा या शिक्षा सहायता हेतु अपना आवेदन दर्ज करें।'}
              </p>
              <button
                onClick={() => setCurrentPage('services')}
                className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.common.registerNow}
              </button>
            </div>

            {/* Box 2: Volunteer */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition-all text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Volunteer' : 'स्वयंसेवक'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Contribute your time and talent to empower marginalized lives in Bihar.'
                  : 'अपना समय और सहयोग देकर जरूरतमंदों की मदद में भागीदार बनें।'}
              </p>
              <button
                onClick={() => setCurrentPage('volunteer-registration')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.common.becomeVolunteer}
              </button>
            </div>

            {/* Box 3: Donate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-400 transition-all text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 fill-red-600 text-red-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Donate' : 'सहयोग राशि दान'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Your generous donation funds nutrition, uniforms, medicines, and dignified shelter.'
                  : 'आपका छोटा सहयोग किसी जरूरतमंद को भोजन, शिक्षा और दवा उपलब्ध करा सकता है।'}
              </p>
              <button
                onClick={() => setCurrentPage('donation')}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.common.donateNow}
              </button>
            </div>

            {/* Box 4: Student Registration */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Student Registration' : 'छात्र पंजीकरण'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Register for free coaching, textbooks, stationery, and digital education.'
                  : 'निःशुल्क कोचिंग और पाठ्य सामग्री प्राप्त करने हेतु विद्यार्थी पंजीकरण करें।'}
              </p>
              <button
                onClick={() => setCurrentPage('student-registration')}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t.common.registerNow}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-blue-800">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              {language === 'en' ? 'Our Impact' : 'सेवा के पदचिह्न'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {language === 'en' ? 'Key Social Impact Numbers' : 'हमारे सेवा कार्यों की सांख्यिकी'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 max-w-xl mx-auto">
              {language === 'en'
                ? 'Humanitarian aid and direct support delivered across Nalanda and surrounding areas.'
                : 'नालंदा एवं आसपास के क्षेत्रों में जन-जन तक पहुंचाई गई मानवीय सहायता का विवरण।'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-300 font-mono">
                {settings.stats.beneficiaries}+
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-white">
                {t.home.statsBeneficiaries}
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-300 font-mono">
                {settings.stats.students}+
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-white">
                {t.home.statsStudents}
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-sky-300 font-mono">
                {settings.stats.medicalAssistance}+
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-white">
                {t.home.statsMedical}
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-rose-300 font-mono">
                {settings.stats.volunteers}+
              </div>
              <div className="mt-1 text-xs sm:text-sm font-semibold text-white">
                {t.home.statsVolunteers}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Official ID Card Portal Promotion Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-blue-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.home.idCardSectionTitle}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {t.home.idCardSectionTitle}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {t.home.idCardSectionSub}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <h4 className="font-bold text-xs text-amber-300">{t.home.idCardFeature1Title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{t.home.idCardFeature1Desc}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <h4 className="font-bold text-xs text-amber-300">{t.home.idCardFeature2Title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{t.home.idCardFeature2Desc}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <h4 className="font-bold text-xs text-amber-300">{t.home.idCardFeature3Title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{t.home.idCardFeature3Desc}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-3">
              <button
                onClick={() => setCurrentPage('id-card')}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t.home.openIdPortal}</span>
              </button>
              <span className="text-xs text-slate-400">
                {language === 'en' ? 'Search using Card Number or Mobile' : 'कार्ड नंबर अथवा मोबाइल नंबर से खोजें'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chairperson Message */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-4 text-center">
            <div className="relative inline-block">
              <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-amber-400 bg-amber-50 mx-auto relative group">
                <SafeImage
                  src={settings.chairpersonPhotoUrl || CHAIRPERSON_PHOTO}
                  alt="Chairperson Satyendra Kumar"
                  className="w-full h-full object-cover object-top"
                />
                
                {/* Instant upload overlay on hover/tap */}
                <label
                  title="अपनी असली फ़ोटो अपलोड करें"
                  className="absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity p-2 text-center"
                >
                  <Upload className="w-6 h-6 text-amber-300 mb-1" />
                  <span className="text-xs font-bold text-amber-200">अपनी असली फ़ोटो चुनें</span>
                  <span className="text-[10px] text-slate-300">(Upload Photo)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleChairpersonPhotoUpload}
                  />
                </label>
              </div>

              {/* Direct visible button right under photo */}
              <div className="mt-2.5 flex flex-col items-center gap-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-full text-[11px] font-bold cursor-pointer shadow-xs transition-transform active:scale-95">
                  <Upload className="w-3.5 h-3.5 text-amber-800" />
                  <span>{settings.chairpersonPhotoUrl ? 'फ़ोटो बदलें (Change Photo)' : 'अपनी असली फ़ोटो चुनें (Upload Photo)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleChairpersonPhotoUpload}
                  />
                </label>

                {photoUploadSuccess && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>फ़ोटो सफलतापूर्वक सेट हो गई!</span>
                  </span>
                )}
              </div>

              <div className="mt-2">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
                </h3>
                <p className="text-xs font-bold text-red-600">
                  {t.home.chairpersonTitle}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'en' ? 'Office: Raisar, Rajgir (Nalanda)' : 'कार्यालय : राईसर, राजगीर (नालंदा)'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Quote className="w-6 h-6 rotate-180" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t.home.chairpersonMsgTitle}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {language === 'en'
                ? '"Service to humanity is true devotion — our goal is that no helpless person remains unsupported."'
                : '"नर सेवा ही नारायण सेवा है — हमारा एक ही लक्ष्य, कोई भी बेसहारा असहाय न रहे।"'}
            </h3>

            <p className="text-sm text-slate-700 leading-relaxed">
              {t.home.chairpersonQuote}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.nav.helpline} {settings.phone}</span>
              </span>
              <span>•</span>
              <span>{t.banner.regNumberLabel}: {settings.registrationNumber}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Latest Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {language === 'en' ? 'Notice Board' : 'सूचना पट्ट'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              {t.home.announcementsTitle}
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage('id-card')}
            className="text-xs font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'en' ? 'Open ID Card Portal →' : 'पहचान पत्र पोर्टल देखें →'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${
                ann.isImportant ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
              }`}
            >
              {/* Optional Announcement Image */}
              {ann.imageUrl && (
                <div
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="relative w-full h-48 bg-slate-100 overflow-hidden cursor-pointer group border-b border-slate-100"
                >
                  <SafeImage
                    src={ann.imageUrl}
                    alt={ann.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow">
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>{language === 'en' ? 'Click to Enlarge Photo' : 'फोटो बड़ा करके देखें'}</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ann.date}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ann.imageUrl && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{language === 'en' ? 'Photo' : 'फोटो'}</span>
                        </span>
                      )}
                      {ann.isImportant && (
                        <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {language === 'en' ? 'IMPORTANT' : 'महत्वपूर्ण'}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {ann.imageUrl ? (
                    <button
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'View Photo & Notice' : 'फोटो व विवरण देखें'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {language === 'en' ? 'Luv Kush Seva Trust' : 'लव कुश सेवा ट्रस्ट'}
                    </span>
                  )}

                  <button
                    onClick={() => setCurrentPage('contact')}
                    className="font-bold text-blue-800 hover:underline cursor-pointer"
                  >
                    {language === 'en' ? 'Inquire →' : 'संपर्क करें →'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Announcement Detail & Photo Lightbox Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-red-700 via-orange-600 to-amber-600 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {language === 'en' ? 'Official Announcement' : 'आधिकारिक सूचना'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {/* Image if available */}
                {selectedAnnouncement.imageUrl && (
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner flex items-center justify-center max-h-80">
                    <SafeImage
                      src={selectedAnnouncement.imageUrl}
                      alt={selectedAnnouncement.title}
                      className="w-full h-full max-h-80 object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'en' ? 'Published Date' : 'प्रकाशित तिथि'}: <strong>{selectedAnnouncement.date}</strong></span>
                  </span>
                  {selectedAnnouncement.isImportant && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                      {language === 'en' ? 'IMPORTANT NOTICE' : 'अति महत्वपूर्ण सूचना'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedAnnouncement.title}
                </h3>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedAnnouncement.content}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.nav.helpline}: <strong>{settings.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAnnouncement(null);
                        setCurrentPage('contact');
                      }}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      {language === 'en' ? 'Contact Trust Office' : 'कार्यालय से संपर्क करें'}
                    </button>
                    <button
                      onClick={() => setSelectedAnnouncement(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      {language === 'en' ? 'Close' : 'बंद करें'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Community Testimonials */}
      <section className="bg-slate-100/70 py-12 px-4 sm:px-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              {language === 'en' ? 'Community Voices' : 'शुभचिंतक विचार'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {language === 'en' ? 'What Well-Wishers Say' : 'शुभचिंतकों के अनुभव'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              {language === 'en'
                ? 'Trust and appreciation from citizens and respected professionals across Bihar.'
                : 'लव कुश सेवा ट्रस्ट की निष्ठा और सेवा भाव पर क्षेत्रवासियों का विश्वास।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Quote className="w-5 h-5 text-amber-500" />
              <p className="text-xs text-slate-700 leading-relaxed italic">
                {language === 'en'
                  ? '"The dedicated work being carried out by Luv Kush Seva Trust for orphaned children and free education in Rajgir is truly commendable."'
                  : '"राजगीर में गरीब बच्चों की निःशुल्क शिक्षा और अनाथ बच्चों के लिए ट्रस्ट द्वारा किया जा रहा कार्य अत्यंत सराहनीय है।"'}
              </p>
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-xs font-bold text-slate-900">
                  {language === 'en' ? 'Dr. Sunil Kumar Verma' : 'डॉ. सुनील कुमार वर्मा'}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {language === 'en' ? 'Senior Medical Practitioner, Nalanda' : 'वरिष्ठ चिकित्सक, नालंदा'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Quote className="w-5 h-5 text-amber-500" />
              <p className="text-xs text-slate-700 leading-relaxed italic">
                {language === 'en'
                  ? '"The dignified shelter provided for senior citizens and destitute mothers brings immense hope to those in need."'
                  : '"वृद्ध आश्रम और निराश्रित माताओं के सम्मानजनक जीवन के लिए ट्रस्ट का प्रयास प्रशंसनीय है।"'}
              </p>
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-xs font-bold text-slate-900">
                  {language === 'en' ? 'Smt. Sarojini Sahay' : 'श्रीमती सरोजिनी सहाय'}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {language === 'en' ? 'Social Worker, Bihar Sharif' : 'समाजसेविका, बिहार शरीफ'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Quote className="w-5 h-5 text-amber-500" />
              <p className="text-xs text-slate-700 leading-relaxed italic">
                {language === 'en'
                  ? '"I personally visited the office at Raisar and witnessed their transparent operations and genuine devotion to public service."'
                  : '"मैंने स्वयं जाकर राईसर स्थित कार्यालय और कार्यों को देखा है। पूरी पारदर्शिता और सेवा भाव से कार्य हो रहा है।"'}
              </p>
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-xs font-bold text-slate-900">
                  {language === 'en' ? 'Shri Ram Narayan Singh' : 'श्री रामनारायण सिंह'}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {language === 'en' ? 'Entrepreneur & Donor' : 'व्यवसायी व दानदाता'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Donation Prompt Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider text-amber-200">
              {language === 'en' ? 'Noble Support' : 'पुनीत सेवा सहयोग'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              "{t.home.donationAppealTitle}"
            </h2>
            <p className="text-xs sm:text-sm text-red-100 max-w-xl">
              {language === 'en'
                ? 'Contribute directly to the trust official account and download an instant receipt.'
                : 'सीधे ट्रस्ट के बैंक खाते में दान करें और तुरंत पावती रसीद प्राप्त करें।'}
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentPage('donation')}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              {t.common.donateNow}
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/30 cursor-pointer"
            >
              {t.nav.contact}
            </button>
          </div>
        </div>
      </section>

      {/* Detailed Service Information Modal (Orphanage Home and all services) */}
      {selectedServiceForDetail && (
        <ServiceDetailModal
          service={selectedServiceForDetail}
          onClose={() => setSelectedServiceForDetail(null)}
        />
      )}

    </div>
  );
};

