import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { ServiceCategory } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import {
  CheckCircle,
  FileText,
  Upload,
  User,
  ShieldCheck,
  AlertCircle,
  Printer,
  ArrowRight,
  RotateCcw,
  CreditCard,
  Trash2,
  Lock,
  Sparkles,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { openRazorpayCheckout } from '../lib/razorpayClient';

interface ServiceRegistrationPageProps {
  initialCategory?: ServiceCategory;
}

export const ServiceRegistrationPage: React.FC<ServiceRegistrationPageProps> = ({
  initialCategory = 'orphanage',
}) => {
  const { addApplication, recordIdCardOrder, setActiveReceipt, setCurrentPage, settings, language, t } = useTrust();

  const [registrationTier, setRegistrationTier] = useState<'special_service_200' | 'general_associate_free'>('special_service_200');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ orderId?: string; paymentId?: string; amount?: number } | null>(null);

  const [category, setCategory] = useState<ServiceCategory>(initialCategory);
  const [fullName, setFullName] = useState('');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState(language === 'en' ? 'Nalanda' : 'नालंदा');
  const [state, setState] = useState(language === 'en' ? 'Bihar' : 'बिहार');
  const [pinCode, setPinCode] = useState('803116');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [description, setDescription] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string>('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string>('');
  const [declaration, setDeclaration] = useState(false);

  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const getCategoryTitle = (cat: ServiceCategory) => {
    if (language === 'en') {
      switch (cat) {
        case 'orphanage':
          return 'Orphanage Home Registration';
        case 'old_age':
          return 'Old Age Home Registration';
        case 'widow':
          return 'Widow Support Registration';
        case 'education':
          return 'Free Education Registration';
        case 'medical':
          return 'Free Medical Help Registration';
        default:
          return 'Community Welfare Registration';
      }
    }
    switch (cat) {
      case 'orphanage':
        return 'अनाथ आश्रम पंजीकरण';
      case 'old_age':
        return 'वृद्ध आश्रम पंजीकरण';
      case 'widow':
        return 'विधवा सहायता पंजीकरण';
      case 'education':
        return 'निःशुल्क शिक्षा पंजीकरण';
      case 'medical':
        return 'निःशुल्क इलाज पंजीकरण';
      default:
        return 'समाज सेवा पंजीकरण';
    }
  };

  const handleReset = () => {
    setFullName('');
    setFatherOrHusbandName('');
    setMotherName('');
    setDob('');
    setMobile('');
    setAlternateMobile('');
    setEmail('');
    setAddress('');
    setVillage('');
    setAadhaarNumber('');
    setDescription('');
    setEmergencyContact('');
    setPhotoPreview('');
    setAadhaarFrontPreview('');
    setAadhaarBackPreview('');
    setDeclaration(false);
    setErrorMsg('');
  };

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

  const handleAadhaarFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setAadhaarFrontPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setAadhaarFrontPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAadhaarBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setAadhaarBackPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setAadhaarBackPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      setErrorMsg(language === 'en' ? 'Please accept the declaration.' : 'कृपया घोषणा स्वीकार करें।');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg(language === 'en' ? 'Please enter a valid 10-digit mobile number.' : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }

    setErrorMsg('');

    if (registrationTier === 'special_service_200') {
      setIsProcessingPayment(true);
      try {
        await openRazorpayCheckout({
          amount: 200,
          purpose: 'smart_id_card',
          donorName: fullName.trim(),
          contact: cleanMobile,
          email: email.trim() || undefined,
          notes: {
            serviceCategory: category,
            tier: 'special_service_200',
            purpose: 'Special Service Smart ID Card Registration (₹200 Fee)',
          },
          onSuccess: async (verifyResult) => {
            setIsProcessingPayment(false);

            // 1. Create the application (Pending admin approval)
            const newApp = addApplication({
              serviceCategory: category,
              serviceTitleHi: `${getCategoryTitle(category)} (विशेष सेवा - ₹200)`,
              fullName: fullName.trim(),
              fatherOrHusbandName,
              motherName,
              dob,
              gender,
              mobile: cleanMobile,
              alternateMobile,
              email,
              address,
              village,
              district,
              state,
              pinCode,
              aadhaarNumber,
              photoUrl: photoPreview,
              aadhaarFrontUrl: aadhaarFrontPreview,
              aadhaarBackUrl: aadhaarBackPreview,
              description: `[विशेष सेवा ₹200 पेड - RZP: ${verifyResult.paymentId}] ${description}`,
              emergencyContact: emergencyContact || cleanMobile,
            });

            // 2. Record ₹200 in id_card_orders (Separated from charitable donations)
            await recordIdCardOrder({
              orderId: verifyResult.orderId,
              paymentId: verifyResult.paymentId,
              tier: 'special_service_200',
              applicantId: newApp.id,
              fullName: fullName.trim(),
              mobile: cleanMobile,
              email: email.trim() || undefined,
              serviceCategory: category,
              amountFee: 200,
              isPaid: true,
              adminApproved: false, // Locked until Admin explicitly approves
              cardIssued: false,
            });

            setPaymentInfo({
              orderId: verifyResult.orderId,
              paymentId: verifyResult.paymentId,
              amount: 200,
            });
            setSubmittedApp(newApp);
          },
          onFailure: (err) => {
            setIsProcessingPayment(false);
            setErrorMsg(
              err.message ||
                (language === 'en'
                  ? 'Payment could not be completed. Please try again.'
                  : '₹200 पंजीकरण शुल्क का भुगतान पूरा नहीं हो सका। कृपया पुनः प्रयास करें।')
            );
          },
        });
      } catch (err: any) {
        setIsProcessingPayment(false);
        setErrorMsg(err.message || 'Payment processing error');
      }
    } else {
      // General Associate Free Registration
      const newApp = addApplication({
        serviceCategory: category,
        serviceTitleHi: `${getCategoryTitle(category)} (सामान्य सहयोगी - निःशुल्क)`,
        fullName: fullName.trim(),
        fatherOrHusbandName,
        motherName,
        dob,
        gender,
        mobile: cleanMobile,
        alternateMobile,
        email,
        address,
        village,
        district,
        state,
        pinCode,
        aadhaarNumber,
        photoUrl: photoPreview,
        aadhaarFrontUrl: aadhaarFrontPreview,
        aadhaarBackUrl: aadhaarBackPreview,
        description: `[सामान्य सहयोगी निःशुल्क] ${description}`,
        emergencyContact: emergencyContact || cleanMobile,
      });

      await recordIdCardOrder({
        orderId: `free_${Date.now()}`,
        tier: 'general_associate_free',
        applicantId: newApp.id,
        fullName: fullName.trim(),
        mobile: cleanMobile,
        email: email.trim() || undefined,
        serviceCategory: category,
        amountFee: 0,
        isPaid: false,
        adminApproved: false,
        cardIssued: false,
      });

      setPaymentInfo({
        amount: 0,
      });
      setSubmittedApp(newApp);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {language === 'en' ? 'Registration Form' : 'पंजीकरण फॉर्म'}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
          {getCategoryTitle(category)}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {settings.name} — {language === 'en' ? 'Application for Social Welfare, Shelter, Healthcare and Education Aid' : 'समाज सेवा, आश्रय, स्वास्थ्य एवं शिक्षा सहायता हेतु आवेदन'}
        </p>
      </div>

      {submittedApp ? (
        // Success View
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800">
              {t.form.appSubmittedSuccess}
            </h2>
            <p className="text-sm text-slate-600">
              {t.form.noteKeepSafe}
            </p>
          </div>

          {/* Application ID Card */}
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-900 font-bold uppercase tracking-wider">
                {t.form.applicationId}:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-400">
                ⏳ {language === 'en' ? 'Pending Approval' : 'प्रतीक्षारत (लंबित)'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-950 bg-white py-2 px-4 rounded-xl border border-amber-300 shadow-sm">
              {submittedApp.id}
            </div>
            <div className="text-xs text-slate-700 text-left space-y-1.5 pt-2 border-t border-amber-200">
              <div><strong>{t.form.fullName}:</strong> {submittedApp.fullName}</div>
              <div><strong>{t.form.requiredService}:</strong> {submittedApp.serviceTitleHi}</div>
              <div><strong>{t.form.mobile}:</strong> {submittedApp.mobile}</div>
              {paymentInfo?.paymentId && (
                <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-medium">
                  <span>विशेष सेवा शुल्क (Razorpay):</span>
                  <span className="font-mono font-bold">₹200 Paid ({paymentInfo.paymentId})</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-950 font-medium bg-amber-100/60 p-3 rounded-xl text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {language === 'en'
                    ? 'Smart ID Card Generation Locked'
                    : 'स्मार्ट पहचान पत्र जनरेशन सुरक्षित रूप से लॉक है'}
                </span>
              </div>
              <p className="leading-relaxed">
                {language === 'en'
                  ? 'Your application and service fee have been securely recorded. In accordance with Trust security protocols, active ID Card issuance and printing remain locked until authorized administration review and approval.'
                  : 'आपका आवेदन एवं सेवा शुल्क सफलतापूर्वक दर्ज हो गया है। ट्रस्ट नियमों के अनुसार, पहचान पत्र का जनरेशन व प्रिंट व्यवस्थापक द्वारा दस्तावेजों के भौतिक सत्यापन व स्वीकृति (Approval) के उपरांत ही जारी होगा।'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              disabled
              className="px-6 py-3 bg-slate-200 text-slate-500 font-bold text-sm rounded-xl border border-slate-300 shadow-none flex items-center gap-2 cursor-not-allowed opacity-80"
              title={language === 'en' ? 'Printing is locked until admin approves this application' : 'प्रिंट विकल्प व्यवस्थापक द्वारा स्वीकृति के बाद सक्रिय होगा'}
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>{language === 'en' ? 'Print 🔒 (Approval Required)' : 'प्रिंट 🔒 (स्वीकृति आवश्यक)'}</span>
            </button>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow transition-colors cursor-pointer"
            >
              {t.common.backToHome}
            </button>
            <button
              onClick={() => {
                setSubmittedApp(null);
                handleReset();
              }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Submit Another Application' : 'नया आवेदन करें'}
            </button>
          </div>
        </div>
      ) : (
        // Main Form
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-8"
        >
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Service Category Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'en' ? 'Select Required Service *' : 'सेवा का प्रकार चुनें *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'orphanage', label: t.nav.orphanage },
                { id: 'old_age', label: t.nav.oldAge },
                { id: 'widow', label: t.nav.widow },
                { id: 'education', label: t.nav.education },
                { id: 'medical', label: t.nav.medical },
                { id: 'social_welfare', label: t.nav.communityWelfare },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCategory(item.id as ServiceCategory)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    category === item.id
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Registration Tier & Smart ID Card Processing Fee Selector */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'en' ? 'Registration Tier & Smart ID Processing Fee *' : 'पंजीकरण श्रेणी एवं स्मार्ट पहचान पत्र शुल्क *'}
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {language === 'en' ? 'Razorpay Secure' : 'रेजरपे सुरक्षित'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Special Service Tier - ₹200 */}
              <div
                onClick={() => setRegistrationTier('special_service_200')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  registrationTier === 'special_service_200'
                    ? 'border-red-600 bg-red-50/40 shadow-md ring-2 ring-red-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {language === 'en' ? 'Special Service Registration' : 'विशेष सेवा पंजीकरण'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                        ₹200
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {language === 'en'
                        ? 'Includes official Smart PVC Card processing and priority verification.'
                        : 'स्मार्ट पीवीसी पहचान पत्र शुल्क एवं प्राथमिकता सत्यापन सम्मिलित।'}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="registrationTier"
                    checked={registrationTier === 'special_service_200'}
                    onChange={() => setRegistrationTier('special_service_200')}
                    className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px]">
                  <span className="font-semibold text-red-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Pay ₹200 via Razorpay' : 'रेजरपे से ₹200 ऑनलाइन'}</span>
                  </span>
                  <span className="text-slate-500 font-mono">Service Fee</span>
                </div>
              </div>

              {/* General Associate Tier - Free */}
              <div
                onClick={() => setRegistrationTier('general_associate_free')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  registrationTier === 'general_associate_free'
                    ? 'border-blue-900 bg-blue-50/40 shadow-md ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {language === 'en' ? 'General Associate Registration' : 'सामान्य सहयोगी पंजीकरण'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                        FREE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {language === 'en'
                        ? 'Standard associate record with standard administrative processing.'
                        : 'सामान्य सेवा सहयोगी रिकॉर्ड एवं सामान्य प्रशासनिक प्रक्रिया।'}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="registrationTier"
                    checked={registrationTier === 'general_associate_free'}
                    onChange={() => setRegistrationTier('general_associate_free')}
                    className="mt-1 w-4 h-4 text-blue-900 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px]">
                  <span className="font-semibold text-emerald-700">
                    {language === 'en' ? 'No Service Fee (₹0)' : 'निःशुल्क पंजीकरण (₹0)'}
                  </span>
                  <span className="text-slate-500 font-mono">Free Tier</span>
                </div>
              </div>
            </div>

            {/* Regulatory and Financial Separation Notice */}
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-[11px] text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Accounting Separation & Admin Authorization Notice:'
                    : 'लेखा पृथक्करण एवं व्यवस्थापक स्वीकृति सूचना:'}
                </span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-amber-900">
                {language === 'en'
                  ? '• The ₹200 fee is an administrative processing fee and is strictly separated from charitable donations. Paying the fee does NOT automatically generate or activate an ID Card; generation remains locked until authorized admin document approval.'
                  : '• ₹200 का शुल्क प्रशासनिक सेवा शुल्क है और इसे धर्मार्थ दान में नहीं जोड़ा जाता है। शुल्क भुगतान करने मात्र से पहचान पत्र जारी नहीं होता; पहचान पत्र जारी करने का अधिकार पूर्णतः ट्रस्ट व्यवस्थापक द्वारा जांच व स्वीकृति के अधीन रहेगा।'}
              </p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>1. {language === 'en' ? 'Personal Details' : 'व्यक्तिगत विवरण'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'en' ? 'Applicant full name' : 'आवेदक का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.fatherOrHusbandName} *
                </label>
                <input
                  type="text"
                  required
                  value={fatherOrHusbandName}
                  onChange={(e) => setFatherOrHusbandName(e.target.value)}
                  placeholder={language === 'en' ? 'Father or husband name' : 'पिता या पति का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.motherName}
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder={language === 'en' ? 'Mother name' : 'माता का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.form.dob} *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.form.gender} *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">{t.form.male}</option>
                    <option value="Female">{t.form.female}</option>
                    <option value="Other">{t.form.other}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>2. {language === 'en' ? 'Contact & Address' : 'संपर्क एवं पता'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.mobile} *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={language === 'en' ? '10-digit mobile number' : '10 अंकों का मोबाइल नंबर'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.alternateMobile}
                </label>
                <input
                  type="tel"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  placeholder={language === 'en' ? 'Alternate phone' : 'अन्य संपर्क नंबर'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.address} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'en' ? 'House number, street, landmark' : 'मकान नंबर, मोहल्ला, डाकघर'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.village} *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={language === 'en' ? 'Village / Town' : 'ग्राम या कस्बा'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.district} *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={language === 'en' ? 'Nalanda' : 'नालंदा'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.state} *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={language === 'en' ? 'Bihar' : 'बिहार'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.pinCode} *
                </label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="803116"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Details & Documents */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>3. {language === 'en' ? 'Requirement & Verification Details' : 'आवश्यकता एवं पहचान विवरण'}</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.problemOrRequirement} *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.form.problemPlaceholder}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.aadhaarNumber}
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.emergencyContact} *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder={language === 'en' ? 'Relative / Neighbor name and phone' : 'रिश्तेदार या पड़ोसी का नाम व मोबाइल'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Uploads Section: Photo + Aadhaar Front + Aadhaar Back */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {language === 'en' ? 'Upload Documents & Photo' : 'फोटो एवं आधार कार्ड अपलोड'}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Photo Upload */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      {t.form.photo}
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white text-center transition-colors">
                      <Upload className="w-5 h-5 text-blue-700 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">{t.form.uploadPhoto}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{t.form.photoHelpText}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoPreview && (
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm">
                        <img src={photoPreview} alt="Photo Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoPreview('')}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                          title={language === 'en' ? 'Remove' : 'हटाएं'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. Aadhaar Card Front Side */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>{t.form.aadhaarFront}</span>
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white text-center transition-colors">
                      <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">{t.form.uploadAadhaarFront}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{t.form.aadhaarFrontHelpText}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAadhaarFrontUpload}
                        className="hidden"
                      />
                    </label>
                    {aadhaarFrontPreview && (
                      <div className="relative w-28 h-18 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm bg-white flex items-center justify-center">
                        <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAadhaarFrontPreview('')}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                          title={language === 'en' ? 'Remove' : 'हटाएं'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Aadhaar Card Back Side */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>{t.form.aadhaarBack}</span>
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white text-center transition-colors">
                      <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">{t.form.uploadAadhaarBack}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{t.form.aadhaarBackHelpText}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAadhaarBackUpload}
                        className="hidden"
                      />
                    </label>
                    {aadhaarBackPreview && (
                      <div className="relative w-28 h-18 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm bg-white flex items-center justify-center">
                        <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAadhaarBackPreview('')}
                          className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                          title={language === 'en' ? 'Remove' : 'हटाएं'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                {t.form.serviceDeclarationText}
              </span>
            </label>
          </div>

          {/* Submit and Reset buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isProcessingPayment}
              className={`w-full sm:flex-1 py-3.5 px-6 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                registrationTier === 'special_service_200'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white'
                  : 'bg-blue-900 hover:bg-blue-950 text-white'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {language === 'en'
                      ? 'Connecting to Razorpay...'
                      : 'रेजरपे गेटवे से संपर्क हो रहा है...'}
                  </span>
                </>
              ) : registrationTier === 'special_service_200' ? (
                <>
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Proceed to Pay ₹200 via Razorpay & Submit'
                      : 'रेजरपे द्वारा ₹200 भुगतान करें एवं सबमिट करें'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t.common.submitApplication}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.common.resetForm}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
