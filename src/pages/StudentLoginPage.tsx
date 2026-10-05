import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { GraduationCap, LogIn, AlertCircle, Key, UserCheck, ArrowRight } from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const { studentLogin, setCurrentPage, language, t } = useTrust();
  const [identifier, setIdentifier] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !authKey.trim()) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter Registration Number and Date of Birth or Password.'
          : 'कृपया पंजीकरण संख्या और जन्म तिथि दर्ज करें।'
      );
      return;
    }

    const success = studentLogin(identifier, authKey);
    if (success) {
      setCurrentPage('student-dashboard');
    } else {
      setErrorMsg(
        language === 'en'
          ? 'Invalid credentials! Please verify registration number or date of birth. (e.g. LKST-REG-9801 / 2010-06-15)'
          : 'अमान्य विवरण! कृपया पंजीकरण संख्या या जन्म तिथि जांचें। (उदा. LKST-REG-9801 / 2010-06-15)'
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center mx-auto mb-3 shadow-md">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{t.student.loginTitle}</h2>
          <p className="text-xs text-blue-200 mt-1">
            {language === 'en' ? 'Luv Kush Seva Trust, Rajgir' : 'लव कुश सेवा ट्रस्ट'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t.student.regNumberLabel} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t.student.regNumberPlaceholder}
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t.student.dobOrPassLabel} *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder={language === 'en' ? 'YYYY-MM-DD or Password' : 'YYYY-MM-DD अथवा पासवर्ड'}
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'en'
                  ? 'Use Date of Birth (e.g. 2010-06-15) or your account password.'
                  : 'जन्म तिथि (उदा. 2010-06-15) अथवा पंजीकरण पासवर्ड का उपयोग करें।'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.student.loginBtn}</span>
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block mb-1">
              {language === 'en' ? 'Demo Credentials:' : 'डेमो विवरण:'}
            </span>
            <div>{t.student.regNumberLabel}: <strong className="font-mono text-blue-900">LKST-REG-9801</strong></div>
            <div>{language === 'en' ? 'Date of Birth:' : 'जन्म तिथि:'} <strong className="font-mono text-blue-900">2010-06-15</strong> ({language === 'en' ? 'Password:' : 'पासवर्ड:'} <strong className="font-mono text-blue-900">password123</strong>)</div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex flex-col gap-2">
            <span>{language === 'en' ? 'Are you a new student?' : 'नए विद्यार्थी हैं?'}</span>
            <button
              onClick={() => setCurrentPage('student-registration')}
              className="font-bold text-amber-700 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{language === 'en' ? 'Fill Student Registration Form' : 'छात्र पंजीकरण फॉर्म भरें'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
