import React from 'react';
import { useTrust } from '../context/TrustContext';
import { FileText } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const { settings, language } = useTrust();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
          {language === 'en' ? 'Rules & Regulations' : 'नियम एवं विनियम'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {language === 'en' ? 'Terms & Conditions' : 'नियम एवं शर्तें'}
        </h1>
        <p className="text-xs text-slate-500">
          {settings.name} ({language === 'en' ? 'Reg No:' : 'पंजीकरण सं:'} {settings.registrationNumber})
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 text-sm text-slate-700 leading-relaxed shadow-sm">
        <div className="flex items-center gap-2 text-blue-900 font-bold">
          <FileText className="w-5 h-5" />
          <span>
            {language === 'en'
              ? 'Operational Rules & Institutional Guidelines'
              : 'संस्थान संचालन नियम व दिशानिर्देश'}
          </span>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '1. Voluntary Service Pledge' : '1. स्वैच्छिक सेवा संकल्प'}
          </h2>
          <p>
            {language === 'en'
              ? 'Luv Kush Seva Trust is a humanitarian public charitable organization. Orphanage, elderly shelter, widow support, free coaching, and medical aid provided by the trust are completely free of charge and based on humanitarian welfare.'
              : 'लव कुश सेवा ट्रस्ट एक जनहितकारी सामाजिक संगठन है। ट्रस्ट द्वारा प्रदान की जाने वाली अनाथ आश्रय, वृद्ध देखभाल, विधवा संबल, निःशुल्क शिक्षा एवं प्राथमिक चिकित्सा सेवाएं पूर्णतः निःशुल्क और मानवीय संवेदना पर आधारित हैं।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '2. Application & Verification Process' : '2. आवेदन एवं चयन प्रक्रिया'}
          </h2>
          <p>
            {language === 'en'
              ? 'After submitting an application via the website or offline office, eligibility verification is conducted by authorized trustees or local review committees before service sanction and issuance of the official ID card.'
              : 'वेबसाइट अथवा कार्यालय में आवेदन जमा करने के बाद ट्रस्ट के अधिकृत पदाधिकारियों अथवा स्थानीय समिति द्वारा पात्रता सत्यापन के उपरांत ही सेवा स्वीकृत की जाती है और आधिकारिक पहचान पत्र जारी किया जाता है।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '3. ID Card & Rules of Beneficiary Services' : '3. पहचान पत्र एवं सेवा नियम'}
          </h2>
          <p>
            {language === 'en'
              ? 'Carrying the trust-issued authorized ID Card is required to access benefits (e.g. classroom coaching, shelter, medical consultations). Any intentional misuse of the ID card may lead to termination of assistance.'
              : 'संस्थान की सुविधाओं (जैसे कोचिंग, आवास, चिकित्सा परामर्श) का लाभ लेने के लिए ट्रस्ट द्वारा जारी अधिकृत पहचान पत्र साथ रखना अनिवार्य है। पहचान पत्र का दुरुपयोग पाए जाने पर सदस्यता समाप्त की जा सकती है।'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? '4. Donations & Support Policy' : '4. दान एवं सहयोग नीति'}
          </h2>
          <p>
            {language === 'en'
              ? 'All funds contributed to the Trust are treated as voluntary charitable donations utilized solely for welfare programs. Donors receive instant receipt acknowledgments with QR verification.'
              : 'ट्रस्ट को प्राप्त होने वाला सभी दान स्वेच्छा से दिया गया सामाजिक सहयोग माना जाता है और इसे ट्रस्ट के सेवा कार्यों में ही उपयोग किया जाता है। दानदाताओं को तत्काल पावती रसीद प्रदान की जाती है।'}
          </p>
        </section>
      </div>
    </div>
  );
};
