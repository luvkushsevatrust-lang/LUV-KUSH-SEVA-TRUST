import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  GraduationCap,
  CreditCard,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  LogOut,
  Bell,
  MapPin,
  ShieldCheck,
  BadgeCheck,
  RotateCw,
  Image as ImageIcon,
  Eye,
  X,
} from 'lucide-react';
import { QRCodeSVG } from '../components/QRCodeSVG';
import { SafeImage } from '../components/SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';

export const StudentDashboardPage: React.FC = () => {
  const {
    currentStudent,
    studentLogout,
    idCards,
    setActiveIdCard,
    setVerifyModalCard,
    announcements,
    setCurrentPage,
    settings,
    language,
    t,
  } = useTrust();

  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedNoticeModal, setSelectedNoticeModal] = useState<any>(null);

  if (!currentStudent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">
          {language === 'en' ? 'Sign In Required' : 'लॉगिन आवश्यक है'}
        </h2>
        <p className="text-xs text-slate-600">
          {language === 'en'
            ? 'Please sign in with your Registration Number to view the student dashboard.'
            : 'छात्र डैशबोर्ड देखने हेतु कृपया अपने छात्र पंजीकरण नंबर से लॉगिन करें।'}
        </p>
        <button
          onClick={() => setCurrentPage('student-login')}
          className="px-5 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          {language === 'en' ? 'Go to Student Login' : 'लॉगिन पृष्ठ पर जाएं'}
        </button>
      </div>
    );
  }

  // Find Student ID Card for this student
  const studentCard = idCards.find(
    (c) =>
      c.sourceId === currentStudent.id ||
      c.registrationNumber === currentStudent.registrationNumber ||
      c.mobile === currentStudent.mobile
  );

  const verificationPayload = studentCard
    ? `https://luvkushsevatrust.org/verify?card=${encodeURIComponent(
        studentCard.cardNumber
      )}&reg=${encodeURIComponent(studentCard.registrationNumber)}&code=${encodeURIComponent(
        studentCard.verificationCode
      )}`
    : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Welcome Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0 border-2 border-white/20 overflow-hidden">
            {currentStudent.photoUrl ? (
              <img
                src={currentStudent.photoUrl}
                alt={currentStudent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{currentStudent.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              {t.student.dashboardTitle}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              {language === 'en' ? `Welcome, ${currentStudent.name}` : `नमस्ते, ${currentStudent.name}`}
            </h1>
            <p className="text-xs text-blue-200 mt-1">
              {t.banner.regNumberLabel}: <span className="font-mono font-bold text-white">{currentStudent.registrationNumber}</span> | {currentStudent.studentClass}
              {studentCard && (
                <span className="ml-2 font-mono text-amber-300 font-bold">
                  • {t.idCard.cardNumber}: {studentCard.cardNumber}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {studentCard && (
            <button
              onClick={() => setActiveIdCard(studentCard)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.student.downloadIdCard}</span>
            </button>
          )}
          <button
            onClick={studentLogout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.student.logout}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student Details & Official ID Card Box */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Official Student ID Card Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'en' ? 'Student Identity Card' : 'विद्यार्थी पहचान पत्र'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Verified' : 'सत्यापित'}
                </span>
                <button
                  onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>
                    {activeSide === 'front'
                      ? (language === 'en' ? 'View Back Side' : 'पीछे का भाग देखें')
                      : (language === 'en' ? 'View Front Side' : 'सामने का भाग देखें')}
                  </span>
                </button>
              </div>
            </div>

            {studentCard ? (
              <div className="space-y-4">
                
                {/* ID Card Display Card */}
                <div className="flex justify-center">
                  <div
                    className="w-full max-w-[380px] aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-2 border-slate-300 overflow-hidden flex flex-col justify-between relative transition-all duration-300"
                    style={{ minHeight: '240px' }}
                  >
                    {activeSide === 'front' ? (
                      /* FRONT SIDE */
                      <>
                        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-3 py-2 flex items-center justify-between border-b-2 border-amber-400">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-amber-300 shrink-0 flex items-center justify-center overflow-hidden">
                              <SafeImage
                                src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                                alt="Logo"
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                            <div>
                              <h3 className="text-[12px] font-black leading-tight text-white">
                                LUV KUSH SEVA TRUST
                              </h3>
                              <p className="text-[7px] text-amber-200">
                                {language === 'en' ? 'Dedicated to Service, Education, Health and Humanity' : settings.tagline}
                              </p>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[7px] rounded uppercase">
                            STUDENT
                          </span>
                        </div>

                        <div className="bg-blue-950 text-white px-3 py-0.5 text-center text-[8.5px] font-bold flex justify-between">
                          <span>{language === 'en' ? 'Student Identity Card' : 'विद्यार्थी पहचान पत्र'}</span>
                          <span className="font-mono text-amber-300">{studentCard.cardNumber}</span>
                        </div>

                        <div className="px-3 py-2 flex-1 flex items-center gap-3">
                          <div className="w-16 h-20 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                            {currentStudent.photoUrl ? (
                              <img
                                src={currentStudent.photoUrl}
                                alt={currentStudent.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1 text-[9px]">
                            <div>
                              <span className="text-[7px] text-slate-400 uppercase block">{t.idCard.holderName}:</span>
                              <strong className="text-slate-900 text-xs block truncate">{studentCard.fullName}</strong>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px]">
                              <div>
                                <span className="text-slate-400 block text-[6.5px]">{t.idCard.fatherHusband}:</span>
                                <span className="text-slate-800 font-medium truncate block">{studentCard.fatherOrHusbandName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[6.5px]">{t.student.studentClassLabel}:</span>
                                <span className="text-blue-900 font-bold truncate block">{studentCard.roleOrClass}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[6.5px]">{t.idCard.regNumber}:</span>
                                <span className="font-mono font-bold text-red-700 block truncate">{studentCard.registrationNumber}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[6.5px]">{t.idCard.mobileLabel}:</span>
                                <span className="font-mono text-slate-800 block truncate">{studentCard.mobile}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 px-3 py-1 border-t border-slate-200 flex items-center justify-between text-[7.5px] text-slate-600">
                          <span>{t.idCard.validTillLabel}: <strong className="text-emerald-700">{studentCard.validTill}</strong></span>
                          <span className="font-serif italic font-bold text-blue-950">
                            {language === 'en' ? 'Satyendra Kumar (Chairperson)' : 'सत्येन्द्र कुमार (अध्यक्ष)'}
                          </span>
                        </div>
                      </>
                    ) : (
                      /* BACK SIDE */
                      <>
                        <div className="bg-blue-950 text-white px-3 py-1.5 flex items-center justify-between border-b border-amber-400">
                          <span className="text-[9.5px] font-black text-amber-300">
                            {language === 'en' ? 'LUV KUSH SEVA TRUST (RAJGIR)' : 'लव कुश सेवा ट्रस्ट (राजगीर)'}
                          </span>
                          <span className="text-[7px] font-mono text-slate-300">
                            BR/2026/1161821
                          </span>
                        </div>

                        <div className="p-3 flex-1 flex items-start gap-2 text-[7.5px]">
                          <div className="flex-1 space-y-1">
                            <strong className="text-slate-900 block font-bold text-[8px]">
                              {language === 'en' ? 'Instructions:' : 'निर्देश:'}
                            </strong>
                            <p className="text-slate-600 leading-tight">
                              {language === 'en'
                                ? 'Mandatory identity card for entry into coaching center, computer lab and library.'
                                : 'कोचिंग केंद्र, कंप्यूटर लैब एवं पुस्तकालय में प्रवेश हेतु यह परिचय पत्र अनिवार्य है।'}
                            </p>
                            <div className="pt-1 text-[7px] text-slate-500">
                              <div>{language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}</div>
                              <div className="font-bold text-slate-700 mt-0.5">{language === 'en' ? 'Helpline:' : 'हेल्पलाइन:'} {settings.phone}</div>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-center p-1 bg-slate-50 rounded-lg border border-slate-200">
                            <QRCodeSVG value={verificationPayload} size={64} />
                            <span className="text-[5.5px] font-mono mt-0.5 font-bold">{t.idCard.scanToVerify}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 text-white px-3 py-0.5 text-center text-[7px]">
                          “{language === 'en' ? 'Selfless Service is our Mission, Humanity is our Religion' : 'सेवा ही संकल्प, मानवता ही हमारा धर्म'}”
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ID Card Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveIdCard(studentCard)}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t.idCard.printCard}</span>
                  </button>

                  <button
                    onClick={() => setVerifyModalCard(studentCard)}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t.idCard.verifyCard}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
                {language === 'en' ? 'Student ID card is currently being prepared.' : 'इस विद्यार्थी का पहचान पत्र तैयार किया जा रहा है।'}
              </div>
            )}
          </div>

          {/* Student Profile Overview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <span>{language === 'en' ? 'Profile Details' : 'पंजीकरण विवरण'}</span>
              </h2>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {currentStudent.registrationNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">{language === 'en' ? 'Student ID:' : 'विद्यार्थी आईडी:'}</span>
                <strong className="text-slate-900 font-mono text-sm">{currentStudent.id}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">{t.student.studentClassLabel}:</span>
                <strong className="text-slate-900">{currentStudent.studentClass}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">{t.form.fatherOrHusbandName}:</span>
                <span className="text-slate-800 font-medium">{currentStudent.fatherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.form.motherName}:</span>
                <span className="text-slate-800 font-medium">{currentStudent.motherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.form.dob}:</span>
                <span className="text-slate-800 font-mono">{currentStudent.dob}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{language === 'en' ? 'Gender / Category:' : 'वर्ग:'}</span>
                <span className="text-slate-800">{currentStudent.gender} / {currentStudent.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.form.mobile}:</span>
                <span className="text-slate-800 font-mono">{currentStudent.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{language === 'en' ? 'Previous Marks:' : 'पिछला अंक प्रतिशत:'}</span>
                <span className="text-slate-800 font-semibold">{currentStudent.previousMarks || (language === 'en' ? 'N/A' : 'उपलब्ध नहीं')}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">{t.student.schoolLabel}:</span>
                <span className="text-slate-800">{currentStudent.schoolOrInstitute}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">{t.form.address}:</span>
                <span className="text-slate-800">{currentStudent.address}, {currentStudent.district} - {currentStudent.pinCode} ({currentStudent.state})</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Notices & Trust Support */}
        <div className="space-y-6">
          
          {/* Trust Coaching Notices */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>{t.home.announcementsTitle}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {announcements.length} {language === 'en' ? 'Notices' : 'सूचनाएं'}
              </span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3.5 bg-slate-50 rounded-2xl border transition-all space-y-2 ${
                    ann.isImportant ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {ann.date}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ann.imageUrl && (
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{language === 'en' ? 'Photo' : 'फोटो'}</span>
                        </span>
                      )}
                      {ann.isImportant && (
                        <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {language === 'en' ? 'Important' : 'महत्वपूर्ण'}
                        </span>
                      )}
                    </div>
                  </div>

                  {ann.imageUrl && (
                    <div
                      onClick={() => setSelectedNoticeModal(ann)}
                      className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer shadow-xs"
                    >
                      <SafeImage
                        src={ann.imageUrl}
                        alt={ann.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'View Photo' : 'फोटो देखें'}</span>
                      </div>
                    </div>
                  )}

                  <strong className="text-slate-900 block leading-snug text-xs sm:text-sm">{ann.title}</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{ann.content}</p>

                  {ann.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedNoticeModal(ann)}
                      className="text-[11px] font-bold text-blue-800 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{language === 'en' ? 'View Full Image' : 'फोटो बड़ा करके देखें'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Student Notice Image Lightbox Modal */}
          {selectedNoticeModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>{selectedNoticeModal.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedNoticeModal(null)}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {selectedNoticeModal.imageUrl && (
                    <div className="w-full max-h-72 rounded-xl overflow-hidden bg-slate-100 border flex items-center justify-center">
                      <SafeImage
                        src={selectedNoticeModal.imageUrl}
                        alt={selectedNoticeModal.title}
                        className="max-h-72 w-auto object-contain"
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border">
                    {selectedNoticeModal.content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help & Coordinator Contact */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>{language === 'en' ? 'Education Center Helpdesk' : 'शिक्षा केंद्र संपर्क सूत्र'}</span>
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {language === 'en'
                ? 'For class timings, books, or ID card queries, contact our education coordinator:'
                : 'क्लास टाइमिंग, पुस्तकें अथवा पहचान पत्र संबंधित किसी भी सहायता हेतु ट्रस्ट के शिक्षा समन्वयक से संपर्क करें:'}
            </p>
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-slate-900">
                {language === 'en' ? 'Luv Kush Seva Trust Education Center' : 'लव कुश सेवा ट्रस्ट शिक्षा केंद्र'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116' : 'राईसर, क्रिकेट स्टेडियम के समीप, राजगीर'}
              </div>
              <div className="font-mono font-bold text-emerald-700 pt-1">
                {language === 'en' ? 'Helpline:' : 'हेल्पलाइन:'} {settings.phone}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
