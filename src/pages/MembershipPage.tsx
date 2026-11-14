import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { MembershipApplication } from '../types';
import { openRazorpayCheckout } from '../lib/razorpayClient';
import { SupabaseService } from '../lib/supabaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { SafeImage } from '../components/SafeImage';
import {
  buildMemberIdCard,
  downloadIdCardDirectPdf,
  printIdCardDirect,
} from '../utils/idCardHelper';
import {
  Award,
  CheckCircle,
  ShieldCheck,
  CreditCard,
  Mail,
  User,
  Phone,
  MapPin,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  Printer,
  Search,
  Lock,
  Sparkles,
  BadgeCheck,
  RotateCcw,
  IdCard as IdCardIcon,
  Download,
} from 'lucide-react';

const FIXED_MEMBERSHIP_FEE = 5000;

export const MembershipPage: React.FC = () => {
  const { language, settings, setActiveReceipt } = useTrust();

  // Application Form Fields
  const [fullName, setFullName] = useState('');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('नालंदा');
  const [stateName, setStateName] = useState('बिहार');
  const [pinCode, setPinCode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [qualification, setQualification] = useState('');
  const [panCard, setPanCard] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(true);

  // Payment & Submission States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentFailed, setPaymentFailed] = useState<string | null>(null);
  const [confirmedMembership, setConfirmedMembership] = useState<MembershipApplication | null>(null);

  // Public Membership & Receipt Lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<MembershipApplication | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const handleDownloadMemberIdCard = async (member: MembershipApplication) => {
    setIsGeneratingCard(true);
    try {
      const card = buildMemberIdCard(member);
      await downloadIdCardDirectPdf(
        card,
        'both',
        settings,
        language,
        null,
        `LKST-Member-IDCard-${card.cardNumber}.pdf`
      );
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handlePrintMemberIdCard = async (member: MembershipApplication) => {
    setIsGeneratingCard(true);
    try {
      const card = buildMemberIdCard(member);
      await printIdCardDirect(card, 'both', settings, language);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 420, 480, 0.72);
      if (compressed.length > 420000) {
        const ultraCompressed = await compressImageFile(file, 320, 360, 0.58);
        setPhotoUrl(ultraCompressed);
      } else {
        setPhotoUrl(compressed);
      }
    } catch {
      setErrorMsg(
        language === 'en'
          ? 'Could not process the uploaded photo. Please choose another image.'
          : 'फोटो प्रोसेस करने में समस्या आई। कृपया दूसरी फोटो चुनें।'
      );
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setFatherOrHusbandName('');
    setDob('');
    setGender('Male');
    setMobile('');
    setEmail('');
    setAddress('');
    setDistrict('नालंदा');
    setStateName('बिहार');
    setPinCode('');
    setOccupation('');
    setQualification('');
    setPanCard('');
    setAadhaarNumber('');
    setPhotoUrl('');
    setConfirmedMembership(null);
    setErrorMsg('');
    setPaymentFailed(null);
  };

  const handleApplyAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentFailed(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg(
        language === 'en' ? 'Please enter applicant full name.' : 'कृपया आवेदक का पूरा नाम दर्ज करें।'
      );
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid email address for membership receipt delivery.'
          : 'ईमेल पर रसीद प्राप्त करने के लिए कृपया मान्य ईमेल पता दर्ज करें।'
      );
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter your complete postal address.'
          : 'कृपया अपना पूरा डाक पता दर्ज करें।'
      );
      return;
    }

    if (pinCode.trim() && !/^\d{6}$/.test(pinCode.trim())) {
      setErrorMsg(
        language === 'en' ? 'PIN code must be 6 digits.' : 'पिन कोड 6 अंकों का होना चाहिए।'
      );
      return;
    }

    if (panCard.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panCard.trim())) {
      setErrorMsg(
        language === 'en'
          ? 'Invalid PAN format (e.g., ABCDE1234F).'
          : 'अमान्य पैन नंबर प्रारूप (उदाहरण: ABCDE1234F)।'
      );
      return;
    }

    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (aadhaarNumber.trim() && cleanAadhaar.length !== 12) {
      setErrorMsg(
        language === 'en'
          ? 'Aadhaar number must be 12 digits.'
          : 'आधार संख्या 12 अंकों की होनी चाहिए।'
      );
      return;
    }

    if (!acceptedDeclaration) {
      setErrorMsg(
        language === 'en'
          ? 'Please accept the Trust Membership Declaration.'
          : 'कृपया ट्रस्ट सदस्यता घोषणा पर सहमति दें।'
      );
      return;
    }

    setIsProcessing(true);

    const applicantDetails = {
      fullName: fullName.trim(),
      fatherOrHusbandName: fatherOrHusbandName.trim(),
      dob: dob.trim(),
      gender,
      mobile: cleanMobile,
      email: email.trim().toLowerCase(),
      address: address.trim(),
      district: district.trim(),
      state: stateName.trim(),
      pinCode: pinCode.trim(),
      occupation: occupation.trim(),
      qualification: qualification.trim(),
      panCard: panCard.trim().toUpperCase(),
      aadhaarNumber: cleanAadhaar,
      photoUrl: photoUrl || '',
      membershipType: 'Life Member',
    };

    try {
      await openRazorpayCheckout({
        amount: FIXED_MEMBERSHIP_FEE,
        purpose: 'membership',
        donorName: applicantDetails.fullName,
        contact: cleanMobile,
        email: applicantDetails.email,
        address: applicantDetails.address,
        causeOrService: 'Luv Kush Seva Trust Life Membership Fee (₹5,000)',
        applicantDetails,
        notes: {
          membershipType: 'Life Member',
          district: applicantDetails.district,
          state: applicantDetails.state,
        },
        onSuccess: (paymentResult) => {
          setIsProcessing(false);
          const confirmedRecord: MembershipApplication = {
            id: paymentResult.orderId,
            membershipNumber: paymentResult.membershipNumber || undefined,
            receiptNumber: paymentResult.receiptNumber,
            fullName: applicantDetails.fullName,
            fatherOrHusbandName: applicantDetails.fatherOrHusbandName || undefined,
            dob: applicantDetails.dob || undefined,
            gender: applicantDetails.gender,
            mobile: cleanMobile,
            email: applicantDetails.email,
            address: applicantDetails.address,
            district: applicantDetails.district || undefined,
            state: applicantDetails.state || undefined,
            pinCode: applicantDetails.pinCode || undefined,
            aadhaarNumber: applicantDetails.aadhaarNumber || undefined,
            panCard: applicantDetails.panCard || undefined,
            occupation: applicantDetails.occupation || undefined,
            qualification: applicantDetails.qualification || undefined,
            photoUrl: applicantDetails.photoUrl || undefined,
            membershipType: 'Life Member',
            feeAmount: FIXED_MEMBERSHIP_FEE,
            paymentStatus: 'Paid',
            status: 'Confirmed',
            razorpayOrderId: paymentResult.razorpay_order_id,
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            paymentMode: 'Razorpay',
            paidAt: new Date().toISOString(),
            receiptEmailSent: Boolean(paymentResult.emailSent),
            receiptEmailSentAt: paymentResult.emailSent ? new Date().toISOString() : undefined,
            auditStatus: 'Pending Audit',
            createdAt: new Date().toISOString(),
          };
          setConfirmedMembership(confirmedRecord);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setPaymentFailed(
            err?.description ||
              err?.message ||
              (language === 'en'
                ? 'Membership payment failed or could not be verified. Please retry.'
                : 'सदस्यता भुगतान असफल रहा या सत्यापित नहीं हो सका। कृपया पुनः प्रयास करें।')
          );
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentFailed(
        err?.message ||
          (language === 'en'
            ? 'Unable to launch Razorpay checkout.'
            : 'रेजरपे पेमेंट गेटवे शुरू नहीं हो सका।')
      );
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    const cleanQ = lookupQuery.trim();
    if (cleanQ.length < 6) {
      setLookupError(
        language === 'en'
          ? 'Enter complete Membership Number, Receipt Number, 10-digit Mobile, or Payment ID.'
          : 'कृपया पूर्ण सदस्यता संख्या, रसीद संख्या, 10 अंकों का मोबाइल नंबर या पेमेंट ID दर्ज करें।'
      );
      return;
    }

    setIsLookingUp(true);
    try {
      const found = await SupabaseService.lookupConfirmedMembership(cleanQ);
      if (!found) {
        setLookupError(
          language === 'en'
            ? 'No confirmed paid membership found for that exact query.'
            : 'इस विवरण से कोई पुष्ट (Confirmed) सदस्यता रिकॉर्ड नहीं मिला।'
        );
      } else {
        setLookupResult(found);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>
                {language === 'en'
                  ? 'Official Trust Membership Portal'
                  : 'आधिकारिक ट्रस्ट सदस्यता पोर्टल'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {language === 'en'
                ? 'Become a Life Member of Luv Kush Seva Trust'
                : 'लव कुश सेवा ट्रस्ट के आजीवन सदस्य बनें'}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {language === 'en'
                ? 'Join hands with our social welfare mission. Complete the membership form and pay the fixed ₹5,000 membership contribution via Razorpay to receive instant confirmation & automated email receipt.'
                : 'समाज सेवा के इस पुनीत मिशन से स्थायी रूप से जुड़ें। सदस्यता आवेदन फॉर्म भरें और ₹5,000 शुल्क का सुरक्षित रेजरपे भुगतान करें — भुगतान सफल होते ही ईमेल द्वारा आधिकारिक रसीद एवं सदस्यता संख्या प्राप्त होगी।'}
            </p>
          </div>

          {/* Fixed Fee Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-amber-400/40 rounded-2xl p-5 text-center shrink-0 min-w-[230px] shadow-lg">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300 block">
              {language === 'en' ? 'Fixed Life Membership Fee' : 'निर्धारित आजीवन सदस्यता शुल्क'}
            </span>
            <div className="text-4xl font-black text-white font-mono mt-1">₹ 5,000</div>
            <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Instant Receipt + Email Confirmation' : 'तुरंत रसीद + ईमेल पुष्टि'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Screen after Successful Payment */}
      {confirmedMembership && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {language === 'en' ? 'Membership Confirmed!' : 'सदस्यता सफलतापूर्वक पुष्ट हुई!'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {language === 'en'
                    ? `Welcome, ${confirmedMembership.fullName}`
                    : `हार्दिक स्वागत है, ${confirmedMembership.fullName} जी`}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveReceipt({ type: 'membership', data: confirmedMembership })
                }
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {language === 'en' ? 'Download / Print Receipt' : 'रसीद डाउनलोड / प्रिंट करें'}
                </span>
              </button>

              <button
                type="button"
                disabled={isGeneratingCard}
                onClick={() => handleDownloadMemberIdCard(confirmedMembership)}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingCard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IdCardIcon className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {language === 'en' ? 'Download Member ID Card' : 'सदस्य ID कार्ड डाउनलोड करें'}
                </span>
              </button>

              <button
                type="button"
                disabled={isGeneratingCard}
                onClick={() => handlePrintMemberIdCard(confirmedMembership)}
                className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'en' ? 'Print ID Card' : 'ID कार्ड प्रिंट'}</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'New Application' : 'नया आवेदन करें'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {language === 'en' ? 'Membership Number' : 'सदस्यता संख्या'}
              </span>
              <strong className="text-sm font-mono font-black text-blue-900">
                {confirmedMembership.membershipNumber || 'CONFIRMED'}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {language === 'en' ? 'Receipt Number' : 'रसीद संख्या'}
              </span>
              <strong className="text-sm font-mono font-black text-slate-900">
                {confirmedMembership.receiptNumber}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {language === 'en' ? 'Razorpay Payment ID' : 'रेजरपे पेमेंट ID'}
              </span>
              <strong className="text-xs font-mono font-bold text-emerald-800">
                {confirmedMembership.razorpayPaymentId}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {language === 'en' ? 'Email Receipt Status' : 'ईमेल रसीद स्थिति'}
              </span>
              <strong className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>
                  {confirmedMembership.receiptEmailSent
                    ? language === 'en'
                      ? `Sent to ${confirmedMembership.email}`
                      : `${confirmedMembership.email} पर भेजा गया`
                    : language === 'en'
                    ? `Dispatched to ${confirmedMembership.email}`
                    : `${confirmedMembership.email} पर प्रक्रियाधीन`}
                </span>
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Application Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base sm:text-lg">
                {language === 'en'
                  ? 'Life Membership Application Form'
                  : 'आजीवन सदस्यता आवेदन पत्र'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
              ₹5,000 Fee
            </span>
          </div>

          <form onSubmit={handleApplyAndPay} className="p-6 space-y-5 text-xs sm:text-sm">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {paymentFailed && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentFailed}</span>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-sm">
                <User className="w-4 h-4 text-blue-900" />
                <span>{language === 'en' ? 'Personal Information' : 'व्यक्तिगत विवरण'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Full Name *' : 'आवेदक का पूरा नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Rajesh Kumar' : 'उदा. राजेश कुमार'}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? "Father's / Husband's Name *" : 'पिता / पति का नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherOrHusbandName}
                    onChange={(e) => setFatherOrHusbandName(e.target.value)}
                    placeholder={language === 'en' ? "Father / Husband's Name" : 'पिता या पति का नाम'}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Date of Birth' : 'जन्म तिथि'}
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Gender *' : 'लिंग *'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Male">{language === 'en' ? 'Male' : 'पुरुष (Male)'}</option>
                    <option value="Female">{language === 'en' ? 'Female' : 'महिला (Female)'}</option>
                    <option value="Other">{language === 'en' ? 'Other' : 'अन्य (Other)'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-sm">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>{language === 'en' ? 'Contact & Address' : 'संपर्क एवं पता'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? '10-Digit Mobile Number *' : 'मोबाइल नंबर (10 अंक) *'}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en'
                      ? 'Email Address (For Official Receipt) *'
                      : 'ईमेल पता (रसीद व पुष्टि हेतु) *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Complete Postal Address *' : 'पूरा डाक पता *'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Village / Mohalla, Post, Police Station...'
                        : 'ग्राम / मोहल्ला, पोस्ट, थाना...'
                    }
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'District *' : 'जिला *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'State *' : 'राज्य *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'PIN Code' : 'पिन कोड'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="803116"
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* KYC, Occupation & Optional Photo */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>
                  {language === 'en'
                    ? 'Profession, KYC & Photo (Optional)'
                    : 'व्यवसाय, पहचान विवरण व फोटो'}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Occupation / Business' : 'व्यवसाय / कार्यक्षेत्र'}
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Teacher / Business' : 'उदा. शिक्षक / समाजसेवा / व्यवसाय'}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Educational Qualification' : 'शैक्षणिक योग्यता'}
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Graduate' : 'उदा. स्नातक / इंटरमीडिएट'}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'PAN Card (Optional)' : 'पैन कार्ड नंबर (वैकल्पिक)'}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panCard}
                    onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3.5 py-2.5 text-xs font-mono uppercase border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Aadhaar Number (Optional)' : 'आधार संख्या (वैकल्पिक)'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="12-digit UIDAI"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en'
                      ? 'Applicant Passport Photo (Optional)'
                      : 'पासपोर्ट साइज फोटो अपलोड करें (वैकल्पिक)'}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer">
                      {isCompressingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-blue-800" />
                      )}
                      <span>{language === 'en' ? 'Choose Photo' : 'फोटो चुनें'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoUrl && (
                      <div className="flex items-center gap-2">
                        <SafeImage
                          src={photoUrl}
                          alt="Applicant Preview"
                          className="w-12 h-14 rounded-lg object-cover border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          {language === 'en' ? 'Remove' : 'हटाएं'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <label className="flex items-start gap-2.5 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedDeclaration}
                onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-900"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                {language === 'en'
                  ? `I hereby apply for Life Membership of ${settings.name} (Reg. ${settings.registrationNumber}) and declare that the details provided are accurate. I agree to pay the fixed membership fee of ₹5,000 via Razorpay.`
                  : `मैं घोषणा करता/करती हूँ कि मेरे द्वारा दी गई सभी जानकारी पूर्णतः सत्य है। मैं ${settings.nameHi} (पंजी. ${settings.registrationNumber}) के नियमों का पालन करते हुए आजीवन सदस्यता हेतु ₹5,000 शुल्क भुगतान करने के लिए सहमत हूँ।`}
              </span>
            </label>

            {/* Fixed Fee Summary + Pay Button */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                  {language === 'en' ? 'Total Payable Membership Fee' : 'कुल देय सदस्यता शुल्क'}
                </span>
                <div className="text-2xl font-black font-mono text-white">₹ 5,000 /-</div>
                <span className="text-[10.5px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>
                    {language === 'en'
                      ? 'Secured by Razorpay (UPI, Cards, NetBanking)'
                      : 'रेजरपे द्वारा 100% सुरक्षित (UPI, कार्ड, नेटबैंकिंग)'}
                  </span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing || isCompressingPhoto}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Opening Razorpay...' : 'पेमेंट खुल रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {language === 'en'
                        ? 'Pay ₹5,000 & Confirm Membership'
                        : '₹5,000 भुगतान करें व सदस्य बनें'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Benefits + Membership Receipt Verification */}
        <div className="lg:col-span-4 space-y-6">
          {/* Benefits Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-base">
                {language === 'en' ? 'Membership Benefits' : 'सदस्यता के लाभ व विशेषताएं'}
              </h3>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'en'
                    ? 'Official Life Membership ID Number (LKST-MEM-...) & Printable Receipt.'
                    : 'आधिकारिक आजीवन सदस्यता संख्या (LKST-MEM-...) एवं तुरंत प्रिंट योग्य रसीद।'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'en'
                    ? 'Automatic Email Receipt & Confirmation sent immediately after payment.'
                    : 'भुगतान सफल होते ही आपके ईमेल पर स्वतः आधिकारिक रसीद एवं पुष्टि पत्र।'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'en'
                    ? '100% transparent Supabase ledger & Trust Admin Audit verification.'
                    : 'Supabase डेटाबेस में सुरक्षित रिकॉर्ड और एडमिन द्वारा पूर्ण ऑडिट पारदर्शिता।'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'en'
                    ? 'Invitation & participation in annual Trust Welfare Meetings & Social Drives.'
                    : 'ट्रस्ट के वार्षिक सेवा सम्मेलनों, शिक्षा व चिकित्सा शिविरों में सक्रिय भागीदारी।'}
                </span>
              </li>
            </ul>
          </div>

          {/* Membership Verification / Receipt Lookup */}
          <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base">
                {language === 'en'
                  ? 'Verify Membership / Download Receipt'
                  : 'सदस्यता सत्यापन / रसीद खोजें'}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'en'
                ? 'Search using Membership Number, Receipt Number, 10-digit Mobile, or Payment ID.'
                : 'सदस्यता संख्या, रसीद संख्या, 10 अंकों का मोबाइल नंबर या पेमेंट ID दर्ज कर जांचें।'}
            </p>

            <form onSubmit={handleLookup} className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="LKST-MEM-... / 9876543210 / pay_..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLookingUp}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLookingUp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{language === 'en' ? 'Verify & Fetch Receipt' : 'सत्यापित करें व रसीद देखें'}</span>
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {lookupError}
              </div>
            )}

            {lookupResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-blue-900">
                    {lookupResult.membershipNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    ✓ {lookupResult.status}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{lookupResult.fullName}</div>
                <div className="text-slate-600 font-mono text-[11px]">
                  Mobile: {lookupResult.mobile} • ₹{Number(lookupResult.feeAmount || 5000).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-600">
                  Audit: <strong>{lookupResult.auditStatus}</strong>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveReceipt({ type: 'membership', data: lookupResult })}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Official Receipt' : 'आधिकारिक रसीद'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingCard}
                    onClick={() => handleDownloadMemberIdCard(lookupResult)}
                    className="w-full py-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'en' ? 'Member ID Card' : 'सदस्य ID कार्ड'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
