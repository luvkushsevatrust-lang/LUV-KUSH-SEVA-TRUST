import React from 'react';
import { useTrust } from '../context/TrustContext';
import { GraduationCap, Users, Shield, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setCurrentPage } = useTrust();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          लॉगिन
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
          लॉगिन माध्यम चुनें
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          विद्यार्थी, स्वयंसेवक एवं व्यवस्थापक हेतु पृथक सुरक्षित लॉगिन।
        </p>
      </div>

      {/* 3 Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Student Portal */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all p-6 text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">छात्र लॉगिन</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              पंजीकृत विद्यार्थी अपनी प्रोफाइल एवं पहचान पत्र देखने व डाउनलोड करने हेतु लॉगिन करें।
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('student-login')}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>लॉगिन करें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Volunteer Hub */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all p-6 text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">स्वयंसेवक केंद्र</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              लव कुश सेवा ट्रस्ट के स्वयंसेवक नया पंजीकरण करें अथवा गतिविधियों की जानकारी प्राप्त करें।
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('volunteer-registration')}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>स्वयंसेवक पंजीकरण</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Portal */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all p-6 text-center space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-950 flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">प्रबंधक लॉगिन</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              ट्रस्ट के अधिकृत पदाधिकारियों हेतु आवेदन समीक्षा, छात्र प्रबंधन, पहचान पत्र जारी करने एवं नियंत्रण हेतु।
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('admin-login')}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>प्रबंधक लॉगिन</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
