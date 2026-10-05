import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  GraduationCap,
  CheckCircle,
  Upload,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CreditCard,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Student } from '../types';

export const StudentRegistrationPage: React.FC = () => {
  const { addStudent, setCurrentPage, language, t } = useTrust();

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [studentClass, setStudentClass] = useState(language === 'en' ? 'Class 1st' : 'कक्षा 1');
  const [schoolOrInstitute, setSchoolOrInstitute] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState(language === 'en' ? 'Nalanda' : 'नालंदा');
  const [state, setState] = useState(language === 'en' ? 'Bihar' : 'बिहार');
  const [pinCode, setPinCode] = useState('803116');
  const [category, setCategory] = useState<'General' | 'OBC' | 'EBC' | 'SC' | 'ST'>('OBC');
  const [parentOccupation, setParentOccupation] = useState('');
  const [previousClass, setPreviousClass] = useState(language === 'en' ? 'UKG / Prep' : 'आंगनबाड़ी / पूर्व कक्षा');
  const [previousMarks, setPreviousMarks] = useState('');
  const [password, setPassword] = useState('password123');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string>('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string>('');
  const [declaration, setDeclaration] = useState(false);

  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = () => {
    setName('');
    setFatherName('');
    setMotherName('');
    setDob('');
    setSchoolOrInstitute('');
    setMobile('');
    setEmail('');
    setAadhaarNumber('');
    setAddress('');
    setStudentClass(language === 'en' ? 'Class 1st' : 'कक्षा 1');
    setPreviousClass(language === 'en' ? 'UKG / Prep' : 'आंगनबाड़ी / पूर्व कक्षा');
    setPreviousMarks('');
    setParentOccupation('');
    setPhotoPreview('');
    setAadhaarFrontPreview('');
    setAadhaarBackPreview('');
    setDeclaration(false);
    setErrorMsg('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      setErrorMsg(language === 'en' ? 'Please accept the declaration.' : 'कृपया घोषणा स्वीकार करें।');
      return;
    }
    if (mobile.length < 10) {
      setErrorMsg(language === 'en' ? 'Please enter a valid 10-digit mobile number.' : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }

    setErrorMsg('');

    const newStudent = addStudent({
      name,
      fatherName,
      motherName,
      dob,
      gender,
      studentClass,
      schoolOrInstitute,
      mobile,
      email,
      aadhaarNumber,
      address,
      district,
      state,
      pinCode,
      category,
      parentOccupation,
      previousClass,
      previousMarks,
      password: password || 'password123',
      photoUrl: photoPreview,
      aadhaarFrontUrl: aadhaarFrontPreview,
      aadhaarBackUrl: aadhaarBackPreview,
    });

    setRegisteredStudent(newStudent);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Page Title */}
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {language === 'en' ? 'Free Education Scheme' : 'निःशुल्क शिक्षा योजना'}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
          {language === 'en' ? 'Student Registration Form' : 'विद्यार्थी पंजीकरण फॉर्म'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {language === 'en'
            ? 'Free coaching, educational kits, and scholarship support by Luv Kush Seva Trust.'
            : 'लव कुश सेवा ट्रस्ट द्वारा विद्यार्थियों हेतु निःशुल्क कोचिंग, पाठ्य-सामग्री एवं सहायता योजना।'}
        </p>
      </div>

      {registeredStudent ? (
        // Registration Success Card
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800">
              {t.form.appSubmittedSuccess}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {language === 'en'
                ? 'Your student profile has been created. You can sign in to the student portal using your Registration Number.'
                : 'आपका विवरण पंजीकृत कर लिया गया है। आप अपने पंजीकरण नंबर से छात्र पोर्टल में लॉगिन कर सकते हैं।'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto bg-amber-50/70 border border-amber-200 p-5 rounded-2xl text-left">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.student.rollNumberLabel}</span>
              <strong className="text-lg font-mono text-red-700 font-extrabold">{registeredStudent.registrationNumber}</strong>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">ID:</span>
              <strong className="text-lg font-mono text-blue-900 font-extrabold">{registeredStudent.id}</strong>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.form.fullName}:</span>
              <span className="text-sm font-semibold text-slate-900">{registeredStudent.name}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.form.studentClass}:</span>
              <span className="text-sm font-semibold text-slate-900">{registeredStudent.studentClass}</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-amber-200/60 text-xs text-slate-600">
              {language === 'en' ? 'Default Login Password:' : 'लॉगिन पासवर्ड:'}{' '}
              <strong className="font-mono text-slate-800">{registeredStudent.password || 'password123'}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentPage('id-card')}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.idCard.myIdCard}</span>
            </button>

            <button
              onClick={() => setCurrentPage('student-login')}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t.nav.studentLogin}</span>
            </button>
          </div>
        </div>
      ) : (
        // Registration Form
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-8"
        >
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Student Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>1. {language === 'en' ? 'Student Personal Details' : 'विद्यार्थी का व्यक्तिगत विवरण'}</span>
            </h3>

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
                  placeholder={language === 'en' ? 'Student name' : 'विद्यार्थी का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.fatherName} *
                </label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder={language === 'en' ? 'Father or guardian name' : 'पिता या अभिभावक का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.motherName}
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder={language === 'en' ? 'Mother name' : 'माता का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.dob} *
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.gender} *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Male">{t.form.male}</option>
                  <option value="Female">{t.form.female}</option>
                  <option value="Other">{t.form.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.category} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="General">{language === 'en' ? 'General' : 'सामान्य'}</option>
                  <option value="OBC">{language === 'en' ? 'OBC' : 'पिछड़ा वर्ग'}</option>
                  <option value="EBC">{language === 'en' ? 'EBC' : 'अत्यंत पिछड़ा वर्ग'}</option>
                  <option value="SC">{language === 'en' ? 'SC' : 'अनुसूचित जाति'}</option>
                  <option value="ST">{language === 'en' ? 'ST' : 'अनुसूचित जनजाति'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>2. {language === 'en' ? 'Academic Information' : 'शैक्षणिक विवरण'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.studentClass} (कक्षा 1 से 5) *
                </label>
                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-semibold text-slate-800 bg-white"
                >
                  <option value={language === 'en' ? 'Class 1st' : 'कक्षा 1'}>{language === 'en' ? 'Class 1st (कक्षा 1)' : 'कक्षा 1 (Class 1st)'}</option>
                  <option value={language === 'en' ? 'Class 2nd' : 'कक्षा 2'}>{language === 'en' ? 'Class 2nd (कक्षा 2)' : 'कक्षा 2 (Class 2nd)'}</option>
                  <option value={language === 'en' ? 'Class 3rd' : 'कक्षा 3'}>{language === 'en' ? 'Class 3rd (कक्षा 3)' : 'कक्षा 3 (Class 3rd)'}</option>
                  <option value={language === 'en' ? 'Class 4th' : 'कक्षा 4'}>{language === 'en' ? 'Class 4th (कक्षा 4)' : 'कक्षा 4 (Class 4th)'}</option>
                  <option value={language === 'en' ? 'Class 5th' : 'कक्षा 5'}>{language === 'en' ? 'Class 5th (कक्षा 5)' : 'कक्षा 5 (Class 5th)'}</option>
                </select>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  {language === 'en' ? '• Primary Education: Classes 1 to 5 eligible' : '• प्राथमिक शिक्षा योजना: कक्षा 1 से 5वीं तक'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.schoolOrInstitute} *
                </label>
                <input
                  type="text"
                  required
                  value={schoolOrInstitute}
                  onChange={(e) => setSchoolOrInstitute(e.target.value)}
                  placeholder={language === 'en' ? 'Primary School name' : 'प्राथमिक विद्यालय का नाम'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.previousClass}
                </label>
                <input
                  type="text"
                  value={previousClass}
                  onChange={(e) => setPreviousClass(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. UKG / Class 1' : 'उदा. आंगनबाड़ी, UKG या पूर्व कक्षा'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.previousMarks}
                </label>
                <input
                  type="text"
                  value={previousMarks}
                  onChange={(e) => setPreviousMarks(e.target.value)}
                  placeholder="e.g. 82%"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.parentOccupation}
                </label>
                <input
                  type="text"
                  value={parentOccupation}
                  onChange={(e) => setParentOccupation(e.target.value)}
                  placeholder={language === 'en' ? 'Farmer, Laborer, Private job' : 'उदा. किसान, श्रमिक, निजी कार्य'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Address */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>3. {language === 'en' ? 'Contact & Address' : 'संपर्क एवं पता'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
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
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Create Password *' : 'लॉगिन पासवर्ड बनाएं *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Min 6 characters' : 'कम से कम 6 अक्षर'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.form.address} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'en' ? 'House number, street, landmark' : 'मकान नंबर, मोहल्ला, डाकघर'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.form.district} *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.form.pinCode} *</label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
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
                  className="w-full sm:w-1/2 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
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
                    <label className="cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white text-center transition-colors">
                      <Upload className="w-5 h-5 text-blue-700 mb-1" />
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
                        <img src={photoPreview} alt="Student Preview" className="w-full h-full object-cover" />
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
          </div>

          {/* Declaration */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                {t.form.studentDeclarationText}
              </span>
            </label>
          </div>

          {/* Submit and Reset Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5" />
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
