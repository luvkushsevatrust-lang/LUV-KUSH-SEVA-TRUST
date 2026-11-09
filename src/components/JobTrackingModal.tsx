import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { JobApplication, JobApplicationStatus } from '../types/career';
import { SupabaseCareerService } from '../lib/supabaseCareerService';
import {
  Search,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  AlertCircle,
  X,
  FileText,
  User,
  Briefcase,
  Phone,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';

interface JobTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppId?: string;
}

const STATUS_PROGRESS: Record<
  JobApplicationStatus,
  { step: number; color: string; badgeHi: string; badgeEn: string }
> = {
  'Pending': { step: 1, color: 'amber', badgeHi: 'प्रतीक्षारत (Pending)', badgeEn: 'Pending Review' },
  'Under Review': { step: 2, color: 'blue', badgeHi: 'समीक्षाधीन (Under Review)', badgeEn: 'Under Review' },
  'Shortlisted': { step: 3, color: 'teal', badgeHi: 'शॉर्टलिस्टेड (Shortlisted)', badgeEn: 'Shortlisted' },
  'Interview Scheduled': { step: 4, color: 'purple', badgeHi: 'साक्षात्कार निर्धारित (Interview Scheduled)', badgeEn: 'Interview Scheduled' },
  'Selected': { step: 5, color: 'emerald', badgeHi: 'अंतिम चयन (Selected)', badgeEn: 'Selected' },
  'Not Selected': { step: 5, color: 'rose', badgeHi: 'अचयनित (Not Selected)', badgeEn: 'Not Selected' },
};

