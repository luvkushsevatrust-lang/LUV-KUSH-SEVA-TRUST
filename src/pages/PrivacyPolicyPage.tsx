import React from 'react';
import { useTrust } from '../context/TrustContext';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { settings, language } = useTrust();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
          {language === 'en' ? 'Legal Protection' : 'कानूनी सुरक्षा'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}
        </h1>
        <p className="text-xs text-slate-500">
          {settings.name} • {language === 'en' ? 'Last Updated: 2026' : 'अंतिम अद्यतन: 2026'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 text-sm text-slate-700 leading-relaxed shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <span>
            {language === 'en'
              ? 'Complete Respect for Data Protection & Privacy'
              : 'डेटा सुरक्षा एवं निजता का पूर्ण सम्मान'}
          </span>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '1. Information We Collect' : '1. एकत्रित की जाने वाली जानकारी'}
          </h2>
          <p>
            {language === 'en'
              ? 'During registration at Luv Kush Seva Trust (Orphanage, Old Age Home, Widow Support, Free Medical, Education, or Volunteer), we only collect essential information (Name, Father/Husband Name, Date of Birth, Address, Mobile Number, and ID proof) necessary for beneficiary verification.'
              : 'लव कुश सेवा ट्रस्ट में पंजीकरण (अनाथ आश्रम, वृद्ध आश्रम, विधवा संबल, निःशुल्क चिकित्सा, शिक्षा अथवा स्वयंसेवक) के दौरान केवल वही जानकारी (नाम, पिता/पति का नाम, जन्मतिथि, पता, मोबाइल नंबर व पहचान प्रमाण) ली जाती है जो सेवा सत्यापन हेतु आवश्यक हो।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '2. Use of Information' : '2. जानकारी का उपयोग'}
          </h2>
          <p>
            {language === 'en'
              ? 'None of the collected personal information is sold or shared with any commercial or external organizations. It is used strictly for aid delivery, issuing authorized ID cards, and providing official donation receipts.'
              : 'एकत्रित की गई किसी भी व्यक्तिगत जानकारी को किसी भी व्यावसायिक अथवा अन्य संस्था को नहीं बेचा या साझा किया जाता। इसका उपयोग केवल सहायता वितरण, पहचान पत्र जारी करने व पावती रसीद देने के लिए किया जाता है।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '3. Donor Security & Discretion' : '3. दानदाताओं की सुरक्षा'}
          </h2>
          <p>
            {language === 'en'
              ? 'Contributions made by donors via UPI or bank transfer are held securely under transparent social audits. At the donor’s request, their identity can remain confidential.'
              : 'दानदाताओं द्वारा यूपीआई अथवा बैंक ट्रांसफर के माध्यम से दी जाने वाली सहयोग राशि पूर्णतः सुरक्षित और पारदर्शी ऑडिट के अंतर्गत रखी जाती है। दानदाता की इच्छा पर उनकी पहचान गुप्त रखी जा सकती है।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '4. Contact & Inquiries' : '4. संपर्क व सहायता'}
          </h2>
          <p>
            {language === 'en'
              ? `For any data correction or information, please contact the Trust office at ${settings.address} or helpline `
              : `किसी भी डेटा संशोधन अथवा जानकारी के लिए ट्रस्ट कार्यालय ${settings.address} पर अथवा हेल्पलाइन `}
            <strong>{settings.phone}</strong>
            {language === 'en' ? '.' : ' पर संपर्क करें।'}
          </p>
        </section>
      </div>
    </div>
  );
};
