import React, { useRef, useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { X, Printer, CheckCircle, Download, CreditCard, ZoomIn, ZoomOut } from 'lucide-react';
import { downloadElementAsPdf } from '../utils/idCardHelper';
import { SafeImage } from './SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';

export const PrintableReceipt: React.FC = () => {
  const { activeReceipt, setActiveReceipt, settings, language, t } = useTrust();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isCompact, setIsCompact] = useState(true);

  if (!activeReceipt) return null;

  const { type, data } = activeReceipt;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename =
        type === 'donation'
          ? `LKST-Donation-${data.receiptNumber || 'Receipt'}.pdf`
          : `LKST-Application-${data.id || data.registrationNumber || 'Doc'}.pdf`;
      await downloadElementAsPdf(receiptRef.current, filename);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container with responsive compact or normal width */}
      <div
        className={`bg-white rounded-2xl shadow-2xl ${
          isCompact ? 'max-w-lg' : 'max-w-2xl'
        } w-full overflow-hidden border border-slate-300 print-page my-3 transition-all duration-200`}
      >
        {/* Actions Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
          <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {type === 'donation'
                ? (language === 'en' ? 'Official Donation Receipt' : 'आधिकारिक दान पावती रसीद')
                : (language === 'en' ? 'Official Application Slip' : 'आधिकारिक आवेदन पावती रसीद')}
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Size Toggle (Compact / Normal) */}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-600 transition-colors cursor-pointer"
              title={
                isCompact
                  ? (language === 'en' ? 'Switch to Normal Size' : 'बड़ा आकार देखें')
                  : (language === 'en' ? 'Switch to Compact Size' : 'छोटा आकार देखें')
              }
            >
              {isCompact ? (
                <>
                  <ZoomIn className="w-3 h-3 text-amber-400" />
                  <span>{language === 'en' ? 'Expand' : 'बड़ा करें'}</span>
                </>
              ) : (
                <>
                  <ZoomOut className="w-3 h-3 text-amber-400" />
                  <span>{language === 'en' ? 'Compact' : 'छोटा करें'}</span>
                </>
              )}
            </button>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              title={language === 'en' ? 'Download Official PDF' : 'आधिकारिक PDF डाउनलोड करें'}
            >
              <Download className="w-3 h-3" />
              <span>
                {isDownloadingPdf
                  ? (language === 'en' ? 'Saving...' : 'सहेज रहे हैं...')
                  : (language === 'en' ? 'PDF' : 'PDF')}
              </span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              title={language === 'en' ? 'Print Document' : 'प्रिंट करें'}
            >
              <Printer className="w-3 h-3" />
              <span>{language === 'en' ? 'Print' : 'प्रिंट'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setActiveReceipt(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer ml-1"
              title={language === 'en' ? 'Close' : 'बंद करें'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Slip Document (Clean, Compact, Well-Proportioned) */}
        <div
          ref={receiptRef}
          className="p-4 sm:p-5 bg-white text-slate-800 space-y-3.5 border-2 border-amber-600/30 m-2 sm:m-3 rounded-xl relative text-xs"
        >
          {/* Subtle Watermark Emblem Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
            <SafeImage
              src={settings?.logoUrl || TRUST_EMBLEM_LOGO}
              alt="Seal"
              className="w-48 h-48 object-contain"
            />
          </div>

          {/* Top Trust Header */}
          <div className="text-center pb-2.5 border-b-2 border-slate-800">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <div className="w-11 h-11 rounded-full border border-amber-500 p-0.5 bg-white shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
                <SafeImage
                  src={settings?.logoUrl || TRUST_EMBLEM_LOGO}
                  alt="Luv Kush Seva Trust Official Emblem"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-black text-red-600 tracking-tight leading-none">
                  LUV KUSH SEVA TRUST
                </h2>
                <h3 className="text-xs sm:text-sm font-bold text-blue-900 leading-tight">
                  {language === 'en' ? 'Luv Kush Seva Trust, Rajgir' : 'लव कुश सेवा ट्रस्ट, राजगीर'}
                </h3>
              </div>
            </div>

            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              " {language === 'en' ? 'Dedicated to Service, Education, Health and Humanity' : settings.tagline} "
            </p>
            <p className="text-[9.5px] text-slate-600 mt-0.5 font-medium">
              {t.banner.regNumberLabel} : <strong className="font-mono text-slate-900">{settings.registrationNumber}</strong> | {language === 'en' ? 'Chairperson' : 'अध्यक्ष'}: <strong className="text-slate-900">{language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}</strong>
            </p>
            <p className="text-[9px] text-slate-500">
              {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir (Nalanda) Bihar - 803116' : settings.address} | {t.contact.phoneTitle}: {settings.phone}
            </p>
          </div>

          {/* Document Title Badge */}
          <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">
                {type === 'donation'
                  ? (language === 'en' ? 'Receipt Number' : 'रसीद संख्या')
                  : (language === 'en' ? 'Application ID' : 'आवेदन संख्या')}
              </span>
              <span className="text-sm font-bold font-mono text-blue-900">
                {type === 'donation' ? data.receiptNumber : data.id}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">
                {language === 'en' ? 'Date' : 'दिनांक'}
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {new Date(data.donatedAt || data.submittedAt || Date.now()).toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Detail Content Table */}
          {type === 'donation' ? (
            <div className="space-y-3">
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 w-1/3 text-[11px]">
                        {language === 'en' ? 'Donor Name:' : 'दानदाता का नाम:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">{data.donorName}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Mobile Number:' : 'मोबाइल नंबर:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-800">{data.mobile}</td>
                    </tr>
                    {data.email && (
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                          {language === 'en' ? 'Email:' : 'ईमेल:'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-800">{data.email}</td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Payment Method:' : 'भुगतान माध्यम:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800">{data.paymentMethod}</td>
                    </tr>
                    {data.transactionId && (
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                          {language === 'en' ? 'Transaction ID (Ref):' : 'ट्रांजैक्शन आईडी (Ref):'}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-800">{data.transactionId}</td>
                      </tr>
                    )}
                    {data.message && (
                      <tr className="border-b border-slate-200">
                        <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                          {language === 'en' ? 'Purpose / Message:' : 'उद्देश्य / सन्देश:'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-800">{data.message}</td>
                      </tr>
                    )}
                    <tr className="bg-amber-50/80 font-bold">
                      <td className="py-2 px-2.5 text-slate-900 text-xs">
                        {language === 'en' ? 'Donation Amount Received:' : 'प्राप्त दान राशि:'}
                      </td>
                      <td className="py-2 px-2.5 text-red-700 text-base font-black">
                        ₹ {data.amount.toLocaleString('en-IN')} /-
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[10.5px] leading-relaxed text-emerald-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'en'
                    ? 'Luv Kush Seva Trust expresses heartfelt gratitude for your generous support. Your contribution is utilized transparently for the welfare of the underprivileged, children and senior citizens.'
                    : 'लव कुश सेवा ट्रस्ट आपके इस अमूल्य सहयोग के लिए हार्दिक आभार व्यक्त करता है। आपकी दान राशि पूर्णतः पारदर्शी रूप से दीन-दुखियों, बच्चों एवं बुजुर्गों की सेवा में उपयोग की जाती है।'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 w-1/3 text-[11px]">
                        {language === 'en' ? 'Service Applied:' : 'सेवा का प्रकार:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-blue-900">{data.serviceTitleHi}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Applicant Name:' : 'आवेदक का पूरा नाम:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">{data.fullName}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Father / Husband Name:' : 'पिता / पति का नाम:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800">{data.fatherOrHusbandName}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Mother Name:' : 'माता का नाम:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800">{data.motherName}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Date of Birth / Gender:' : 'जन्मतिथि / लिंग:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800">{data.dob} ({data.gender})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Mobile / Emergency:' : 'मोबाइल / आपातकालीन:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-800">
                        {data.mobile} {data.emergencyContact ? `(इमर्जेंसी: ${data.emergencyContact})` : ''}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Complete Address:' : 'पूरा पता:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800">
                        {data.address}, {data.village}, {data.district} - {data.pinCode} ({data.state})
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-2.5 bg-slate-50 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Description of Need:' : 'आवश्यकता का विवरण:'}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-700">{data.description}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-700 text-[11px]">
                        {language === 'en' ? 'Current Application Status:' : 'आवेदन की वर्तमान स्थिति:'}
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-blue-900">{data.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Uploaded Documents Strip */}
              {(data.photoUrl || data.aadhaarFrontUrl || data.aadhaarBackUrl || data.aadhaarNumber) && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-300 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'en' ? 'Attached Documents' : 'संलग्न दस्तावेज'}</span>
                    </span>
                    {data.aadhaarNumber && (
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        UIDAI: {data.aadhaarNumber}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Applicant Photo */}
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-center space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-600 block uppercase">
                        {language === 'en' ? 'Photo' : 'फोटो'}
                      </span>
                      {data.photoUrl ? (
                        <div className="w-16 h-20 mx-auto rounded border border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img src={data.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-20 mx-auto rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          {language === 'en' ? 'No Photo' : 'उपलब्ध नहीं'}
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Front */}
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-center space-y-0.5">
                      <span className="text-[9px] font-bold text-emerald-800 block uppercase">
                        {language === 'en' ? 'Aadhaar (F)' : 'आधार (आगे)'}
                      </span>
                      {data.aadhaarFrontUrl ? (
                        <div className="w-full h-20 rounded border border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img src={data.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          {language === 'en' ? 'Not Uploaded' : 'नहीं है'}
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Back */}
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-center space-y-0.5">
                      <span className="text-[9px] font-bold text-emerald-800 block uppercase">
                        {language === 'en' ? 'Aadhaar (B)' : 'आधार (पीछे)'}
                      </span>
                      {data.aadhaarBackUrl ? (
                        <div className="w-full h-20 rounded border border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img src={data.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          {language === 'en' ? 'Not Uploaded' : 'नहीं है'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 italic">
                {language === 'en'
                  ? '* Your application has been registered successfully. Preserving this Application ID is advised.'
                  : '* आपका आवेदन सफलतापूर्वक पंजीकृत हो चुका है। कृपया अपनी आवेदन संख्या सुरक्षित रखें।'}
              </p>
            </div>
          )}

          {/* Signatures & Seal Section */}
          <div className="pt-3 flex items-end justify-between border-t border-slate-200 text-xs">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full border border-red-700 text-red-700 flex flex-col items-center justify-center p-0.5 uppercase font-bold text-[7.5px] leading-tight rotate-[-6deg] opacity-80">
                <span>{language === 'en' ? 'LUV KUSH' : 'लव कुश'}</span>
                <span className="text-[6.5px]">★ RAJGIR ★</span>
                <span className="text-[7px] font-mono">SEAL</span>
              </div>
              <span className="block mt-0.5 text-[9px] text-slate-400">
                {language === 'en' ? 'Official Seal' : 'आधिकारिक मुहर'}
              </span>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-800 w-28 mb-0.5">
                <span className="font-serif italic font-bold text-xs text-blue-900">
                  Satyendra Kr.
                </span>
              </div>
              <span className="block font-bold text-slate-800 text-[11px]">
                {language === 'en' ? 'Satyendra Kumar' : 'सत्येन्द्र कुमार'}
              </span>
              <span className="text-[9px] text-slate-400">
                {t.idCard.authorizedSignature}
              </span>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-1 border-t border-dashed border-slate-200">
            {language === 'en'
              ? 'This is a computer-generated official slip | LUV KUSH SEVA TRUST | Rajgir, Nalanda, Bihar'
              : 'यह एक कंप्यूटर जनरेटेड आधिकारिक रसीद है | LUV KUSH SEVA TRUST | राजगीर, नालंदा, बिहार'}
          </div>
        </div>
      </div>
    </div>
  );
};
