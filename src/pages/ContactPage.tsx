import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';

export const ContactPage: React.FC = () => {
  const { settings, language, t } = useTrust();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {language === 'en' ? 'Office Contact' : 'कार्यालय संपर्क'}
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900">
          {t.contact.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          {t.contact.subtitle}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Trust Info & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full border border-amber-400 bg-amber-50 p-0.5 shrink-0">
                <SafeImage
                  src={TRUST_EMBLEM_LOGO}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {settings.name}
                </h3>
                <p className="text-xs font-bold text-red-600">
                  {settings.nameHi}
                </p>
                <span className="text-[11px] text-slate-500 font-mono">
                  {t.banner.regNumberLabel}: {settings.registrationNumber}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">
                    {language === 'en' ? 'Office Address:' : 'कार्यालय का पता:'}
                  </strong>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {language === 'en' ? 'Raisar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar' : settings.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">
                    {language === 'en' ? 'Helpline Number:' : 'हेल्पलाइन नंबर:'}
                  </strong>
                  <a
                    href={`tel:${settings.phone}`}
                    className="text-emerald-700 font-mono font-bold text-base hover:underline block"
                  >
                    +91 {settings.phone}
                  </a>
                  <span className="text-[11px] text-slate-400">
                    {language === 'en' ? '8:00 AM to 8:00 PM' : 'प्रातः 8:00 से सायं 8:00 बजे तक'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">
                    {language === 'en' ? 'Email:' : 'ईमेल:'}
                  </strong>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-blue-900 hover:underline block"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">
                    {language === 'en' ? 'Office Hours:' : 'कार्यालय समय:'}
                  </strong>
                  <p className="text-slate-600">
                    {language === 'en'
                      ? 'Monday to Saturday: 09:00 AM - 06:00 PM\nSunday: Special Seva Camp'
                      : 'सोमवार से शनिवार: 09:00 AM - 06:00 PM\nरविवार: विशेष सेवा शिविर'}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Call & WhatsApp Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${settings.phone}`}
                className="py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>{language === 'en' ? 'Call Now' : 'कॉल करें'}</span>
              </a>

              <a
                href={`https://wa.me/91${settings.phone}?text=${encodeURIComponent(language === 'en' ? 'Hello Luv Kush Seva Trust, I need information.' : 'नमस्ते लव कुश सेवा ट्रस्ट, मुझे जानकारी चाहिए।')}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language === 'en' ? 'WhatsApp' : 'WhatsApp करें'}</span>
              </a>
            </div>
          </div>

          {/* Chairperson Card */}
          <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
                {language === 'en' ? 'Trust Chairperson' : 'कार्यालय प्रमुख / अध्यक्ष'}
              </span>
              <strong className="text-base text-slate-900">
                {language === 'en' ? 'Satyendra Kumar' : settings.chairpersonName}
              </strong>
              <p className="text-xs text-slate-500">
                {language === 'en' ? 'Luv Kush Seva Trust, Rajgir (Nalanda)' : 'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा)'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow">
              {language === 'en' ? 'Chair' : 'अध्यक्ष'}
            </div>
          </div>

        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {language === 'en' ? 'Send a Message' : 'संदेश भेजें'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'en'
                ? 'Send us a message regarding trust activities or assistance.'
                : 'ट्रस्ट की गतिविधियों अथवा सहायता के संबंध में अपना संदेश हमें भेजें।'}
            </p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">
                {t.contact.successMessage}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {language === 'en'
                  ? 'Thank you for reaching out. We will get back to you soon.'
                  : 'हमसे संपर्क करने के लिए धन्यवाद। हमारी टीम शीघ्र ही आपसे संपर्क करेगी।'}
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setName('');
                  setMessage('');
                }}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {language === 'en' ? 'Send Another Message' : 'अन्य संदेश भेजें'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.contact.nameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'en' ? 'Your Name' : 'आपका नाम'}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.contact.mobileLabel} *
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.contact.subjectLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={language === 'en' ? 'e.g., Education, Medical, Donation, or Volunteer' : 'उदा. शिक्षा, चिकित्सा, दान या स्वयंसेवक'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.contact.messageLabel} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={language === 'en' ? 'Write your message here...' : 'अपना संदेश यहाँ लिखें...'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t.contact.sendBtn}</span>
              </button>
            </form>
          )}

          {/* Interactive Google Map Section */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {language === 'en' ? 'Map Location' : 'मानचित्र स्थिति'}
            </span>
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 flex items-center justify-center">
              <iframe
                title="Trust Office Location Rajgir"
                src="https://maps.google.com/maps?q=Rajgir%20Cricket%20Stadium,%20Bihar&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
            <span className="text-[11px] text-slate-500 block text-right">
              {language === 'en'
                ? 'Near Cricket Stadium, Raisar, Rajgir (Nalanda), Bihar'
                : 'क्रिकेट स्टेडियम के नजदीक, राईसर, राजगीर (नालंदा)'}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
