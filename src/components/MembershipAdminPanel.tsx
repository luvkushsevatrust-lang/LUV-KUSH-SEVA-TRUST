import React, { useState, useEffect } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  MembershipApplication,
  MembershipAuditLog,
  MembershipAuditStatus,
  MembershipRecordStatus,
} from '../types';
import { SupabaseService } from '../lib/supabaseService';
import { SafeImage } from './SafeImage';
import {
  buildMemberIdCard,
  downloadIdCardDirectPdf,
  printIdCardDirect,
} from '../utils/idCardHelper';
import {
  Award,
  Search,
  RefreshCw,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Mail,
  ShieldCheck,
  FileCheck,
  User,
  Phone,
  MapPin,
  CreditCard,
  History,
  Loader2,
  Ban,
  IdCard as IdCardIcon,
} from 'lucide-react';

export const MembershipAdminPanel: React.FC = () => {
  const {
    memberships,
    refreshMemberships,
    auditMembershipRecord,
    setActiveReceipt,
    language,
    settings,
  } = useTrust();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Paid' | 'Pending' | 'Failed'>('all');
  const [auditFilter, setAuditFilter] = useState<'all' | MembershipAuditStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inspection & Audit Modal state
  const [selectedMember, setSelectedMember] = useState<MembershipApplication | null>(null);
  const [auditStatusInput, setAuditStatusInput] = useState<MembershipAuditStatus>('Audited & Verified');
  const [recordStatusInput, setRecordStatusInput] = useState<MembershipRecordStatus>('Confirmed');
  const [auditNotesInput, setAuditNotesInput] = useState('');
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit Logs Timeline state
  const [auditLogs, setAuditLogs] = useState<MembershipAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [busyCardMemberId, setBusyCardMemberId] = useState<string | null>(null);

  const handleDownloadMemberIdCard = async (member: MembershipApplication) => {
    setBusyCardMemberId(member.id);
    try {
      const card = buildMemberIdCard(member);
      await downloadIdCardDirectPdf(
        card,
        'both',
        settings,
        language,
        null,
        `LKST-Member-IDCard-${card.cardNumber}.pdf`
      );
    } finally {
      setBusyCardMemberId(null);
    }
  };

  const handlePrintMemberIdCard = async (member: MembershipApplication) => {
    setBusyCardMemberId(member.id);
    try {
      const card = buildMemberIdCard(member);
      await printIdCardDirect(card, 'both', settings, language);
    } finally {
      setBusyCardMemberId(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMemberships();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      setAuditStatusInput(selectedMember.auditStatus || 'Pending Audit');
      setRecordStatusInput(selectedMember.status || 'Confirmed');
      setAuditNotesInput(selectedMember.auditNotes || '');
      setAuditFeedback(null);
      setIsLoadingLogs(true);
      SupabaseService.fetchMembershipAuditLogs(selectedMember.id)
        .then((logs) => setAuditLogs(logs))
        .finally(() => setIsLoadingLogs(false));
    } else {
      setAuditLogs([]);
    }
  }, [selectedMember]);

  // Statistics
  const totalCount = memberships.length;
  const paidList = memberships.filter((m) => m.paymentStatus === 'Paid');
  const paidCount = paidList.length;
  const totalRevenue = paidList.reduce((acc, m) => acc + Number(m.feeAmount || 5000), 0);
  const pendingAuditCount = memberships.filter(
    (m) => m.paymentStatus === 'Paid' && m.auditStatus === 'Pending Audit'
  ).length;
  const verifiedAuditCount = memberships.filter((m) => m.auditStatus === 'Audited & Verified').length;
  const flaggedCount = memberships.filter((m) => m.auditStatus === 'Flagged').length;

  // Filtered Memberships
  const filteredMemberships = memberships.filter((m) => {
    if (paymentFilter !== 'all' && m.paymentStatus !== paymentFilter) return false;
    if (auditFilter !== 'all' && m.auditStatus !== auditFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        (m.membershipNumber && m.membershipNumber.toLowerCase().includes(q)) ||
        (m.receiptNumber && m.receiptNumber.toLowerCase().includes(q)) ||
        (m.mobile && m.mobile.includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.razorpayPaymentId && m.razorpayPaymentId.toLowerCase().includes(q)) ||
        (m.razorpayOrderId && m.razorpayOrderId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSavingAudit(true);
    setAuditFeedback(null);

    try {
      const res = await auditMembershipRecord({
        id: selectedMember.id,
        membershipNumber: selectedMember.membershipNumber,
        previousAuditStatus: selectedMember.auditStatus,
        auditStatus: auditStatusInput,
        auditNotes: auditNotesInput.trim(),
        status: recordStatusInput,
      });

      if (res.success) {
        setSelectedMember((prev) =>
          prev
            ? {
                ...prev,
                auditStatus: auditStatusInput,
                auditNotes: auditNotesInput.trim(),
                status: recordStatusInput,
                auditedAt: new Date().toISOString(),
              }
            : null
        );
        const latestLogs = await SupabaseService.fetchMembershipAuditLogs(selectedMember.id);
        setAuditLogs(latestLogs);
        setAuditFeedback({
          type: 'success',
          text:
            language === 'en'
              ? 'Audit decision and trail log saved to Supabase successfully!'
              : 'ऑडिट निर्णय एवं लॉग विवरण सफलतापूर्वक Supabase में सुरक्षित हो गया!',
        });
      } else {
        setAuditFeedback({
          type: 'error',
          text: res.error || (language === 'en' ? 'Failed to save audit status.' : 'ऑडिट स्थिति सहेजने में त्रुटि।'),
        });
      }
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Membership Number',
      'Receipt Number',
      'Full Name',
      'Father/Husband Name',
      'Mobile',
      'Email',
      'District',
      'State',
      'Pin Code',
      'Occupation',
      'Fee Amount (INR)',
      'Payment Status',
      'Membership Status',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Email Sent',
      'Audit Status',
      'Audited By',
      'Audited At',
      'Audit Remarks',
      'Created At',
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredMemberships.map((m) => [
      m.membershipNumber || '',
      m.receiptNumber || '',
      m.fullName || '',
      m.fatherOrHusbandName || '',
      m.mobile || '',
      m.email || '',
      m.district || '',
      m.state || '',
      m.pinCode || '',
      m.occupation || '',
      m.feeAmount || 5000,
      m.paymentStatus || '',
      m.status || '',
      m.razorpayOrderId || '',
      m.razorpayPaymentId || '',
      m.receiptEmailSent ? 'Yes' : 'No',
      m.auditStatus || '',
      m.auditedBy || '',
      m.auditedAt || '',
      m.auditNotes || '',
      m.createdAt || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LKST-Memberships-Audit-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintAuditReport = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.width = '1000px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      const rowsHtml = filteredMemberships
        .map(
          (m, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-family:monospace;font-weight:bold;">${m.membershipNumber || 'PENDING'}<br/><small>${m.receiptNumber || ''}</small></td>
            <td><strong>${m.fullName}</strong><br/><small>${m.mobile} | ${m.email}</small></td>
            <td>₹ ${Number(m.feeAmount || 5000).toLocaleString('en-IN')}</td>
            <td>${m.paymentStatus}<br/><small style="font-family:monospace;">${m.razorpayPaymentId || '-'}</small></td>
            <td><strong>${m.auditStatus}</strong><br/><small>${m.auditedBy || '-'}</small></td>
            <td>${m.auditNotes || '-'}</td>
          </tr>
        `
        )
        .join('');

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>LKST Membership & Audit Register</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #0f172a; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { margin: 0; color: #991b1b; font-size: 18px; }
            .header p { margin: 2px 0; color: #475569; font-size: 11px; }
            .summary { display: flex; justify-content: space-between; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #1e3a8a; color: #ffffff; font-size: 10px; text-transform: uppercase; }
            tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LUV KUSH SEVA TRUST — OFFICIAL MEMBERSHIP & AUDIT REGISTER</h1>
            <p>Reg. No: ${settings.registrationNumber} | Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <div class="summary">
            <div><strong>Total Listed:</strong> ${filteredMemberships.length}</div>
            <div><strong>Confirmed Paid:</strong> ${paidCount}</div>
            <div><strong>Total Collected:</strong> ₹ ${totalRevenue.toLocaleString('en-IN')}</div>
            <div><strong>Audited & Verified:</strong> ${verifiedAuditCount}</div>
            <div><strong>Pending Audit:</strong> ${pendingAuditCount}</div>
            <div><strong>Flagged:</strong> ${flaggedCount}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Membership / Receipt</th>
                <th>Member & Contact</th>
                <th>Fee</th>
                <th>Payment Info</th>
                <th>Audit Status / Auditor</th>
                <th>Audit Remarks</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 15000);
        }
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>
              {language === 'en'
                ? 'Trust Life Membership & Financial Audit Ledger'
                : 'ट्रस्ट आजीवन सदस्यता एवं वित्तीय ऑडिट रजिस्टर'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {language === 'en' ? 'Memberships & Audit Control' : 'सदस्यता प्रबंधन व ऑडिट'}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            {language === 'en'
              ? 'Verify ₹5,000 Razorpay membership payments, inspect KYC & email delivery, and maintain immutable audit logs.'
              : '₹5,000 रेजरपे सदस्यता भुगतान, ईमेल रसीद स्थिति व आवेदक विवरण का ऑडिट और सत्यापन करें।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'en' ? 'Refresh Live Data' : 'डेटा रिफ्रेश करें'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredMemberships.length === 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Export Audit CSV' : 'ऑडिट CSV डाउनलोड'}</span>
          </button>

          <button
            onClick={handlePrintAuditReport}
            disabled={filteredMemberships.length === 0}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Print Audit Report' : 'ऑडिट रिपोर्ट प्रिंट'}</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {language === 'en' ? 'Total Applications' : 'कुल आवेदन'}
          </span>
          <strong className="text-2xl font-black text-slate-900 font-mono">{totalCount}</strong>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">
            {language === 'en' ? 'Confirmed Paid' : 'पुष्ट भुगतान (Paid)'}
          </span>
          <strong className="text-2xl font-black text-emerald-700 font-mono">{paidCount}</strong>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-900 block">
            {language === 'en' ? 'Collected Fee (₹)' : 'कुल सदस्यता राशि'}
          </span>
          <strong className="text-xl font-black text-amber-800 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </strong>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-900 block">
            {language === 'en' ? 'Pending Audit' : 'ऑडिट लंबित'}
          </span>
          <strong className="text-2xl font-black text-blue-700 font-mono">{pendingAuditCount}</strong>
        </div>

        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-900 block">
            {language === 'en' ? 'Audited & Verified' : 'ऑडिट सत्यापित'}
          </span>
          <strong className="text-2xl font-black text-teal-700 font-mono">{verifiedAuditCount}</strong>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs">
          <span className="text-[11px] font-semibold text-red-900 block">
            {language === 'en' ? 'Flagged Records' : 'चिन्हित (Flagged)'}
          </span>
          <strong className="text-2xl font-black text-red-700 font-mono">{flaggedCount}</strong>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Search Name, Membership No., Receipt No., Mobile, Email, Payment ID...'
                : 'नाम, सदस्यता सं., रसीद सं., मोबाइल, ईमेल या पेमेंट ID खोजें...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
        >
          <option value="all">{language === 'en' ? 'All Payments' : 'सभी भुगतान'}</option>
          <option value="Paid">{language === 'en' ? 'Paid Only' : 'भुगतान पूर्ण (Paid)'}</option>
          <option value="Pending">{language === 'en' ? 'Pending Payment' : 'भुगतान लंबित'}</option>
          <option value="Failed">{language === 'en' ? 'Failed' : 'असफल (Failed)'}</option>
        </select>

        <select
          value={auditFilter}
          onChange={(e) => setAuditFilter(e.target.value as any)}
          className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
        >
          <option value="all">{language === 'en' ? 'All Audit States' : 'सभी ऑडिट स्थिति'}</option>
          <option value="Pending Audit">Pending Audit</option>
          <option value="Audited & Verified">Audited & Verified</option>
          <option value="Flagged">Flagged</option>
        </select>
      </div>

      {/* Memberships Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredMemberships.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-slate-500">
            <Award className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">
              {language === 'en'
                ? 'No membership applications match the current filters.'
                : 'वर्तमान फ़िल्टर के अनुसार कोई सदस्यता रिकॉर्ड उपलब्ध नहीं है।'}
            </p>
            <p className="text-xs">
              {language === 'en'
                ? 'New ₹5,000 Razorpay membership applications will automatically appear here.'
                : 'नए ₹5,000 सदस्यता आवेदन एवं भुगतान यहाँ स्वतः प्रदर्शित होंगे।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">
                    {language === 'en' ? 'Membership / Receipt' : 'सदस्यता / रसीद सं.'}
                  </th>
                  <th className="py-3 px-3.5">
                    {language === 'en' ? 'Applicant Info' : 'सदस्य विवरण'}
                  </th>
                  <th className="py-3 px-3.5">
                    {language === 'en' ? 'Contact & Location' : 'संपर्क एवं पता'}
                  </th>
                  <th className="py-3 px-3.5">
                    {language === 'en' ? 'Payment & Email' : 'भुगतान व ईमेल'}
                  </th>
                  <th className="py-3 px-3.5">
                    {language === 'en' ? 'Audit Status' : 'ऑडिट स्थिति'}
                  </th>
                  <th className="py-3 px-3.5 text-right">
                    {language === 'en' ? 'Actions' : 'कार्रवाई'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMemberships.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Membership / Receipt */}
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-mono font-bold text-blue-900 text-xs">
                        {m.membershipNumber || (
                          <span className="text-amber-700">PENDING-ID</span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-600 mt-0.5">
                        {m.receiptNumber || '—'}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'Suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Applicant Info */}
                    <td className="py-3 px-3.5 align-top">
                      <div className="flex items-center gap-2.5">
                        {m.photoUrl ? (
                          <SafeImage
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{m.fullName}</div>
                          {m.fatherOrHusbandName && (
                            <div className="text-[11px] text-slate-500">
                              S/O, W/O: {m.fatherOrHusbandName}
                            </div>
                          )}
                          {m.occupation && (
                            <div className="text-[10px] text-indigo-700 font-semibold">
                              {m.occupation}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact & Location */}
                    <td className="py-3 px-3.5 align-top space-y-0.5">
                      <div className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{m.mobile}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate max-w-[190px]" title={m.email}>
                        {m.email}
                      </div>
                      <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {[m.district, m.state].filter(Boolean).join(', ') || m.address}
                        </span>
                      </div>
                    </td>

                    {/* Payment & Email */}
                    <td className="py-3 px-3.5 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black font-mono text-slate-900">
                          ₹{Number(m.feeAmount || 5000).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.paymentStatus === 'Failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.paymentStatus}
                        </span>
                      </div>
                      {m.razorpayPaymentId && (
                        <div className="font-mono text-[10px] text-slate-600">
                          {m.razorpayPaymentId}
                        </div>
                      )}
                      <div>
                        {m.receiptEmailSent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <Mail className="w-3 h-3" />
                            <span>{language === 'en' ? 'Receipt Sent' : 'ईमेल भेजा गया'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Mail className="w-3 h-3" />
                            <span>{language === 'en' ? 'Not Sent' : 'लंबित'}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Audit Status */}
                    <td className="py-3 px-3.5 align-top space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          m.auditStatus === 'Audited & Verified'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : m.auditStatus === 'Flagged'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        {m.auditStatus === 'Audited & Verified' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : m.auditStatus === 'Flagged' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{m.auditStatus}</span>
                      </span>
                      {m.auditedBy && (
                        <div className="text-[10px] text-slate-500">
                          By: <strong>{m.auditedBy}</strong>
                        </div>
                      )}
                      {m.auditedAt && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.auditedAt).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 align-top text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                          <span>{language === 'en' ? 'Audit / Inspect' : 'ऑडिट / जांच'}</span>
                        </button>
                        {m.paymentStatus === 'Paid' && (
                          <>
                            <button
                              onClick={() => setActiveReceipt({ type: 'membership', data: m })}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title={language === 'en' ? 'View Official Receipt' : 'आधिकारिक रसीद देखें'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Receipt' : 'रसीद'}</span>
                            </button>
                            <button
                              disabled={busyCardMemberId === m.id}
                              onClick={() => handleDownloadMemberIdCard(m)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 rounded-lg text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                              title={language === 'en' ? 'Download Member ID Card' : 'सदस्य ID कार्ड डाउनलोड करें'}
                            >
                              {busyCardMemberId === m.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <IdCardIcon className="w-3.5 h-3.5" />
                              )}
                              <span>{language === 'en' ? 'ID Card' : 'ID कार्ड'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Inspection & Verification Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-sm sm:text-base">
                    {language === 'en'
                      ? 'Membership Inspection & Audit Review'
                      : 'सदस्यता विवरण एवं ऑडिट समीक्षा'}
                  </h3>
                  <p className="text-[11px] text-blue-200 font-mono">
                    {selectedMember.membershipNumber || selectedMember.id} •{' '}
                    {selectedMember.receiptNumber || 'No Receipt Yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Applicant Profile & Payment Info */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Profile Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {selectedMember.photoUrl ? (
                        <SafeImage
                          src={selectedMember.photoUrl}
                          alt={selectedMember.fullName}
                          className="w-16 h-20 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-20 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xl shrink-0">
                          {selectedMember.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-black text-base text-slate-900">
                          {selectedMember.fullName}
                        </h4>
                        <div className="text-slate-600">
                          {selectedMember.fatherOrHusbandName && (
                            <span>S/O, W/O: {selectedMember.fatherOrHusbandName} • </span>
                          )}
                          <span>{selectedMember.membershipType}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px]">
                            📱 {selectedMember.mobile}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px]">
                            ✉ {selectedMember.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">DOB / Gender</span>
                        <strong className="text-slate-800">
                          {selectedMember.dob || '—'} ({selectedMember.gender || '—'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Occupation / Qualification</span>
                        <strong className="text-slate-800">
                          {[selectedMember.occupation, selectedMember.qualification]
                            .filter(Boolean)
                            .join(' / ') || '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">PAN / Aadhaar</span>
                        <strong className="font-mono text-slate-800">
                          {selectedMember.panCard || '—'} | {selectedMember.aadhaarNumber || '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Applied Date</span>
                        <strong className="font-mono text-slate-800">
                          {new Date(selectedMember.createdAt).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Complete Address</span>
                        <strong className="text-slate-800">
                          {selectedMember.address}
                          {selectedMember.district ? `, ${selectedMember.district}` : ''}
                          {selectedMember.state ? `, ${selectedMember.state}` : ''}
                          {selectedMember.pinCode ? ` - ${selectedMember.pinCode}` : ''}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Email Delivery Box */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <h5 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>
                        {language === 'en'
                          ? 'Razorpay Payment & Email Verification'
                          : 'रेजरपे भुगतान एवं ईमेल रसीद स्थिति'}
                      </span>
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Fee & Status</span>
                        <strong className="text-emerald-800 font-mono">
                          ₹{Number(selectedMember.feeAmount || 5000).toLocaleString('en-IN')} (
                          {selectedMember.paymentStatus})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Payment Mode</span>
                        <strong className="text-slate-800">
                          {selectedMember.paymentMode || 'Razorpay'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Razorpay Order ID</span>
                        <strong className="font-mono text-slate-800">
                          {selectedMember.razorpayOrderId || '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Razorpay Payment ID</span>
                        <strong className="font-mono text-slate-900">
                          {selectedMember.razorpayPaymentId || '—'}
                        </strong>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-emerald-200/70 flex items-center justify-between">
                        <span>
                          Resend Email Receipt:{' '}
                          <strong
                            className={
                              selectedMember.receiptEmailSent ? 'text-emerald-700' : 'text-amber-800'
                            }
                          >
                            {selectedMember.receiptEmailSent
                              ? `Sent (${selectedMember.receiptEmailSentAt ? new Date(selectedMember.receiptEmailSentAt).toLocaleString('en-IN') : 'Confirmed'})`
                              : 'Not Sent'}
                          </strong>
                        </span>
                        {selectedMember.paymentStatus === 'Paid' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReceipt({ type: 'membership', data: selectedMember })
                              }
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              {language === 'en' ? 'Open Receipt' : 'रसीद खोलें'}
                            </button>
                            <button
                              type="button"
                              disabled={busyCardMemberId === selectedMember.id}
                              onClick={() => handleDownloadMemberIdCard(selectedMember)}
                              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <IdCardIcon className="w-3 h-3 text-amber-300" />
                              <span>{language === 'en' ? 'ID Card PDF' : 'ID कार्ड PDF'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={busyCardMemberId === selectedMember.id}
                              onClick={() => handlePrintMemberIdCard(selectedMember)}
                              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-slate-950 rounded-lg font-black text-[11px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>{language === 'en' ? 'Print ID' : 'प्रिंट ID'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Audit Action Form */}
                <div className="lg:col-span-5">
                  <form
                    onSubmit={handleSaveAudit}
                    className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3.5"
                  >
                    <h5 className="font-black text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>
                        {language === 'en' ? 'Official Audit Decision' : 'आधिकारिक ऑडिट निर्णय'}
                      </span>
                    </h5>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'en' ? 'Audit Verification Status *' : 'ऑडिट सत्यापन स्थिति *'}
                      </label>
                      <select
                        value={auditStatusInput}
                        onChange={(e) => setAuditStatusInput(e.target.value as MembershipAuditStatus)}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Pending Audit">Pending Audit (ऑडिट लंबित)</option>
                        <option value="Audited & Verified">
                          Audited & Verified (ऑडिट पूर्ण एवं सत्यापित)
                        </option>
                        <option value="Flagged">Flagged (संदिग्ध / चिन्हित)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'en' ? 'Membership Standing' : 'सदस्यता स्थिति'}
                      </label>
                      <select
                        value={recordStatusInput}
                        onChange={(e) => setRecordStatusInput(e.target.value as MembershipRecordStatus)}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Confirmed">Confirmed (पुष्ट एवं सक्रिय)</option>
                        <option value="Pending Payment">Pending Payment</option>
                        <option value="Suspended">Suspended (निलंबित)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {language === 'en' ? 'Auditor Remarks / Ledger Notes' : 'ऑडिटर टिप्पणी / विवरण'}
                      </label>
                      <textarea
                        rows={4}
                        value={auditNotesInput}
                        onChange={(e) => setAuditNotesInput(e.target.value)}
                        placeholder={
                          language === 'en'
                            ? 'Enter bank settlement check, KYC review note, or discrepancy details...'
                            : 'बैंक मिलान, KYC जांच या किसी विसंगति का विवरण दर्ज करें...'
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    {auditFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                          auditFeedback.type === 'success'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {auditFeedback.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{auditFeedback.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingAudit}
                      className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSavingAudit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{language === 'en' ? 'Saving Audit...' : 'सहेज रहे हैं...'}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-amber-300" />
                          <span>
                            {language === 'en'
                              ? 'Save Audit Decision & Log'
                              : 'ऑडिट निर्णय एवं लॉग सुरक्षित करें'}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Immutable Audit History Timeline */}
              <div className="border-t border-slate-200 pt-4 space-y-2.5">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <History className="w-4 h-4 text-blue-800" />
                  <span>
                    {language === 'en'
                      ? 'Immutable Audit Trail Timeline (Supabase Ledger)'
                      : 'अपरिवर्तनीय ऑडिट इतिहास (Supabase Audit Log)'}
                  </span>
                </h5>

                {isLoadingLogs ? (
                  <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Loading audit logs...' : 'ऑडिट लॉग लोड हो रहे हैं...'}</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {language === 'en'
                      ? 'No audit log entries recorded for this application yet.'
                      : 'इस आवेदन के लिए अभी तक कोई ऑडिट लॉग दर्ज नहीं हुआ है।'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-mono text-[10px] font-bold">
                              {log.action}
                            </span>
                            {log.previousAuditStatus && log.newAuditStatus && (
                              <span className="text-[11px] font-semibold text-slate-700">
                                {log.previousAuditStatus} → <strong>{log.newAuditStatus}</strong>
                              </span>
                            )}
                            {!log.previousAuditStatus && log.newAuditStatus && (
                              <span className="text-[11px] font-bold text-emerald-800">
                                {log.newAuditStatus}
                              </span>
                            )}
                          </div>
                          {log.auditNotes && (
                            <p className="text-[11px] text-slate-600">{log.auditNotes}</p>
                          )}
                        </div>
                        <div className="text-right text-[10.5px] text-slate-500 shrink-0">
                          <div className="font-bold text-slate-700 flex items-center sm:justify-end gap-1">
                            <User className="w-3 h-3" />
                            <span>{log.auditedBy}</span>
                          </div>
                          <div className="font-mono">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
