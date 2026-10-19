import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { SafeImage } from '../components/SafeImage';
import {
  Heart,
  QrCode,
  Building,
  CreditCard,
  Copy,
  Check,
  Upload,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  Download,
  Search,
  RefreshCw,
  Edit3,
  Save,
  ExternalLink,
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Donation } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

export const DonationPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    addDonation,
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
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'QR Code' | 'Bank Transfer'>('QR Code');
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedReceiptNo, setCopiedReceiptNo] = useState(false);


  const [submittedDonation, setSubmittedDonation] = useState<Donation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Download Approved Receipt Finder State
  const [showDownloadReceiptModal, setShowDownloadReceiptModal] = useState(false);
  const [searchReceiptQuery, setSearchReceiptQuery] = useState('');
  const [searchedDonation, setSearchedDonation] = useState<Donation | null>(null);
  const [searchStatusMsg, setSearchStatusMsg] = useState<{
    text: string;
    type: 'error' | 'info' | 'pending' | 'success';
  } | null>(null);
  const [statusRefreshToast, setStatusRefreshToast] = useState<string>('');

  const handleSearchReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchReceiptQuery.trim().toLowerCase();
    if (!q) {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'Please enter your receipt number, mobile number, or UTR.'
            : 'कृपया रसीद संख्या, मोबाइल नंबर या UTR दर्ज करें।',
        type: 'error',
      });
      return;
    }

    const found = donations.find(
      (d) =>
        d.receiptNumber.toLowerCase() === q ||
        d.receiptNumber.toLowerCase().includes(q) ||
        d.mobile.includes(q) ||
        (d.transactionId && d.transactionId.toLowerCase().includes(q))
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
    const isAppr =
      found.status === 'Approved' ||
      (found.isVerified && found.status !== 'Rejected' && found.status !== 'Pending');

    if (isAppr) {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? '✓ Your donation is officially Approved! Click the download button below.'
            : '✓ आपका दान आधिकारिक रूप से स्वीकृत है! रसीद डाउनलोड करने हेतु नीचे दिए गए बटन पर क्लिक करें।',
        type: 'success',
      });
    } else if (found.status === 'Rejected') {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? 'This donation request was rejected. Please contact trust helpline.'
            : 'यह दान अनुरोध अस्वीकृत है। सहायता हेतु कृपया ट्रस्ट हेल्पलाइन पर संपर्क करें।',
        type: 'error',
      });
    } else {
      setSearchStatusMsg({
        text:
          language === 'en'
            ? '⏳ Your donation is Under Verification (Pending Approval). Verified receipt will be available immediately upon approval.'
            : '⏳ आपका दान वर्तमान में सत्यापन प्रक्रियाधीन (लंबित) है। ट्रस्ट व्यवस्थापक द्वारा अप्रूवल (स्वीकृति) मिलते ही यहाँ से रसीद डाउनलोड होगी।',
        type: 'pending',
      });
    }
  };

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleSelectAmount = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyBank = () => {
    const text = `Account: ${settings.bankDetails.accountNumber}\nIFSC: ${settings.bankDetails.ifscCode}\nBank: ${settings.bankDetails.bankName}\nName: ${settings.bankDetails.accountHolderName}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setScreenshotPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount <= 0) {
      setErrorMsg(
        language === 'en'
          ? 'Please select or enter a donation amount.'
          : 'कृपया सहयोग राशि चुनें या दर्ज करें।'
      );
      return;
    }
    if (mobile.length < 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    setErrorMsg('');

    const newDon = addDonation({
      donorName,
      mobile,
      email,
      amount: effectiveAmount,
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      screenshotUrl: screenshotPreview,
      message,
      status: 'Pending',
    });

    setSubmittedDonation(newDon);
  };

  // Universal UPI payment URL without fixed amount (allows donor to pay any amount of their choice)
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.name
  )}&cu=INR&tn=${encodeURIComponent('Seva Donation')}`;


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      
      {/* Top Headline Section */}
      <div className="text-center space-y-3">


        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          {t.donation.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          "{t.donation.subtitle}"
        </p>

        {/* Quick Receipt Download Bar for already approved donations */}
        <div className="pt-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 rounded-2xl shadow-xs text-xs">
            <span className="font-bold text-emerald-900 px-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{language === 'en' ? 'Already contributed and got approval?' : 'दान स्वीकृत हो चुका है? यहाँ से रसीद डाउनलोड करें:'}</span>
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

      {submittedDonation ? (() => {
        const liveDonation = donations.find((d) => d.id === submittedDonation.id) || submittedDonation;
        const isApproved =
          liveDonation.status === 'Approved' ||
          (liveDonation.isVerified && liveDonation.status !== 'Rejected' && liveDonation.status !== 'Pending');

        return (
          // Donation Success Card (Target element of selector 1)
          <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-xl mx-auto animate-fadeIn">
            {/* Top Check Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            {/* Thank You Message */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
                {language === 'en' ? 'Donation Received' : 'दान विवरण प्रेषित'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-800">
                {language === 'en'
                  ? 'Thank You for Your Generous Support!'
                  : 'सहयोग एवं दान हेतु आपका हार्दिक धन्यवाद!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {language === 'en'
                  ? 'Your donation has been registered successfully with Luv Kush Seva Trust. We are deeply grateful for your generous contribution towards humanity, education, and welfare.'
                  : 'लव कुश सेवा ट्रस्ट में आपका दान विवरण सफलतापूर्वक दर्ज कर लिया गया है। असहायों, बच्चों व समाज सेवा के इस पुनीत कार्य में सहयोग के लिए ट्रस्ट परिवार आपका सदैव आभारी रहेगा।'}
              </p>
            </div>

            {/* Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-bold">{t.donation.receiptNumber}:</span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-sm text-blue-950 font-black">{liveDonation.receiptNumber}</strong>
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
                    {copiedReceiptNo ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedReceiptNo ? (language === 'en' ? 'Copied' : 'कॉपी') : (language === 'en' ? 'Copy' : 'कॉपी')}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">{t.donation.donorName}:</span>
                <strong className="text-slate-900 font-bold">{liveDonation.donorName}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">{language === 'en' ? 'Contribution Amount:' : 'सहयोग दान राशि:'}</span>
                <strong className="text-red-700 text-base font-black font-mono">₹ {liveDonation.amount.toLocaleString('en-IN')} /-</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">{t.donation.paymentMethodTitle}:</span>
                <span className="text-slate-800 font-semibold">{liveDonation.paymentMethod}</span>
              </div>

              {liveDonation.transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{t.donation.transactionIdLabel}:</span>
                  <span className="font-mono text-slate-800 font-bold">{liveDonation.transactionId}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                <span className="text-slate-600 font-medium">{language === 'en' ? 'Approval Status:' : 'स्वीकृति स्थिति:'}</span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'en' ? 'Approved & Verified' : 'स्वीकृत एवं सत्यापित'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                    <span>{language === 'en' ? 'Pending Admin Approval' : 'व्यवस्थापक अप्रूवल प्रतीक्षारत (लंबित)'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* If Approved: PROMINENT DOWNLOAD RECEIPT BUTTON */}
            {isApproved ? (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 space-y-3 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'en' ? 'Official Receipt is Ready!' : 'आपकी आधिकारिक रसीद तैयार है!'}</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {language === 'en'
                    ? 'Your donation has been approved by the trust administration. Click below to download your verified receipt with official seal.'
                    : 'ट्रस्ट कार्यालय द्वारा आपके दान का सत्यापन कर अप्रूवल (स्वीकृति) दे दिया गया है। आप नीचे दिए गए बटन से अपनी प्रमाणित रसीद डाउनलोड कर सकते हैं।'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveReceipt({ type: 'donation', data: liveDonation })}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>{language === 'en' ? 'Download Approved Receipt (PDF)' : 'स्वीकृत रसीद डाउनलोड करें (PDF)'}</span>
                </button>
              </div>
            ) : (
              /* Wait for Approval Notice Box */
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-left space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {language === 'en'
                      ? 'Please wait for Admin Approval to download receipt'
                      : 'रसीद डाउनलोड करने के लिए व्यवस्थापक अप्रूवल (स्वीकृति) की प्रतीक्षा करें'}
                  </span>
                </div>

                <p className="text-[11.5px] text-amber-900 leading-relaxed">
                  {language === 'en'
                    ? 'Your transaction is currently under verification with the trust bank records. Once the administration verifies and approves your contribution, the verified official receipt will become available. Please note down your Receipt Number for future reference.'
                    : 'आपके द्वारा किए गए भुगतान (UTR / Transaction ID) का बैंक खाते से मिलान एवं भौतिक सत्यापन किया जा रहा है। ट्रस्ट कार्यालय द्वारा अप्रूवल (स्वीकृति) प्रदान करने के उपरांत ही प्रमाणित रसीद उपलब्ध होगी। कृपया अपनी रसीद संख्या सुरक्षित रखें।'}
                </p>

                {/* Live Status Refresh Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = donations.find((d) => d.id === submittedDonation.id);
                      if (updated && (updated.status === 'Approved' || updated.isVerified)) {
                        setStatusRefreshToast(
                          language === 'en'
                            ? '✓ Approved! Your verified receipt is now available above.'
                            : '✓ स्वीकृत हो चुका है! आपकी प्रमाणित रसीद डाउनलोड के लिए तैयार है।'
                        );
                      } else {
                        setStatusRefreshToast(
                          language === 'en'
                            ? '⏳ Still under review with trust office. Please wait.'
                            : '⏳ अभी व्यवस्थापक सत्यापन प्रक्रियाधीन है। कृपया थोड़ी प्रतीक्षा करें।'
                        );
                      }
                      setTimeout(() => setStatusRefreshToast(''), 4000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold cursor-pointer transition-colors w-fit"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                    <span>{language === 'en' ? 'Check Live Approval Status' : 'लाइव अप्रूवल स्थिति जांचें'}</span>
                  </button>

                  <div className="text-[11px] text-amber-900 font-bold">
                    <span>{language === 'en' ? 'Helpline:' : 'हेल्पलाइन:'} </span>
                    <span className="font-mono text-blue-950">{settings.phone}</span>
                  </div>
                </div>

                {statusRefreshToast && (
                  <div className="text-[11px] font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 animate-fadeIn">
                    {statusRefreshToast}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedDonation(null);
                  setDonorName('');
                  setMobile('');
                  setTransactionId('');
                  setMessage('');
                  setScreenshotPreview('');
                  setStatusRefreshToast('');
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Make Another Donation' : 'अन्य दान करें'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Go to Home' : 'मुख्य पृष्ठ पर जाएं'}
              </button>
            </div>
          </div>
        );
      })() : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: QR Code & Bank Details */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* UPI QR Code Card */}
            <div className="bg-white rounded-3xl border-2 border-amber-400 p-6 shadow-xl text-center space-y-4 relative overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs py-1 px-4 -mx-6 -mt-6 mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>{language === 'en' ? 'Trust UPI QR Code' : 'ट्रस्ट UPI क्यूआर कोड'}</span>
                <span className="text-[10px] text-amber-200">
                  {language === 'en' ? 'Verified Official' : 'अधिकृत'}
                </span>
              </div>

              <div className="w-56 h-56 mx-auto bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 flex flex-col items-center justify-center relative shadow-inner">
                {settings.donationQrUrl ? (
                  <SafeImage
                    src={settings.donationQrUrl}
                    alt="Luv Kush Seva Trust Official UPI QR Code for Charitable Donations"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-2 p-2">
                    <QrCode className="w-28 h-28 text-slate-800" />
                    <span className="text-[11px] font-bold text-slate-700">
                      {t.donation.scanQrToPay}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (PhonePe, GPay, Paytm, BHIM)
                    </span>
                  </div>
                )}
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  {t.donation.upiIdLabel}
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-sm text-blue-950 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 select-all">
                    {settings.upiId}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-1 font-bold cursor-pointer transition-colors"
                    title={language === 'en' ? 'Copy UPI' : 'कॉपी करें'}
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUpi ? t.donation.copied : t.donation.copyUpi}</span>
                  </button>
                </div>
              </div>

              {/* Direct UPI Payment Section (Direct 1-click launch, flexible voluntary amount, no popup modal) */}
              <div className="space-y-2 pt-1.5">
                <a
                  href={upiPayUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>{language === 'en' ? 'Pay Directly via Any UPI App' : 'सीधे किसी भी UPI ऐप से भुगतान करें'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>


                <p className="text-[10px] text-slate-500 text-center font-medium">
                  {language === 'en'
                    ? 'No fixed amount • Pay any voluntary contribution amount directly in your app'
                    : 'राशि फिक्स नहीं है • ऐप में अपनी इच्छानुसार कोई भी सहयोग राशि भरकर सीधे भुगतान करें'}
                </p>
              </div>

            </div>

            {/* Bank Transfer Details Box */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-700" />
                  <span>{t.donation.bankDetailsTitle}</span>
                </h3>
                <button
                  onClick={handleCopyBank}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank ? t.donation.copied : t.donation.copyBankDetails}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.bankName}:</span>
                  <strong className="text-slate-900">{settings.bankDetails.bankName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.accountHolder}:</span>
                  <strong className="text-slate-900">{settings.bankDetails.accountHolderName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.accountNumber}:</span>
                  <strong className="font-mono text-sm text-blue-900">{settings.bankDetails.accountNumber}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.ifscCode}:</span>
                  <strong className="font-mono text-sm text-red-700">{settings.bankDetails.ifscCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.donation.branch}:</span>
                  <span className="text-slate-800">{settings.bankDetails.branch}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                {language === 'en'
                  ? '* After transfer, please fill details in the form to generate your official receipt.'
                  : '* ट्रांसफर के बाद कृपया नीचे दिए गए फॉर्म में विवरण भरकर रसीद प्राप्त करें।'}
              </div>
            </div>

          </div>

          {/* Right Column: Amount Selection & Donor Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.donation.amountTitle} *
              </label>

              {/* Preset Buttons per prompt: 100, 500, 1000, 2100, 5100 */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {[100, 500, 1000, 2100, 5100].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => handleSelectAmount(amt)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={t.donation.customAmountPlaceholder}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.donation.donorInfoTitle}
              </label>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={language === 'en' ? 'Your Name' : 'आपका नाम'}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorMobile} *
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
                    {t.donation.donorEmail}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.paymentMethodTitle} *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="QR Code">{language === 'en' ? 'QR Code Scanner' : 'QR Code स्कैनर'}</option>
                    <option value="UPI">{language === 'en' ? 'UPI Transfer' : 'UPI ट्रांसफर'}</option>
                    <option value="Bank Transfer">{language === 'en' ? 'Bank Transfer (NEFT / IMPS)' : 'बैंक ट्रांसफर (NEFT / IMPS)'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.transactionIdLabel}
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={t.donation.transactionIdPlaceholder}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.messageLabel}
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.donation.messagePlaceholder}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>


              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  <span>Donate Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}


      {/* ========================================================
          DOWNLOAD APPROVED DONATION RECEIPT MODAL
      ======================================================== */}
      {showDownloadReceiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 animate-fadeIn my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'Download Approved Donation Receipt'
                      : 'स्वीकृत दान रसीद डाउनलोड करें'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Enter your Receipt Number, Mobile Number, or UTR to download verified receipt.'
                    : 'अपनी रसीद संख्या, मोबाइल नंबर या UTR दर्ज कर प्रमाणित रसीद डाउनलोड करें।'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDownloadReceiptModal(false);
                  setSearchStatusMsg(null);
                  setSearchedDonation(null);
                  setSearchReceiptQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchReceipt} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'en'
                  ? 'Enter Receipt Number or Mobile Number *'
                  : 'रसीद संख्या या पंजीकृत मोबाइल नंबर *'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchReceiptQuery}
                    onChange={(e) => setSearchReceiptQuery(e.target.value)}
                    placeholder="e.g. LKST-REC-2026-784 या 98XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Find' : 'खोजें'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'en'
                  ? '* Official receipts can be downloaded only after physical bank verification and admin approval.'
                  : '* केवल व्यवस्थापक द्वारा स्वीकृत (Approved) दानों की ही प्रमाणित रसीद डाउनलोड की जा सकती है।'}
              </p>
            </form>

            {/* Status Message / Result */}
            {searchStatusMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                  searchStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : searchStatusMsg.type === 'pending'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}
              >
                {searchStatusMsg.text}
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
                    <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Amount:' : 'दान राशि:'}</span>
                    <strong className="text-red-700 font-mono font-bold text-xs">
                      ₹ {Number(searchedDonation.amount || 0).toLocaleString('en-IN')} /-
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Date:' : 'दिनांक:'}</span>
                    <span>{new Date(searchedDonation.donatedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Status:' : 'स्थिति:'}</span>
                    {searchedDonation.status === 'Approved' ||
                    (searchedDonation.isVerified &&
                      searchedDonation.status !== 'Rejected' &&
                      searchedDonation.status !== 'Pending') ? (
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
                {searchedDonation.status === 'Approved' ||
                (searchedDonation.isVerified &&
                  searchedDonation.status !== 'Rejected' &&
                  searchedDonation.status !== 'Pending') ? (
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
                      ? 'This receipt will be downloadable as soon as admin approves the transaction.'
                      : 'व्यवस्थापक द्वारा भुगतान अप्रूव होते ही यहाँ डाउनलोड बटन सक्रिय हो जाएगा।'}
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
