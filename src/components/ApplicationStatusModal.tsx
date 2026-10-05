import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { X, Search, CheckCircle, Clock, AlertCircle, FileText, CreditCard } from 'lucide-react';
import { ServiceApplication } from '../types';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { searchApplication, setActiveReceipt, idCards, setActiveIdCard, language, t } = useTrust();
  const [appId, setAppId] = useState('');
  const [mobile, setMobile] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<ServiceApplication | undefined>(undefined);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim()) return;
    const found = searchApplication(appId, mobile);
    setResult(found);
    setSearched(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            {language === 'en' ? 'Approved' : 'स्वीकृत'}
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            {language === 'en' ? 'Under Review' : 'समीक्षाधीन'}
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle className="w-3.5 h-3.5" />
            {language === 'en' ? 'Completed' : 'पूर्ण'}
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {language === 'en' ? 'Rejected' : 'अस्वीकृत'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5" />
            {language === 'en' ? 'Pending' : 'लंबित'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base sm:text-lg">
              {t.appStatus.modalTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t.appStatus.appIdLabel} *
              </label>
              <input
                type="text"
                required
                placeholder={t.appStatus.appIdPlaceholder}
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'en' ? 'Enter the Application ID received during registration.' : 'पंजीकरण के समय प्राप्त आवेदन संख्या दर्ज करें।'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t.appStatus.mobileLabel}
              </label>
              <input
                type="tel"
                placeholder={t.appStatus.mobilePlaceholder}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{t.appStatus.checkStatusBtn}</span>
            </button>
          </form>

          {/* Search Result */}
          {searched && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              {result ? (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-slate-200 text-blue-900">
                      {result.id}
                    </span>
                    {getStatusBadge(result.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">{t.appStatus.applicantName}:</span>
                      <strong className="text-slate-900 font-semibold">{result.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t.appStatus.appliedFor}:</span>
                      <strong className="text-slate-900 font-semibold">{result.serviceTitleHi}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t.appStatus.appliedOn}:</span>
                      <span className="text-slate-800">
                        {new Date(result.submittedAt).toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{language === 'en' ? 'Location:' : 'स्थान:'}</span>
                      <span className="text-slate-800">{result.district}, {result.state}</span>
                    </div>
                  </div>

                  {result.statusRemarks && (
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                      <strong>{t.appStatus.adminRemarks}:</strong> {result.statusRemarks}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                    {result.status === 'Approved' && (
                      <button
                        onClick={() => {
                          const card = idCards.find(
                            (c) => c.sourceId === result.id || c.registrationNumber === result.id
                          );
                          if (card) {
                            setActiveIdCard(card);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{t.appStatus.viewIdCard}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveReceipt({ type: 'application', data: result });
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>{t.appStatus.viewReceipt}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">{t.appStatus.notFoundMsg}</p>
                  <p className="mt-1">
                    {language === 'en' ? 'Please check your Application ID or Mobile Number.' : 'कृपया अपनी आवेदन संख्या अथवा मोबाइल नंबर जांचें।'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
