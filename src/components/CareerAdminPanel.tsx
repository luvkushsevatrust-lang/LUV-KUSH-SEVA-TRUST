import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar,
  MapPin,
  Upload,
  Check,
  Sparkles,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  JobVacancy,
  JobApplication,
  JobCategory,
  JobApplicationStatus,
  PlacementAddressInfo,
} from '../types/career';

export const CareerAdminPanel: React.FC = () => {
  const {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    toggleJobStatus,
    jobApplications,
    updateJobApplicationStatus,
    deleteJobApplication,
    placementAddress,
    updatePlacementAddress,
    uploadPlacementPdf,
    deletePlacementPdf,
  } = useTrust();

  // Subtab within Career Admin
  const [activeCareerSubtab, setActiveCareerSubtab] = useState<
    'applications' | 'vacancies' | 'placement_address'
  >('applications');

  // Application Filters
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appCategoryFilter, setAppCategoryFilter] = useState<'all' | JobCategory>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | JobApplicationStatus>('all');

  // Application Dossier View & Status Update Modal
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [statusUpdateApp, setStatusUpdateApp] = useState<JobApplication | null>(null);
  const [newStatus, setNewStatus] = useState<JobApplicationStatus>('Under Review');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewVenue, setInterviewVenue] = useState(placementAddress.interviewAddress);

  // Vacancy Add/Edit Modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobVacancy | null>(null);
  const [jobFormData, setJobFormData] = useState<Omit<JobVacancy, 'id' | 'postedAt'>>({
    title: '',
    titleHi: '',
    position: '',
    positionHi: '',
    category: 'teacher',
    qualification: '',
    qualificationHi: '',
    experience: 'Fresher / Experienced',
    experienceHi: 'नया / अनुभवी',
    vacancies: 1,
    deadline: '2026-06-30',
    location: 'Nalanda, Bihar',
    locationHi: 'नालंदा, बिहार',
    salary: '',
    description: '',
    descriptionHi: '',
    requirements: [],
    requirementsHi: [],
    status: 'Active',
  });

  // Placement Address edit form state
  const [placementEditData, setPlacementEditData] = useState<PlacementAddressInfo>(placementAddress);
  const [isSavingPlacement, setIsSavingPlacement] = useState(false);
  const [placementSuccessMsg, setPlacementSuccessMsg] = useState('');
  const [instructionsText, setInstructionsText] = useState(placementAddress.instructions.join('\n'));

  // Toast feedback
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Filtered Applications
  const filteredApplications = jobApplications.filter((app) => {
    const matchesCategory =
      appCategoryFilter === 'all' || app.jobCategory === appCategoryFilter;
    const matchesStatus =
      appStatusFilter === 'all' || app.status === appStatusFilter;

    const q = appSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      app.id.toLowerCase().includes(q) ||
      app.fullName.toLowerCase().includes(q) ||
      app.mobile.includes(q) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      app.position.toLowerCase().includes(q) ||
      app.block.toLowerCase().includes(q) ||
      app.village.toLowerCase().includes(q);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Export Applications to CSV
  const exportToCSV = () => {
    if (jobApplications.length === 0) {
      alert('निर्यात हेतु कोई आवेदन उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'Application ID',
      'Full Name',
      'Father/Guardian Name',
      'DOB',
      'Gender',
      'Mobile',
      'WhatsApp',
      'Email',
      'Category',
      'Position',
      'District',
      'Block',
      'Village',
      'Address',
      'Educational Qualification',
      'Professional Qualification',
      'Work Experience',
      'Status',
      'Submitted At',
    ];

    const rows = filteredApplications.map((app) => [
      `"${app.id}"`,
      `"${app.fullName}"`,
      `"${app.fatherOrGuardianName}"`,
      `"${app.dob}"`,
      `"${app.gender || ''}"`,
      `"${app.mobile}"`,
      `"${app.whatsappNumber || ''}"`,
      `"${app.email || ''}"`,
      `"${app.jobCategory}"`,
      `"${app.position}"`,
      `"${app.district}"`,
      `"${app.block}"`,
      `"${app.village}"`,
      `"${(app.address || '').replace(/"/g, '""')}"`,
      `"${(app.educationalQualification || '').replace(/"/g, '""')}"`,
      `"${(app.professionalQualification || '').replace(/"/g, '""')}"`,
      `"${(app.workExperience || '').replace(/"/g, '""')}"`,
      `"${app.status}"`,
      `"${app.submittedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LKST_Job_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('आवेदन CSV सफलतापूर्वक डाउनलोड हो गई।');
  };

  // Handle open job modal for add
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setJobFormData({
      title: '',
      titleHi: '',
      position: '',
      positionHi: '',
      category: 'teacher',
      qualification: '',
      qualificationHi: '',
      experience: 'Fresher / Experienced',
      experienceHi: 'नया / 1+ वर्ष',
      vacancies: 2,
      deadline: '2026-06-30',
      location: 'Nalanda, Bihar',
      locationHi: 'नालंदा, बिहार',
      salary: '',
      description: '',
      descriptionHi: '',
      requirements: [],
      requirementsHi: [],
      status: 'Active',
    });
    setIsJobModalOpen(true);
  };

  // Handle open job modal for edit
  const handleOpenEditJob = (job: JobVacancy) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      titleHi: job.titleHi,
      position: job.position,
      positionHi: job.positionHi,
      category: job.category,
      qualification: job.qualification,
      qualificationHi: job.qualificationHi,
      experience: job.experience,
      experienceHi: job.experienceHi,
      vacancies: job.vacancies,
      deadline: job.deadline,
      location: job.location,
      locationHi: job.locationHi,
      salary: job.salary || '',
      description: job.description || '',
      descriptionHi: job.descriptionHi || '',
      requirements: job.requirements || [],
      requirementsHi: job.requirementsHi || [],
      status: job.status,
    });
    setIsJobModalOpen(true);
  };

  // Handle save job
  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title || !jobFormData.position) {
      alert('कृपया शीर्षक एवं पद का नाम अवश्य भरें।');
      return;
    }

    if (editingJob) {
      updateJob(editingJob.id, jobFormData);
      showToast('रिक्ति सफलतापूर्वक अपडेट की गई।');
    } else {
      addJob(jobFormData);
      showToast('नई रिक्ति सफलतापूर्वक जोड़ दी गई।');
    }
    setIsJobModalOpen(false);
  };

  // Handle Status Update Submit
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateApp) return;

    await updateJobApplicationStatus(
      statusUpdateApp.id,
      newStatus,
      statusRemarks,
      newStatus === 'Interview Scheduled'
        ? {
            date: interviewDate,
            time: interviewTime,
            address: interviewVenue,
          }
        : undefined
    );

    showToast(`आवेदन संख्या ${statusUpdateApp.id} की स्थिति अपडेट कर दी गई: ${newStatus}`);
    setStatusUpdateApp(null);
    setStatusRemarks('');
    setInterviewDate('');
    setInterviewTime('');
  };

  // Handle Placement Address Save
  const handleSavePlacementAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPlacement(true);
    const parsedInstructions = instructionsText
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    updatePlacementAddress({
      ...placementEditData,
      instructions: parsedInstructions,
    });

    setTimeout(() => {
      setIsSavingPlacement(false);
      setPlacementSuccessMsg('साक्षात्कार व नियुक्ति केंद्र विवरण सुरक्षित कर दिया गया!');
      setTimeout(() => setPlacementSuccessMsg(''), 3000);
    }, 400);
  };

  // Handle PDF file upload for placement address
  const handlePlacementPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('कृपया केवल PDF प्रारूप की फाइल चुनें।');
      return;
    }

    try {
      const res = await uploadPlacementPdf(file);
      setPlacementEditData((prev) => ({
        ...prev,
        placementPdfUrl: res.url,
        placementPdfName: res.fileName,
        updatedAt: new Date().toISOString(),
      }));
      showToast('नियुक्ति केंद्र PDF सफलतापूर्वक अपलोड हो गई।');
    } catch (err) {
      console.error(err);
      alert('PDF अपलोड करने में त्रुटि आई।');
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>लंबित (Pending)</span>
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3" />
            <span>समीक्षाधीन (Under Review)</span>
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3" />
            <span>शॉर्टलिस्टेड (Shortlisted)</span>
          </span>
        );
      case 'Interview Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Calendar className="w-3 h-3" />
            <span>साक्षात्कार निर्धारित</span>
          </span>
        );
      case 'Selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            <span>चयनित (Selected)</span>
          </span>
        );
      case 'Not Selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />
            <span>अस्वीकृत (Not Selected)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-xl border border-emerald-600 flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Stat & Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recruitment & Career Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            करियर एवं भर्ती प्रबंधन (Career Portal)
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            शिक्षक एवं नर्सिंग स्टाफ रिक्तियां, ऑनलाइन आवेदन, साक्षात्कार व नियुक्ति केंद्र
          </p>
        </div>

        {/* Career Subtabs */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 w-full md:w-auto">
          <button
            onClick={() => setActiveCareerSubtab('applications')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCareerSubtab === 'applications'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>प्राप्त आवेदन ({jobApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveCareerSubtab('vacancies')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCareerSubtab === 'vacancies'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span>रिक्तियां प्रबंधित करें ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveCareerSubtab('placement_address')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCareerSubtab === 'placement_address'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>नियुक्ति केंद्र व PDF</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: JOB APPLICATIONS */}
      {activeCareerSubtab === 'applications' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-50/50">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder="आवेदन ID, नाम, मोबाइल, पद, गाँव या ब्लॉक खोजें..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Selects & CSV Export */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={appCategoryFilter}
                onChange={(e) => setAppCategoryFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">सभी श्रेणियां (All Categories)</option>
                <option value="teacher">शिक्षक भर्ती (Teacher)</option>
                <option value="nursing">नर्सिंग स्टाफ (Nursing)</option>
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">सभी स्थितियां (All Status)</option>
                <option value="Pending">लंबित (Pending)</option>
                <option value="Under Review">समीक्षाधीन (Under Review)</option>
                <option value="Shortlisted">शॉर्टलिस्टेड (Shortlisted)</option>
                <option value="Interview Scheduled">साक्षात्कार निर्धारित</option>
                <option value="Selected">चयनित (Selected)</option>
                <option value="Not Selected">अस्वीकृत (Not Selected)</option>
              </select>

              <button
                onClick={exportToCSV}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Export Applications to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV निर्यात</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">आवेदन संख्या</th>
                  <th className="py-3.5 px-4">आवेदक का नाम</th>
                  <th className="py-3.5 px-4">पद एवं श्रेणी</th>
                  <th className="py-3.5 px-4">स्थान (ब्लॉक/गाँव)</th>
                  <th className="py-3.5 px-4">मोबाइल व ईमेल</th>
                  <th className="py-3.5 px-4">दस्तावेज़</th>
                  <th className="py-3.5 px-4">वर्तमान स्थिति</th>
                  <th className="py-3.5 px-4 text-right">कार्यवाही</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      कोई आवेदन प्राप्त नहीं हुआ या खोज से मेल नहीं खाता।
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                        {app.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{app.fullName}</div>
                        <div className="text-[11px] text-stone-500">पिता/अभिभावक: {app.fatherOrGuardianName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 ${
                            app.jobCategory === 'teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {app.jobCategory === 'teacher' ? 'शिक्षक' : 'नर्सिंग'}
                        </span>
                        <div className="font-semibold text-stone-800 text-xs">{app.position}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-stone-800">{app.block}</div>
                        <div className="text-stone-500">{app.village}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-stone-800">{app.mobile}</div>
                        {app.email && <div className="text-stone-400 text-[11px]">{app.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={`${app.id}_CV.pdf`}
                              className="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-stone-200 transition-colors flex items-center gap-1"
                              title="Download Resume PDF"
                            >
                              <FileText className="w-3 h-3" />
                              <span>CV</span>
                            </a>
                          ) : (
                            <span className="text-stone-400 text-[11px]">-</span>
                          )}

                          {app.photoUrl && (
                            <a
                              href={app.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-6 h-6 rounded overflow-hidden border border-stone-200 shrink-0"
                              title="View Photo"
                            >
                              <img src={app.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="पूरा विवरण देखें (View Dossier)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setStatusUpdateApp(app);
                              setNewStatus(app.status);
                              setStatusRemarks(app.statusRemarks || '');
                            }}
                            className="p-1.5 text-stone-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="स्थिति बदलें / साक्षात्कार निर्धारित करें"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`क्या आप आवेदन ${app.id} को हटाना चाहते हैं?`)) {
                                deleteJobApplication(app.id);
                                showToast(`आवेदन संख्या ${app.id} हटा दी गई।`);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="हटाएं (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: VACANCIES MANAGEMENT */}
      {activeCareerSubtab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-800">
              उपलब्ध पद व रिक्तियां (Job Vacancies List)
            </h3>
            <button
              onClick={handleOpenAddJob}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>नई रिक्ति जोड़ें (Add Vacancy)</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">श्रेणी</th>
                    <th className="py-3 px-4">पद का नाम</th>
                    <th className="py-3 px-4">योग्यता</th>
                    <th className="py-3 px-4">रिक्तियां</th>
                    <th className="py-3 px-4">वेतनमान</th>
                    <th className="py-3 px-4">अंतिम तिथि</th>
                    <th className="py-3 px-4">स्थिति</th>
                    <th className="py-3 px-4 text-right">कार्यवाही</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.category === 'teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {job.category === 'teacher' ? 'शिक्षक' : 'नर्सिंग'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{job.title}</div>
                        <div className="text-xs text-stone-500">{job.titleHi}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600 max-w-xs truncate">
                        {job.qualification}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800">{job.vacancies}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-700">
                        {job.salary || 'ट्रस्ट नियमानुसार'}
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-500">{job.deadline}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            toggleJobStatus(job.id);
                            showToast(`पद ${job.title} की स्थिति बदली गई।`);
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                            job.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          {job.status === 'Active' ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditJob(job)}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="संपादित करें"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`क्या आप रिक्ति "${job.title}" को हटाना चाहते हैं?`)) {
                                deleteJob(job.id);
                                showToast('रिक्ति हटा दी गई।');
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PLACEMENT ADDRESS & PDF */}
      {activeCareerSubtab === 'placement_address' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <span>साक्षात्कार एवं नियुक्ति केंद्र प्रबंधन (Placement & Interview Address)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              अभ्यर्थियों को प्रदर्शित होने वाला साक्षात्कार केंद्र, गूगल मैप्स लिंक, संपर्क अधिकारी एवं नियुक्ति विवरण PDF यहाँ प्रबंधित करें।
            </p>
          </div>

          {placementSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{placementSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSavePlacementAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  शीर्षक / केंद्र का नाम (Title) *
                </label>
                <input
                  type="text"
                  value={placementEditData.title}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  स्थान विवरण (Placement Location) *
                </label>
                <input
                  type="text"
                  value={placementEditData.placementLocation}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, placementLocation: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  साक्षात्कार व केंद्र का पूरा पता (Complete Interview Address) *
                </label>
                <textarea
                  rows={2}
                  value={placementEditData.interviewAddress}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, interviewAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Google Maps लोकेशन लिंक
                </label>
                <input
                  type="url"
                  value={placementEditData.googleMapsUrl}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, googleMapsUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  संपर्क व्यक्ति (Contact Person Name) *
                </label>
                <input
                  type="text"
                  value={placementEditData.contactPersonName}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, contactPersonName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  संपर्क पद / रोल (Designation)
                </label>
                <input
                  type="text"
                  value={placementEditData.contactPersonDesignation}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, contactPersonDesignation: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  संपर्क दूरभाष / मोबाइल नंबर (Contact Phone) *
                </label>
                <input
                  type="text"
                  value={placementEditData.contactPersonPhone}
                  onChange={(e) =>
                    setPlacementEditData({ ...placementEditData, contactPersonPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  साक्षात्कार दिशानिर्देश (Instructions - प्रति पंक्ति एक निर्देश)
                </label>
                <textarea
                  rows={3}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Placement PDF Section */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-stone-800">
                साक्षात्कार एवं नियुक्ति सूचना PDF (Placement Address Document)
              </label>
              <p className="text-[11px] text-stone-500">
                यहाँ आधिकारिक नियुक्ति आदेश अथवा केंद्र सूचना संबंधी PDF अपलोड करें जिसे उम्मीदवार पोर्टल से डाउनलोड कर सकें।
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{placementEditData.placementPdfUrl ? 'PDF बदलें (Replace PDF)' : 'PDF अपलोड करें (Upload PDF)'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePlacementPdfUpload}
                    className="hidden"
                  />
                </label>

                {placementEditData.placementPdfUrl && (
                  <>
                    <a
                      href={placementEditData.placementPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={placementEditData.placementPdfName || 'Placement_Address_LKST.pdf'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{placementEditData.placementPdfName || 'डाउनलोड PDF'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('क्या आप नियुक्ति केंद्र PDF को हटाना चाहते हैं?')) {
                          deletePlacementPdf();
                          setPlacementEditData((prev) => ({
                            ...prev,
                            placementPdfUrl: undefined,
                            placementPdfName: undefined,
                          }));
                          showToast('नियुक्ति केंद्र PDF हटा दी गई।');
                        }
                      }}
                      className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 cursor-pointer"
                    >
                      PDF हटाएं
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSavingPlacement}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingPlacement ? 'सुरक्षित हो रहा है...' : 'विवरण सुरक्षित करें (Save Details)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT JOB VACANCY */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <span>{editingJob ? 'रिक्ति संपादित करें' : 'नई रिक्ति जोड़ें'}</span>
              </h3>
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    श्रेणी (Category) *
                  </label>
                  <select
                    value={jobFormData.category}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, category: e.target.value as JobCategory })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="teacher">शिक्षक भर्ती (Teacher Recruitment)</option>
                    <option value="nursing">नर्सिंग स्टाफ (Nursing Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    रिक्त पदों की संख्या *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={jobFormData.vacancies}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, vacancies: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    शीर्षक (Title - English) *
                  </label>
                  <input
                    type="text"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    placeholder="e.g. Primary Teacher"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    शीर्षक (Title - Hindi) *
                  </label>
                  <input
                    type="text"
                    value={jobFormData.titleHi}
                    onChange={(e) => setJobFormData({ ...jobFormData, titleHi: e.target.value })}
                    placeholder="उदा. प्राथमिक शिक्षक"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पद का नाम (Position Name - English) *
                  </label>
                  <input
                    type="text"
                    value={jobFormData.position}
                    onChange={(e) => setJobFormData({ ...jobFormData, position: e.target.value })}
                    placeholder="e.g. Primary Teacher (Classes 1-5)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पद का नाम (Position Name - Hindi)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.positionHi}
                    onChange={(e) => setJobFormData({ ...jobFormData, positionHi: e.target.value })}
                    placeholder="उदा. प्राथमिक शिक्षक (कक्षा 1 से 5)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    शैक्षणिक योग्यता (Qualification - EN)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.qualification}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, qualification: e.target.value })
                    }
                    placeholder="e.g. 12th Pass / Graduate + D.El.Ed"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    शैक्षणिक योग्यता (Qualification - HI)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.qualificationHi}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, qualificationHi: e.target.value })
                    }
                    placeholder="उदा. 12वीं उत्तीर्ण / स्नातक + डीएलएड"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    कार्य अनुभव (Experience)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.experience}
                    onChange={(e) => setJobFormData({ ...jobFormData, experience: e.target.value })}
                    placeholder="e.g. Fresher or 1+ Year"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    अंतिम तिथि (Deadline)
                  </label>
                  <input
                    type="date"
                    value={jobFormData.deadline}
                    onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    कार्यस्थल (Location)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    वेतनमान (Salary - केवल वास्तविक विवरण)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.salary}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary: e.target.value })}
                    placeholder="रिक्त छोड़ने पर 'ट्रस्ट नियमानुसार' प्रदर्शित होगा"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पद का विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  placeholder="पद से संबंधित जिम्मेदारियां..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={jobFormData.status === 'Active'}
                  onChange={(e) =>
                    setJobFormData({ ...jobFormData, status: e.target.checked ? 'Active' : 'Inactive' })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-stone-800">
                  यह रिक्ति वेबसाइट पर प्रदर्शित करने हेतु सक्रिय (Active) रखें
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingJob ? 'अपडेट सुरक्षित करें' : 'रिक्ति प्रकाशित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STATUS UPDATE & INTERVIEW SCHEDULER */}
      {statusUpdateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  आवेदन स्थिति एवं साक्षात्कार निर्धारण
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {statusUpdateApp.id} - {statusUpdateApp.fullName}
                </p>
              </div>
              <button
                onClick={() => setStatusUpdateApp(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  नई स्थिति चुनें (Select Status) *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as JobApplicationStatus)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pending">लंबित (Pending)</option>
                  <option value="Under Review">समीक्षाधीन (Under Review)</option>
                  <option value="Shortlisted">शॉर्टलिस्टेड (Shortlisted)</option>
                  <option value="Interview Scheduled">साक्षात्कार निर्धारित (Interview Scheduled)</option>
                  <option value="Selected">चयनित (Selected)</option>
                  <option value="Not Selected">अस्वीकृत (Not Selected)</option>
                </select>
              </div>

              {/* Show Interview Scheduling fields if status is Interview Scheduled */}
              {newStatus === 'Interview Scheduled' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>साक्षात्कार का समय व स्थान दर्ज करें:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        साक्षात्कार तिथि *
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        समय *
                      </label>
                      <input
                        type="time"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      साक्षात्कार केंद्र / पता *
                    </label>
                    <textarea
                      rows={2}
                      value={interviewVenue}
                      onChange={(e) => setInterviewVenue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  प्रशासनिक टिप्पणी / निर्देश (Remarks for Applicant)
                </label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="उदा. सभी मूल प्रमाण पत्रों व 2 पासपोर्ट फोटो के साथ उपस्थित हों।"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setStatusUpdateApp(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  स्थिति अपडेट करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL APPLICANT DOSSIER VIEWER */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedApplication.jobCategory === 'teacher' ? 'शिक्षक भर्ती' : 'नर्सिंग स्टाफ'}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  {selectedApplication.fullName}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  आवेदन संख्या: <strong>{selectedApplication.id}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs sm:text-sm text-stone-800">
              <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
                {selectedApplication.photoUrl ? (
                  <img
                    src={selectedApplication.photoUrl}
                    alt={selectedApplication.fullName}
                    className="w-20 h-24 object-cover rounded-lg border border-stone-300 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-20 h-24 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 text-xs">
                    No Photo
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-bold text-base text-stone-900">
                    {selectedApplication.position}
                  </div>
                  <div>पिता/अभिभावक: {selectedApplication.fatherOrGuardianName}</div>
                  <div>जन्मतिथि: {selectedApplication.dob} | लिंग: {selectedApplication.gender || 'Not specified'}</div>
                  <div>आवेदन तिथि: {selectedApplication.submittedAt}</div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl">
                <div>
                  <span className="font-bold text-stone-700 block">संपर्क सूत्र:</span>
                  <div>मोबाइल: {selectedApplication.mobile}</div>
                  <div>व्हाट्सएप: {selectedApplication.whatsappNumber || selectedApplication.mobile}</div>
                  <div>ईमेल: {selectedApplication.email || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-bold text-stone-700 block">पता (नालंदा, बिहार):</span>
                  <div>जिला: {selectedApplication.district}</div>
                  <div>प्रखंड (Block): {selectedApplication.block}</div>
                  <div>गाँव (Village): {selectedApplication.village}</div>
                  <div>पूर्ण पता: {selectedApplication.address}</div>
                </div>
              </div>

              {/* Qualification & Experience */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-xl">
                <div>
                  <span className="font-bold text-stone-700">शैक्षणिक योग्यता: </span>
                  <span>{selectedApplication.educationalQualification}</span>
                </div>
                {selectedApplication.professionalQualification && (
                  <div>
                    <span className="font-bold text-stone-700">व्यावसायिक योग्यता (B.Ed/D.El.Ed/GNM): </span>
                    <span>{selectedApplication.professionalQualification}</span>
                  </div>
                )}
                {selectedApplication.workExperience && (
                  <div>
                    <span className="font-bold text-stone-700">पूर्व कार्य अनुभव: </span>
                    <span>{selectedApplication.workExperience}</span>
                  </div>
                )}
              </div>

              {/* Status & Interview info */}
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div>
                  <span className="font-bold text-stone-700">आवेदन स्थिति: </span>
                  <span>{selectedApplication.status}</span>
                </div>
                {selectedApplication.interviewDate && (
                  <div>
                    <span className="font-bold text-indigo-700">साक्षात्कार समय: </span>
                    <span>{selectedApplication.interviewDate} {selectedApplication.interviewTime || ''}</span>
                  </div>
                )}
                {selectedApplication.interviewAddress && (
                  <div>
                    <span className="font-bold text-indigo-700">साक्षात्कार स्थल: </span>
                    <span>{selectedApplication.interviewAddress}</span>
                  </div>
                )}
                {selectedApplication.statusRemarks && (
                  <div>
                    <span className="font-bold text-stone-700">टिप्पणी: </span>
                    <span>{selectedApplication.statusRemarks}</span>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {selectedApplication.resumeUrl && (
                  <a
                    href={selectedApplication.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={`${selectedApplication.id}_CV.pdf`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>बायोडाटा / CV (PDF) डाउनलोड करें</span>
                  </a>
                )}

                {selectedApplication.additionalDocsUrl && (
                  <a
                    href={selectedApplication.additionalDocsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                    <span>{selectedApplication.additionalDocsFileName || 'अतिरिक्त दस्तावेज़'}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                onClick={() => setSelectedApplication(null)}
                className="px-5 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