export const JobTrackingModal: React.FC<JobTrackingModalProps> = ({
  isOpen,
  onClose,
  initialAppId = '',
}) => {
  const { language, settings } = useTrust();

  const [applicationId, setApplicationId] = useState(initialAppId);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trackedApplication, setTrackedApplication] = useState<JobApplication | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim() || !mobileNumber.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter both Application ID and registered Mobile Number.'
          : 'कृपया आवेदन संख्या (Application ID) और पंजीकृत मोबाइल नंबर दोनों दर्ज करें।'
      );
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setTrackedApplication(null);

    try {
      const found = await SupabaseCareerService.trackApplication(applicationId, mobileNumber);
      if (found) {
        setTrackedApplication(found);
      } else {
        setErrorMessage(
          language === 'en'
            ? 'No application found with the provided Application ID and Mobile number. Please verify and try again.'
            : 'दर्ज की गई आवेदन संख्या व मोबाइल नंबर से कोई आवेदन रिकॉर्ड नहीं मिला। कृपया जांच कर पुनः प्रयास करें।'
        );
      }
    } catch {
      setErrorMessage(
        language === 'en'
          ? 'Network error. Please try again later.'
          : 'सर्वर से संपर्क करने में समस्या हुई। कृपया कुछ समय बाद पुनः प्रयास करें।'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const whatsappNumber = settings.phone || '9470635412';
  const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(
    trackedApplication
      ? language === 'en'
        ? `Hello Luv Kush Seva Trust, I need support regarding my Job Application ID: ${trackedApplication.id} for ${trackedApplication.position}.`
        : `नमस्ते लव कुश सेवा ट्रस्ट, मुझे अपने नौकरी आवेदन ID: ${trackedApplication.id} (${trackedApplication.position}) के संबंध में सहायता चाहिए।`
      : language === 'en'
      ? 'Hello Luv Kush Seva Trust, I need support regarding Job Recruitment.'
      : 'नमस्ते लव कुश सेवा ट्रस्ट, मुझे नौकरी भर्ती एवं आवेदन के संबंध में सहायता चाहिए।'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Search className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'en'
                  ? 'Track Application Status'
                  : 'आवेदन स्थिति ट्रैक करें'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {settings.name} — {language === 'en' ? 'Recruitment Portal' : 'भर्ती एवं रोजगार पोर्टल'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Application ID' : 'आवेदन संख्या (Application ID)'} *
                </label>
                <input
                  type="text"
                  required
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                  placeholder="e.g. LKST-JOB-2026-1001"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Registered Mobile Number' : 'पंजीकृत मोबाइल नंबर'} *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>
                {isSearching
                  ? (language === 'en' ? 'Searching Records...' : 'खोज जारी है...')
                  : (language === 'en' ? 'Track My Application' : 'मेरी आवेदन स्थिति देखें')}
              </span>
            </button>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Result Card */}
          {trackedApplication && (
            <div className="p-6 rounded-3xl bg-white border-2 border-emerald-400 shadow-md space-y-5 animate-fadeIn">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    {language === 'en' ? 'Application ID' : 'आवेदन संख्या'}
                  </span>
                  <strong className="text-xl font-black font-mono text-emerald-800">
                    {trackedApplication.id}
                  </strong>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {language === 'en'
                        ? STATUS_PROGRESS[trackedApplication.status]?.badgeEn || trackedApplication.status
                        : STATUS_PROGRESS[trackedApplication.status]?.badgeHi || trackedApplication.status}
                    </span>
                  </span>
                </div>
              </div>

              {/* Applicant Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {language === 'en' ? 'Applicant Name' : 'अभ्यर्थी का नाम'}:
                  </span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {trackedApplication.fullName}
                  </strong>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    S/O, D/O: {trackedApplication.fatherOrGuardianName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {language === 'en' ? 'Applied Position' : 'आवेदन पद'}:
                  </span>
                  <strong className="text-emerald-800 font-bold text-sm">
                    {trackedApplication.position}
                  </strong>
                  <span className="block text-[11px] text-slate-500 mt-0.5 capitalize">
                    {trackedApplication.jobCategory === 'teacher' ? 'शिक्षक संवर्ग (Teaching)' : 'नर्सिंग संवर्ग (Healthcare)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {language === 'en' ? 'Submission Date' : 'आवेदन तिथि'}:
                  </span>
                  <strong className="text-slate-800 font-mono">
                    {trackedApplication.submittedAt ? new Date(trackedApplication.submittedAt).toLocaleDateString() : 'N/A'}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {language === 'en' ? 'Location (Block / Village)' : 'स्थान (प्रखंड / गाँव)'}:
                  </span>
                  <strong className="text-slate-800">
                    {trackedApplication.village}, {trackedApplication.block} ({trackedApplication.district})
                  </strong>
                </div>
              </div>

              {/* Status Timeline / Steps */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Recruitment Status Timeline' : 'भर्ती प्रगति स्थिति'}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                  <div
                    className={`p-2 rounded-xl font-bold border ${
                      trackedApplication.status === 'Pending'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    1. {language === 'en' ? 'Pending' : 'प्रतीक्षारत'}
                  </div>
                  <div
                    className={`p-2 rounded-xl font-bold border ${
                      trackedApplication.status === 'Under Review'
                        ? 'bg-blue-100 text-blue-900 border-blue-300 ring-2 ring-blue-400'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    2. {language === 'en' ? 'Under Review' : 'समीक्षाधीन'}
                  </div>
                  <div
                    className={`p-2 rounded-xl font-bold border ${
                      trackedApplication.status === 'Shortlisted'
                        ? 'bg-teal-100 text-teal-900 border-teal-300 ring-2 ring-teal-400'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    3. {language === 'en' ? 'Shortlisted' : 'शॉर्टलिस्टेड'}
                  </div>
                  <div
                    className={`p-2 rounded-xl font-bold border ${
                      trackedApplication.status === 'Interview Scheduled'
                        ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400'
                        : trackedApplication.status === 'Selected'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    4. {trackedApplication.status === 'Selected' ? (language === 'en' ? 'Selected' : 'चयनित') : (language === 'en' ? 'Interview' : 'साक्षात्कार')}
                  </div>
                </div>

                {/* If Interview Scheduled: Prominent Interview Notice */}
                {trackedApplication.status === 'Interview Scheduled' && (
                  <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-300 text-purple-950 space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-purple-900 font-black text-xs uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <span>{language === 'en' ? 'Interview Scheduled Details' : 'साक्षात्कार निर्धारण विवरण'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong>{language === 'en' ? 'Date' : 'दिनांक'}: </strong>
                        <span className="font-mono">{trackedApplication.interviewDate || 'Notified via SMS/Phone'}</span>
                      </div>
                      <div>
                        <strong>{language === 'en' ? 'Reporting Time' : 'समय'}: </strong>
                        <span className="font-mono">{trackedApplication.interviewTime || '10:00 AM'}</span>
                      </div>
                    </div>
                    <div className="text-xs pt-1 border-t border-purple-200">
                      <strong>{language === 'en' ? 'Venue Address' : 'साक्षात्कार स्थल'}: </strong>
                      <span>{trackedApplication.interviewAddress || settings.address}</span>
                    </div>
                  </div>
                )}

                {/* Remarks by Admin if any */}
                {trackedApplication.statusRemarks && (
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-700">
                    <strong className="text-emerald-900">{language === 'en' ? 'Admin Remarks' : 'कार्यालय टिप्पणी'}: </strong>
                    <span>{trackedApplication.statusRemarks}</span>
                  </div>
                )}
              </div>

              {/* Help & Support Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <span className="text-slate-500">
                  {language === 'en' ? 'Need help with your application?' : 'आवेदन अथवा साक्षात्कार संबंधी सहायता:'}
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'WhatsApp Support' : 'व्हाट्सएप सहायता'}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'बंद करें'}
          </button>
        </div>
      </div>
    </div>
  );
};
