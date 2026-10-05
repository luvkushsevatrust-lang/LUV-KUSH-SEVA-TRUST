import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { Shield, Key, AlertCircle, LogIn } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, setCurrentPage, language, t } = useTrust();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter username and password.'
          : 'कृपया यूजरनेम एवं पासवर्ड दर्ज करें।'
      );
      return;
    }

    const ok = adminLogin(username, password);
    if (ok) {
      setCurrentPage('admin-dashboard');
    } else {
      setErrorMsg(
        language === 'en'
          ? 'Invalid credentials! (Default: admin / admin123)'
          : 'अमान्य क्रेडेंशियल! (डिफ़ॉल्ट: admin / admin123)'
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{t.admin.loginTitle}</h2>
          <p className="text-xs text-slate-300 mt-1">
            {language === 'en' ? 'Luv Kush Seva Trust - Control Panel' : 'लव कुश सेवा ट्रस्ट - नियंत्रण कक्ष'}
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
                {t.admin.username} *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t.admin.password} *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.admin.loginBtn}</span>
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block mb-1">
              {language === 'en' ? 'Authorized Demo Credentials:' : 'अधिकृत क्रेडेंशियल:'}
            </span>
            <div>{t.admin.username}: <strong className="font-mono text-blue-900">admin</strong></div>
            <div>{t.admin.password}: <strong className="font-mono text-blue-900">admin123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
