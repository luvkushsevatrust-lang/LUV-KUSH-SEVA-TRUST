import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  ShieldCheck,
  Search,
  Printer,
  AlertCircle,
  CheckCircle,
  Download,
  CreditCard,
  BadgeCheck,
} from 'lucide-react';
import { IdCard } from '../types';
import { ID_CARD_CATEGORY_CONFIG } from '../data/mockData';
import { getCardPhotoUrl } from '../utils/idCardHelper';

export const IdCardPortalPage: React.FC = () => {
  const { searchIdCard, setActiveIdCard, setVerifyModalCard, setCurrentPage, settings, language, t } =
    useTrust();
  const [query, setQuery] = useState('');
  const [dob, setDob] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundCard, setFoundCard] = useState<IdCard | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setErrorMessage('');
    const res = searchIdCard(query, dob);

    if (res.card) {
      setFoundCard(res.card);
      setSearched(true);
      if (res.error) {
        setErrorMessage(res.error);
      }
    } else {
      setFoundCard(null);
      setSearched(true);
      setErrorMessage(
        res.error ||
          (language === 'en'
            ? 'ID Card not found. Please verify your ID card number, registration number, or mobile number and try again.'
            : 'पहचान पत्र नहीं मिला। कृपया पहचान पत्र संख्या, पंजीकरण संख्या अथवा मोबाइल नंबर जांचकर पुनः प्रयास करें।')
      );
    }
  };

  const handleQuickDemo = (demoId: string) => {
    setQuery(demoId);
    setDob('');
    const res = searchIdCard(demoId);
    if (res.card) {
      setFoundCard(res.card);
      setSearched(true);
      setErrorMessage(res.error || '');
    }
  };

  const isApproved =
    foundCard && (foundCard.status === 'Active' || foundCard.status === 'Approved');

  const categoryTitle =
    foundCard &&
    (language === 'en'
      ? foundCard.categoryLabelEn || foundCard.categoryLabelHi
      : foundCard.categoryLabelHi);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {t.idCard.portalTitle}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
          {language === 'en' ? 'Search & Download ID Card' : 'पहचान पत्र खोजें'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
          {t.idCard.portalSub}
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t.idCard.searchCardNumber} *
            </label>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.idCard.searchCardPlaceholder}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t.idCard.searchDob}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{t.idCard.searchBtn}</span>
          </button>
        </form>

        {/* Demo Chips */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'en' ? 'Sample ID Cards to Test:' : 'नमूना कार्ड जांचें:'}
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('LKST-2026-000001')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-mono font-medium cursor-pointer"
            >
              {language === 'en' ? 'Orphanage: LKST-2026-000001' : 'अनाथ आश्रम: LKST-2026-000001'}
            </button>
            <button
              onClick={() => handleQuickDemo('LKST-2026-000003')}
              className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-100 font-mono font-medium cursor-pointer"
            >
              {language === 'en' ? 'Student ID: LKST-2026-000003' : 'छात्र कार्ड: LKST-2026-000003'}
            </button>
            <button
              onClick={() => handleQuickDemo('LKST-2026-000006')}
              className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg hover:bg-amber-100 font-mono font-medium cursor-pointer"
            >
              {language === 'en' ? 'Volunteer: LKST-2026-000006' : 'स्वयंसेवक: LKST-2026-000006'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {searched && (
        <div className="max-w-2xl mx-auto">
          {foundCard ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-8 space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {t.idCard.cardFound}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {categoryTitle}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.idCard.cardNumber}</span>
                  <span className="font-mono font-black text-sm text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg inline-block">
                    {foundCard.cardNumber}
                  </span>
                </div>
              </div>

              {/* Status Notice if not approved */}
              {!isApproved ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">{t.idCard.statusLabel}: {foundCard.status}</strong>
                    <span>{errorMessage || (language === 'en' ? 'ID card can only be downloaded once approved.' : 'पहचान पत्र स्वीकृत होने के बाद ही डाउनलोड किया जा सकता है।')}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-emerald-800">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">{language === 'en' ? 'Status: Active • Verified' : 'स्थिति: सक्रिय (Active) • सत्यापित'}</span>
                </div>
              )}

              {/* Summary Profile Grid with Passport Photo */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo Display */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-24 h-28 rounded-xl border-2 border-amber-400 bg-white overflow-hidden shadow-md relative flex items-center justify-center">
                    <img
                      src={getCardPhotoUrl(foundCard)}
                      alt={foundCard.fullName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-amber-300 text-[8px] font-bold text-center py-0.5 tracking-wider">
                      LKST PHOTO
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">
                    {foundCard.bloodGroup ? `Blood: ${foundCard.bloodGroup}` : foundCard.cardNumber}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">{t.idCard.holderName}:</span>
                    <strong className="text-slate-900 text-sm font-bold">{foundCard.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.idCard.fatherHusband}:</span>
                    <span className="text-slate-800 font-medium">{foundCard.fatherOrHusbandName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.idCard.categoryLabel}:</span>
                    <span className="text-blue-900 font-bold">{foundCard.roleOrClass || categoryTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.idCard.regNumber}:</span>
                    <strong className="text-slate-900 font-mono">{foundCard.registrationNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.idCard.issueDateLabel}:</span>
                    <span className="text-slate-800 font-medium">{foundCard.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.idCard.validTillLabel}:</span>
                    <strong className="text-emerald-700">{foundCard.validTill}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200 text-slate-600">
                    <span className="text-slate-500 block">{t.idCard.addressLabel}:</span>
                    <span>{foundCard.address}, {foundCard.district} ({foundCard.state}) - {foundCard.pinCode}</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons per prompt: पहचान पत्र डाउनलोड करें, प्रिंट करें, सत्यापन स्थिति */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveIdCard(foundCard)}
                  className="px-6 py-3 font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:scale-105 active:scale-95"
                  title={language === 'en' ? 'Download ID Card (with Photo)' : 'फोटो सहित पहचान पत्र डाउनलोड करें'}
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'en' ? 'Download ID Card (with Photo)' : 'फोटो सहित पहचान पत्र डाउनलोड करें'}</span>
                </button>

                <button
                  onClick={() => setActiveIdCard(foundCard)}
                  className="px-5 py-3 font-bold text-sm rounded-xl shadow transition-colors flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white cursor-pointer active:scale-95"
                  title={language === 'en' ? 'Print ID Card' : 'आईडी कार्ड प्रिंट करें'}
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.idCard.printCard}</span>
                </button>

                <button
                  onClick={() => setVerifyModalCard(foundCard)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t.idCard.verifyCard}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-red-300 p-8 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">{t.idCard.cardNotFound}</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {errorMessage}
              </p>
              <div className="pt-3 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('services')}
                  className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {t.common.registerNow}
                </button>
                <button
                  onClick={() => setCurrentPage('student-registration')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  {t.nav.studentRegistration}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust ID Cards info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <CreditCard className="w-5 h-5 text-blue-700" />
          <h4 className="font-bold text-slate-900">{language === 'en' ? 'Unique Card Number' : 'विशिष्ट पहचान संख्या'}</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {language === 'en'
              ? 'Every verified member is issued a unique card in LKST-2026-000001 format.'
              : 'प्रत्येक स्वीकृत सदस्य को LKST-2026-000001 प्रारूप में विशिष्ट पहचान संख्या दी जाती है।'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <BadgeCheck className="w-5 h-5 text-emerald-700" />
          <h4 className="font-bold text-slate-900">{language === 'en' ? 'Digital QR Verification' : 'डिजिटल सत्यापन'}</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {language === 'en'
              ? 'Scan the QR code on the back of the card with any camera for instant validity check.'
              : 'कार्ड के पीछे मौजूद QR कोड से तुरंत ऑनलाइन प्रमाणिकता की जांच की जा सकती है।'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <h4 className="font-bold text-slate-900">{language === 'en' ? 'Trust Recognition & Benefits' : 'मान्यता एवं सेवाएं'}</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {language === 'en'
              ? 'Valid across all orphanage, old age home, education coaching and medical camps run by the trust.'
              : 'ट्रस्ट द्वारा संचालित अनाथ आश्रम, वृद्ध आश्रम, कोचिंग व चिकित्सा सहायता में यह कार्ड मान्य है।'}
          </p>
        </div>
      </div>

    </div>
  );
};
