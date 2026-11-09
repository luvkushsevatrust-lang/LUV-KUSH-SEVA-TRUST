import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { PlacementAddressInfo } from '../types/career';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  User,
  Download,
  Upload,
  FileText,
  ExternalLink,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  Navigation,
  MessageCircle,
  FileCheck,
} from 'lucide-react';

interface PlacementAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlacementAddressModal: React.FC<PlacementAddressModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    placementAddress,
    updatePlacementAddress,
    uploadPlacementPdf,
    deletePlacementPdf,
    isAdmin,
    language,
    settings,
  } = useTrust();

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<PlacementAddressInfo>(placementAddress);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  if (!isOpen) return null;

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError(
        language === 'en'
          ? 'Please select a valid PDF document.'
          : 'कृपया केवल वैध PDF दस्तावेज का चयन करें।'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        language === 'en'
          ? 'File size exceeds 10MB limit.'
          : 'फाइल का आकार 10MB की सीमा से अधिक है।'
      );
      return;
    }

    setUploadError('');
    setIsUploadingPdf(true);
    try {
      const res = await uploadPlacementPdf(file);
      setUploadSuccess(
        language === 'en'
          ? 'Placement PDF uploaded successfully!'
          : 'नियुक्ति एवं साक्षात्कार PDF सफलतापूर्वक अपलोड हो गई!'
      );
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch {
      setUploadError(
        language === 'en'
          ? 'Failed to upload PDF. Please try again.'
          : 'PDF अपलोड करने में त्रुटि। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlacementAddress(editFormData);
    setIsEditing(false);
  };

  const whatsappNumber = settings.phone || '9470635412';
  const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(
    language === 'en'
      ? 'Hello Luv Kush Seva Trust, I need assistance regarding the Interview & Placement location.'
      : 'नमस्ते लव कुश सेवा ट्रस्ट, मुझे साक्षात्कार एवं नियुक्ति स्थल के संबंध में जानकारी चाहिए।'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <MapPin className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'en'
                  ? 'Placement & Interview Address'
                  : 'नियुक्ति एवं साक्षात्कार स्थल'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {settings.name} — {settings.nameHi}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800">
          {/* Admin Edit Toggle */}
          {isAdmin && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900">
                ⚙️ {language === 'en' ? 'Admin Mode: Update Placement Details & PDF' : 'व्यवस्थापक: नियुक्ति स्थल विवरण व PDF संपादित करें'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditFormData(placementAddress);
                  setIsEditing(!isEditing);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isEditing ? (language === 'en' ? 'Cancel Edit' : 'रद्द करें') : (language === 'en' ? 'Edit Details' : 'संपादित करें')}
              </button>
            </div>
          )}

          {isEditing ? (
            /* Admin Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Placement Location (English)
                </label>
                <input
                  type="text"
                  value={editFormData.placementLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, placementLocation: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नियुक्ति स्थल (हिंदी)
                </label>
                <input
                  type="text"
                  value={editFormData.placementLocationHi}
                  onChange={(e) => setEditFormData({ ...editFormData, placementLocationHi: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interview Address (English)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.interviewAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, interviewAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  साक्षात्कार पता (हिंदी)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.interviewAddressHi}
                  onChange={(e) => setEditFormData({ ...editFormData, interviewAddressHi: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactPersonName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPersonName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactPersonPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPersonPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={editFormData.googleMapsUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, googleMapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Save Placement Address Details' : 'विवरण सुरक्षित करें'}
              </button>
            </form>
          ) : (
            /* Display Mode */
            <div className="space-y-6">
              {/* Primary Address Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Placement Location Card */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    <Navigation className="w-3 h-3" />
                    {language === 'en' ? 'Placement Location' : 'नियुक्ति / कार्य स्थल'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {language === 'en' ? placementAddress.placementLocation : placementAddress.placementLocationHi}
                  </p>
                  <p className="text-xs text-slate-600">
                    {language === 'en'
                      ? 'Nalanda District (Rajgir, Islampur, Silao & Giriyak Blocks)'
                      : 'नालंदा जिला (राजगीर, इस्लामपुर, सिलाव एवं गिरियक प्रखंड कार्यक्षेत्र)'}
                  </p>
                </div>

                {/* Interview Venue Card */}
                <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800">
                    <Calendar className="w-3 h-3" />
                    {language === 'en' ? 'Interview & Verification Venue' : 'साक्षात्कार एवं सत्यापन केंद्र'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {language === 'en' ? placementAddress.interviewAddress : placementAddress.interviewAddressHi}
                  </p>
                  <div className="pt-1">
                    <a
                      href={placementAddress.googleMapsUrl || 'https://maps.google.com/?q=Rajgir,Nalanda,Bihar'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>{language === 'en' ? 'Open in Google Maps' : 'गूगल मैप्स पर रास्ता देखें'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'en' ? 'Nodal Contact Person' : 'नोडल संपर्क अधिकारी'}
                    </span>
                    <strong className="text-slate-900 font-bold text-sm block">
                      {placementAddress.contactPersonName || 'सत्येन्द्र कुमार'}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {placementAddress.contactPersonDesignation || 'अध्यक्ष / भर्ती संयोजक'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${placementAddress.contactPersonPhone || '9470635412'}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{placementAddress.contactPersonPhone || '9470635412'}</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Instructions Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Interview & Placement Instructions' : 'साक्षात्कार एवं नियुक्ति दिशा-निर्देश'}</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  {(language === 'en' ? placementAddress.instructions : placementAddress.instructionsHi)?.map(
                    (inst, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                        <span>{inst}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Admin-Uploaded Placement PDF Document Section */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 border-2 border-emerald-300/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {language === 'en' ? 'Official Placement Address PDF' : 'आधिकारिक नियुक्ति स्थल दस्तावेज (PDF)'}
                    </h4>
                  </div>
                  {placementAddress.placementPdfUrl && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ {language === 'en' ? 'Document Available' : 'दस्तावेज उपलब्ध'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600">
                  {language === 'en'
                    ? 'Download the official notification document containing route map, reporting instructions, and placement center guidelines.'
                    : 'साक्षात्कार केंद्र का आधिकारिक सूचना पत्र, मार्ग दर्शन एवं स्थल विवरण PDF फॉर्मेट में यहां से डाउनलोड करें।'}
                </p>

                {uploadSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* PDF Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {placementAddress.placementPdfUrl ? (
                    <>
                      <a
                        href={placementAddress.placementPdfUrl}
                        download={placementAddress.placementPdfName || 'Luv_Kush_Seva_Trust_Placement_Address.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{language === 'en' ? 'Download Placement PDF' : 'नियुक्ति स्थल PDF डाउनलोड करें'}</span>
                      </a>
                      <a
                        href={placementAddress.placementPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Preview Document' : 'दस्तावेज देखें'}</span>
                      </a>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(language === 'en' ? 'Delete this placement PDF document?' : 'क्या आप यह PDF हटाना चाहते हैं?')) {
                              deletePlacementPdf();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 cursor-pointer"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Remove' : 'हटाएं'}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 italic bg-slate-100 p-3 rounded-xl w-full">
                      ℹ️ {language === 'en'
                        ? 'Placement notice PDF will be uploaded by the administration soon. Please refer to the address and Google Maps above.'
                        : 'नियुक्ति सूचना पत्र PDF ट्रस्ट कार्यालय द्वारा शीघ्र ही अपलोड किया जाएगा। कृपया ऊपर दिए गए पते व गूगल मैप्स का संदर्भ लें।'}
                    </div>
                  )}

                  {/* Admin PDF Upload / Replace */}
                  {isAdmin && (
                    <div className="w-full pt-2 border-t border-slate-200/80">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>
                          {isUploadingPdf
                            ? (language === 'en' ? 'Uploading PDF...' : 'अपलोड हो रहा है...')
                            : placementAddress.placementPdfUrl
                            ? (language === 'en' ? 'Replace Placement PDF' : 'नया PDF बदलें / अपलोड करें')
                            : (language === 'en' ? 'Upload Placement PDF' : 'नियुक्ति स्थल PDF अपलोड करें')}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          disabled={isUploadingPdf}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'बंद करें'}
          </button>
        </div>
      </div>
    </div>
  );
};
