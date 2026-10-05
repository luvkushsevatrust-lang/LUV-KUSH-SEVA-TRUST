import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Heart,
  QrCode,
  Building,
  CreditCard,
  Copy,
  Check,
  Upload,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Donation } from '../types';

export const DonationPage: React.FC = () => {
  const { settings, addDonation, setActiveReceipt, language, t } = useTrust();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'QR Code' | 'Bank Transfer'>('QR Code');
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const [submittedDonation, setSubmittedDonation] = useState<Donation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleSelectAmount = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyBank = () => {
    const text = `Account: ${settings.bankDetails.accountNumber}\nIFSC: ${settings.bankDetails.ifscCode}\nBank: ${settings.bankDetails.bankName}\nName: ${settings.bankDetails.accountHolderName}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount <= 0) {
      setErrorMsg(
        language === 'en'
          ? 'Please select or enter a donation amount.'
          : 'कृपया सहयोग राशि चुनें या दर्ज करें।'
      );
      return;
    }
    if (mobile.length < 10) {
      setErrorMsg(
        language === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    setErrorMsg('');

    const newDon = addDonation({
      donorName,
      mobile,
      email,
      amount: effectiveAmount,
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      screenshotUrl: screenshotPreview,
      message,
    });

    setSubmittedDonation(newDon);
  };

  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.name
  )}&am=${effectiveAmount}&cu=INR&tn=${encodeURIComponent('Seva Donation')}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      
      {/* Top Headline Section */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          {language === 'en' ? 'Support & Contribute' : 'सहयोग पोर्टल'}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          {t.donation.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          "{t.donation.subtitle}"
        </p>
      </div>

      {submittedDonation ? (
        // Donation Success
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-10 text-center space-y-6 max-w-xl mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800">
              {t.donation.thankYouMessage}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.donation.donationSuccessAlert}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
              <span className="text-slate-600">{t.donation.receiptNumber}:</span>
              <strong className="font-mono text-sm text-blue-950 font-bold">{submittedDonation.receiptNumber}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.donation.donorName}:</span>
              <strong className="text-slate-900">{submittedDonation.donorName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{language === 'en' ? 'Contribution Amount:' : 'सहयोग राशि:'}</span>
              <strong className="text-red-700 text-base font-bold">₹ {submittedDonation.amount.toLocaleString('en-IN')} /-</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{t.donation.paymentMethodTitle}:</span>
              <span className="text-slate-800 font-semibold">{submittedDonation.paymentMethod}</span>
            </div>
            {submittedDonation.transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">{t.donation.transactionIdLabel}:</span>
                <span className="font-mono text-slate-800">{submittedDonation.transactionId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveReceipt({ type: 'donation', data: submittedDonation })}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.common.print}</span>
            </button>
            <button
              onClick={() => {
                setSubmittedDonation(null);
                setDonorName('');
                setTransactionId('');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              {language === 'en' ? 'Make Another Donation' : 'अन्य दान करें'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: QR Code & Bank Details */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* UPI QR Code Card */}
            <div className="bg-white rounded-3xl border-2 border-amber-400 p-6 shadow-xl text-center space-y-4 relative overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs py-1 px-4 -mx-6 -mt-6 mb-4 uppercase tracking-wider">
                {language === 'en' ? 'Trust UPI QR Code' : 'ट्रस्ट UPI क्यूआर कोड'}
              </div>

              <div className="w-56 h-56 mx-auto bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 flex flex-col items-center justify-center relative shadow-inner">
                {settings.donationQrUrl ? (
                  <img
                    src={settings.donationQrUrl}
                    alt="Luv Kush Seva Trust QR"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-2 p-2">
                    <QrCode className="w-28 h-28 text-slate-800" />
                    <span className="text-[11px] font-bold text-slate-700">
                      {t.donation.scanQrToPay}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (PhonePe, GPay, Paytm, BHIM)
                    </span>
                  </div>
                )}
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  {t.donation.upiIdLabel}
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-sm text-blue-950 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {settings.upiId}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-1 font-bold cursor-pointer"
                    title={language === 'en' ? 'Copy UPI' : 'कॉपी करें'}
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedUpi ? t.donation.copied : t.donation.copyUpi}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Quick Pay Intent */}
              <div className="pt-2">
                <a
                  href={upiPayUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'en' ? `Pay via UPI App (₹${effectiveAmount})` : `UPI ऐप से भुगतान करें (₹${effectiveAmount})`}</span>
                </a>
              </div>
            </div>

            {/* Bank Transfer Details Box */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-700" />
                  <span>{t.donation.bankDetailsTitle}</span>
                </h3>
                <button
                  onClick={handleCopyBank}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank ? t.donation.copied : t.donation.copyBankDetails}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.bankName}:</span>
                  <strong className="text-slate-900">{settings.bankDetails.bankName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.accountHolder}:</span>
                  <strong className="text-slate-900">{settings.bankDetails.accountHolderName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.accountNumber}:</span>
                  <strong className="font-mono text-sm text-blue-900">{settings.bankDetails.accountNumber}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">{t.donation.ifscCode}:</span>
                  <strong className="font-mono text-sm text-red-700">{settings.bankDetails.ifscCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.donation.branch}:</span>
                  <span className="text-slate-800">{settings.bankDetails.branch}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                {language === 'en'
                  ? '* After transfer, please fill details in the form to generate your official receipt.'
                  : '* ट्रांसफर के बाद कृपया नीचे दिए गए फॉर्म में विवरण भरकर रसीद प्राप्त करें।'}
              </div>
            </div>

          </div>

          {/* Right Column: Amount Selection & Donor Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.donation.amountTitle} *
              </label>

              {/* Preset Buttons per prompt: 100, 500, 1000, 2100, 5100 */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {[100, 500, 1000, 2100, 5100].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => handleSelectAmount(amt)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={t.donation.customAmountPlaceholder}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.donation.donorInfoTitle}
              </label>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={language === 'en' ? 'Your Name' : 'आपका नाम'}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.donorMobile} *
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
                    {t.donation.donorEmail}
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
                    {t.donation.paymentMethodTitle} *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="QR Code">{language === 'en' ? 'QR Code Scanner' : 'QR Code स्कैनर'}</option>
                    <option value="UPI">{language === 'en' ? 'UPI Transfer' : 'UPI ट्रांसफर'}</option>
                    <option value="Bank Transfer">{language === 'en' ? 'Bank Transfer (NEFT / IMPS)' : 'बैंक ट्रांसफर (NEFT / IMPS)'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.transactionIdLabel}
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={t.donation.transactionIdPlaceholder}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.messageLabel}
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.donation.messagePlaceholder}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.donation.screenshotLabel}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700">
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>{language === 'en' ? 'Choose Screenshot' : 'स्क्रीनशॉट चुनें'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                    {screenshotPreview && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Upload Complete' : 'अपलोड संपन्न'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  <span>{language === 'en' ? `Donate Now (₹${effectiveAmount})` : `दान करें (₹${effectiveAmount})`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

    </div>
  );
};
