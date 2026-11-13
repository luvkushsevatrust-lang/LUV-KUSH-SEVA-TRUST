import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Heart,
  CreditCard,
  Check,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  Download,
  Search,
  X,
  Lock,
  ShieldCheck,
  Smartphone,
  Building2,
  FileText,
  BadgeCheck,
  Sparkles,
  Loader2,
  Copy,
  Printer,
  RefreshCw,
  Home,
  MapPin,
  Mail,
  User,
  Phone,
} from 'lucide-react';
import { Donation } from '../types';
import { openRazorpayCheckout } from '../lib/razorpayClient';
import { SupabaseService } from '../lib/supabaseService';

export const DONATION_PURPOSES = [
  {
    id: 'food_distribution',
    labelHi: '1. Food Distribution (अन्नदान एवं भोजन वितरण)',
    labelEn: '1. Food Distribution',
  },
  {
    id: 'medical_camps',
    labelHi: '2. Medical Camps (निःशुल्क चिकित्सा एवं स्वास्थ्य शिविर)',
    labelEn: '2. Medical Camps',
  },
  {
    id: 'education_support',
    labelHi: '3. Education Support (गरीब बच्चों की शिक्षा सहायता)',
    labelEn: '3. Education Support',
  },
  {
    id: 'old_age_home',
    labelHi: '4. वृद्धाश्रम सहायता (Old Age Home Care)',
    labelEn: '4. वृद्धाश्रम सहायता',
  },
  {
    id: 'general_donation',
    labelHi: '5. General Donation (सामान्य धर्मार्थ एवं जनकल्याण)',
    labelEn: '5. General Donation',
  },
];

