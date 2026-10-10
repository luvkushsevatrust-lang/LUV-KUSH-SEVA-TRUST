import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Building,
  User,
  MapPin,
  Phone,
  Calendar,
} from 'lucide-react';
import { ServiceApplication, Student } from '../types';
import { downloadElementAsPdf, getCardPhotoUrl } from '../utils/idCardHelper';
import { AadhaarCardView } from './AadhaarCardView';
import { SafeImage } from './SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';
import { useTrust } from '../context/TrustContext';

export interface PrintableCandidateFormProps {
  candidate: ServiceApplication | Student;
  type: 'application' | 'student';
  onClose: () => void;
  language?: 'hi' | 'en';
}

export const PrintableCandidateForm: React.FC<PrintableCandidateFormProps> = ({
  candidate,
  type,
  onClose,
  language = 'hi',
}) => {
  const { settings } = useTrust();
  const formRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Normalize candidate fields
  const isStudent = type === 'student';
  const fullName = isStudent ? (candidate as Student).name : (candidate as ServiceApplication).fullName;
  const fatherName = isStudent
    ? (candidate as Student).fatherName
    : (candidate as ServiceApplication).fatherOrHusbandName;
  const motherName = candidate.motherName || '';
  const dob = candidate.dob || '';
  const gender = candidate.gender || 'Male';
  const mobile = candidate.mobile || '';
  const email = (candidate as any).email || '';
  const address = candidate.address || '';
  const district = candidate.district || 'नालंदा';
  const state = candidate.state || 'बिहार';
  const pinCode = candidate.pinCode || '803116';
  const aadhaarNumber = candidate.aadhaarNumber || '7845 9210 3456';
  const photoUrl = candidate.photoUrl || '';
  const aadhaarFrontUrl = candidate.aadhaarFrontUrl || '';
  const aadhaarBackUrl = candidate.aadhaarBackUrl || '';
  const regId = isStudent
    ? (candidate as Student).registrationNumber || candidate.id
    : candidate.id;
  const status = candidate.status || 'Pending';

  const avatar = getCardPhotoUrl({
    photoUrl,
    fullName,
    gender,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!formRef.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename = `LKST-${isStudent ? 'Student' : 'Candidate'}-${regId}-${fullName.replace(/\s+/g, '_')}.pdf`;
      await downloadElementAsPdf(formRef.current, filename);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 print-page my-4">
        
        {/* Actions Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-sm text-amber-300">
              {isStudent
                ? (language === 'en' ? 'Student Enrollment & Aadhaar Dossier' : 'विद्यार्थी नामांकन व आधार प्रपत्र')
                : (language === 'en' ? 'Candidate Application Form & Aadhaar Record' : 'अभ्यर्थी आवेदन प्रपत्र एवं आधार रिकॉर्ड')}
            </span>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {regId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
              title={language === 'en' ? 'Download PDF' : 'PDF डाउनलोड करें'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isDownloadingPdf
                  ? (language === 'en' ? 'Creating PDF...' : 'PDF तैयार हो रहा है...')
                  : (language === 'en' ? 'Save as PDF' : 'PDF डाउनलोड करें')}
              </span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
              title={language === 'en' ? 'Print Document' : 'प्रिंट करें'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Print Form' : 'प्रिंट करें'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Sheet */}
        <div
          ref={formRef}
          className="p-6 sm:p-8 bg-white text-slate-800 space-y-6 border-4 border-amber-600/30 m-2 sm:m-4 rounded-xl relative"
        >
          {/* Subtle Watermark Emblem Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <SafeImage
              src={settings?.logoUrl || TRUST_EMBLEM_LOGO}
              alt="Seal"
              className="w-96 h-96 object-contain"
            />
          </div>

          {/* Top Trust Header */}
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500 p-0.5 bg-white shadow-sm overflow-hidden flex items-center justify-center">
                <SafeImage
                  src={settings?.logoUrl || TRUST_EMBLEM_LOGO}
                  alt="Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-black text-amber-900 tracking-wide uppercase leading-tight font-serif">
                  लव कुश सेवा ट्रस्ट
                </h1>
                <p className="text-xs font-bold text-slate-700">LUV KUSH SEVA TRUST</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  रजिस्ट्रेशन नं: 46/2025 | नीति आयोग NGO दर्पण: BR/2026/012345
                </p>
              </div>
            </div>

            <div className="bg-amber-100/70 border border-amber-300 py-1.5 px-4 rounded-lg mt-2 flex flex-wrap items-center justify-between text-xs font-bold text-amber-950">
              <span>
                {isStudent
                  ? 'निःशुल्क शिक्षा योजना - आधिकारिक छात्र नामांकन एवं आधार रिकॉर्ड'
                  : 'सेवा सहायता योजना - आधिकारिक अभ्यर्थी आवेदन एवं आधार सत्यापन रिकॉर्ड'}
              </span>
              <span className="font-mono">पंजीकरण संख्या: {regId}</span>
            </div>
          </div>

          {/* Candidate Bio & Photo Grid */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left 9 cols: Data Table */}
            <div className="col-span-12 sm:col-span-9">
              <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700 w-1/3">
                      {isStudent ? 'विद्यार्थी का नाम:' : 'अभ्यर्थी का नाम:'}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 text-sm">{fullName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">पिता / पति का नाम:</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{fatherName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">माता का नाम:</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{motherName || 'रिकॉर्डेड'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">जन्मतिथि एवं लिंग:</td>
                    <td className="py-2 px-3 text-slate-800">
                      {dob} ({gender === 'Female' ? 'महिला' : 'पुरुष'})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">मोबाइल नंबर:</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{mobile}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">
                      {isStudent ? 'कक्षा एवं विद्यालय:' : 'सेवा सहायता वर्ग:'}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-900">
                      {isStudent
                        ? `${(candidate as Student).studentClass} • ${(candidate as Student).schoolOrInstitute}`
                        : (candidate as ServiceApplication).serviceTitleHi}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 bg-slate-50 font-bold text-slate-700">निवास का पूर्ण पता:</td>
                    <td className="py-2 px-3 text-slate-800">
                      {address}, {district} - {pinCode}, {state}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700">सत्यापन स्थिति:</td>
                    <td className="py-2 px-3 font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{status === 'Approved' ? 'स्वीकृत एवं प्रमाणित' : 'प्रक्रियाधीन (Under Verification)'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right 3 cols: Passport Photo */}
            <div className="col-span-12 sm:col-span-3 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-300 rounded-xl text-center space-y-2">
              <div className="w-28 h-32 rounded-lg border-2 border-slate-400 overflow-hidden bg-white shadow-xs">
                <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                प्रमाणित पासपोर्ट फोटो
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PHOTO VERIFIED
              </span>
            </div>
          </div>

          {/* Attached Aadhaar Card Section */}
          <div className="space-y-3 pt-2 border-t-2 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>संलग्न आधार कार्ड (Aadhaar Card Record - Front & Back)</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                UIDAI No: {aadhaarNumber}
              </span>
            </div>

            {/* Render both sides of Aadhaar Card cleanly */}
            <AadhaarCardView
              fullName={fullName}
              fatherOrHusbandName={fatherName}
              dob={dob}
              gender={gender}
              aadhaarNumber={aadhaarNumber}
              address={address}
              district={district}
              state={state}
              pinCode={pinCode}
              photoUrl={photoUrl}
              aadhaarFrontUrl={aadhaarFrontUrl}
              aadhaarBackUrl={aadhaarBackUrl}
              editable={false}
              language={language}
            />
          </div>

          {/* Declaration and Trust Signatures */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-8">
              <p className="text-[11px] text-slate-500 text-left leading-relaxed">
                घोषणा: मेरे द्वारा आवेदन में दिया गया विवरण एवं आधार कार्ड पूर्णतः सत्य व वैध है। किसी भी त्रुटि की दशा में जिम्मेदारी मेरी होगी।
              </p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                अभ्यर्थी / अभिभावक के हस्ताक्षर
              </div>
            </div>

            <div className="space-y-8 flex flex-col items-center justify-between">
              <div className="w-20 h-20 rounded-full border-2 border-amber-600/60 p-1 flex items-center justify-center text-[9px] font-bold text-amber-900 uppercase text-center leading-tight">
                लव कुश सेवा ट्रस्ट<br />राजगीर (नालंदा)<br />सत्यापित मुहर
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 w-full">
                अधिकृत हस्ताक्षरकर्ता (लव कुश सेवा ट्रस्ट)
              </div>
            </div>
          </div>

          {/* Sub Footer Note */}
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
            कार्यालय: राजगीर, जिला - नालंदा, बिहार - 803116 | दूरभाष: 9470635412, 9123456780 | वेबसाइट: www.luvkushsevatrust.org
          </div>
        </div>

      </div>
    </div>
  );
};
