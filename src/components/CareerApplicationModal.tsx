import React, { useState, useEffect } from 'react';
import { useTrust } from '../context/TrustContext';
import { JobVacancy, JobCategory, JobApplication } from '../types/career';
import { NALANDA_BLOCKS, NALANDA_DISTRICT } from '../data/nalandaVillages';
import { SupabaseCareerService } from '../lib/supabaseCareerService';
import { compressImageFile } from '../utils/imageCompressor';
import {
  X,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Calendar,
  Building,
} from 'lucide-react';

interface CareerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob?: JobVacancy | null;
  onSuccessTracking?: (appId: string) => void;
}

const TEACHER_POSITIONS = [
  'Primary Teacher',
  'Secondary Teacher',
  'Subject Teacher',
  'Computer Teacher',
  'Female Teacher',
];

const NURSING_POSITIONS = [
  'Nursing Staff',
  'Staff Nurse',
  'ANM',
  'GNM',
  'Medical Support Staff',
];

export const CareerApplicationModal: React.FC<CareerApplicationModalProps> = ({
  isOpen,
  onClose,
  selectedJob,
  onSuccessTracking,
}) => {
  const { submitJobApplication, language, settings } = useTrust();

  // Form State
  const [jobCategory, setJobCategory] = useState<JobCategory>(
    selectedJob?.category || 'teacher'
  );
  const [position, setPosition] = useState<string>(
    selectedJob?.position || 'Primary Teacher'
  );

  const [fullName, setFullName] = useState('');
  const [fatherOrGuardianName, setFatherOrGuardianName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | undefined>('Male');
  const [mobile, setMobile] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [email, setEmail] = useState('');

  // Location - Nalanda dependent dropdown
  const [district, setDistrict] = useState('Nalanda');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('rajgir');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [address, setAddress] = useState('');

  // Qualifications & Experience
  const [educationalQualification, setEducationalQualification] = useState('');
  const [professionalQualification, setProfessionalQualification] = useState('');
  const [workExperience, setWorkExperience] = useState('');

  // Document Uploads
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [additionalDocFile, setAdditionalDocFile] = useState<File | null>(null);
  const [additionalDocName, setAdditionalDocName] = useState('');

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedApp, setSubmittedApp] = useState<JobApplication | null>(null);
  const [copiedAppId, setCopiedAppId] = useState(false);

  // Sync when selectedJob prop changes
  useEffect(() => {
    if (selectedJob) {
      setJobCategory(selectedJob.category);
      setPosition(selectedJob.position);
    }
  }, [selectedJob]);

  // Sync whatsapp number with mobile if checked
  useEffect(() => {
    if (sameAsMobile) {
      setWhatsappNumber(mobile);
    }
  }, [mobile, sameAsMobile]);

  // Get active block's villages from the PDF data
  const currentBlock = NALANDA_BLOCKS.find((b) => b.id === selectedBlockId) || NALANDA_BLOCKS[0];

  // Set default village when block changes
  useEffect(() => {
    if (currentBlock && currentBlock.villages.length > 0) {
      setSelectedVillage(currentBlock.villages[0].nameHi);
    }
  }, [selectedBlockId]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.75);
        setPhotoPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFormError(
          language === 'en'
            ? 'Resume must be in PDF format.'
            : 'बायोडाटा / सीवी (Resume) केवल PDF प्रारूप में होना चाहिए।'
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError(
          language === 'en'
            ? 'Resume file size must be less than 5MB.'
            : 'सीवी फाइल का आकार 5MB से कम होना चाहिए।'
        );
        return;
      }
      setFormError('');
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handleAdditionalDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError(
          language === 'en'
            ? 'Document size exceeds 10MB limit.'
            : 'दस्तावेज का आकार 10MB से अधिक नहीं होना चाहिए।'
        );
        return;
      }
      setAdditionalDocFile(file);
      setAdditionalDocName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!fullName.trim() || !fatherOrGuardianName.trim() || !dob) {
      setFormError(
        language === 'en'
          ? 'Please fill in all personal details.'
          : 'कृपया नाम, पिता/अभिभावक का नाम और जन्मतिथि अनिवार्य रूप से भरें।'
      );
      return;
    }

    if (mobile.replace(/\D/g, '').length !== 10) {
      setFormError(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError(
        language === 'en'
          ? 'Please enter a valid email address.'
          : 'कृपया मान्य ईमेल पता दर्ज करें।'
      );
      return;
    }

    if (!selectedVillage) {
      setFormError(
        language === 'en'
          ? 'Please select your village from the list.'
          : 'कृपया प्रखंड के अंतर्गत अपना गाँव चुनें।'
      );
      return;
    }

    if (!educationalQualification.trim()) {
      setFormError(
        language === 'en'
          ? 'Please specify your educational qualification.'
          : 'कृपया अपनी शैक्षणिक योग्यता दर्ज करें।'
      );
      return;
    }

    if (!declarationAccepted) {
      setFormError(
        language === 'en'
          ? 'Please accept the declaration and consent checkbox.'
          : 'कृपया घोषणा और सहमति चेकबॉक्स को स्वीकार करें।'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload files via Supabase service (with robust base64 fallback)
      let resumeUrl = '';
      if (resumeFile) {
        const uploadRes = await SupabaseCareerService.uploadDocument(resumeFile, 'resumes');
        resumeUrl = uploadRes.url;
      }

      let additionalDocsUrl = '';
      if (additionalDocFile) {
        const docRes = await SupabaseCareerService.uploadDocument(additionalDocFile, 'additional');
        additionalDocsUrl = docRes.url;
      }

      // 2. Submit application
      const createdApp = await submitJobApplication({
        jobId: selectedJob?.id || `JOB-${jobCategory.toUpperCase()}`,
        jobTitle: selectedJob?.title || `${position} (${jobCategory === 'teacher' ? 'Teaching' : 'Nursing'})`,
        jobCategory,
        position,
        fullName: fullName.trim(),
        fatherOrGuardianName: fatherOrGuardianName.trim(),
        dob,
        gender,
        mobile: mobile.trim(),
        whatsappNumber: whatsappNumber.trim() || mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        district: 'Nalanda',
        block: currentBlock.nameHi,
        village: selectedVillage,
        educationalQualification: educationalQualification.trim(),
        professionalQualification: professionalQualification.trim(),
        workExperience: workExperience.trim(),
        resumeUrl,
        resumeFileName: resumeName,
        photoUrl: photoPreview,
        additionalDocsUrl,
        additionalDocsFileName: additionalDocName,
        declarationAccepted: true,
      });

      setSubmittedApp(createdApp);
    } catch {
      setFormError(
        language === 'en'
          ? 'Failed to submit application. Please check your network and try again.'
          : 'आवेदन सबमिट करने में त्रुटि हुई। कृपया नेटवर्क जांचें और पुनः प्रयास करें।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedApp?.id) {
      navigator.clipboard.writeText(submittedApp.id);
      setCopiedAppId(true);
      setTimeout(() => setCopiedAppId(false), 2500);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Briefcase className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'en' ? 'Online Job Application Form' : 'ऑनलाइन भर्ती एवं नौकरी आवेदन पत्र'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {settings.name} — {language === 'en' ? 'Nalanda, Bihar' : 'नालंदा, बिहार'}
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

        {/* Modal Content */}
        <div className="p-5 sm:p-8 space-y-6 text-slate-800">
          {submittedApp ? (
            /* Submission Success View */
            <div className="text-center space-y-6 py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  {language === 'en' ? 'Application Submitted Successfully' : 'आवेदन सफलतापूर्वक दर्ज हो गया'}
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {language === 'en' ? 'Thank You for Applying!' : 'आवेदन हेतु धन्यवाद!'}
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {language === 'en'
                    ? 'Your application has been received by Luv Kush Seva Trust. Please save your Application ID for future reference and interview tracking.'
                    : 'आपका आवेदन लव कुश सेवा ट्रस्ट द्वारा प्राप्त कर लिया गया है। भविष्य के संदर्भ एवं साक्षात्कार ट्रैकिंग हेतु अपनी आवेदन संख्या सुरक्षित रखें।'}
                </p>
              </div>

              {/* Application ID Card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="text-xs font-bold text-amber-900 uppercase">
                    {language === 'en' ? 'Unique Application ID:' : 'विशिष्ट आवेदन संख्या:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedAppId ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAppId ? (language === 'en' ? 'Copied' : 'कॉपी') : (language === 'en' ? 'Copy ID' : 'कॉपी करें')}</span>
                  </button>
                </div>

                <div className="text-2xl font-black font-mono text-emerald-900 bg-white py-2 px-3 rounded-xl border border-amber-200 text-center shadow-xs">
                  {submittedApp.id}
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <div><strong>{language === 'en' ? 'Applicant Name' : 'अभ्यर्थी'}:</strong> {submittedApp.fullName}</div>
                  <div><strong>{language === 'en' ? 'Position' : 'पद'}:</strong> {submittedApp.position} ({submittedApp.jobCategory === 'teacher' ? 'शिक्षक' : 'नर्सिंग'})</div>
                  <div><strong>{language === 'en' ? 'Location' : 'स्थान'}:</strong> {submittedApp.village}, {submittedApp.block} ({submittedApp.district})</div>
                  <div><strong>{language === 'en' ? 'Mobile' : 'मोबाइल'}:</strong> {submittedApp.mobile}</div>
                  <div><strong>{language === 'en' ? 'Current Status' : 'वर्तमान स्थिति'}:</strong> <span className="font-bold text-amber-800">⏳ प्रतीक्षारत (Pending)</span></div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-950">
                  ℹ️ {language === 'en'
                    ? 'Our recruitment cell will review your qualification and schedule an interview. You can track your status anytime on the website using this Application ID.'
                    : 'हमारी चयन समिति आपके आवेदन की समीक्षा करेगी। आप इस Application ID द्वारा कभी भी वेबसाइट पर साक्षात्कार की स्थिति ट्रैक कर सकते हैं।'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'en' ? 'Print Summary' : 'प्रपत्र प्रिंट करें'}</span>
                </button>

                {onSuccessTracking && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSuccessTracking(submittedApp.id);
                    }}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Track My Application Now' : 'आवेदन स्थिति ट्रैक करें'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Close Window' : 'बंद करें'}
                </button>
              </div>
            </div>
          ) : (
            /* Online Application Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Position Selection */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>1. {language === 'en' ? 'Select Recruitment Category & Position' : 'भर्ती संवर्ग एवं पद का चयन'} *</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Job Category' : 'भर्ती संवर्ग (Category)'} *
                    </label>
                    <select
                      value={jobCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as JobCategory;
                        setJobCategory(newCat);
                        setPosition(newCat === 'teacher' ? TEACHER_POSITIONS[0] : NURSING_POSITIONS[0]);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="teacher">
                        {language === 'en' ? 'A. Teacher Recruitment (शिक्षक भर्ती)' : 'क. शिक्षक भर्ती (Teacher Recruitment)'}
                      </option>
                      <option value="nursing">
                        {language === 'en' ? 'B. Nursing Staff Recruitment (नर्सिंग स्टाफ भर्ती)' : 'ख. नर्सिंग स्टाफ भर्ती (Nursing Staff Recruitment)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Applying For Position' : 'आवेदन पद (Position)'} *
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {(jobCategory === 'teacher' ? TEACHER_POSITIONS : NURSING_POSITIONS).map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>2. {language === 'en' ? 'Applicant Personal Information' : 'अभ्यर्थी का व्यक्तिगत विवरण'} *</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Full Name' : 'पूरा नाम'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. Rahul Kumar' : 'जैसे: राहुल कुमार'}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? "Father's / Guardian's Name" : 'पिता / अभिभावक का नाम'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fatherOrGuardianName}
                      onChange={(e) => setFatherOrGuardianName(e.target.value)}
                      placeholder={language === 'en' ? "Father's name" : 'पिता का नाम'}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Date of Birth' : 'जन्मतिथि'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Gender (Optional)' : 'लिंग (ऐच्छिक)'}
                    </label>
                    <select
                      value={gender || 'Male'}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Male">{language === 'en' ? 'Male' : 'पुरुष'}</option>
                      <option value="Female">{language === 'en' ? 'Female' : 'महिला'}</option>
                      <option value="Other">{language === 'en' ? 'Other' : 'अन्य'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'} *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10 digits mobile"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'WhatsApp Number' : 'व्हाट्सएप नंबर'} *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={sameAsMobile}
                      value={sameAsMobile ? mobile : whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="10 digits whatsapp"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono disabled:bg-slate-100"
                    />
                    <label className="flex items-center gap-1.5 text-[10.5px] text-slate-600 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsMobile}
                        onChange={(e) => setSameAsMobile(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{language === 'en' ? 'Same as Mobile' : 'मोबाइल समान'}</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Email Address' : 'ईमेल पता'} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Location Selection – Nalanda, Bihar (Dependent Dropdown from PDF) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>3. {language === 'en' ? 'Location Selection – Nalanda, Bihar' : 'स्थान चयन – नालंदा जिला, बिहार'} *</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-amber-300">
                    PDF गाँव सूची (147 Villages)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* District: Nalanda */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'District' : 'जिला (District)'}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={language === 'en' ? `${NALANDA_DISTRICT.nameEn}, ${NALANDA_DISTRICT.stateEn}` : `${NALANDA_DISTRICT.nameHi}, ${NALANDA_DISTRICT.stateHi}`}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-slate-100 font-bold text-slate-800"
                    />
                  </div>

                  {/* Block: Rajgir, Islampur, Silao, Giriyak */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Select Block' : 'प्रखंड चुनें (Block)'} *
                    </label>
                    <select
                      value={selectedBlockId}
                      onChange={(e) => setSelectedBlockId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {NALANDA_BLOCKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {language === 'en' ? `${b.nameEn} (${b.villageCount} Villages)` : `${b.nameHi} (${b.villageCount} गाँव)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Village: Dependent Dropdown from PDF */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Select Village' : 'गाँव का नाम चुनें (Village)'} *
                    </label>
                    <select
                      value={selectedVillage}
                      onChange={(e) => setSelectedVillage(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-blue-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    >
                      <option value="">{language === 'en' ? '-- Select Village from List --' : '-- सूची से गाँव चुनें --'}</option>
                      {currentBlock.villages.map((v) => (
                        <option key={v.sno} value={v.nameHi}>
                          {v.sno}. {v.nameHi} ({v.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Full Street Address / Landmark / Pin Code' : 'पूरा पता / लैंडमार्क / पिन कोड'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'en' ? 'House no, Ward no, Post office, Pincode' : 'मकान संख्या, वार्ड संख्या, डाकघर, पिन कोड'}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 4: Qualification & Experience */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>4. {language === 'en' ? 'Qualifications & Work Experience' : 'शैक्षणिक, व्यावसायिक योग्यता एवं अनुभव'} *</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Educational Qualification' : 'शैक्षणिक योग्यता (10th/12th/Graduation/PG)'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={educationalQualification}
                      onChange={(e) => setEducationalQualification(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. B.Sc / B.A / M.Sc / 10+2' : 'जैसे: बीएससी / बीए / एमएससी / 10+2'}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Professional Qualification' : 'व्यावसायिक / तकनीकी योग्यता (B.Ed/D.El.Ed/ANM/GNM)'}
                    </label>
                    <input
                      type="text"
                      value={professionalQualification}
                      onChange={(e) => setProfessionalQualification(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. B.Ed, D.El.Ed, GNM, ANM, BCA, Nursing' : 'जैसे: बी.एड, डी.एल.एड, जीएनएम, एएनएम, बीसीए'}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Work Experience Details (If any)' : 'कार्य अनुभव का विवरण (यदि कोई हो)'}
                  </label>
                  <textarea
                    rows={2}
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    placeholder={language === 'en' ? 'Fresher or mention previous teaching/clinical experience (e.g. 2 years as Primary Teacher)' : 'फ्रेशर अथवा पूर्व अध्यापन/नर्सिंग अनुभव (जैसे: 2 वर्ष प्राथमिक शिक्षक के रूप में)'}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 5: Documents & Photo Upload */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>5. {language === 'en' ? 'Upload Documents & Passport Photo' : 'दस्तावेज एवं पासपोर्ट फोटो अपलोड'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Photo Upload */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Passport Size Photo' : 'पासपोर्ट साइज फोटो'}
                    </span>
                    {photoPreview ? (
                      <div className="w-20 h-24 mx-auto rounded-xl overflow-hidden border-2 border-emerald-400 shadow-xs relative">
                        <img src={photoPreview} alt="Passport preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoPreview('')}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                        <User className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {language === 'en' ? 'Upload Photo' : 'फोटो अपलोड'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Resume / CV Upload (PDF) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Resume / CV (PDF)' : 'बायोडाटा / सीवी (PDF)'}
                    </span>
                    {resumeName ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold truncate">
                        ✓ {resumeName}
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            setResumeName('');
                          }}
                          className="block text-[10px] text-red-600 hover:underline mx-auto mt-1"
                        >
                          {language === 'en' ? 'Remove' : 'हटाएं'}
                        </button>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {language === 'en' ? 'Choose PDF' : 'PDF चुनें (Max 5MB)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Additional Documents */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Qualification Certificate' : 'प्रमाण पत्र / अन्य दस्तावेज'}
                    </span>
                    {additionalDocName ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold truncate">
                        ✓ {additionalDocName}
                        <button
                          type="button"
                          onClick={() => {
                            setAdditionalDocFile(null);
                            setAdditionalDocName('');
                          }}
                          className="block text-[10px] text-red-600 hover:underline mx-auto mt-1"
                        >
                          {language === 'en' ? 'Remove' : 'हटाएं'}
                        </button>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {language === 'en' ? 'Choose File' : 'फाइल चुनें'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleAdditionalDocUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Declaration and Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    {language === 'en'
                      ? 'I hereby declare that all information provided in this application form is true, complete and correct to the best of my knowledge and belief. I agree to comply with the rules and recruitment criteria of Luv Kush Seva Trust, Nalanda, Bihar.'
                      : 'मैं सत्यनिष्ठापूर्वक घोषणा करता/करती हूँ कि इस आवेदन पत्र में दी गई सभी सूचनाएं मेरे ज्ञान एवं विश्वास के अनुसार पूर्णतः सत्य एवं सही हैं। मैं लव कुश सेवा ट्रस्ट, नालंदा (बिहार) के भर्ती नियमों एवं शर्तों का पालन करने हेतु सहमत हूँ।'}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-950 disabled:bg-slate-400 text-white font-black text-sm rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5 text-amber-300" />
                  <span>
                    {isSubmitting
                      ? (language === 'en' ? 'Submitting Application...' : 'आवेदन दर्ज हो रहा है...')
                      : (language === 'en' ? 'Submit Application' : 'आवेदन सबमिट करें (Submit Application)')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
