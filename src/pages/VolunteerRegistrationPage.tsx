import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowRight,
  RotateCcw,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { Volunteer } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

export const VolunteerRegistrationPage: React.FC = () => {
  const { addVolunteer, setCurrentPage, settings, language, t } = useTrust();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState(language === 'en' ? 'Nalanda' : 'नालंदा');
  const [skills, setSkills] = useState('');
  const [occupation, setOccupation] = useState('');
  const [availableTime, setAvailableTime] = useState(
    language === 'en' ? 'Weekends (Saturday / Sunday)' : 'सप्ताहांत (शनिवार / रविवार)'
  );
  const [preferredService, setPreferredService] = useState(
    language === 'en' ? 'Free Education & Coaching' : 'निःशुल्क शिक्षा एवं कोचिंग'
  );
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string>('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string>('');
  const [declaration, setDeclaration] = useState(false);

  const [registeredVol, setRegisteredVol] = useState<Volunteer | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = () => {
    setName('');
    setMobile('');
    setEmail('');
    setAadhaarNumber('');
    setAge(24);
    setGender('Male');
    setAddress('');
    setDistrict(language === 'en' ? 'Nalanda' : 'नालंदा');
    setSkills('');
    setOccupation('');
    setMessage('');
    setPhotoPreview('');
    setAadhaarFrontPreview('');
    setAadhaarBackPreview('');
    setDeclaration(false);
    setErrorMsg('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.75);
        setPhotoPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAadhaarFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setAadhaarFrontPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setAadhaarFrontPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAadhaarBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.7);
        setAadhaarBackPreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setAadhaarBackPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      setErrorMsg(language === 'en' ? 'Please accept the volunteer declaration.' : 'कृपया सेवा संकल्प घोषणा स्वीकार करें।');
      return;
    }
    if (mobile.length < 10) {
      setErrorMsg(language === 'en' ? 'Please enter a valid 10-digit mobile number.' : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }

    setErrorMsg('');

    const newVol = addVolunteer({
      name,
      mobile,
      email,
      aadhaarNumber,
      age: Number(age),
      gender,
      address,
      district,
      skills,
      occupation,
      availableTime,
      preferredService,
      photoUrl: photoPreview,
      aadhaarFrontUrl: aadhaarFrontPreview,
      aadhaarBackUrl: aadhaarBackPreview,
      message,
    });

    setRegisteredVol(newVol);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Title */}
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {language === 'en' ? 'Volunteer Registration' : 'स्वयंसेवक पंजीकरण'}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
          {language === 'en' ? 'Join as a Volunteer at Luv Kush Seva Trust' : 'लव कुश सेवा ट्रस्ट के स्वयंसेवक बनें'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          "{t.banner.secondaryTagline}" — {language === 'en' ? 'Contribute your time and skills to serve the needy.' : 'आइए, समाज सेवा में अपना अमूल्य समय व सहयोग दें।'}
        </p>
      </div>

      {registeredVol ? (
        // Volunteer Success Card
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800">
              {t.form.appSubmittedSuccess}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {language === 'en' ? 'Welcome to Luv Kush Seva Trust. Our team will contact you shortly.' : 'लव कुश सेवा ट्रस्ट में आपका स्वागत है। ट्रस्ट द्वारा शीघ्र ही आपसे संपर्क किया जाएगा।'}
            </p>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-5 max-w-md mx-auto space-y-3">
            <span className="text-xs text-emerald-800 font-bold block uppercase tracking-wider">
              {t.form.applicationId}:
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-950 bg-white py-2 px-4 rounded-xl border border-emerald-200 shadow-sm">
              {registeredVol.id}
            </div>
            <div className="text-xs text-slate-600 text-left space-y-1 pt-2 border-t border-emerald-200">
              <div><strong>{t.form.fullName}:</strong> {registeredVol.name}</div>
              <div><strong>{t.form.preferredService}:</strong> {registeredVol.preferredService}</div>
              <div><strong>{t.form.mobile}:</strong> {registeredVol.mobile}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              {t.common.backToHome}
            </button>
            <button
              onClick={() => {
                setRegisteredVol(null);
                handleReset();
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Register Another Volunteer' : 'नया पंजीकरण करें'}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-6"
        >
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.fullName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'Your full name' : 'आपका नाम'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.mobile} *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={language === 'en' ? '10-digit mobile number' : '10 अंकों का मोबाइल नंबर'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Age *' : 'उम्र *'}
                </label>
                <input
                  type="number"
                  required
                  min="16"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.gender} *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Male">{t.form.male}</option>
                  <option value="Female">{t.form.female}</option>
                  <option value="Other">{t.form.other}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.occupation} *
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={language === 'en' ? 'Teacher, Student, Professional' : 'शिक्षक, विद्यार्थी, व्यवसायी आदि'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.district} *
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={language === 'en' ? 'Nalanda' : 'नालंदा'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.address} *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={language === 'en' ? 'Village/Locality, Post, Rajgir' : 'ग्राम/मोहल्ला, पोस्ट, राजगीर'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.availableTime} *
              </label>
              <select
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value={language === 'en' ? 'Weekends (Saturday / Sunday)' : 'सप्ताहांत (शनिवार / रविवार)'}>
                  {language === 'en' ? 'Weekends (Saturday / Sunday)' : 'सप्ताहांत (शनिवार / रविवार)'}
                </option>
                <option value={language === 'en' ? 'Daily 1-2 hours in evening' : 'प्रतिदिन 1-2 घंटे शाम में'}>
                  {language === 'en' ? 'Daily 1-2 hours in evening' : 'प्रतिदिन शाम में'}
                </option>
                <option value={language === 'en' ? '2-3 days a month in camps' : 'माह में 2-3 दिन शिविरों में'}>
                  {language === 'en' ? '2-3 days a month in camps' : 'माह में 2-3 दिन शिविरों में'}
                </option>
                <option value={language === 'en' ? 'Full-time volunteer' : 'पूर्णकालिक सेवा'}>
                  {language === 'en' ? 'Full-time volunteer' : 'पूर्णकालिक सेवा'}
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.preferredService} *
              </label>
              <select
                value={preferredService}
                onChange={(e) => setPreferredService(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="निःशुल्क शिक्षा एवं कोचिंग">
                  {language === 'en' ? 'Free Education & School Tutoring' : 'निःशुल्क शिक्षा एवं शिक्षण'}
                </option>
                <option value="निःशुल्क चिकित्सा व स्वास्थ्य शिविर">
                  {language === 'en' ? 'Free Healthcare & Medical Camps' : 'निःशुल्क चिकित्सा व स्वास्थ्य शिविर'}
                </option>
                <option value="अनाथ आश्रम सेवा एवं बाल संबल">
                  {language === 'en' ? 'Orphanage Child Care & Protection' : 'अनाथ आश्रम सेवा एवं बाल संबल'}
                </option>
                <option value="वृद्ध आश्रम सेवा एवं देखभाल">
                  {language === 'en' ? 'Old Age Home Care & Elder Support' : 'वृद्ध आश्रम सेवा एवं देखभाल'}
                </option>
                <option value="विधवा आश्रम व स्वावलंबन">
                  {language === 'en' ? 'Widow Livelihood & Empowerment' : 'विधवा आश्रम व स्वावलंबन'}
                </option>
                <option value="रक्तदान व सामाजिक जागरूकता">
                  {language === 'en' ? 'Blood Donation & Social Campaigns' : 'रक्तदान व सामाजिक जागरूकता'}
                </option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.skills}
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder={language === 'en' ? 'Computer, teaching, first aid, sports, yoga' : 'कंप्यूटर, शिक्षण, प्राथमिक उपचार, संगीत, योग आदि'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.message}
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'en' ? 'Any personal motive or message for joining...' : 'ट्रस्ट से जुड़ने का उद्देश्य...'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Aadhaar Number */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.form.aadhaarNumber}
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full sm:w-1/2 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            {/* Uploads Section: Photo + Aadhaar Front + Aadhaar Back */}
            <div className="sm:col-span-3 pt-2 border-t border-slate-100 space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                {language === 'en' ? 'Upload Documents & Photo' : 'फोटो एवं आधार कार्ड अपलोड'}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Photo Upload */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.form.photo}
                  </label>
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white text-center transition-colors">
                    <Upload className="w-5 h-5 text-emerald-700 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">{t.form.uploadPhoto}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{language === 'en' ? 'Passport Photo (ID Card)' : 'पासपोर्ट साइज फोटो (पहचान पत्र हेतु)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm">
                      <img src={photoPreview} alt="Volunteer Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview('')}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        title={language === 'en' ? 'Remove' : 'हटाएं'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Aadhaar Card Front Side */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>{t.form.aadhaarFront}</span>
                  </label>
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white text-center transition-colors">
                    <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">{t.form.uploadAadhaarFront}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t.form.aadhaarFrontHelpText}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleAadhaarFrontUpload}
                      className="hidden"
                    />
                  </label>
                  {aadhaarFrontPreview && (
                    <div className="relative w-28 h-18 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm bg-white flex items-center justify-center">
                      <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAadhaarFrontPreview('')}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        title={language === 'en' ? 'Remove' : 'हटाएं'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Aadhaar Card Back Side */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>{t.form.aadhaarBack}</span>
                  </label>
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white text-center transition-colors">
                    <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">{t.form.uploadAadhaarBack}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t.form.aadhaarBackHelpText}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleAadhaarBackUpload}
                      className="hidden"
                    />
                  </label>
                  {aadhaarBackPreview && (
                    <div className="relative w-28 h-18 rounded-lg overflow-hidden border border-slate-300 mx-auto shadow-sm bg-white flex items-center justify-center">
                      <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAadhaarBackPreview('')}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        title={language === 'en' ? 'Remove' : 'हटाएं'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                {t.form.volunteerDeclarationText}
              </span>
            </label>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t.common.submitApplication}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.common.resetForm}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
