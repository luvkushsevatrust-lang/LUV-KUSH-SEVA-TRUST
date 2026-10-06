import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  X,
  CheckCircle,
  Clock,
  Building,
  Heart,
  ShieldCheck,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SafeImage } from './SafeImage';
import { ORPHANAGE_CARE, resolveAssetUrl } from '../assets';

interface ServiceDetailModalProps {
  service: any;
  onClose: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
}) => {
  const { language, setCurrentPage, settings, t } = useTrust();
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'facilities' | 'routine' | 'programs' | 'admission'>('all');

  if (!service) return null;

  const isOrphanage = service.id === 'orphanage';
  const title = language === 'en' ? service.titleEn : service.titleHi;
  const tagline = language === 'en' ? service.taglineEn : service.taglineHi;
  const description = language === 'en' ? service.descriptionEn : service.description;
  const details = service.details;

  const overview =
    details
      ? language === 'en'
        ? details.overviewEn
        : details.overviewHi
      : description;

  const facilities: string[] =
    details
      ? language === 'en'
        ? details.facilitiesEn || []
        : details.facilitiesHi || []
      : service.featuresEn || service.features || [];

  const dailyRoutine: Array<{ time: string; activity: string }> =
    details
      ? language === 'en'
        ? details.dailyRoutineEn || []
        : details.dailyRoutineHi || []
      : [];

  const admissionCriteria: string[] =
    details
      ? language === 'en'
        ? details.admissionCriteriaEn || []
        : details.admissionCriteriaHi || []
      : [];

  const programs: string[] =
    details
      ? language === 'en'
        ? details.programsEn || []
        : details.programsHi || []
      : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto max-h-[94vh] flex flex-col">
        
        {/* Header Visual Hero */}
        <div className="relative h-52 sm:h-64 md:h-72 w-full bg-slate-950 overflow-hidden shrink-0">
          <SafeImage
            src={resolveAssetUrl(service.imageUrl) || ORPHANAGE_CARE}
            alt={title}
            className="w-full h-full object-cover opacity-75 transform scale-100 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent flex flex-col justify-between p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{language === 'en' ? 'Luv Kush Seva Trust • Official Mission' : 'लव कुश सेवा ट्रस्ट • अधिकृत सेवा प्रकल्प'}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-md"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/30">
                  {service.titleEn}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/80 text-white text-[11px] font-bold">
                  {language === 'en' ? '100% Free Facility' : '100% निःशुल्क सेवा'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-md">
                {title}
              </h2>
              <p className="text-amber-300 text-xs sm:text-base font-semibold drop-shadow max-w-3xl">
                "{tagline}"
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Filter & Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {language === 'en' ? 'All Sections' : 'सभी विवरण (सम्पूर्ण)'}
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {language === 'en' ? 'Overview & Mission' : 'परिचय व विज़न'}
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'facilities'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {language === 'en' ? `Facilities (${facilities.length})` : `सुविधाएं व व्यवस्थाएं (${facilities.length})`}
          </button>

          {dailyRoutine.length > 0 && (
            <button
              onClick={() => setActiveTab('routine')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'routine'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {language === 'en' ? 'Daily Routine' : 'दैनिक दिनचर्या'}
            </button>
          )}

          {programs.length > 0 && (
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'programs'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {language === 'en' ? 'Key Programs' : 'विशेष कार्यक्रम'}
            </button>
          )}

          {admissionCriteria.length > 0 && (
            <button
              onClick={() => setActiveTab('admission')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'admission'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {language === 'en' ? 'Admission & Eligibility' : 'प्रवेश पात्रता व नियम'}
            </button>
          )}
        </div>

        {/* Modal Scrollable Long-Form Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-8 flex-1 text-slate-800">
          
          {/* Quick Highlight Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{language === 'en' ? '100% Free' : 'पूर्णतः निःशुल्क'}</span>
              </div>
              <p className="text-[11px] text-emerald-950 font-medium">
                {language === 'en' ? 'Zero fees or hidden charges' : 'आवास, भोजन व सेवा बिल्कुल मुफ्त'}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-blue-800 font-bold text-xs">
                <Building className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{language === 'en' ? '24/7 Care & Safety' : '24x7 सेवा व सुरक्षा'}</span>
              </div>
              <p className="text-[11px] text-blue-950 font-medium">
                {language === 'en' ? 'Dedicated resident wardens & CCTV' : 'समर्पित सेवादार व सुरक्षा निगरानी'}
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-purple-800 font-bold text-xs">
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{language === 'en' ? 'Govt Registered' : 'पंजीकृत ट्रस्ट'}</span>
              </div>
              <p className="text-[11px] text-purple-950 font-medium">
                {settings.registrationNumber || 'Bihar Govt Regd.'}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-800 font-bold text-xs">
                <Heart className="w-4 h-4 text-red-500 shrink-0" />
                <span>{language === 'en' ? 'Family Atmosphere' : 'पारिवारिक स्नेह'}</span>
              </div>
              <p className="text-[11px] text-amber-950 font-medium">
                {language === 'en' ? 'Dignity, love & moral support' : 'सम्मान, संबल व अपनत्व'}
              </p>
            </div>
          </div>

          {/* Section 1: Overview & Mission */}
          {(activeTab === 'all' || activeTab === 'overview') && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{language === 'en' ? 'Detailed Overview & Trust Mission' : 'विस्तृत परिचय, उद्देश्य एवं विज़न'}</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full">
                  {title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {overview}
              </p>
            </div>
          )}

          {/* Section 2: Key Facilities & Infrastructure */}
          {(activeTab === 'all' || activeTab === 'facilities') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'en' ? 'Key Facilities & Infrastructure' : 'मुख्य सुविधाएं, व्यवस्थाएं एवं व्यवस्था तंत्र'}</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {facilities.length} {language === 'en' ? 'Points' : 'मुख्य बिंदु'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {facilities.map((fac: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 transition-all text-xs sm:text-sm text-slate-800"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Daily Routine & Schedule */}
          {(activeTab === 'all' || activeTab === 'routine') && dailyRoutine.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>{language === 'en' ? 'Daily Routine & Time Schedule' : 'दैनिक दिनचर्या व समय-सारणी'}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'en' ? 'Disciplined & Healthy Lifestyle' : 'अनुशासित, स्वस्थ व सुखद जीवनशैली'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dailyRoutine.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex items-start gap-3 hover:bg-amber-50 transition-colors"
                  >
                    <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded-lg font-mono text-[11px] shrink-0 mt-0.5 shadow-xs">
                      {item.time}
                    </span>
                    <span className="text-slate-800 font-medium text-xs leading-relaxed">
                      {item.activity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Key Programs & Initiatives */}
          {(activeTab === 'all' || activeTab === 'programs') && programs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span>{language === 'en' ? 'Special Programs & Initiatives' : 'विशेष योजनाएं, कार्यक्रम व पहल'}</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {programs.length} {language === 'en' ? 'Programs' : 'कार्यक्रम'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {programs.map((prog, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs sm:text-sm text-purple-950 font-medium flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{prog}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Admission, Eligibility & Guidelines */}
          {(activeTab === 'all' || activeTab === 'admission') && admissionCriteria.length > 0 && (
            <div className="space-y-4 bg-slate-50/80 rounded-3xl p-5 sm:p-7 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>{language === 'en' ? 'Admission, Eligibility & Documents' : 'प्रवेश पात्रता, आवश्यक दस्तावेज़ एवं प्रक्रिया'}</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {language === 'en' ? 'Zero Cost' : 'शून्य शुल्क'}
                </span>
              </div>

              <div className="space-y-3">
                {admissionCriteria.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Care Campus & Helpline Info Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Rajgir Care Campus & Contact Point' : 'राजगीर सेवा केंद्र व ट्रस्ट कार्यालय'}</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm">
                {settings.nameHi || settings.name} • {settings.address}
              </p>
              <p className="text-slate-400 text-xs">
                {language === 'en'
                  ? 'Visiting hours: Sunday 02:00 PM – 05:00 PM | Office: 09:00 AM – 06:00 PM (Daily)'
                  : 'मुलाकात समय: प्रत्येक रविवार दोपहर 02 से शाम 05 बजे | कार्यालय: प्रातः 09 से सायं 06 बजे (नियमित)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow"
              >
                <Phone className="w-4 h-4" />
                <span>{settings.phone}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentPage('contact');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs sm:text-sm transition-all border border-white/20"
              >
                <span>{language === 'en' ? 'Contact Trust' : 'ट्रस्ट से संपर्क'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Close Window' : 'खिड़की बंद करें'}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                setCurrentPage('donation');
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Heart className="w-4 h-4 fill-slate-950" />
              <span>
                {isOrphanage
                  ? (language === 'en' ? 'Sponsor a Child' : 'बच्चे को सहयोग / दान करें')
                  : service.id === 'old_age'
                  ? (language === 'en' ? 'Support Elders' : 'बुजुर्गों हेतु दान करें')
                  : service.id === 'widow'
                  ? (language === 'en' ? 'Support Sisters' : 'बहनों हेतु दान करें')
                  : service.id === 'education'
                  ? (language === 'en' ? 'Sponsor a Student' : 'शिक्षा हेतु दान करें')
                  : (language === 'en' ? 'Donate Now' : 'दान करें')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                setCurrentPage(service.registrationRoute);
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>{language === 'en' ? 'Apply / Register Now' : 'ऑनलाइन आवेदन / पंजीकरण करें'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
