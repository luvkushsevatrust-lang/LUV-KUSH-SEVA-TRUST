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

  const isActive = card.status === 'Active';
  const isApproved = isActive;

  const handlePrint = async () => {
    if (!card) return;
    if (!isActive) {
      alert(
        language === 'en'
          ? `Print Locked: This ID card is currently ${card.status}. Only officially Active ID cards can be printed.`
          : `प्रिंट वर्जित: यह पहचान पत्र अभी सक्रिय (Active) नहीं है (स्थिति: ${card.status === 'Pending' ? 'लंबित' : card.status})। ट्रस्ट द्वारा सक्रिय (Active) होने के उपरांत ही प्रिंट किया जा सकता है।`
      );
      return;
    }
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
    if (!isActive) {
      alert(
        language === 'en'
          ? `Download Locked: This ID card is currently ${card.status}. Only officially Active ID cards can be downloaded.`
          : `डाउनलोड वर्जित: यह पहचान पत्र अभी सक्रिय (Active) नहीं है (स्थिति: ${card.status === 'Pending' ? 'लंबित' : card.status})। सक्रिय होने के बाद ही डाउनलोड संभव है।`
      );
      return;
    }
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
    if (!isActive) {
      alert(
        language === 'en'
          ? `PDF Download Locked: This ID card is currently ${card.status}. Only officially Active ID cards can be downloaded.`
          : `PDF डाउनलोड वर्जित: यह पहचान पत्र अभी सक्रिय (Active) नहीं है (स्थिति: ${card.status === 'Pending' ? 'लंबित' : card.status})। सक्रिय होने के बाद ही डाउनलोड संभव है।`
      );
      return;
    }
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

  // Secure verification URL encoded in QR Code (NO sensitive documents or passwords exposed)
  const verificationPayload = `https://luvkushsevatrust.org/verify?card=${encodeURIComponent(
    card.cardNumber
  )}&reg=${encodeURIComponent(card.registrationNumber)}&code=${encodeURIComponent(
    card.verificationCode
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 print:static print:bg-transparent print:p-0 print:overflow-visible print:inset-auto print-id-modal-container">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-300 print-id-modal my-2 print:my-0 print:border-none print:shadow-none print:max-w-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 px-3 sm:px-4 py-2 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-amber-300 block leading-tight">
                  {t.idCard.officialIdCard}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950 font-black'
                }`}>
                  {isActive ? (language === 'en' ? 'Active' : 'सक्रिय') : (language === 'en' ? `Pending (${card.status})` : `लंबित (${card.status})`)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {card.cardNumber} • {categoryTitle}
              </span>
            </div>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="hidden sm:flex items-center bg-slate-800 rounded-md p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setViewSide('both')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  viewSide === 'both' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.bothSides}
              </button>
              <button
                onClick={() => setViewSide('front')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  viewSide === 'front' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.frontSide}
              </button>
              <button
                onClick={() => setViewSide('back')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  viewSide === 'back' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t.idCard.backSide}
              </button>
            </div>

            {/* 1. Security Verification Button */}
            <button
              onClick={() => setVerifyModalCard(card)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              title={language === 'en' ? 'Security Verification' : 'सुरक्षा सत्यापन'}
            >
              <BadgeCheck className="w-3 h-3" />
              <span className="hidden sm:inline">{t.idCard.verifyCard}</span>
              {!isActive && <span className="text-[9px] font-mono">({card.status})</span>}
            </button>

            {/* 2. Direct Download ID Card with Photo Button (PNG) */}
            <button
              onClick={handleDownloadImage}
              disabled={!isActive || isDownloading || isDownloadingPdf}
              className={`px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-50 shadow-none'
              }`}
              title={
                !isActive
                  ? (language === 'en' ? 'ID Card is Pending / Inactive — Download locked' : 'पहचान पत्र सक्रिय नहीं है — डाउनलोड लॉक है')
                  : (language === 'en' ? 'Download ID Card as Image (PNG with Photo)' : 'फोटो सहित आईडी कार्ड डाउनलोड करें (PNG)')
              }
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{language === 'en' ? 'Downloading...' : 'डाउनलोड...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>{language === 'en' ? 'PNG' : 'PNG (फोटो)'}</span>
                  {!isActive && <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded text-amber-300 font-mono">🔒</span>}
                </>
              )}
            </button>

            {/* 3. Direct Download ID Card with Photo Button (PDF) */}
            <button
              onClick={handleDownloadPdf}
              disabled={!isActive || isDownloading || isDownloadingPdf}
              className={`px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-50 shadow-none'
              }`}
              title={
                !isActive
                  ? (language === 'en' ? 'ID Card is Pending / Inactive — PDF locked' : 'पहचान पत्र सक्रिय नहीं है — PDF लॉक है')
                  : (language === 'en' ? 'Download Official PDF (with Photo)' : 'आधिकारिक PDF डाउनलोड करें (फोटो सहित)')
              }
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{language === 'en' ? 'Generating...' : 'तैयार...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" />
                  <span>{language === 'en' ? 'PDF' : 'PDF (फोटो)'}</span>
                  {!isActive && <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded text-amber-300 font-mono">🔒</span>}
                </>
              )}
            </button>

            {/* 4. Print ID Card Button */}
            <button
              onClick={handlePrint}
              disabled={!isActive || isPrinting || isDownloading || isDownloadingPdf}
              className={`px-3 py-1 text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-50 shadow-none'
              }`}
              title={
                !isActive
                  ? (language === 'en' ? 'ID Card is Pending / Inactive — Print locked' : 'पहचान पत्र सक्रिय नहीं है — प्रिंट लॉक है')
                  : (language === 'en' ? 'Print Official ID Card' : 'आईडी कार्ड प्रिंट करें')
              }
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{language === 'en' ? 'Printing...' : 'प्रिंट...'}</span>
                </>
              ) : (
                <>
                  <Printer className="w-3 h-3" />
                  <span>{t.idCard.printCard}</span>
                  {!isActive && <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded text-amber-300 font-mono">🔒</span>}
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Print Notification Banner */}
        {printNotice && isActive && (
          <div className="no-print bg-amber-50 border-b border-amber-300 px-3 sm:px-4 py-2 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-inner">
            <div className="flex items-start sm:items-center gap-2">
              <Printer className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong className="block text-amber-900 font-bold text-xs">
                  {language === 'en' ? '🖨️ ID Card Print Document Ready!' : '🖨️ पहचान पत्र प्रिंट दस्तावेज़ तैयार है!'}
                </strong>
                <span className="text-slate-700 text-[11px]">
                  {language === 'en'
                    ? 'Official A4 Print-ready PDF has been downloaded.'
                    : 'A4 प्रिंट-रेडी PDF फाइल डाउनलोड हो गई है।'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch {
                    // ignore
                  }
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Printer className="w-3 h-3" />
                <span>{language === 'en' ? 'Printer Dialog' : 'प्रिंटर डायलॉग'}</span>
              </button>
              <button
                onClick={() => setPrintNotice(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Success Alert Banner when Download Completes */}
        {downloadSuccess && !printNotice && (
          <div className="no-print bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-[11px]">{downloadSuccess}</span>
            </div>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-emerald-200 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Strict Status Alert if Pending or Inactive */}
        {!isActive && (
          <div className="no-print border-b border-amber-300 px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 bg-amber-50">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong className="text-amber-900 font-bold block text-xs">
                  {language === 'en'
                    ? `⚠️ ID Card is NOT Active (Status: ${card.status})`
                    : `⚠️ पहचान पत्र सक्रिय (Active) नहीं है — स्थिति: ${card.status === 'Pending' ? 'लंबित' : card.status}`}
                </strong>
                <span className="text-amber-800 text-[11px]">
                  {language === 'en'
                    ? 'Print and download features are locked until approved and activated.'
                    : 'प्रिंट एवं डाउनलोड लॉक हैं। ट्रस्ट द्वारा सक्रिय (Active) करने के बाद ही प्रिंट होगा।'}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                {card.status === 'Pending' ? (language === 'en' ? 'PENDING' : 'लंबित') : card.status}
              </span>
            </div>
          </div>
        )}

        {/* Modal Printable Workspace */}
        <div className="p-3 sm:p-4 bg-slate-100 flex flex-col items-center justify-center space-y-2.5">
          
          <div className="no-print text-center text-[10.5px] text-slate-500">
            {language === 'en'
              ? 'CR80 Standard Wallet Card (85.6mm × 54mm) • A4 Print Layout'
              : 'मानक वॉलेट साइज (CR80 Standard • 85.6mm × 54mm) • A4 लेआउट'}
          </div>

          {/* Print Protection Notice for Pending / Inactive ID Cards */}
          {!isActive && (
            <div className="hidden print:flex flex-col items-center justify-center min-h-[350px] p-6 text-center border-4 border-dashed border-red-600 rounded-2xl m-4 bg-red-50">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-red-700 mb-1.5">
                {language === 'en' ? '⚠️ PRINT NOT PERMITTED: ID CARD NOT ACTIVE' : '⚠️ प्रिंट वर्जित: पहचान पत्र सक्रिय (Active) नहीं है'}
              </h2>
              <p className="text-sm font-bold text-slate-800 mb-1">
                {card.cardNumber} • {card.fullName} • {language === 'en' ? `Status: ${card.status}` : `स्थिति: ${card.status === 'Pending' ? 'लंबित (Pending)' : card.status}`}
              </p>
              <p className="text-xs text-slate-600 max-w-md mt-1">
                {language === 'en'
                  ? 'ID cards in Pending status cannot be printed or downloaded until officially approved and marked Active by an administrator.'
                  : 'लंबित पहचान पत्र व्यवस्थापक द्वारा आधिकारिक रूप से सक्रिय (Active) किए बिना प्रिंट अथवा उपयोग नहीं किए जा सकते।'}
              </p>
            </div>
          )}

          {/* CARDS DISPLAY CONTAINER */}
          <div
            ref={cardSheetRef}
            className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full p-1 bg-slate-100 rounded-xl ${
              !isActive ? 'print:hidden' : ''
            }`}
          >

            {/* ==================== FRONT SIDE ==================== */}
            {(viewSide === 'both' || viewSide === 'front') && (
              <div
                className="w-full max-w-[325px] aspect-[1.586/1] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between relative print-card select-none"
                style={{ minHeight: '205px' }}
              >
                {/* Pending / Inactive Diagonal Watermark Overlay */}
                {!isActive && (
                  <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
                    <div className="transform -rotate-25 border-2 border-amber-600/70 bg-amber-500/30 text-amber-950 px-3 py-1 rounded-lg font-black text-[10.5px] tracking-wider uppercase shadow-md select-none backdrop-blur-[1px]">
                      {language === 'en' ? '⚠️ PENDING - NOT ACTIVE' : '⚠️ लंबित - सक्रिय नहीं है'}
                    </div>
                  </div>
                )}

                {/* Background Subtle Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                  <SafeImage
                    src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                    alt="Luv Kush Seva Trust Security Watermark"
                    className="w-40 h-40 object-contain"
                  />
                </div>

                {/* Top Header Strip */}
                <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-2.5 py-1.5 flex items-center justify-between border-b border-amber-400 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-white p-0.5 border border-amber-300 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                      <SafeImage
                        src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                        alt="Luv Kush Seva Trust Official Emblem"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-[11px] font-black tracking-tight leading-none text-white drop-shadow-xs">
                        LUV KUSH SEVA TRUST
                      </h2>
                      <h3 className="text-[8.5px] font-extrabold text-amber-200 leading-tight">
                        {language === 'en' ? 'Luv Kush Seva Trust, Rajgir' : 'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा)'}
                      </h3>
                      <p className="text-[6.5px] font-medium text-slate-100 leading-none">
                        {language === 'en' ? 'Dedicated to Service & Humanity' : settings.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Micro Emblem / Registration Badge */}
                  <div className="text-right">
                    <span className="text-[6.5px] block font-mono text-amber-200">
                      Reg. BR/2026/1161821
                    </span>
                    <span className={`inline-block mt-0.5 px-1 py-0.2 font-black text-[6.5px] rounded uppercase tracking-wider ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-red-500 text-white'
                    }`}>
                      {isActive ? card.cardType.split(' ')[0] : (language === 'en' ? 'PENDING' : 'लंबित')}
                    </span>
                  </div>
                </div>

                {/* Category Ribbon */}
                <div className="bg-blue-950 text-white px-2.5 py-0.5 text-center text-[8px] font-bold tracking-wider uppercase flex items-center justify-between">
                  <span>{categoryTitle}</span>
                  <span className="font-mono text-amber-300 text-[7.5px]">{card.cardNumber}</span>
                </div>

                {/* Body: Photo Left, Details Right */}
                <div className="px-2.5 py-1.5 flex-1 flex items-center gap-2 relative z-10">
                  {/* Photo Container with Official Photo */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-16 h-20 rounded-md border border-slate-300 bg-slate-50 overflow-hidden shadow-xs relative flex items-center justify-center">
                      <img
                        src={cardPhoto}
                        alt={card.fullName}
                        className="w-full h-full object-cover"
                        crossOrigin={cardPhoto.startsWith('http') ? 'anonymous' : undefined}
                      />
                      {/* Approved Seal Badge on Photo */}
                      {isActive ? (
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-700/90 text-white text-[6px] font-bold text-center py-0.2 tracking-wider">
                          {language === 'en' ? 'ACTIVE' : 'सक्रिय'}
                        </div>
                      ) : (
                        <div className="absolute bottom-0 inset-x-0 bg-amber-600/95 text-white text-[6px] font-bold text-center py-0.2 tracking-wider">
                          {language === 'en' ? 'PENDING' : 'लंबित'}
                        </div>
                      )}
                    </div>
                    <span className="text-[6.5px] font-mono text-slate-500 mt-0.5 font-bold">
                      {card.bloodGroup ? (language === 'en' ? `Bld: ${card.bloodGroup}` : `रक्त: ${card.bloodGroup}`) : `ID: ${card.registrationNumber}`}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="flex-1 min-w-0 space-y-0.5 text-[8.5px]">
                    <div className="border-b border-slate-200 pb-0.5">
                      <span className="text-[6.5px] text-slate-500 uppercase block font-semibold leading-none">
                        {t.idCard.holderName}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-[10.5px] truncate leading-tight">
                        {card.fullName}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[7.5px]">
                      <div>
                        <span className="text-[6.5px] text-slate-400 block">{t.idCard.fatherHusband}:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {card.fatherOrHusbandName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[6.5px] text-slate-400 block">{t.idCard.dobLabel}:</span>
                        <span className="font-mono font-semibold text-slate-800 block">
                          {card.dob}
                        </span>
                      </div>
                      <div>
                        <span className="text-[6.5px] text-slate-400 block">{t.idCard.categoryLabel}:</span>
                        <span className="font-semibold text-blue-900 block truncate">
                          {card.roleOrClass || card.gender}
                        </span>
                      </div>
                      <div>
                        <span className="text-[6.5px] text-slate-400 block">{t.idCard.mobileLabel}:</span>
                        <span className="font-mono font-semibold text-slate-800 block">
                          {card.mobile}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[6.5px] text-slate-400 block">{t.idCard.regNumber}:</span>
                        <span className="font-mono font-bold text-red-700 block truncate">
                          {card.registrationNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Front Footer: Issue Date, Validity & Authorized Seal */}
                <div className="bg-slate-50 px-2.5 py-0.5 border-t border-slate-200 flex items-center justify-between text-[7px] text-slate-600 relative z-10">
                  <div>
                    <span>{t.idCard.issueDateLabel}: <strong>{card.issueDate}</strong></span>
                    <span className="mx-1 text-slate-300">•</span>
                    <span>{t.idCard.validTillLabel}: <strong className="text-emerald-700">{card.validTill}</strong></span>
                  </div>

                  {/* Signatory */}
                  <div className="text-right">
                    <div className="font-serif italic font-bold text-[7.5px] text-blue-950 leading-none">
                      {language === 'en' ? 'Satyendra Kumar' : 'सत्येन्द्र कुमार'}
                    </div>
                    <span className="text-[5.5px] text-slate-500 block leading-tight font-semibold">
                      {t.idCard.authorizedSignature}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== BACK SIDE ==================== */}
            {(viewSide === 'both' || viewSide === 'back') && (
              <div
                className="w-full max-w-[325px] aspect-[1.586/1] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between relative print-card select-none"
                style={{ minHeight: '205px' }}
              >
                {/* Pending / Inactive Diagonal Watermark Overlay */}
                {!isActive && (
                  <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
                    <div className="transform -rotate-25 border-2 border-amber-600/70 bg-amber-500/30 text-amber-950 px-3 py-1 rounded-lg font-black text-[10.5px] tracking-wider uppercase shadow-md select-none backdrop-blur-[1px]">
                      {language === 'en' ? '⚠️ PENDING - NOT ACTIVE' : '⚠️ लंबित - सक्रिय नहीं है'}
                    </div>
                  </div>
                )}

                {/* Top Header */}
                <div className="bg-blue-950 text-white px-2.5 py-1 flex items-center justify-between border-b border-amber-400">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <SafeImage
                        src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                        alt="Luv Kush Seva Trust Official Emblem"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <span className="text-[8.5px] font-black text-amber-300 uppercase tracking-wide">
                      {language === 'en' ? 'LUV KUSH SEVA TRUST' : 'लव कुश सेवा ट्रस्ट (राजगीर)'}
                    </span>
                  </div>
                  <span className="text-[6.5px] font-mono text-slate-300">
                    {language === 'en' ? 'Reg. BR/2026/1161821' : 'पंजी BR/2026/1161821'}
                  </span>
                </div>

                {/* Middle Content: Instructions + Secure QR */}
                <div className="p-2 flex-1 flex items-start gap-2">
                  
                  {/* Left: Important Instructions & Address */}
                  <div className="flex-1 space-y-1 text-[7px] text-slate-700 leading-snug">
                    <div>
                      <strong className="text-[7.5px] text-slate-900 block font-bold">
                        {language === 'en' ? 'Instructions:' : 'आवश्यक निर्देश:'}
                      </strong>
                      <ul className="list-disc list-inside space-y-0.2 text-[6.5px] text-slate-600 pl-0.5">
                        {language === 'en' ? (
                          <>
                            <li>Valid only for authorized person.</li>
                            <li>In case of loss, inform trust immediately.</li>
                            <li>Mandatory for all free services.</li>
                            <li>Non-transferable card.</li>
                          </>
                        ) : (
                          <>
                            <li>यह कार्ड केवल अधिकृत व्यक्ति हेतु ही मान्य है।</li>
                            <li>खो जाने पर तुरंत संस्था को सूचित करें।</li>
                            <li>निःशुल्क सेवाओं हेतु यह कार्ड अनिवार्य है।</li>
                            <li>यह कार्ड अहस्तांतरणीय है।</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100 pt-0.5 text-[6.5px]">
                      <div className="flex items-start gap-1 text-slate-800">
                        <MapPin className="w-2 h-2 text-red-600 shrink-0 mt-0.5" />
                        <span className="truncate">{settings.address}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <Phone className="w-2 h-2 text-emerald-700 shrink-0" />
                        <span>{settings.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Secure QR Code for instant scan verification */}
                  <div className="shrink-0 flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <QRCodeSVG
                      value={verificationPayload}
                      size={58}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                    <span className="text-[5.5px] font-mono font-bold text-slate-700 mt-0.5 uppercase text-center block">
                      {t.idCard.scanToVerify}
                    </span>
                    <span className="text-[5px] font-mono text-slate-400 text-center block">
                      {card.verificationCode}
                    </span>
                  </div>

                </div>

                {/* Back Bottom Ribbon */}
                <div className="bg-slate-900 text-white px-2.5 py-0.5 text-center text-[6.5px] font-semibold flex items-center justify-between">
                  <span>“{language === 'en' ? 'Selfless Service is our Mission' : 'सेवा ही संकल्प, मानवता धर्म'}”</span>
                  <span className="text-amber-300 font-mono">www.luvkushsevatrust.org</span>
                </div>
              </div>
            )}

          </div>

          {/* Quick Notice under modal for User Convenience */}
          <div className="no-print max-w-lg text-center text-[10.5px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.idCard.digitalIdLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {t.idCard.printNotice}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
