import React, { useState, useRef } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  X,
  Printer,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  User,
  Heart,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { IdCard } from '../types';
import { ID_CARD_CATEGORY_CONFIG } from '../data/mockData';
import { QRCodeSVG } from './QRCodeSVG';
import { SafeImage } from './SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';
import {
  getCardPhotoUrl,
  downloadIdCardDirectImage,
  downloadIdCardDirectPdf,
  printIdCardDirect,
} from '../utils/idCardHelper';

interface PrintableIdCardProps {
  card: IdCard | null;
  onClose: () => void;
}

export const PrintableIdCard: React.FC<PrintableIdCardProps> = ({ card, onClose }) => {
  const { settings, setVerifyModalCard, language, t } = useTrust();
  const [viewSide, setViewSide] = useState<'both' | 'front' | 'back'>('both');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [printNotice, setPrintNotice] = useState(false);
  const cardSheetRef = useRef<HTMLDivElement>(null);

  if (!card) return null;

  const cardPhoto = getCardPhotoUrl(card);

  const categoryCfg =
    ID_CARD_CATEGORY_CONFIG[card.category] || ID_CARD_CATEGORY_CONFIG.beneficiary;

  const categoryTitle =
    language === 'en'
      ? categoryCfg?.titleEn || card.categoryLabelEn || card.categoryLabelHi
      : categoryCfg?.titleHi || card.categoryLabelHi;

  const handlePrint = async () => {
    if (!card) return;
    setIsPrinting(true);
    try {
      // 1. Guaranteed Fail-safe: Always generate and download the high-resolution Print-Ready A4 PDF
      const printFileName = `LKST-IDCard-Print-${card.cardNumber}.pdf`;
      await downloadIdCardDirectPdf(
        card,
        viewSide,
        settings,
        language,
        cardSheetRef.current,
        printFileName
      );

      // 2. Trigger browser print (offscreen frame and window.print)
      await printIdCardDirect(card, viewSide, settings, language, cardSheetRef.current);

      setPrintNotice(true);
      setDownloadSuccess(
        language === 'en'
          ? 'Print file prepared & PDF downloaded! You can print directly.'
          : 'प्रिंट फाइल तैयार हो गई है और A4 PDF डाउनलोड हो गई है! आप इसे सीधे प्रिंट कर सकते हैं।'
      );
    } catch (e) {
      console.warn('Print error fallback:', e);
      try {
        window.print();
      } catch {
        // ignore
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!card) return;
    setIsDownloading(true);
    try {
      const fileName = `LKST-IDCard-${card.cardNumber}`;
      const ok = await downloadIdCardDirectImage(
        card,
        viewSide,
        settings,
        language,
        cardSheetRef.current,
        fileName
      );
      if (ok) {
        setDownloadSuccess(
          language === 'en'
            ? 'PNG ID Card (with Photo) downloaded successfully!'
            : 'PNG फोटो आईडी कार्ड सफलतापूर्वक डाउनलोड हुआ!'
        );
        setTimeout(() => setDownloadSuccess(null), 4000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!card) return;
    setIsDownloadingPdf(true);
    try {
      const fileName = `LKST-IDCard-${card.cardNumber}.pdf`;
      const ok = await downloadIdCardDirectPdf(
        card,
        viewSide,
        settings,
        language,
        cardSheetRef.current,
        fileName
      );
      if (ok) {
        setDownloadSuccess(
          language === 'en'
            ? 'Official PDF ID Card (with Photo) downloaded successfully!'
            : 'आधिकारिक PDF कार्ड (फोटो सहित) सफलतापूर्वक डाउनलोड हुआ!'
        );
        setTimeout(() => setDownloadSuccess(null), 4000);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const isApproved = card.status === 'Active' || card.status === 'Approved';

  // Secure verification URL encoded in QR Code (NO sensitive documents or passwords exposed)
  const verificationPayload = `https://luvkushsevatrust.org/verify?card=${encodeURIComponent(
    card.cardNumber
  )}&reg=${encodeURIComponent(card.registrationNumber)}&code=${encodeURIComponent(
    card.verificationCode
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:static print:bg-transparent print:p-0 print:overflow-visible print:inset-auto print-id-modal-container">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 print-id-modal my-4 print:my-0 print:border-none print:shadow-none print:max-w-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 px-4 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm text-amber-300 block leading-tight">
                {t.idCard.officialIdCard}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {card.cardNumber} • {categoryTitle}
              </span>
            </div>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewSide('both')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewSide === 'both' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.bothSides}
              </button>
              <button
                onClick={() => setViewSide('front')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewSide === 'front' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.frontSide}
              </button>
              <button
                onClick={() => setViewSide('back')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewSide === 'back' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.backSide}
              </button>
            </div>

            <button
              onClick={() => setVerifyModalCard(card)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
              title={language === 'en' ? 'Security Verification' : 'सुरक्षा सत्यापन'}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.idCard.verifyCard}</span>
            </button>

            {/* Direct Download ID Card with Photo Button (PNG) */}
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading || isDownloadingPdf}
              className="px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 disabled:opacity-50"
              title={language === 'en' ? 'Download ID Card as Image (PNG with Photo)' : 'फोटो सहित आईडी कार्ड डाउनलोड करें (PNG)'}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'en' ? 'Downloading...' : 'डाउनलोड...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'PNG (with Photo)' : 'PNG (फोटो सहित)'}</span>
                </>
              )}
            </button>

            {/* Direct Download ID Card with Photo Button (PDF) */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading || isDownloadingPdf}
              className="px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95 disabled:opacity-50"
              title={language === 'en' ? 'Download Official PDF (with Photo)' : 'आधिकारिक PDF डाउनलोड करें (फोटो सहित)'}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'en' ? 'Generating...' : 'तैयार हो रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'PDF (with Photo)' : 'PDF (फोटो सहित)'}</span>
                </>
              )}
            </button>

            {/* Print ID Card Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting || isDownloading || isDownloadingPdf}
              className="px-4 py-1.5 text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95 disabled:opacity-50"
              title={language === 'en' ? 'Print Official ID Card' : 'आईडी कार्ड प्रिंट करें'}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'en' ? 'Preparing Print...' : 'प्रिंट तैयार हो रहा है...'}</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.idCard.printCard}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Print Notification Banner */}
        {printNotice && (
          <div className="no-print bg-amber-50 border-b-2 border-amber-300 px-4 sm:px-6 py-3 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-start sm:items-center gap-2.5">
              <Printer className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong className="block text-amber-900 font-bold text-sm">
                  {language === 'en' ? '🖨️ ID Card Print Document Ready!' : '🖨️ पहचान पत्र प्रिंट दस्तावेज़ तैयार है!'}
                </strong>
                <span className="text-slate-700">
                  {language === 'en'
                    ? 'Official A4 Print-ready PDF has been downloaded. You can send it directly to your printer or click below to open printer dialog.'
                    : 'आपके पहचान पत्र की A4 प्रिंट-रेडी PDF फाइल डाउनलोड हो गई है। आप इसे सीधे प्रिंटर पर भेज सकते हैं या नीचे दिए बटन से प्रिंट डायलॉग फिर से खोल सकते हैं।'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch {
                    // ignore
                  }
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Retry Printer Dialog' : 'प्रिंटर डायलॉग खोलें'}</span>
              </button>
              <button
                onClick={() => setPrintNotice(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Alert Banner when Download Completes */}
        {downloadSuccess && !printNotice && (
          <div className="no-print bg-emerald-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>{downloadSuccess}</span>
            </div>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-emerald-200 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Alert if Pending or Suspended */}
        {!isApproved && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {language === 'en'
                ? `This ID card is currently in ${card.status} status. It will be activated upon completion of physical verification.`
                : `यह पहचान पत्र वर्तमान में ${card.status} स्थिति में है। कार्डधारक का भौतिक सत्यापन पूर्ण होने पर इसे सक्रिय कर दिया जाएगा।`}
            </span>
          </div>
        )}

        {/* Modal Printable Workspace */}
        <div className="p-4 sm:p-8 bg-slate-100 flex flex-col items-center justify-center space-y-6">
          
          <div className="no-print text-center text-xs text-slate-500">
            {language === 'en'
              ? 'CR80 Standard Wallet Card Ratio (85.6mm × 54mm) • Print in A4 layout'
              : 'मानक वॉलेट साइज (CR80 Standard Wallet Card Ratio • 85.6mm × 54mm) • A4 लेआउट में प्रिंट करें'}
          </div>

          {/* CARDS DISPLAY CONTAINER */}
          <div
            ref={cardSheetRef}
            className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-3xl p-2 bg-slate-100 rounded-2xl"
          >

            {/* ==================== FRONT SIDE ==================== */}
            {(viewSide === 'both' || viewSide === 'front') && (
              <div
                className="w-full max-w-[390px] aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-2 border-slate-300 overflow-hidden flex flex-col justify-between relative print-card select-none"
                style={{ minHeight: '246px' }}
              >
                {/* Background Subtle Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                  <SafeImage
                    src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                    alt="Watermark"
                    className="w-48 h-48 object-contain"
                  />
                </div>

                {/* Top Header Strip */}
                <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-3 py-2 flex items-center justify-between border-b-2 border-amber-400 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-amber-300 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                      <SafeImage
                        src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-[13px] font-black tracking-tight leading-none text-white drop-shadow-sm">
                        LUV KUSH SEVA TRUST
                      </h2>
                      <h3 className="text-[10px] font-extrabold text-amber-200 leading-tight">
                        {language === 'en' ? 'Luv Kush Seva Trust, Rajgir' : 'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा)'}
                      </h3>
                      <p className="text-[7.5px] font-medium text-slate-100">
                        {language === 'en' ? 'Dedicated to Service, Education, Health and Humanity' : settings.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Micro Emblem / Registration Badge */}
                  <div className="text-right">
                    <span className="text-[7px] block font-mono text-amber-200">
                      Reg. BR/2026/1161821
                    </span>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[7.5px] rounded uppercase tracking-wider">
                      {card.cardType.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Category Ribbon */}
                <div className="bg-blue-950 text-white px-3 py-0.5 text-center text-[9px] font-bold tracking-wider uppercase flex items-center justify-between">
                  <span>{categoryTitle}</span>
                  <span className="font-mono text-amber-300 text-[8.5px]">{card.cardNumber}</span>
                </div>

                {/* Body: Photo Left, Details Right */}
                <div className="px-3.5 py-2 flex-1 flex items-center gap-3 relative z-10">
                  {/* Photo Container with Official Photo */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-20 h-24 rounded-lg border-2 border-slate-300 bg-slate-50 overflow-hidden shadow-sm relative flex items-center justify-center">
                      <img
                        src={cardPhoto}
                        alt={card.fullName}
                        className="w-full h-full object-cover"
                        crossOrigin={cardPhoto.startsWith('http') ? 'anonymous' : undefined}
                      />
                      {/* Approved Seal Badge on Photo */}
                      {isApproved && (
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-700/90 text-white text-[7px] font-bold text-center py-0.2 tracking-wider">
                          {language === 'en' ? 'VERIFIED' : 'सत्यापित'}
                        </div>
                      )}
                    </div>
                    <span className="text-[7.5px] font-mono text-slate-500 mt-1 font-bold">
                      {card.bloodGroup ? (language === 'en' ? `Blood: ${card.bloodGroup}` : `रक्त: ${card.bloodGroup}`) : `ID: ${card.registrationNumber}`}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="flex-1 min-w-0 space-y-1 text-[9.5px]">
                    <div className="border-b border-slate-200 pb-0.5">
                      <span className="text-[7.5px] text-slate-500 uppercase block font-semibold leading-none">
                        {t.idCard.holderName}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-[12px] truncate leading-tight">
                        {card.fullName}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px]">
                      <div>
                        <span className="text-[7px] text-slate-400 block">{t.idCard.fatherHusband}:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {card.fatherOrHusbandName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-400 block">{t.idCard.dobLabel}:</span>
                        <span className="font-mono font-semibold text-slate-800 block">
                          {card.dob}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-400 block">{t.idCard.categoryLabel}:</span>
                        <span className="font-semibold text-blue-900 block truncate">
                          {card.roleOrClass || card.gender}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-400 block">{t.idCard.mobileLabel}:</span>
                        <span className="font-mono font-semibold text-slate-800 block">
                          {card.mobile}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[7px] text-slate-400 block">{t.idCard.regNumber}:</span>
                        <span className="font-mono font-bold text-red-700 block truncate">
                          {card.registrationNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Front Footer: Issue Date, Validity & Authorized Seal */}
                <div className="bg-slate-50 px-3 py-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600 relative z-10">
                  <div>
                    <span>{t.idCard.issueDateLabel}: <strong>{card.issueDate}</strong></span>
                    <span className="mx-1 text-slate-300">•</span>
                    <span>{t.idCard.validTillLabel}: <strong className="text-emerald-700">{card.validTill}</strong></span>
                  </div>

                  {/* Signatory */}
                  <div className="text-right">
                    <div className="font-serif italic font-bold text-[8.5px] text-blue-950 leading-none">
                      {language === 'en' ? 'Satyendra Kumar' : 'सत्येन्द्र कुमार'}
                    </div>
                    <span className="text-[6.5px] text-slate-500 block leading-tight font-semibold">
                      {t.idCard.authorizedSignature}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== BACK SIDE ==================== */}
            {(viewSide === 'both' || viewSide === 'back') && (
              <div
                className="w-full max-w-[390px] aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-2 border-slate-300 overflow-hidden flex flex-col justify-between relative print-card select-none"
                style={{ minHeight: '246px' }}
              >
                {/* Top Header */}
                <div className="bg-blue-950 text-white px-3 py-1.5 flex items-center justify-between border-b border-amber-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <SafeImage
                        src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide">
                      {language === 'en' ? 'LUV KUSH SEVA TRUST (RAJGIR)' : 'लव कुश सेवा ट्रस्ट (राजगीर)'}
                    </span>
                  </div>
                  <span className="text-[7.5px] font-mono text-slate-300">
                    {language === 'en' ? 'Reg. BR/2026/1161821' : 'पंजी BR/2026/1161821'}
                  </span>
                </div>

                {/* Middle Content: Instructions + Secure QR */}
                <div className="p-3 flex-1 flex items-start gap-3">
                  
                  {/* Left: Important Instructions & Address */}
                  <div className="flex-1 space-y-1.5 text-[8px] text-slate-700 leading-snug">
                    <div>
                      <strong className="text-[8.5px] text-slate-900 block font-bold">
                        {language === 'en' ? 'Important Instructions:' : 'आवश्यक निर्देश:'}
                      </strong>
                      <ul className="list-disc list-inside space-y-0.5 text-[7.5px] text-slate-600 pl-0.5">
                        {language === 'en' ? (
                          <>
                            <li>This ID card is valid only for authorized person.</li>
                            <li>In case of loss or damage, inform the trust immediately.</li>
                            <li>Mandatory for all free services offered by the trust.</li>
                            <li>This card is non-transferable.</li>
                          </>
                        ) : (
                          <>
                            <li>यह पहचान पत्र केवल अधिकृत व्यक्ति हेतु ही मान्य है।</li>
                            <li>कार्ड खोने अथवा क्षतिग्रस्त होने पर तुरंत संस्था को सूचित करें।</li>
                            <li>ट्रस्ट की सभी निःशुल्क सेवाओं हेतु यह कार्ड अनिवार्य है।</li>
                            <li>यह कार्ड अहस्तांतरणीय है।</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100 pt-1 text-[7.5px]">
                      <div className="flex items-start gap-1 text-slate-800">
                        <MapPin className="w-2.5 h-2.5 text-red-600 shrink-0 mt-0.5" />
                        <span>{language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir (Nalanda) Bihar - 803116' : settings.address}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-800 mt-0.5 font-bold">
                        <Phone className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                        <span>{language === 'en' ? 'Helpline / WhatsApp:' : 'हेल्पलाइन / WhatsApp:'} {settings.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Secure QR Code for instant scan verification */}
                  <div className="shrink-0 flex flex-col items-center justify-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <QRCodeSVG
                      value={verificationPayload}
                      size={76}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                    <span className="text-[6.5px] font-mono font-bold text-slate-700 mt-1 uppercase text-center block">
                      {t.idCard.scanToVerify}
                    </span>
                    <span className="text-[5.5px] font-mono text-slate-400 text-center block">
                      {card.verificationCode}
                    </span>
                  </div>

                </div>

                {/* Back Bottom Ribbon */}
                <div className="bg-slate-900 text-white px-3 py-1 text-center text-[7.5px] font-semibold flex items-center justify-between">
                  <span>“{language === 'en' ? 'Selfless Service is our Mission, Humanity is our Religion' : 'सेवा ही संकल्प, मानवता ही हमारा धर्म'}”</span>
                  <span className="text-amber-300 font-mono">www.luvkushsevatrust.org</span>
                </div>
              </div>
            )}

          </div>

          {/* Quick Notice under modal for User Convenience */}
          <div className="no-print max-w-xl text-center text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.idCard.digitalIdLabel}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t.idCard.printNotice}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
