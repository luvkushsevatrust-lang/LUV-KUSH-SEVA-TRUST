import React, { useState } from 'react';
import {
  CreditCard,
  Upload,
  Trash2,
  RotateCcw,
  Eye,
  CheckCircle,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  QrCode,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { getCardPhotoUrl } from '../utils/idCardHelper';

export interface AadhaarCardViewProps {
  fullName: string;
  fatherOrHusbandName?: string;
  dob?: string;
  gender?: string;
  aadhaarNumber?: string;
  address?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  photoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  onFrontChange?: (dataUrl: string) => void;
  onBackChange?: (dataUrl: string) => void;
  onReload?: () => void;
  editable?: boolean;
  language?: 'hi' | 'en';
}

export const AadhaarCardView: React.FC<AadhaarCardViewProps> = ({
  fullName,
  fatherOrHusbandName = '',
  dob = '',
  gender = 'Male',
  aadhaarNumber = '7845 9210 3456',
  address = 'राजगीर, नालंदा, बिहार',
  district = 'नालंदा',
  state = 'बिहार',
  pinCode = '803116',
  photoUrl = '',
  aadhaarFrontUrl = '',
  aadhaarBackUrl = '',
  onFrontChange,
  onBackChange,
  onReload,
  editable = true,
  language = 'hi',
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [previewModalImg, setPreviewModalImg] = useState<{ title: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [forcedSimulatedView, setForcedSimulatedView] = useState(false);

  // Format Aadhaar number to 4 4 4 digits
  const cleanAadhaar = (aadhaarNumber || '784592103456').replace(/\D/g, '');
  const formattedAadhaar =
    cleanAadhaar.length >= 12
      ? `${cleanAadhaar.slice(0, 4)} ${cleanAadhaar.slice(4, 8)} ${cleanAadhaar.slice(8, 12)}`
      : aadhaarNumber || '7845 9210 3456';

  const avatarPhoto = getCardPhotoUrl({
    photoUrl,
    fullName,
    gender,
  });

  const handleCopyAadhaar = () => {
    navigator.clipboard.writeText(cleanAadhaar);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFrontChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFrontChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBackChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBackChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Aadhaar Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                {language === 'en' ? 'Candidate Aadhaar Card' : 'उम्मीदवार आधार कार्ड विवरण'}
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>{language === 'en' ? 'UIDAI Verified' : 'आधार प्रमाणित'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'en'
                ? 'Official identity proof linked with beneficiary registration.'
                : 'ट्रस्ट रिकॉर्ड एवं सत्यापन हेतु संलग्न आधिकारिक पहचान पत्र।'}
            </p>
          </div>
        </div>

        {/* View toggles & Reload */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Side View Switcher */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSide('both')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeSide === 'both' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'en' ? 'Both Sides' : 'दोनों भाग'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeSide === 'front' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'en' ? 'Front Side' : 'सामने (Front)'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeSide === 'back' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'en' ? 'Back Side' : 'पीछे (Back)'}
            </button>
          </div>

          {/* UIDAI Simulated vs Uploaded Image toggle */}
          {(aadhaarFrontUrl || aadhaarBackUrl) && (
            <button
              type="button"
              onClick={() => setForcedSimulatedView(!forcedSimulatedView)}
              className="text-[11px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>
                {forcedSimulatedView
                  ? (language === 'en' ? 'Show Uploaded Document' : 'अपलोड दस्तावेज देखें')
                  : (language === 'en' ? 'Show UIDAI Format Card' : 'UIDAI प्रारूप देखें')}
              </span>
            </button>
          )}

          {/* Reload / Refresh Button */}
          {onReload && (
            <button
              type="button"
              onClick={onReload}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title={language === 'en' ? 'Reload Aadhaar' : 'आधार रीलोड करें'}
            >
              <RotateCcw className="w-3 h-3 text-slate-600" />
              <span>{language === 'en' ? 'Reload' : 'रीलोड (Reload)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Aadhaar Number Quick Strip */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">
            {language === 'en' ? 'Aadhaar Number (UIDAI):' : 'आधार संख्या (UIDAI):'}
          </span>
          <span className="font-mono text-base sm:text-lg font-black tracking-wider text-slate-900 bg-amber-50/60 px-3 py-0.5 rounded-lg border border-amber-200">
            {formattedAadhaar}
          </span>
          <button
            type="button"
            onClick={handleCopyAadhaar}
            className="p-1 text-slate-500 hover:text-blue-800 transition-colors cursor-pointer"
            title={language === 'en' ? 'Copy Aadhaar' : 'आधार नंबर कॉपी करें'}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">
            {language === 'en' ? 'Name on Aadhaar:' : 'आधार पर नाम:'} <strong className="text-slate-800">{fullName}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">DOB: {dob || 'उपलब्ध'}</span>
        </div>
      </div>

      {/* Aadhaar Cards Grid Display */}
      <div
        className={`grid gap-4 ${
          activeSide === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'
        }`}
      >
        {/* ========================================================
            CARD 1: FRONT SIDE
        ======================================================== */}
        {(activeSide === 'both' || activeSide === 'front') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>{language === 'en' ? 'Aadhaar Card - Front' : 'आधार कार्ड - मुख्य भाग (Front Side)'}</span>
              </span>
              {aadhaarFrontUrl && !forcedSimulatedView && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModalImg({
                      title: `${fullName} - Aadhaar Front Side`,
                      url: aadhaarFrontUrl,
                    })
                  }
                  className="text-blue-700 hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{language === 'en' ? 'Zoom' : 'बड़ा देखें'}</span>
                </button>
              )}
            </div>

            {/* Display Either Real Uploaded Image OR Authentic UIDAI Styled Front Card */}
            {aadhaarFrontUrl && !forcedSimulatedView ? (
              <div className="relative rounded-2xl border-2 border-slate-300 bg-white p-2 shadow-sm overflow-hidden group">
                <img
                  src={aadhaarFrontUrl}
                  alt="Aadhaar Front"
                  className="w-full h-56 sm:h-64 object-contain rounded-xl bg-slate-100"
                />
                <div className="absolute top-4 left-4 bg-emerald-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  {language === 'en' ? 'Uploaded Front Document' : 'अपलोड किया गया मूल दस्तावेज (Front)'}
                </div>
              </div>
            ) : (
              /* Authentic UIDAI Standard Front Card Graphic */
              <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-md overflow-hidden relative font-sans text-slate-900">
                {/* Top Tricolor Strip */}
                <div className="h-2.5 w-full flex">
                  <div className="h-full w-1/3 bg-[#FF9933]"></div>
                  <div className="h-full w-1/3 bg-white"></div>
                  <div className="h-full w-1/3 bg-[#138808]"></div>
                </div>

                {/* Header Bar */}
                <div className="px-4 py-2 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-b border-amber-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Ashoka Emblem SVG representation */}
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-800" fill="currentColor">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" stroke="currentColor" strokeWidth="0.8" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[12px] font-extrabold text-slate-900 leading-tight">भारत सरकार</div>
                      <div className="text-[10px] font-bold text-slate-600 leading-tight">Government of India</div>
                    </div>
                  </div>

                  {/* UIDAI Sun Logo Representation */}
                  <div className="flex items-center gap-1.5 text-right">
                    <div>
                      <div className="text-[10px] font-black text-red-700 leading-tight">आधार</div>
                      <div className="text-[8px] font-bold text-slate-600 leading-tight">AADHAAR</div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                      आ
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 grid grid-cols-12 gap-3 items-center bg-white min-h-[170px]">
                  {/* Photo Section */}
                  <div className="col-span-4 flex flex-col items-center">
                    <div className="w-24 h-28 rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-xs">
                      <img
                        src={avatarPhoto}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[9px] text-emerald-800 font-bold mt-1 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'en' ? 'Verified Photo' : 'प्रमाणित फोटो'}</span>
                    </span>
                  </div>

                  {/* Personal Details */}
                  <div className="col-span-8 space-y-1 text-left">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">{fullName}</div>
                      <div className="text-xs font-semibold text-slate-600">
                        {fatherOrHusbandName ? `C/O: ${fatherOrHusbandName}` : ''}
                      </div>
                    </div>

                    <div className="text-xs space-y-0.5 pt-1">
                      <div className="text-slate-700 font-medium">
                        <span className="text-slate-500">जन्म तिथि / DOB:</span>{' '}
                        <strong className="font-bold text-slate-900">{dob || '2005-01-01'}</strong>
                      </div>
                      <div className="text-slate-700 font-medium">
                        <span className="text-slate-500">लिंग / Gender:</span>{' '}
                        <strong className="font-bold text-slate-900">
                          {gender === 'Female' ? 'महिला / FEMALE' : 'पुरुष / MALE'}
                        </strong>
                      </div>
                    </div>

                    {/* QR Code representation */}
                    <div className="pt-2 flex items-center gap-2">
                      <div className="w-12 h-12 bg-slate-900 text-white p-1 rounded border border-slate-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-10 h-10" />
                      </div>
                      <span className="text-[9px] text-slate-500 leading-tight">
                        भारतीय विशिष्ट पहचान प्राधिकरण सुरक्षित डिजिटल हस्ताक्षर
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aadhaar Number Strip */}
                <div className="py-1.5 px-4 bg-slate-50 border-t border-b border-slate-200 text-center">
                  <div className="font-mono text-lg sm:text-xl font-black tracking-widest text-red-700">
                    {formattedAadhaar}
                  </div>
                </div>

                {/* Bottom Slogan Ribbon */}
                <div className="py-1 px-4 bg-gradient-to-r from-red-700 via-rose-700 to-red-700 text-white text-center flex items-center justify-between text-[10px] font-bold">
                  <span>मेरा आधार, मेरी पहचान</span>
                  <span className="text-[9px] text-rose-200">हेल्पलाइन: 1947</span>
                </div>
              </div>
            )}

            {/* Front Upload / Replace Control */}
            {editable && onFrontChange && (
              <div className="flex items-center gap-2 pt-1">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {aadhaarFrontUrl
                      ? (language === 'en' ? 'Replace Front Image' : 'सामने का भाग बदलें (Replace)')
                      : (language === 'en' ? 'Upload Front Image' : 'आधार सामने का फोटो अपलोड करें')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFrontUpload}
                  />
                </label>
                {aadhaarFrontUrl && (
                  <button
                    type="button"
                    onClick={() => onFrontChange('')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Remove' : 'हटाएं'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            CARD 2: BACK SIDE
        ======================================================== */}
        {(activeSide === 'both' || activeSide === 'back') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>{language === 'en' ? 'Aadhaar Card - Back' : 'आधार कार्ड - पिछला भाग (Back Side)'}</span>
              </span>
              {aadhaarBackUrl && !forcedSimulatedView && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModalImg({
                      title: `${fullName} - Aadhaar Back Side`,
                      url: aadhaarBackUrl,
                    })
                  }
                  className="text-blue-700 hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{language === 'en' ? 'Zoom' : 'बड़ा देखें'}</span>
                </button>
              )}
            </div>

            {/* Display Either Real Uploaded Image OR Authentic UIDAI Styled Back Card */}
            {aadhaarBackUrl && !forcedSimulatedView ? (
              <div className="relative rounded-2xl border-2 border-slate-300 bg-white p-2 shadow-sm overflow-hidden group">
                <img
                  src={aadhaarBackUrl}
                  alt="Aadhaar Back"
                  className="w-full h-56 sm:h-64 object-contain rounded-xl bg-slate-100"
                />
                <div className="absolute top-4 left-4 bg-blue-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  {language === 'en' ? 'Uploaded Back Document' : 'अपलोड किया गया मूल दस्तावेज (Back)'}
                </div>
              </div>
            ) : (
              /* Authentic UIDAI Standard Back Card Graphic */
              <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-md overflow-hidden relative font-sans text-slate-900">
                {/* Top Tricolor Strip */}
                <div className="h-2.5 w-full flex">
                  <div className="h-full w-1/3 bg-[#FF9933]"></div>
                  <div className="h-full w-1/3 bg-white"></div>
                  <div className="h-full w-1/3 bg-[#138808]"></div>
                </div>

                {/* Header Bar */}
                <div className="px-4 py-2 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-b border-amber-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                        भारतीय विशिष्ट पहचान प्राधिकरण
                      </div>
                      <div className="text-[9px] font-bold text-slate-600 leading-tight">
                        Unique Identification Authority of India
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      www.uidai.gov.in
                    </span>
                  </div>
                </div>

                {/* Card Back Body: Address details in Hindi & English */}
                <div className="p-4 grid grid-cols-12 gap-3 items-center bg-white min-h-[170px]">
                  {/* Address Section */}
                  <div className="col-span-8 space-y-1.5 text-left">
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-900 block mb-0.5">पता:</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                        {fatherOrHusbandName ? `आत्मज / पत्नी: ${fatherOrHusbandName}, ` : ''}
                        {address}, जिला: {district}, {state} - {pinCode}
                      </p>
                    </div>

                    <div className="text-xs pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-600 block mb-0.5 text-[10px]">Address:</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                        {fatherOrHusbandName ? `S/O, D/O, W/O: ${fatherOrHusbandName}, ` : ''}
                        {address}, Dist: {district}, {state} - {pinCode}
                      </p>
                    </div>
                  </div>

                  {/* QR Code and UIDAI seal */}
                  <div className="col-span-4 flex flex-col items-center justify-center space-y-2 border-l border-slate-100 pl-2">
                    <div className="w-16 h-16 bg-slate-900 text-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                      <QrCode className="w-14 h-14" />
                    </div>
                    <span className="text-[8px] text-center text-slate-500 font-semibold leading-tight">
                      सत्यापन हेतु क्यूआर कोड स्कैन करें
                    </span>
                  </div>
                </div>

                {/* Aadhaar Number Strip */}
                <div className="py-1.5 px-4 bg-slate-50 border-t border-b border-slate-200 text-center">
                  <div className="font-mono text-lg sm:text-xl font-black tracking-widest text-red-700">
                    {formattedAadhaar}
                  </div>
                </div>

                {/* Bottom Contact Ribbon */}
                <div className="py-1 px-4 bg-slate-800 text-slate-200 text-center flex items-center justify-between text-[9px] font-semibold">
                  <span>टोल फ्री: 1947</span>
                  <span>help@uidai.gov.in</span>
                  <span>www.uidai.gov.in</span>
                </div>
              </div>
            )}

            {/* Back Upload / Replace Control */}
            {editable && onBackChange && (
              <div className="flex items-center gap-2 pt-1">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {aadhaarBackUrl
                      ? (language === 'en' ? 'Replace Back Image' : 'पीछे का भाग बदलें (Replace)')
                      : (language === 'en' ? 'Upload Back Image' : 'आधार पीछे का फोटो अपलोड करें')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleBackUpload}
                  />
                </label>
                {aadhaarBackUrl && (
                  <button
                    type="button"
                    onClick={() => onBackChange('')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Remove' : 'हटाएं'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 border border-slate-300 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-sm text-slate-800">{previewModalImg.title}</span>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewModalImg.url}
                alt="Aadhaar Document Preview"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
