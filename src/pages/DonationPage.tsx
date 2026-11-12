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
} from 'lucide-react';
import { Donation } from '../types';
import { openRazorpayCheckout } from '../lib/razorpayClient';

export const DonationPage: React.FC = () => {
  const {
    settings,
    recordRazorpayDonation,
    setActiveReceipt,
    language,
    t,
    isAdmin,
    setCurrentPage,
    donations,
  } = useTrust();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [panCard, setPanCard] = useState('');
  const [purpose, setPurpose] = useState('सामान्य धर्मार्थ सहयोग (General Welfare)');
  const [message, setMessage] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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

  const handleSearchReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchReceiptQuery.trim().toLowerCase();
    if (!q) {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'Please enter your receipt number, mobile number, or Razorpay payment ID.'
            : 'कृपया रसीद संख्या, मोबाइल नंबर या रेजरपे पेमेंट आईडी दर्ज करें।',
        type: 'error',
      });
      return;
    }

    const found = donations.find(
      (d) =>
        d.receiptNumber.toLowerCase() === q ||
        d.receiptNumber.toLowerCase().includes(q) ||
        d.mobile.includes(q) ||
        (d.transactionId && d.transactionId.toLowerCase().includes(q)) ||
        (d.razorpayPaymentId && d.razorpayPaymentId.toLowerCase().includes(q))
    );

    if (!found) {
      setSearchedDonation(null);
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'No donation record found. Please verify your receipt number or mobile.'
            : 'इस विवरण से कोई दान रिकॉर्ड नहीं मिला। कृपया रसीद संख्या या मोबाइल नंबर पुनः जांचें।',
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
   * Razorpay Checkout Handler (Exclusive Gateway)
   * Completely bypasses manual UPI/QR/Bank transfer.
   */
  const handleRazorpayPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!effectiveAmount || effectiveAmount < 1) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid donation amount (minimum ₹1).'
          : 'कृपया न्यूनतम ₹1 या अधिक की सहयोग राशि चुनें।'
      );
      return;
    }

    if (!donorName.trim()) {
      setErrorMsg(
        language === 'en' ? 'Please enter your full name.' : 'कृपया अपना पूरा नाम दर्ज करें।'
      );
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    // Optional PAN validation if provided
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
        email: email.trim() || undefined,
        panCard: panCard.trim().toUpperCase() || undefined,
        notes: {
          purpose,
          message: message.trim() || 'Luv Kush Seva Trust Charitable Donation',
        },
        onSuccess: (verifyResult) => {
          setIsProcessing(false);

          // Record instant approved donation with official verified receipt
          const newDon = recordRazorpayDonation({
            donorName: donorName.trim(),
            mobile: cleanMobile,
            email: email.trim() || undefined,
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
          setErrorMsg(
            err.message ||
              (language === 'en'
                ? 'Payment could not be completed. Please try again.'
                : 'भुगतान पूरा नहीं हो सका। कृपया पुनः प्रयास करें।')
          );
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
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
              <span>{language === 'en' ? 'Download Approved Receipt' : 'स्वीकृत रसीद डाउनलोड करें'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {submittedDonation ? (
        (() => {
          const liveDonation =
            donations.find((d) => d.id === submittedDonation.id) || submittedDonation;

          return (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
              {/* Top Check Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              {/* Thank You Message */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'Razorpay Payment Verified & Approved'
                      : 'रेजरपे भुगतान सत्यापित एवं स्वीकृत'}
                  </span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-900">
                  {language === 'en'
                    ? 'Thank You for Your Generous Support!'
                    : 'पुनीत सहयोग एवं दान हेतु आपका हार्दिक धन्यवाद!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                  {language === 'en'
                    ? 'Your donation has been verified and registered with Luv Kush Seva Trust. Your official tax-deductible receipt has been generated automatically.'
                    : 'लव कुश सेवा ट्रस्ट में आपका दान सफलतापूर्वक सत्यापित हो चुका है। आपकी आधिकारिक प्रमाणित रसीद तत्काल तैयार कर दी गई है।'}
                </p>
              </div>

              {/* Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600 font-bold">{t.donation.receiptNumber}:</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-sm text-blue-950 font-black">
                      {liveDonation.receiptNumber}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(liveDonation.receiptNumber);
                        setCopiedReceiptNo(true);
                        setTimeout(() => setCopiedReceiptNo(false), 2000);
                      }}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      title={language === 'en' ? 'Copy Receipt No' : 'रसीद संख्या कॉपी करें'}
                    >
                      {copiedReceiptNo ? (
                        <Check className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>
                        {copiedReceiptNo
                          ? language === 'en'
                            ? 'Copied'
                            : 'कॉपी'
                          : language === 'en'
                          ? 'Copy'
                          : 'कॉपी'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{t.donation.donorName}:</span>
                  <strong className="text-slate-900 font-bold">{liveDonation.donorName}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Contribution Amount:' : 'सहयोग दान राशि:'}
                  </span>
                  <strong className="text-red-700 text-base font-black font-mono">
                    ₹ {Number(liveDonation.amount || 0).toLocaleString('en-IN')} /-
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{t.donation.paymentMethodTitle}:</span>
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Online (Razorpay Gateway)</span>
                  </span>
                </div>

                {liveDonation.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">
                      {language === 'en' ? 'Razorpay Payment ID:' : 'रेजरपे पेमेंट आईडी:'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {liveDonation.razorpayPaymentId}
                    </span>
                  </div>
                )}

                {liveDonation.panCard && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">
                      {language === 'en' ? 'PAN Number (80G Benefit):' : 'पैन नंबर (80G छूट हेतु):'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {liveDonation.panCard}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">
                    {language === 'en' ? 'Approval Status:' : 'स्वीकृति स्थिति:'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'en' ? 'Approved & Ready for Download' : 'स्वीकृत एवं डाउनलोड हेतु तैयार'}</span>
                  </span>
                </div>
              </div>

              {/* Instant Verified Receipt Download CTA */}
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 space-y-3 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-sm">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>
                    {language === 'en' ? 'Your Official Receipt is Ready!' : 'आपकी आधिकारिक प्रमाणित रसीद तैयार है!'}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {language === 'en'
                    ? 'Payment verified via Razorpay HMAC signature. Click below to view, print, or download your official digital receipt with Trust QR code and authorization stamp.'
                    : 'रेजरपे एचएमएसी सिग्नेचर द्वारा सत्यापित। ट्रस्ट के डिजिटल क्यूआर कोड और मुहर सहित प्रमाणित रसीद देखने व डाउनलोड करने के लिए नीचे क्लिक करें।'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveReceipt({ type: 'donation', data: liveDonation })}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Download Approved Receipt (PDF / Print)'
                      : 'स्वीकृत रसीद डाउनलोड करें (PDF / Print)'}
                  </span>
                </button>
              </div>

              {/* Reset or New Donation */}
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedDonation(null);
                    setCustomAmount('');
                    setSelectedAmount(1000);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  {language === 'en' ? '← Make Another Donation' : '← नया दान करें'}
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Razorpay Gateway Information & Trust Credentials */}
          <div className="lg:col-span-5 space-y-6">
            {/* Razorpay Assurance Card */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5 border border-blue-800/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-blue-800/50 pb-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Payment Partner' : 'भुगतान सहयोगी'}
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

              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'en'
                  ? 'All online donations to Luv Kush Seva Trust are processed through Razorpay’s banking gateway with 256-bit SSL encryption. All major payment options are supported:'
                  : 'लव कुश सेवा ट्रस्ट को किए जाने वाले सभी ऑनलाइन दान रेजरपे के 256-बिट सुरक्षित बैंकिंग गेटवे द्वारा प्रोसेस होते हैं। सभी प्रमुख ऑनलाइन विकल्प उपलब्ध हैं:'}
              </p>

              {/* Supported Payment Channels */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">UPI Apps</strong>
                    <span className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, BHIM</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">Cards</strong>
                    <span className="text-[10px] text-slate-400">RuPay, Visa, Mastercard</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">Net Banking</strong>
                    <span className="text-[10px] text-slate-400">50+ Indian Banks</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-[11px]">Instant Receipt</strong>
                    <span className="text-[10px] text-slate-400">Official 80G PDF</span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="p-3 bg-blue-900/40 rounded-xl border border-blue-700/40 space-y-1.5 text-[11px] text-blue-200">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'en'
                      ? 'No Manual UTR Verification Required'
                      : 'मैन्युअल UTR या स्क्रीनशॉट भेजने की आवश्यकता नहीं'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Unlike manual QR or bank transfers, Razorpay automatically verifies your payment in real time and immediately issues your verified official receipt.'
                    : 'पुराने मैन्युअल क्यूआर या बैंक ट्रांसफर के विपरीत, रेजरपे आपके भुगतान का तुरंत ऑटो-वेरिफिकेशन करता है और रसीद तुरंत डाउनलोड हेतु उपलब्ध कराता है।'}
                </p>
              </div>
            </div>

            {/* Official Trust Registration Information */}
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
                  <strong className="font-mono text-blue-950 font-bold">{settings.registrationNumber}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">
                    {language === 'en' ? 'NITI Aayog NGO Darpan:' : 'नीति आयोग दर्पण ID:'}
                  </span>
                  <strong className="font-mono text-emerald-800 font-bold">{settings.ngoDarpanId}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">
                    {language === 'en' ? 'PAN Card No:' : 'ट्रस्ट पैन नंबर:'}
                  </span>
                  <strong className="font-mono text-slate-900">{settings.panNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {language === 'en' ? 'Regd. Address:' : 'पंजीकृत पता:'}
                  </span>
                  <span className="text-slate-800 text-right max-w-[200px]">{settings.address}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-medium">
                {language === 'en'
                  ? '• Donations are eligible for tax exemption under applicable provisions of the Income Tax Act.'
                  : '• आयकर अधिनियम के सुसंगत प्रावधानों के अंतर्गत किए गए दान पर कर छूट की पात्रता उपलब्ध है।'}
              </div>
            </div>
          </div>

          {/* Right Column: Amount Selection & Razorpay Online Payment Form */}
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

              {/* Preset Buttons: ₹100, ₹500, ₹1000, ₹2100, ₹5100 */}
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

            {/* Donor Information & Payment Form */}
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorName} *
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorMobile} *
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorEmail}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'PAN Card (For 80G Tax Benefit)' : 'पैन कार्ड (80G कर छूट रसीद हेतु)'}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Donation Purpose' : 'दान का उद्देश्य'}
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-medium text-slate-800"
                  >
                    <option value="सामान्य धर्मार्थ सहयोग (General Welfare)">सामान्य धर्मार्थ सहयोग (General Welfare)</option>
                    <option value="निःशुल्क चिकित्सा एवं अस्पताल सेवा (Healthcare)">निःशुल्क चिकित्सा एवं अस्पताल सेवा (Healthcare)</option>
                    <option value="गरीब बच्चों की शिक्षा सहायता (Education)">गरीब बच्चों की शिक्षा सहायता (Education)</option>
                    <option value="अनाथ आश्रम एवं वृद्ध आश्रम सेवा (Orphan & Senior Care)">अनाथ आश्रम एवं वृद्ध आश्रम सेवा (Orphan & Senior Care)</option>
                    <option value="एम्बुलेंस एवं आपातकालीन सेवा (Ambulance)">एम्बुलेंस एवं आपातकालीन सेवा (Ambulance)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.messageLabel}
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Best wishes or prayer message (optional)'
                        : 'शुभकामना या संदेश (वैकल्पिक)'
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
                          ? 'Connecting to Razorpay Gateway...'
                          : 'रेजरपे सुरक्षित गेटवे से संपर्क हो रहा है...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-white text-white" />
                      <span>
                        {language === 'en'
                          ? `Proceed to Pay ₹${effectiveAmount.toLocaleString('en-IN')} via Razorpay`
                          : `रेजरपे द्वारा ₹${effectiveAmount.toLocaleString('en-IN')} का सुरक्षित भुगतान करें`}
                      </span>
                      <ArrowRight className="w-5 h-5 text-amber-300" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'Protected by Razorpay 256-bit Bank Grade Security • Instant Receipt'
                      : 'रेजरपे 256-बिट बैंक स्तरीय सुरक्षा • तुरंत रसीद उपलब्ध'}
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Download Approved Receipt Finder Modal */}
      {showDownloadReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <Download className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'en'
                    ? 'Find & Download Approved Receipt'
                    : 'स्वीकृत रसीद खोजें व डाउनलोड करें'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDownloadReceiptModal(false);
                  setSearchStatusMsg(null);
                  setSearchedDonation(null);
                  setSearchReceiptQuery('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en'
                ? 'Enter your Receipt Number (e.g. LKST-REC-2026-...), 10-digit mobile number, or Razorpay payment ID to download your official PDF receipt.'
                : 'अपनी रसीद संख्या (जैसे LKST-REC-2026-...), 10 अंकों का मोबाइल नंबर, या रेजरपे पेमेंट आईडी दर्ज करके अपनी रसीद डाउनलोड करें।'}
            </p>

            <form onSubmit={handleSearchReceipt} className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchReceiptQuery}
                  onChange={(e) => setSearchReceiptQuery(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Receipt No / Mobile / Payment ID'
                      : 'रसीद संख्या / मोबाइल नंबर / पेमेंट आईडी'
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-101 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{language === 'en' ? 'Search Receipt' : 'रसीद खोजें'}</span>
              </button>
            </form>

            {/* Status Message */}
            {searchStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  searchStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : searchStatusMsg.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {searchStatusMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : searchStatusMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{searchStatusMsg.text}</span>
              </div>
            )}

            {/* If Donation Found */}
            {searchedDonation && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">{t.donation.receiptNumber}:</span>
                  <span className="font-mono text-sm font-black text-blue-950">
                    {searchedDonation.receiptNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.donation.donorName}:</span>
                    <strong className="text-slate-900 text-xs">{searchedDonation.donorName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {language === 'en' ? 'Amount:' : 'दान राशि:'}
                    </span>
                    <strong className="text-red-700 font-mono font-bold text-xs">
                      ₹ {Number(searchedDonation.amount || 0).toLocaleString('en-IN')} /-
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {language === 'en' ? 'Date:' : 'दिनांक:'}
                    </span>
                    <span>{new Date(searchedDonation.donatedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {language === 'en' ? 'Status:' : 'स्थिति:'}
                    </span>
                    {searchedDonation.status === 'Approved' || searchedDonation.isVerified ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {language === 'en' ? 'Approved' : 'स्वीकृत'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {language === 'en' ? 'Pending Approval' : 'लंबित'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Download Button if Approved */}
                {searchedDonation.status === 'Approved' || searchedDonation.isVerified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDownloadReceiptModal(false);
                      setActiveReceipt({ type: 'donation', data: searchedDonation });
                    }}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>
                      {language === 'en'
                        ? 'Download Official Receipt (PDF / Print)'
                        : 'प्रमाणित रसीद डाउनलोड / प्रिंट करें'}
                    </span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-900 leading-relaxed text-center font-medium">
                    {language === 'en'
                      ? 'This receipt is pending approval.'
                      : 'यह रसीद अभी सत्यापन प्रक्रिया में है।'}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDownloadReceiptModal(false);
                  setSearchStatusMsg(null);
                  setSearchedDonation(null);
                  setSearchReceiptQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
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