export const DonationPage: React.FC = () => {
  const {
    settings,
    recordRazorpayDonation,
    setActiveReceipt,
    language,
    t,
    setCurrentPage,
    donations,
  } = useTrust();

  // Preset Amounts
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Required Form Fields (Phase 3)
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [purpose, setPurpose] = useState('1. Food Distribution (अन्नदान एवं भोजन वितरण)');
  const [message, setMessage] = useState('');
  const [panCard, setPanCard] = useState('');

  // Processing & Result States (Phase 9: Success, Failure, Pending)
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingPending, setIsVerifyingPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentFailed, setPaymentFailed] = useState<{
    message: string;
    description?: string;
  } | null>(null);
  const [submittedDonation, setSubmittedDonation] = useState<Donation | null>(null);
  const [copiedReceiptNo, setCopiedReceiptNo] = useState(false);

  // Search & Download Past Approved Receipts Modal
  const [showDownloadReceiptModal, setShowDownloadReceiptModal] = useState(false);
  const [searchReceiptQuery, setSearchReceiptQuery] = useState('');
  const [searchedDonation, setSearchedDonation] = useState<Donation | null>(null);
  const [searchStatusMsg, setSearchStatusMsg] = useState<{
    text: string;
    type: 'error' | 'info' | 'pending' | 'success';
  } | null>(null);

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleSelectAmount = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
    setErrorMsg('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setErrorMsg('');
  };

  const handleSearchReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawQuery = searchReceiptQuery.trim();
    const q = rawQuery.toLowerCase();
    if (!q || q.length < 6) {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'Please enter your complete receipt number, 10-digit mobile number, or Razorpay payment ID.'
            : 'कृपया पूर्ण रसीद संख्या, 10 अंकों का मोबाइल नंबर या रेजरपे पेमेंट आईडी दर्ज करें।',
        type: 'error',
      });
      return;
    }

    // 1. Check secure exact-match lookup API / Supabase RPC first
    let found = await SupabaseService.lookupApprovedReceipt(rawQuery);

    // 2. Fallback to current browser session donations if completed just now
    if (!found) {
      found =
        donations.find(
          (d) =>
            d.receiptNumber.toLowerCase() === q ||
            d.mobile === rawQuery.replace(/\D/g, '') ||
            (d.transactionId && d.transactionId.toLowerCase() === q) ||
            (d.razorpayPaymentId && d.razorpayPaymentId.toLowerCase() === q)
        ) || null;
    }

    if (!found) {
      setSearchedDonation(null);
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'No approved donation record found for that exact receipt number, mobile number, or payment ID.'
            : 'इस रसीद संख्या, मोबाइल नंबर या पेमेंट आईडी से कोई स्वीकृत दान रिकॉर्ड नहीं मिला।',
        type: 'error',
      });
      return;
    }

    setSearchedDonation(found);
    const isAppr = found.status === 'Approved' || found.isVerified;

    if (isAppr) {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? '✓ Your donation is officially Approved! Click the download button below.'
            : '✓ आपका दान आधिकारिक रूप से स्वीकृत है! रसीद डाउनलोड करने हेतु नीचे दिए गए बटन पर क्लिक करें।',
        type: 'success',
      });
    } else {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? '⏳ This donation is under verification. Please wait for approval.'
            : '⏳ यह दान वर्तमान में सत्यापन प्रक्रियाधीन है।',
        type: 'pending',
      });
    }
  };

  /**
   * Razorpay Checkout Handler (Exclusive Online Gateway)
   * Validates all required fields and prevents duplicate payments.
   */
  const handleRazorpayPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentFailed(null);

    // 1. Amount validation
    if (!effectiveAmount || effectiveAmount < 1) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid donation amount (minimum ₹1).'
          : 'कृपया न्यूनतम ₹1 या अधिक की सहयोग राशि चुनें।'
      );
      return;
    }

    // 2. Full Name validation
    if (!donorName.trim()) {
      setErrorMsg(
        language === 'en' ? 'Please enter your full name.' : 'कृपया अपना पूरा नाम दर्ज करें।'
      );
      return;
    }

    // 3. Mobile validation (10 digits)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    // 4. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid email address for receipt delivery.'
          : 'कृपया रसीद प्राप्त करने हेतु मान्य ईमेल पता दर्ज करें।'
      );
      return;
    }

    // 5. Full Address validation
    if (!address.trim() || address.trim().length < 5) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter your complete postal address.'
          : 'कृपया अपना पूरा डाक पता दर्ज करें।'
      );
      return;
    }

    // 6. Optional PAN validation
    if (panCard.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panCard.trim())) {
      setErrorMsg(
        language === 'en'
          ? 'Invalid PAN format. Example: ABCDE1234F'
          : 'अमान्य पैन कार्ड नंबर प्रारूप। उदाहरण: ABCDE1234F'
      );
      return;
    }

    setIsProcessing(true);

    try {
      await openRazorpayCheckout({
        amount: effectiveAmount,
        purpose: 'donation',
        donorName: donorName.trim(),
        contact: cleanMobile,
        email: email.trim(),
        address: address.trim(),
        panCard: panCard.trim().toUpperCase() || undefined,
        notes: {
          purpose,
          address: address.trim(),
          message: message.trim() || 'Luv Kush Seva Trust Charitable Donation',
        },
        onSuccess: (verifyResult) => {
          setIsProcessing(false);
          setIsVerifyingPending(false);

          // Record instant approved donation with official verified receipt
          const newDon = recordRazorpayDonation({
            donorName: donorName.trim(),
            mobile: cleanMobile,
            email: email.trim(),
            address: address.trim(),
            panCard: panCard.trim().toUpperCase() || undefined,
            amount: effectiveAmount,
            orderId: verifyResult.orderId,
            paymentId: verifyResult.paymentId,
            purpose,
            receiptNumber: verifyResult.receiptNumber,
          });

          setSubmittedDonation(newDon);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setIsVerifyingPending(false);
          const failureDesc =
            err?.description ||
            err?.message ||
            (language === 'en'
              ? 'Payment was cancelled or could not be completed.'
              : 'भुगतान रद्द कर दिया गया या पूरा नहीं हो सका।');

          setPaymentFailed({
            message:
              language === 'en'
                ? 'Payment Failed / Cancelled'
                : 'भुगतान असफल / रद्द हुआ',
            description: failureDesc,
          });
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setIsVerifyingPending(false);
      setErrorMsg(
        err.message ||
          (language === 'en'
            ? 'Failed to connect to payment gateway.'
            : 'गेटवे से संपर्क करने में असमर्थ। कृपया पुनः प्रयास करें।')
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Headline Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {language === 'en'
              ? 'Official Online Donation Gateway • 100% Secure via Razorpay'
              : 'अधिकृत ऑनलाइन दान पोर्टल • रेजरपे द्वारा 100% सुरक्षित भुगतान'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          {t.donation.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          "{t.donation.subtitle}"
        </p>

        {/* Quick Receipt Download Bar for Past Approved Donations */}
        <div className="pt-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 rounded-2xl shadow-xs text-xs">
            <span className="font-bold text-emerald-900 px-2 flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Already donated online? Download your verified receipt:'
                  : 'पहले ऑनलाइन दान कर चुके हैं? यहाँ से प्रमाणित रसीद डाउनलोड करें:'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowDownloadReceiptModal(true);
                setSearchStatusMsg(null);
                setSearchedDonation(null);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-transform hover:scale-102 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {language === 'en' ? 'Download Approved Receipt' : 'स्वीकृत रसीद डाउनलोड करें'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 9: RESULT SCREENS */}

      {/* 1. SUCCESS SCREEN */}
      {submittedDonation ? (
        (() => {
          const liveDonation =
            donations.find((d) => d.id === submittedDonation.id) || submittedDonation;

          return (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'Payment Verified & Approved'
                      : 'रेजरपे भुगतान सत्यापित एवं स्वीकृत'}
                  </span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-900">
                  {language === 'en'
                    ? 'Thank You for Your Generous Donation!'
                    : 'आपके अमूल्य दान सहयोग हेतु हार्दिक धन्यवाद!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {language === 'en'
                    ? 'Your donation has been verified server-side. Your contribution will directly support our charitable welfare initiatives.'
                    : 'आपका दान सर्वर द्वारा सत्यापित हो चुका है। आपका यह सहयोग दीन-दुखियों, बच्चों एवं वृद्धों की सेवा में उपयोग होगा।'}
                </p>
              </div>

              {/* Donation Key Details Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Receipt Number:' : 'रसीद संख्या:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-900 font-black text-sm">
                      {liveDonation.receiptNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(liveDonation.receiptNumber);
                        setCopiedReceiptNo(true);
                        setTimeout(() => setCopiedReceiptNo(false), 2000);
                      }}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                      title={language === 'en' ? 'Copy Receipt No' : 'रसीद नंबर कॉपी करें'}
                    >
                      {copiedReceiptNo ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Donor Name:' : 'दानदाता का नाम:'}
                  </span>
                  <span className="font-bold text-slate-900">{liveDonation.donorName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Donation Amount:' : 'दान राशि:'}
                  </span>
                  <span className="text-emerald-700 font-black text-base font-mono">
                    ₹{Number(liveDonation.amount || 0).toLocaleString('en-IN')} /-
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Donation Purpose:' : 'दान का उद्देश्य:'}
                  </span>
                  <span className="font-medium text-slate-800 text-right max-w-[240px]">
                    {liveDonation.message}
                  </span>
                </div>

                {liveDonation.address && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">
                      {language === 'en' ? 'Address:' : 'डाक पता:'}
                    </span>
                    <span className="text-slate-800 text-right max-w-[240px]">
                      {liveDonation.address}
                    </span>
                  </div>
                )}

                {liveDonation.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">
                      {language === 'en' ? 'Razorpay Payment ID:' : 'रेजरपे पेमेंट ID:'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold text-[11px]">
                      {liveDonation.razorpayPaymentId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Status:' : 'स्थिति:'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {language === 'en' ? 'SUCCESSFUL & VERIFIED' : 'सफल एवं सत्यापित'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Receipt Actions: Download & Print */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveReceipt({ type: 'donation', data: liveDonation })}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Download & View Official Receipt (PDF / Print)'
                      : 'आधिकारिक रसीद डाउनलोड करें (PDF / Print)'}
                  </span>
                </button>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedDonation(null);
                      setCustomAmount('');
                      setSelectedAmount(1000);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{language === 'en' ? '← Make Another Donation' : '← नया दान करें'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('home')}
                    className="px-4 py-2 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Back to Home' : 'मुख्य पृष्ठ पर जाएँ'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : paymentFailed ? (
        /* 2. FAILURE SCREEN */
        <div className="bg-white rounded-3xl border-2 border-red-400 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-xl mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-red-800 bg-red-50 border border-red-300 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <span>Payment Not Completed</span>
            </span>
            <h2 className="text-2xl font-black text-red-900">
              {paymentFailed.message}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {paymentFailed.description}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 text-left space-y-1">
            <p className="font-bold">
              {language === 'en' ? 'No money deducted?' : 'क्या पैसे कट गए?'}
            </p>
            <p>
              {language === 'en'
                ? 'If amount was debited from your bank, Razorpay will automatically reconcile and auto-refund within 3-5 banking days, or contact our support.'
                : 'यदि आपके खाते से राशि कट गई है, तो रेजरपे द्वारा 3-5 कार्यदिवसों में स्वतः रीफंड आ जाएगा या ट्रस्ट हेल्पलाइन से संपर्क करें।'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaymentFailed(null)}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'en' ? 'Try Again' : 'पुनः प्रयास करें'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{language === 'en' ? 'Back to Home' : 'मुख्य पृष्ठ पर जाएँ'}</span>
            </button>
          </div>
        </div>
      ) : isVerifyingPending ? (
        /* 3. PENDING SCREEN */
        <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-xl mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-amber-900">
              {language === 'en' ? 'Verifying Payment...' : 'भुगतान सत्यापन जारी है...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {language === 'en'
                ? 'Please do not refresh or close the page. We are securely verifying your transaction signature with Razorpay.'
                : 'कृपया पृष्ठ को रीफ्रेश न करें। रेजरपे के साथ आपके भुगतान का सत्यापन किया जा रहा है।'}
            </p>
          </div>
        </div>
      ) : (
        /* PHASE 3: UPGRADED DONATION FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Razorpay Assurance & Real-time Donation Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Donation Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5 border border-blue-800/40 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-blue-800/50 pb-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Donation Summary' : 'दान विवरण सारांश'}
                  </span>
                  <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span className="text-blue-400">Razorpay</span>
                    <span className="text-xs bg-blue-800/60 text-blue-200 px-2 py-0.5 rounded-full border border-blue-600/40 font-mono">
                      100% SECURE
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Lock className="w-5 h-5 text-amber-300" />
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  {language === 'en' ? 'Total Amount:' : 'कुल सहयोग राशि:'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  ₹{effectiveAmount ? effectiveAmount.toLocaleString('en-IN') : '0'}
                </span>
              </div>

              {/* Real-time Donor Data Preview */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'en' ? 'Donor:' : 'दानदाता:'}</span>
                  </span>
                  <strong className="text-white truncate max-w-[180px]">
                    {donorName.trim() || '—'}
                  </strong>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'en' ? 'Mobile:' : 'मोबाइल:'}</span>
                  </span>
                  <span className="font-mono text-white">{mobile || '—'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>{language === 'en' ? 'Email:' : 'ईमेल:'}</span>
                  </span>
                  <span className="text-white truncate max-w-[180px]">{email || '—'}</span>
                </div>

                <div className="flex items-start justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'en' ? 'Address:' : 'पता:'}</span>
                  </span>
                  <span className="text-white text-right truncate max-w-[180px]">
                    {address.trim() || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{language === 'en' ? 'Purpose:' : 'उद्देश्य:'}</span>
                  <span className="text-amber-300 font-medium truncate max-w-[180px]">
                    {purpose}
                  </span>
                </div>
              </div>

              {/* Supported Payment Channels */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">UPI & QR</strong>
                    <span className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">Cards & NetBanking</strong>
                    <span className="text-[10px] text-slate-400">All Indian Banks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Registration Credentials Box */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3.5 text-xs text-slate-700">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-700" />
                <span>
                  {language === 'en' ? 'Trust Registration Credentials' : 'ट्रस्ट का वैधानिक पंजीकरण'}
                </span>
              </h3>

              <div className="space-y-2 text-[11.5px]">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">
                    {language === 'en' ? 'Trust Name:' : 'ट्रस्ट का नाम:'}
                  </span>
                  <strong className="text-slate-900">{settings.name}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">
                    {language === 'en' ? 'Trust Reg. No:' : 'पंजीकरण संख्या:'}
                  </span>
                  <strong className="font-mono text-blue-950 font-bold">
                    {settings.registrationNumber}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">
                    {language === 'en' ? 'NITI Aayog NGO Darpan:' : 'नीति आयोग दर्पण ID:'}
                  </span>
                  <strong className="font-mono text-emerald-800 font-bold">
                    {settings.ngoDarpanId}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {language === 'en' ? 'PAN Card No:' : 'ट्रस्ट पैन नंबर:'}
                  </span>
                  <strong className="font-mono text-slate-900">{settings.panNumber}</strong>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-medium">
                {language === 'en'
                  ? '• Donations are eligible for tax deduction under applicable provisions of the Income Tax Act.'
                  : '• आयकर अधिनियम के सुसंगत प्रावधानों के अंतर्गत किए गए दान पर नियमानुसार कर छूट की पात्रता उपलब्ध है।'}
              </div>
            </div>
          </div>

          {/* Right Column: Amount Selection & 7-Field Donation Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.donation.amountTitle} *
                </label>
                <span className="text-[11px] font-bold text-emerald-700">
                  {language === 'en' ? 'Select or type custom amount' : 'राशि चुनें या अपनी इच्छानुसार लिखें'}
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {[100, 500, 1000, 2100, 5100].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => handleSelectAmount(amt)}
                    className={`py-3 px-3 rounded-xl font-black text-sm border transition-all cursor-pointer ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-transparent shadow-md scale-102 ring-2 ring-amber-400'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="mt-3">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'en'
                    ? 'Or enter any voluntary amount of your choice:'
                    : 'या अपनी इच्छानुसार कोई भी राशि लिखें:'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder={t.donation.customAmountPlaceholder}
                    className="w-full pl-8 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-base focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none font-black text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Donation Form with All 7 Fields (Phase 3) */}
            <form onSubmit={handleRazorpayPay} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.donation.donorInfoTitle}
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  * {language === 'en' ? 'Required fields' : 'अनिवार्य विवरण'}
                </span>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Donor Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Donor Full Name' : 'दानदाता का पूरा नाम'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={language === 'en' ? 'Full Name as on Aadhaar/PAN' : 'पूरा नाम (आधार या पैन के अनुसार)'}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                {/* 2. Mobile Number */}
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
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                </div>

                {/* 3. Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Email Address (For Receipt)' : 'ईमेल पता (रसीद प्राप्ति हेतु)'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>

                {/* 4. Full Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Full Address' : 'पूरा डाक पता'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'House/Street, Village/City, District, State, PIN Code'
                        : 'मकान/गली, गाँव/शहर, जिला, राज्य, पिन कोड'
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>

                {/* 5. Donation Purpose (Exact 5 Categories) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Donation Purpose' : 'दान का उद्देश्य'} *
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-medium text-slate-800"
                  >
                    {DONATION_PURPOSES.map((dp) => (
                      <option key={dp.id} value={dp.labelHi}>
                        {language === 'en' ? dp.labelEn : dp.labelHi}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional PAN Card */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'PAN Card (For 80G Tax Exemption)' : 'पैन कार्ड (80G कर छूट रसीद हेतु)'}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panCard}
                    onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase font-bold text-slate-900"
                  />
                </div>

                {/* 7. Optional Message */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Optional Message or Prayer' : 'शुभकामना संदेश या प्रार्थना (वैकल्पिक)'}
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Best wishes or prayer message'
                        : 'शुभकामना या विशेष निर्देश'
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Single Primary Razorpay CTA Button */}
              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-700 hover:to-amber-700 active:scale-98 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-red-500/30"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>
                        {language === 'en'
                          ? 'Opening Razorpay Secure Checkout...'
                          : 'रेजरपे सुरक्षित गेटवे खुल रहा है...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-amber-300" />
                      <span>
                        {language === 'en'
                          ? `Donate ₹${effectiveAmount ? effectiveAmount.toLocaleString('en-IN') : '0'} via Razorpay`
                          : `रेजरपे द्वारा ₹${effectiveAmount ? effectiveAmount.toLocaleString('en-IN') : '0'} का सुरक्षित दान करें`}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500 font-medium">
                  {language === 'en'
                    ? '🔒 256-bit Bank Grade Security • Dynamic UPI QR, Cards & NetBanking Supported'
                    : '🔒 256-बिट बैंक स्तरीय सुरक्षा • डायनामिक UPI QR, कार्ड्स एवं नेटबैंकिंग समर्थित'}
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Search & Download Past Approved Receipts */}
      {showDownloadReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
                <Download className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'en'
                    ? 'Search & Download Approved Receipt'
                    : 'स्वीकृत दान रसीद खोजें व डाउनलोड करें'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadReceiptModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchReceipt} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'en'
                  ? 'Enter Receipt Number, Mobile, or Razorpay Payment ID:'
                  : 'रसीद संख्या, मोबाइल नंबर या रेजरपे पेमेंट आईडी दर्ज करें:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchReceiptQuery}
                  onChange={(e) => setSearchReceiptQuery(e.target.value)}
                  placeholder="LKST-REC-2026-XXXX / 9876543210"
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>{language === 'en' ? 'Search' : 'खोजें'}</span>
                </button>
              </div>
            </form>

            {searchStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  searchStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : searchStatusMsg.type === 'pending'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {searchStatusMsg.text}
              </div>
            )}

            {searchedDonation && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between font-mono font-bold text-blue-900">
                  <span>{searchedDonation.receiptNumber}</span>
                  <span className="text-emerald-700">₹{searchedDonation.amount}</span>
                </div>
                <div className="text-slate-700 font-semibold">{searchedDonation.donorName}</div>
                <div className="text-slate-500 text-[11px]">{searchedDonation.message}</div>
                {searchedDonation.address && (
                  <div className="text-slate-600 text-[11px]">
                    📍 {searchedDonation.address}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveReceipt({ type: 'donation', data: searchedDonation });
                    setShowDownloadReceiptModal(false);
                  }}
                  className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>{language === 'en' ? 'Open & Download Receipt' : 'रसीद खोलें व डाउनलोड करें'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
