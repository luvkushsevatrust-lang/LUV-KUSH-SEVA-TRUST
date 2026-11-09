import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Search,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  MessageCircle,
  PhoneCall,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { JobVacancy, JobCategory } from '../types/career';
import { CareerApplicationModal } from '../components/CareerApplicationModal';
import { JobTrackingModal } from '../components/JobTrackingModal';
import { PlacementAddressModal } from '../components/PlacementAddressModal';

export const CareerPage: React.FC = () => {
  const { jobs, placementAddress, settings, language } = useTrust();

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | JobCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [applyModalJob, setApplyModalJob] = useState<JobVacancy | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobVacancy | null>(null);

  const isHi = language === 'hi';

  // Filtered Jobs - only show active jobs to applicants
  const activeJobs = jobs.filter((job) => job.status === 'Active');

  const filteredJobs = activeJobs.filter((job) => {
    const matchesCategory =
      selectedCategory === 'all' || job.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.titleHi.toLowerCase().includes(q) ||
      job.position.toLowerCase().includes(q) ||
      job.positionHi.toLowerCase().includes(q) ||
      job.qualification.toLowerCase().includes(q) ||
      job.qualificationHi.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const teacherCount = activeJobs.filter((j) => j.category === 'teacher').length;
  const nursingCount = activeJobs.filter((j) => j.category === 'nursing').length;

  const handleApplyClick = (job: JobVacancy) => {
    setApplyModalJob(job);
    setIsApplyModalOpen(true);
  };

  // WhatsApp support phone
  const whatsappNumber = settings.phone || '9470635412';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');

  const openWhatsApp = (topic: string) => {
    const message = encodeURIComponent(
      `नमस्ते Luv Kush Seva Trust, मुझे ${topic} के संदर्भ में जानकारी चाहिए।`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50/70 pb-16">
      {/* Hero Header with Trust Branding & Emerald/Green Accents */}
      <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white overflow-hidden py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-emerald-500 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-3 backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'आधिकारिक भर्ती पोर्टल • नालंदा, बिहार' : 'Official Recruitment Portal • Nalanda, Bihar'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2">
                {isHi ? 'रोजगार एवं करियर अवसर' : 'Career Opportunities'}
              </h1>
              <p className="text-lg sm:text-xl font-medium text-emerald-200 mb-3">
                {settings.name || 'Luv Kush Seva Trust'} ({settings.nameHi || 'लव कुश सेवा ट्रस्ट'})
              </p>
              <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-2xl">
                {isHi
                  ? 'लव कुश सेवा ट्रस्ट के अंतर्गत शिक्षक एवं नर्सिंग स्टाफ के विभिन्न रिक्त पदों पर समर्पित एवं योग्य उम्मीदवारों से आवेदन आमंत्रित किए जाते हैं। समाज सेवा और राष्ट्र निर्माण में हमारे साथ जुड़ें।'
                  : 'Luv Kush Seva Trust invites online applications from dedicated and qualified candidates for various Teacher and Nursing Staff positions across Nalanda, Bihar.'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => setIsTrackingModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg text-sm cursor-pointer"
              >
                <Search className="w-4 h-4 text-emerald-700" />
                <span>{isHi ? 'आवेदन स्थिति जांचें' : 'Track Application Status'}</span>
              </button>

              <button
                onClick={() => setIsPlacementModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600/90 border border-emerald-400/40 text-white font-semibold transition-all shadow-xs text-sm cursor-pointer backdrop-blur-xs"
              >
                <MapPin className="w-4 h-4 text-emerald-300" />
                <span>{isHi ? 'साक्षात्कार व नियुक्ति केंद्र' : 'Placement & Interview Address'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Support Bar */}
          <div className="mt-8 pt-6 border-t border-emerald-700/50 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="font-semibold text-emerald-200 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              {isHi ? 'सहायता एवं संपर्क (WhatsApp Support):' : 'Recruitment Helpdesk (WhatsApp):'}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openWhatsApp('नौकरी संबंधी जानकारी / Job Information')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{isHi ? 'नौकरी संबंधी जानकारी' : 'Job Information'}</span>
              </button>
              <button
                onClick={() => openWhatsApp('ऑनलाइन फॉर्म सहायता / Application Support')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isHi ? 'आवेदन सहायता' : 'Application Support'}</span>
              </button>
              <button
                onClick={() => openWhatsApp('साक्षात्कार सहायता / Interview Assistance')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isHi ? 'साक्षात्कार सहायता' : 'Interview Assistance'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Search & Category Filter Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200 mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{isHi ? 'सभी रिक्तियां' : 'All Vacancies'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                  {activeJobs.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('teacher')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'teacher'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>{isHi ? 'शिक्षक भर्ती' : 'Teacher Recruitment'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {teacherCount}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('nursing')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'nursing'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>{isHi ? 'नर्सिंग स्टाफ भर्ती' : 'Nursing Staff Recruitment'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {nursingCount}
                </span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHi ? 'पद, योग्यता, या स्थान खोजें...' : 'Search position, qualification...'}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>{isHi ? 'महत्वपूर्ण सूचना:' : 'Notice:'}</strong>{' '}
              {isHi
                ? 'नालंदा जिले के अंतर्गत राजगीर, इसलामपुर, सिलाव एवं गिरियक प्रखंड के सभी योग्य उम्मीदवार ऑनलाइन आवेदन कर सकते हैं। आवेदन उपरांत प्राप्त रसीद व आवेदन संख्या सुरक्षित रखें।'
                : 'Eligible candidates from Nalanda district (Rajgir, Islampur, Silao, Giriyak blocks) can submit online applications. Keep your unique Application ID safe for tracking.'}
            </p>
          </div>
        </div>

        {/* Vacancies Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <Briefcase className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-700 mb-1">
              {isHi ? 'कोई रिक्ति नहीं मिली' : 'No Vacancies Found'}
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-4">
              {isHi
                ? 'आपके द्वारा चुने गए फ़िल्टर या खोज मानदंड के अनुसार कोई पद उपलब्ध नहीं है।'
                : 'No positions matched your selected filter or search criteria.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
            >
              {isHi ? 'सभी पद देखें' : 'View All Vacancies'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isTeacher = job.category === 'teacher';
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isTeacher
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isTeacher ? (
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>
                          {isTeacher
                            ? isHi
                              ? 'शिक्षक भर्ती'
                              : 'Teacher Recruitment'
                            : isHi
                            ? 'नर्सिंग स्टाफ'
                            : 'Nursing Staff'}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md text-xs font-bold">
                        <Users className="w-3 h-3 text-stone-500" />
                        <span>
                          {job.vacancies} {isHi ? 'पद' : 'Posts'}
                        </span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors leading-snug mb-1">
                      {isHi ? job.titleHi || job.title : job.title}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mb-4">
                      {isHi ? job.positionHi || job.position : job.position}
                    </p>

                    {/* Meta Specs */}
                    <div className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {isHi ? 'योग्यता:' : 'Qualification:'}{' '}
                          </span>
                          <span>{isHi ? job.qualificationHi || job.qualification : job.qualification}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {isHi ? 'अनुभव:' : 'Experience:'}{' '}
                          </span>
                          <span>{isHi ? job.experienceHi || job.experience : job.experience}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {isHi ? 'स्थान:' : 'Location:'}{' '}
                          </span>
                          <span>{isHi ? job.locationHi || job.location : job.location}</span>
                        </div>
                      </div>

                      {/* Salary Display: Only when provided by admin, otherwise as per trust norms */}
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-stone-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {isHi ? 'वेतनमान:' : 'Salary:'}{' '}
                          </span>
                          <span className="text-emerald-800 font-semibold">
                            {job.salary && job.salary.trim() !== ''
                              ? isHi && job.salaryHi ? job.salaryHi : job.salary
                              : isHi
                              ? 'ट्रस्ट नियमानुसार (योग्यता एवं अनुभव के आधार पर)'
                              : 'As per Trust Norms'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-700">
                            {isHi ? 'अंतिम तिथि:' : 'Deadline:'}{' '}
                          </span>
                          <span className="text-red-700 font-medium">{job.deadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJobDetails(job)}
                      className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-emerald-700 hover:bg-white rounded-lg border border-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title={isHi ? 'विवरण देखें' : 'View Details'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isHi ? 'विवरण' : 'Details'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyClick(job)}
                      className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <span>{isHi ? 'आवेदन करें' : 'Apply Now'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recruitment Highlights & Instructions Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-800 text-base mb-2">
              {isHi ? 'शिक्षक भर्ती प्रक्रिया' : 'Teacher Recruitment'}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? 'प्राथमिक, माध्यमिक, विषय शिक्षक, कंप्यूटर एवं महिला शिक्षकों की नियुक्ति ट्रस्ट द्वारा संचालित शिक्षण केंद्रों एवं सह-विद्यालयों हेतु की जा रही है।'
                : 'Primary, Secondary, Subject, Computer and Female Teachers recruitment for Trust-run educational centers and partner schools in Nalanda.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-4">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-800 text-base mb-2">
              {isHi ? 'नर्सिंग स्टाफ भर्ती प्रक्रिया' : 'Nursing Staff Recruitment'}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? 'स्टाफ नर्स, एएनएम, जीएनएम एवं चिकित्सा सहायक कर्मियों की नियुक्ति ग्रामीण स्वास्थ्य शिविरों, आश्रय गृहों व एम्बुलेंस सेवा हेतु की जाती है।'
                : 'Staff Nurses, ANM, GNM, and Medical Support Staff for rural health camps, shelter homes, and mobile medical units.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-800 text-base mb-2">
              {isHi ? 'पारदर्शी चयन प्रक्रिया' : 'Transparent Selection'}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? 'ऑनलाइन आवेदन के बाद दस्तावेज़ सत्यापन व साक्षात्कार निर्धारित केंद्र पर आयोजित होगा। प्रत्येक आवेदक अपनी स्थिति ऑनलाइन ट्रैक कर सकता है।'
                : 'After online submission, document verification and interviews are scheduled. All applicants can track their progress online via Application ID.'}
            </p>
          </div>
        </div>

        {/* Placement & Interview Banner */}
        <div className="mt-8 bg-gradient-to-r from-emerald-800 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              {isHi ? 'साक्षात्कार व नियुक्ति केंद्र' : 'Interview & Placement Venue'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {placementAddress.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed mb-3">
              <span className="font-semibold text-emerald-300">{placementAddress.interviewAddress}</span>
              <br />
              {isHi
                ? `संपर्क अधिकारी: ${placementAddress.contactPersonName} (${placementAddress.contactPersonDesignation}) • दूरभाष: ${placementAddress.contactPersonPhone}`
                : `Contact Person: ${placementAddress.contactPersonName} (${placementAddress.contactPersonDesignation}) • Phone: ${placementAddress.contactPersonPhone}`}
            </p>
          </div>

          <button
            onClick={() => setIsPlacementModalOpen(true)}
            className="shrink-0 px-6 py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-all text-sm shadow-md cursor-pointer flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>{isHi ? 'केंद्र विवरण एवं दिशानिर्देश' : 'View Venue & Guidelines'}</span>
          </button>
        </div>
      </div>

      {/* Online Application Modal */}
      {isApplyModalOpen && (
        <CareerApplicationModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setApplyModalJob(null);
          }}
          selectedJob={applyModalJob}
        />
      )}

      {/* Application Tracking Modal */}
      {isTrackingModalOpen && (
        <JobTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      )}

      {/* Placement Address & Venue Modal */}
      {isPlacementModalOpen && (
        <PlacementAddressModal
          isOpen={isPlacementModalOpen}
          onClose={() => setIsPlacementModalOpen(false)}
        />
      )}

      {/* Job Details Modal */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {selectedJobDetails.category === 'teacher' ? 'Teacher Recruitment' : 'Nursing Staff'}
                </span>
                <h3 className="text-xl font-bold text-stone-900 mt-1">
                  {isHi ? selectedJobDetails.titleHi || selectedJobDetails.title : selectedJobDetails.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-700 py-3 border-y border-stone-200">
              <div>
                <strong className="text-stone-900">{isHi ? 'पद:' : 'Position:'}</strong>{' '}
                {isHi ? selectedJobDetails.positionHi : selectedJobDetails.position}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'रिक्तियों की संख्या:' : 'Vacancies:'}</strong>{' '}
                {selectedJobDetails.vacancies}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'शैक्षणिक योग्यता:' : 'Qualification:'}</strong>{' '}
                {isHi ? selectedJobDetails.qualificationHi : selectedJobDetails.qualification}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'कार्य अनुभव:' : 'Experience:'}</strong>{' '}
                {isHi ? selectedJobDetails.experienceHi : selectedJobDetails.experience}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'कार्यस्थल:' : 'Location:'}</strong>{' '}
                {isHi ? selectedJobDetails.locationHi : selectedJobDetails.location}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'वेतनमान:' : 'Salary:'}</strong>{' '}
                {selectedJobDetails.salary && selectedJobDetails.salary.trim() !== ''
                  ? isHi && selectedJobDetails.salaryHi ? selectedJobDetails.salaryHi : selectedJobDetails.salary
                  : isHi
                  ? 'ट्रस्ट नियमानुसार'
                  : 'As per Trust Norms'}
              </div>
              <div>
                <strong className="text-stone-900">{isHi ? 'आवेदन की अंतिम तिथि:' : 'Deadline:'}</strong>{' '}
                <span className="text-red-600 font-semibold">{selectedJobDetails.deadline}</span>
              </div>
              {selectedJobDetails.description && (
                <div className="pt-2">
                  <strong className="text-stone-900 block mb-1">
                    {isHi ? 'पद का विवरण व कार्यक्षेत्र:' : 'Description:'}
                  </strong>
                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
                    {isHi ? selectedJobDetails.descriptionHi || selectedJobDetails.description : selectedJobDetails.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
              <button
                onClick={() => {
                  const j = selectedJobDetails;
                  setSelectedJobDetails(null);
                  handleApplyClick(j);
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{isHi ? 'इस पद हेतु आवेदन करें' : 'Apply for this Job'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
