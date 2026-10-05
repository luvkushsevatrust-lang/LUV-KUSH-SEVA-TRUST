import React from 'react';
import { useTrust } from '../context/TrustContext';
import { CheckCircle2, ShieldCheck, X, Building, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { IdCard } from '../types';

interface IdCardVerificationModalProps {
  card: IdCard | null;
  onClose: () => void;
}

export const IdCardVerificationModal: React.FC<IdCardVerificationModalProps> = ({
  card,
  onClose,
}) => {
  const { settings, language, t } = useTrust();

  if (!card) return null;

  const isApproved = card.status === 'Active' || card.status === 'Approved';

  const categoryTitle =
    language === 'en'
      ? card.categoryLabelEn || card.categoryLabelHi
      : card.categoryLabelHi;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg mx-auto mb-3 flex items-center justify-center border-2 border-amber-400">
            <img
              src="/src/assets/images/trust_emblem_logo_1790500141646.jpg"
              alt="Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-400/50 text-emerald-100 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{t.idCard.verificationModalTitle}</span>
          </div>

          <h3 className="text-xl font-black text-white">
            {isApproved ? t.idCard.verificationSuccess : t.idCard.verificationUnderReview}
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            {language === 'en' ? 'Luv Kush Seva Trust' : 'लव कुश सेवा ट्रस्ट'} • {t.banner.regNumberLabel}: {settings.registrationNumber}
          </p>
        </div>

        {/* Verification Summary Card */}
        <div className="p-6 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t.idCard.cardNumber}</span>
              <strong className="text-base font-mono font-black text-slate-900">
                {card.cardNumber}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block text-right">{t.idCard.statusLabel}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isApproved ? (language === 'en' ? 'Active' : 'सक्रिय') : card.status}</span>
              </span>
            </div>
          </div>

          {/* Holder Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">{t.idCard.holderName}:</span>
              <strong className="text-slate-900 text-sm font-extrabold">{card.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t.idCard.categoryLabel}:</span>
              <strong className="text-blue-900 font-bold">{categoryTitle}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t.idCard.regNumber}:</span>
              <span className="font-mono font-bold text-red-700">{card.registrationNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{language === 'en' ? 'Security Token:' : 'सुरक्षा टोकन कोड:'}</span>
              <span className="font-mono font-bold text-slate-700">{card.verificationCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.idCard.issueDateLabel}:</span>
              <span className="font-medium text-slate-800">{card.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.idCard.validTillLabel}:</span>
              <strong className="text-emerald-700">{card.validTill}</strong>
            </div>
          </div>

          {/* Organization Verification Seals */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Building className="w-4 h-4 text-amber-700" />
              <span>{language === 'en' ? 'Issuing Organization: Luv Kush Seva Trust' : `जारीकर्ता संस्था: ${settings.name}`}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {language === 'en'
                ? 'This identity card is verified from the central database of Luv Kush Seva Trust. For queries, contact the Rajgir central office:'
                : 'यह पहचान पत्र लव कुश सेवा ट्रस्ट के केंद्रीय डाटाबेस से सत्यापित है। अधिक जानकारी या शिकायत हेतु राजगीर कार्यालय से संपर्क करें:'}
            </p>
            <div className="pt-1 flex flex-col gap-1 text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>{language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir (Nalanda) Bihar - 803116' : settings.address}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.contact.phoneTitle}: {settings.phone}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {t.idCard.closeModal}
          </button>
        </div>

      </div>
    </div>
  );
};
