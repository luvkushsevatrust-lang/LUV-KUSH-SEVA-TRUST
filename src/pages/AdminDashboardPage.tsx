import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  Users,
  GraduationCap,
  Heart,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  Trash2,
  Edit,
  Plus,
  Printer,
  LogOut,
  QrCode,
  Building,
  Upload,
  Eye,
  Shield,
  CreditCard,
  BadgeCheck,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  RotateCcw,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Cloud,
  Copy,
  Check,
} from 'lucide-react';
import {
  ApplicationStatus,
  ServiceCategory,
  ServiceApplication,
  Student,
  Volunteer,
  IdCard,
  IdCardStatus,
  IdCardCategory,
} from '../types';
import { ID_CARD_CATEGORY_CONFIG } from '../data/mockData';
import { AadhaarCardView } from '../components/AadhaarCardView';
import { PrintableCandidateForm } from '../components/PrintableCandidateForm';
import { SUPABASE_SQL_SCHEMA, SupabaseService } from '../lib/supabaseService';
import { resolveAssetUrl, CHAIRPERSON_PHOTO } from '../assets';
import { SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export const AdminDashboardPage: React.FC = () => {
  const {
    isAdmin,
    adminLogout,
    settings,
    updateSettings,
    applications,
    updateApplicationStatus,
    updateApplication,
    deleteApplication,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    idCards,
    addIdCard,
    updateIdCard,
    deleteIdCard,
    generateIdCardForRecord,
    volunteers,
    updateVolunteer,
    updateVolunteerStatus,
    deleteVolunteer,
    donations,
    verifyDonation,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    setActiveReceipt,
    setActiveIdCard,
    setVerifyModalCard,
    setCurrentPage,
    language,
    t,
    supabaseStatus,
    syncWithSupabase,
  } = useTrust();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'applications' | 'students' | 'id_cards' | 'donations' | 'volunteers' | 'announcements' | 'settings' | 'supabase'
  >('overview');

  const [copiedSql, setCopiedSql] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Application filters
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Selected Application for Status Update Modal
  const [selectedApp, setSelectedApp] = useState<ServiceApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Approved');
  const [statusRemark, setStatusRemark] = useState('');

  // ID Cards Management filters & state
  const [idCategoryFilter, setIdCategoryFilter] = useState<string>('all');
  const [idStatusFilter, setIdStatusFilter] = useState<string>('all');
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<IdCard | null>(null);

  // Safe Deletion Confirmation Modal State (replaces native window.confirm blocked in iframes)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'id_card' | 'application' | 'student' | 'volunteer';
    id: string;
    title: string;
    details?: string;
  } | null>(null);

  // Floating Toast Notification
  const [actionToast, setActionToast] = useState<{
    message: string;
    type?: 'success' | 'info';
  } | null>(null);

  // New ID Card Modal state
  const [showNewIdCardModal, setShowNewIdCardModal] = useState(false);
  const [newCardCategory, setNewCardCategory] = useState<IdCardCategory>('student');
  const [newCardName, setNewCardName] = useState('');
  const [newCardFather, setNewCardFather] = useState('');
  const [newCardDob, setNewCardDob] = useState('2005-01-01');
  const [newCardGender, setNewCardGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newCardMobile, setNewCardMobile] = useState('');
  const [newCardAddress, setNewCardAddress] = useState('राजगीर, नालंदा, बिहार');
  const [newCardDistrict, setNewCardDistrict] = useState('नालंदा');
  const [newCardRole, setNewCardRole] = useState('');
  const [newCardBlood, setNewCardBlood] = useState('B+');
  const [newCardRegNo, setNewCardRegNo] = useState('');
  const [newCardPhotoPreview, setNewCardPhotoPreview] = useState('');
  const [newCardAadhaarFrontPreview, setNewCardAadhaarFrontPreview] = useState('');
  const [newCardAadhaarBackPreview, setNewCardAadhaarBackPreview] = useState('');

  // New Student modal
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStuName, setNewStuName] = useState('');
  const [newStuFather, setNewStuFather] = useState('');
  const [newStuMother, setNewStuMother] = useState('');
  const [newStuDob, setNewStuDob] = useState('2010-01-01');
  const [newStuGender, setNewStuGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newStuClass, setNewStuClass] = useState('कक्षा 1');
  const [newStuSchool, setNewStuSchool] = useState('');
  const [newStuMobile, setNewStuMobile] = useState('');
  const [newStuAddress, setNewStuAddress] = useState('राजगीर, नालंदा');
  const [newStuCategory, setNewStuCategory] = useState<'General' | 'OBC' | 'EBC' | 'SC' | 'ST'>('OBC');
  const [newStuPhotoPreview, setNewStuPhotoPreview] = useState('');
  const [newStuAadhaarFrontPreview, setNewStuAadhaarFrontPreview] = useState('');
  const [newStuAadhaarBackPreview, setNewStuAadhaarBackPreview] = useState('');

  // New Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImportant, setAnnImportant] = useState(false);
  const [annImagePreview, setAnnImagePreview] = useState('');
  const [previewingImageModal, setPreviewingImageModal] = useState<string | null>(null);

  // Candidate / Application Edit Modal State
  const [editingApp, setEditingApp] = useState<ServiceApplication | null>(null);
  const [editAppFullName, setEditAppFullName] = useState('');
  const [editAppFather, setEditAppFather] = useState('');
  const [editAppMother, setEditAppMother] = useState('');
  const [editAppDob, setEditAppDob] = useState('');
  const [editAppGender, setEditAppGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editAppMobile, setEditAppMobile] = useState('');
  const [editAppAlternateMobile, setEditAppAlternateMobile] = useState('');
  const [editAppEmergencyContact, setEditAppEmergencyContact] = useState('');
  const [editAppEmail, setEditAppEmail] = useState('');
  const [editAppAadhaarNumber, setEditAppAadhaarNumber] = useState('');
  const [editAppCategory, setEditAppCategory] = useState<ServiceCategory>('orphanage');
  const [editAppAddress, setEditAppAddress] = useState('');
  const [editAppVillage, setEditAppVillage] = useState('');
  const [editAppDistrict, setEditAppDistrict] = useState('');
  const [editAppState, setEditAppState] = useState('');
  const [editAppPinCode, setEditAppPinCode] = useState('');
  const [editAppDescription, setEditAppDescription] = useState('');
  const [editAppStatus, setEditAppStatus] = useState<ApplicationStatus>('Pending');
  const [editAppRemarks, setEditAppRemarks] = useState('');
  const [editAppPhotoPreview, setEditAppPhotoPreview] = useState('');
  const [editAppAadhaarFrontPreview, setEditAppAadhaarFrontPreview] = useState('');
  const [editAppAadhaarBackPreview, setEditAppAadhaarBackPreview] = useState('');
  const [showAppAadhaarDetail, setShowAppAadhaarDetail] = useState(false);

  // Student Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStuName, setEditStuName] = useState('');
  const [editStuFather, setEditStuFather] = useState('');
  const [editStuMother, setEditStuMother] = useState('');
  const [editStuDob, setEditStuDob] = useState('');
  const [editStuGender, setEditStuGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editStuClass, setEditStuClass] = useState('कक्षा 1');
  const [editStuSchool, setEditStuSchool] = useState('');
  const [editStuMobile, setEditStuMobile] = useState('');
  const [editStuAddress, setEditStuAddress] = useState('');
  const [editStuCategory, setEditStuCategory] = useState<'General' | 'OBC' | 'EBC' | 'SC' | 'ST'>('OBC');
  const [editStuPhotoPreview, setEditStuPhotoPreview] = useState('');
  const [editStuAadhaarFrontPreview, setEditStuAadhaarFrontPreview] = useState('');
  const [editStuAadhaarBackPreview, setEditStuAadhaarBackPreview] = useState('');
  const [editStuAadhaarNumber, setEditStuAadhaarNumber] = useState('');

  // Volunteer Edit Modal State
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [editVolName, setEditVolName] = useState('');
  const [editVolMobile, setEditVolMobile] = useState('');
  const [editVolEmail, setEditVolEmail] = useState('');
  const [editVolAge, setEditVolAge] = useState(25);
  const [editVolGender, setEditVolGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editVolAddress, setEditVolAddress] = useState('');
  const [editVolDistrict, setEditVolDistrict] = useState('नालंदा');
  const [editVolPreferredService, setEditVolPreferredService] = useState('');
  const [editVolOccupation, setEditVolOccupation] = useState('');
  const [editVolSkills, setEditVolSkills] = useState('');
  const [editVolAvailableTime, setEditVolAvailableTime] = useState('');
  const [editVolAadhaarNumber, setEditVolAadhaarNumber] = useState('');
  const [editVolStatus, setEditVolStatus] = useState<'Pending' | 'Approved' | 'Active'>('Active');
  const [editVolPhotoPreview, setEditVolPhotoPreview] = useState('');
  const [editVolAadhaarFrontPreview, setEditVolAadhaarFrontPreview] = useState('');
  const [editVolAadhaarBackPreview, setEditVolAadhaarBackPreview] = useState('');

  // Printable Candidate Dossier Modal State (Direct Print / PDF)
  const [printableCandidate, setPrintableCandidate] = useState<{
    candidate: ServiceApplication | Student;
    type: 'application' | 'student';
  } | null>(null);

  // Settings State
  const [tempSettings, setTempSettings] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">
          {language === 'en' ? 'Protected Administrative Area' : 'सुरक्षित प्रशासनिक क्षेत्र'}
        </h2>
        <p className="text-xs text-slate-600">
          {language === 'en'
            ? 'This dashboard can only be accessed by authorized administrators of Luv Kush Seva Trust.'
            : 'इस डैशबोर्ड का उपयोग केवल लव कुश सेवा ट्रस्ट के अधिकृत व्यवस्थापकों द्वारा ही किया जा सकता है।'}
        </p>
        <button
          onClick={() => setCurrentPage('admin-login')}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          {t.admin.loginBtn}
        </button>
      </div>
    );
  }

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchCat = appCategoryFilter === 'all' || app.serviceCategory === appCategoryFilter;
    const matchStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
    const matchSearch =
      appSearchQuery === '' ||
      app.fullName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.mobile.includes(appSearchQuery);
    return matchCat && matchStatus && matchSearch;
  });

  // Filtered ID Cards
  const filteredIdCards = idCards.filter((card) => {
    const matchCat = idCategoryFilter === 'all' || card.category === idCategoryFilter;
    const matchStatus = idStatusFilter === 'all' || card.status === idStatusFilter;
    const query = idSearchQuery.toLowerCase().trim();
    const matchSearch =
      query === '' ||
      card.cardNumber.toLowerCase().includes(query) ||
      card.fullName.toLowerCase().includes(query) ||
      card.registrationNumber.toLowerCase().includes(query) ||
      card.mobile.includes(query);
    return matchCat && matchStatus && matchSearch;
  });

  // Statistics
  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === 'Pending').length;
  const approvedApps = applications.filter((a) => a.status === 'Approved').length;
  const rejectedApps = applications.filter((a) => a.status === 'Rejected').length;
  const totalStudents = students.length;
  const totalVolunteers = volunteers.length;
  const totalDonationsAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalIdCards = idCards.length;
  const activeIdCards = idCards.filter((c) => c.status === 'Active' || c.status === 'Approved').length;

  const handleUpdateStatus = () => {
    if (selectedApp) {
      updateApplicationStatus(selectedApp.id, newStatus, statusRemark);
      setSelectedApp(null);
    }
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirmItem) return;

    const { type, id, title } = deleteConfirmItem;

    if (type === 'id_card') {
      deleteIdCard(id);
      setActionToast({
        message:
          language === 'en'
            ? `ID Card (${title}) deleted successfully.`
            : `पहचान पत्र (${title}) सफलतापूर्वक हटा दिया गया।`,
        type: 'success',
      });
    } else if (type === 'application') {
      deleteApplication(id);
      setActionToast({
        message:
          language === 'en'
            ? `Application (${title}) deleted successfully.`
            : `आवेदन (${title}) सफलतापूर्वक हटा दिया गया।`,
        type: 'success',
      });
    } else if (type === 'student') {
      deleteStudent(id);
      setActionToast({
        message:
          language === 'en'
            ? `Student record (${title}) deleted successfully.`
            : `छात्र रिकॉर्ड (${title}) सफलतापूर्वक हटा दिया गया।`,
        type: 'success',
      });
    } else if (type === 'volunteer') {
      deleteVolunteer(id);
      setActionToast({
        message:
          language === 'en'
            ? `Volunteer (${title}) deleted successfully.`
            : `स्वयंसेवक रिकॉर्ड (${title}) सफलतापूर्वक हटा दिया गया।`,
        type: 'success',
      });
    }

    setDeleteConfirmItem(null);
    setTimeout(() => {
      setActionToast(null);
    }, 4000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(tempSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings((prev) => ({
          ...prev,
          donationQrUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName.trim()) return;

    addStudent({
      name: newStuName,
      fatherName: newStuFather,
      motherName: newStuMother,
      dob: newStuDob,
      gender: newStuGender,
      studentClass: newStuClass,
      schoolOrInstitute: newStuSchool || 'लव कुश शिक्षा केंद्र, राजगीर',
      mobile: newStuMobile,
      address: newStuAddress,
      district: 'नालंदा',
      state: 'बिहार',
      pinCode: '803116',
      category: newStuCategory,
      photoUrl: newStuPhotoPreview,
      aadhaarFrontUrl: newStuAadhaarFrontPreview,
      aadhaarBackUrl: newStuAadhaarBackPreview,
    });

    setShowNewStudentModal(false);
    setNewStuName('');
    setNewStuFather('');
    setNewStuMother('');
    setNewStuMobile('');
    setNewStuPhotoPreview('');
    setNewStuAadhaarFrontPreview('');
    setNewStuAadhaarBackPreview('');
  };

  const handleCreateIdCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim()) return;

    const pseudoRecord = {
      id: newCardRegNo.trim() || `LKST-MAN-${Date.now().toString().slice(-4)}`,
      registrationNumber: newCardRegNo.trim() || `LKST-MAN-${Date.now().toString().slice(-4)}`,
      name: newCardName,
      fullName: newCardName,
      fatherName: newCardFather,
      fatherOrHusbandName: newCardFather,
      dob: newCardDob,
      gender: newCardGender,
      mobile: newCardMobile,
      address: newCardAddress,
      district: newCardDistrict,
      bloodGroup: newCardBlood,
      serviceCategory: newCardCategory,
      studentClass: newCardRole,
      occupation: newCardRole,
      photoUrl: newCardPhotoPreview,
      aadhaarFrontUrl: newCardAadhaarFrontPreview,
      aadhaarBackUrl: newCardAadhaarBackPreview,
    };

    let sourceType: 'application' | 'student' | 'volunteer' = 'application';
    if (newCardCategory === 'student') sourceType = 'student';
    else if (newCardCategory === 'volunteer') sourceType = 'volunteer';

    const created = generateIdCardForRecord(sourceType, pseudoRecord, 'Active');

    setShowNewIdCardModal(false);
    setNewCardName('');
    setNewCardFather('');
    setNewCardMobile('');
    setNewCardRole('');
    setNewCardRegNo('');
    setNewCardPhotoPreview('');
    setNewCardAadhaarFrontPreview('');
    setNewCardAadhaarBackPreview('');

    // Open created ID Card
    setActiveIdCard(created);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    addAnnouncement({
      title: annTitle,
      content: annContent,
      date: new Date().toISOString().split('T')[0],
      isImportant: annImportant,
      imageUrl: annImagePreview || undefined,
    });

    setAnnTitle('');
    setAnnContent('');
    setAnnImportant(false);
    setAnnImagePreview('');
  };

  const handleOpenEditApp = (app: ServiceApplication) => {
    setEditingApp(app);
    setEditAppFullName(app.fullName || '');
    setEditAppFather(app.fatherOrHusbandName || '');
    setEditAppMother(app.motherName || '');
    setEditAppDob(app.dob || '');
    setEditAppGender(app.gender || 'Male');
    setEditAppMobile(app.mobile || '');
    setEditAppAlternateMobile(app.alternateMobile || '');
    setEditAppEmergencyContact(app.emergencyContact || '');
    setEditAppEmail(app.email || '');
    setEditAppAadhaarNumber(app.aadhaarNumber || '');
    setEditAppCategory(app.serviceCategory || 'orphanage');
    setEditAppAddress(app.address || '');
    setEditAppVillage(app.village || '');
    setEditAppDistrict(app.district || 'नालंदा');
    setEditAppState(app.state || 'बिहार');
    setEditAppPinCode(app.pinCode || '803116');
    setEditAppDescription(app.description || '');
    setEditAppStatus(app.status || 'Pending');
    setEditAppRemarks(app.statusRemarks || '');
    setEditAppPhotoPreview(app.photoUrl || '');
    setEditAppAadhaarFrontPreview(app.aadhaarFrontUrl || '');
    setEditAppAadhaarBackPreview(app.aadhaarBackUrl || '');
    setShowAppAadhaarDetail(false);
  };

  const handleSaveAppEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    updateApplication(editingApp.id, {
      fullName: editAppFullName,
      fatherOrHusbandName: editAppFather,
      motherName: editAppMother,
      dob: editAppDob,
      gender: editAppGender,
      mobile: editAppMobile,
      alternateMobile: editAppAlternateMobile,
      emergencyContact: editAppEmergencyContact,
      email: editAppEmail,
      aadhaarNumber: editAppAadhaarNumber,
      serviceCategory: editAppCategory,
      address: editAppAddress,
      village: editAppVillage,
      district: editAppDistrict,
      state: editAppState,
      pinCode: editAppPinCode,
      description: editAppDescription,
      status: editAppStatus,
      statusRemarks: editAppRemarks,
      photoUrl: editAppPhotoPreview,
      aadhaarFrontUrl: editAppAadhaarFrontPreview,
      aadhaarBackUrl: editAppAadhaarBackPreview,
    });

    setEditingApp(null);
  };

  const handleReloadAppAadhaar = () => {
    if (editingApp) {
      setEditAppAadhaarFrontPreview(editingApp.aadhaarFrontUrl || '');
      setEditAppAadhaarBackPreview(editingApp.aadhaarBackUrl || '');
      setEditAppAadhaarNumber(editingApp.aadhaarNumber || '7845 9210 3456');
    }
  };

  const handleOpenEditStudent = (stu: Student) => {
    setEditingStudent(stu);
    setEditStuName(stu.name || '');
    setEditStuFather(stu.fatherName || '');
    setEditStuMother(stu.motherName || '');
    setEditStuDob(stu.dob || '');
    setEditStuGender(stu.gender || 'Male');
    setEditStuClass(stu.studentClass || 'कक्षा 1');
    setEditStuSchool(stu.schoolOrInstitute || '');
    setEditStuMobile(stu.mobile || '');
    setEditStuAddress(stu.address || '');
    setEditStuCategory(stu.category || 'OBC');
    setEditStuAadhaarNumber(stu.aadhaarNumber || '7845 9210 3456');
    setEditStuPhotoPreview(stu.photoUrl || '');
    setEditStuAadhaarFrontPreview(stu.aadhaarFrontUrl || '');
    setEditStuAadhaarBackPreview(stu.aadhaarBackUrl || '');
  };

  const handleReloadStudentAadhaar = () => {
    if (editingStudent) {
      setEditStuAadhaarFrontPreview(editingStudent.aadhaarFrontUrl || '');
      setEditStuAadhaarBackPreview(editingStudent.aadhaarBackUrl || '');
      setEditStuAadhaarNumber(editingStudent.aadhaarNumber || '7845 9210 3456');
    }
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      name: editStuName,
      fatherName: editStuFather,
      motherName: editStuMother,
      dob: editStuDob,
      gender: editStuGender,
      studentClass: editStuClass,
      schoolOrInstitute: editStuSchool,
      mobile: editStuMobile,
      address: editStuAddress,
      category: editStuCategory,
      aadhaarNumber: editStuAadhaarNumber,
      photoUrl: editStuPhotoPreview,
      aadhaarFrontUrl: editStuAadhaarFrontPreview,
      aadhaarBackUrl: editStuAadhaarBackPreview,
    });

    setEditingStudent(null);
  };

  const handleOpenEditVolunteer = (vol: Volunteer) => {
    setEditingVolunteer(vol);
    setEditVolName(vol.name);
    setEditVolMobile(vol.mobile);
    setEditVolEmail(vol.email || '');
    setEditVolAge(vol.age || 25);
    setEditVolGender(vol.gender || 'Male');
    setEditVolAddress(vol.address || '');
    setEditVolDistrict(vol.district || 'नालंदा');
    setEditVolPreferredService(vol.preferredService || '');
    setEditVolOccupation(vol.occupation || '');
    setEditVolSkills(vol.skills || '');
    setEditVolAvailableTime(vol.availableTime || '');
    setEditVolAadhaarNumber(vol.aadhaarNumber || '');
    setEditVolStatus(vol.status || 'Active');
    setEditVolPhotoPreview(vol.photoUrl || '');
    setEditVolAadhaarFrontPreview(vol.aadhaarFrontUrl || '');
    setEditVolAadhaarBackPreview(vol.aadhaarBackUrl || '');
  };

  const handleSaveVolunteerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer) return;

    updateVolunteer(editingVolunteer.id, {
      name: editVolName,
      mobile: editVolMobile,
      email: editVolEmail,
      age: Number(editVolAge),
      gender: editVolGender,
      address: editVolAddress,
      district: editVolDistrict,
      preferredService: editVolPreferredService,
      occupation: editVolOccupation,
      skills: editVolSkills,
      availableTime: editVolAvailableTime,
      aadhaarNumber: editVolAadhaarNumber,
      status: editVolStatus,
      photoUrl: editVolPhotoPreview,
      aadhaarFrontUrl: editVolAadhaarFrontPreview,
      aadhaarBackUrl: editVolAadhaarBackPreview,
    });

    setActionToast({
      message:
        language === 'en'
          ? `Volunteer "${editVolName}" updated successfully.`
          : `स्वयंसेवक "${editVolName}" का विवरण सफलतापूर्वक अपडेट किया गया।`,
      type: 'success',
    });

    setEditingVolunteer(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider">
              {language === 'en' ? 'Super Admin Control Panel' : 'सुपर एडमिन नियंत्रण कक्ष'}
            </span>
            <span className="text-xs text-blue-200">
              {t.banner.regNumberLabel}: {settings.registrationNumber}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {t.admin.dashboardTitle}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {language === 'en'
              ? `Office: Raisar, Near Cricket Stadium, Rajgir (Nalanda) | Chairperson: Satyendra Kumar`
              : `कार्यालय: ${settings.address} | अध्यक्ष: ${settings.chairpersonName}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('id_cards')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'en' ? `ID Cards (${totalIdCards})` : `ID Card प्रबंधन (${totalIdCards})`}</span>
          </button>

          <button
            onClick={() => setCurrentPage('home')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'View Website' : 'वेबसाइट देखें'}
          </button>
          
          <button
            onClick={adminLogout}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.admin.logoutBtn}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: t.admin.tabOverview, icon: Shield },
          { id: 'id_cards', label: `${t.admin.tabIdCards} (${totalIdCards})`, icon: CreditCard, highlight: true },
          { id: 'applications', label: `${t.admin.tabApplications} (${totalApps})`, icon: Users },
          { id: 'students', label: `${t.admin.tabStudents} (${totalStudents})`, icon: GraduationCap },
          { id: 'volunteers', label: `${t.admin.tabVolunteers} (${totalVolunteers})`, icon: UserCheck },
          { id: 'donations', label: t.admin.tabDonations, icon: Heart },
          { id: 'announcements', label: t.admin.tabAnnouncements, icon: Bell },
          { id: 'settings', label: t.admin.tabSettings, icon: Settings },
          { id: 'supabase', label: 'Supabase Cloud DB', icon: Database, isSupabase: true },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : (tab as any).isSupabase
                  ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {(tab as any).isSupabase && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW / DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[11px] block">{t.admin.statTotalApplications}</span>
              <strong className="text-2xl font-bold text-slate-900 font-mono">{totalApps}</strong>
              <span className="text-[10px] text-blue-600 block mt-1 font-semibold">
                {language === 'en' ? 'All Services' : 'सभी सेवाएं'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[11px] block">{t.admin.statPendingApplications}</span>
              <strong className="text-2xl font-bold text-amber-600 font-mono">{pendingApps}</strong>
              <span className="text-[10px] text-amber-600 block mt-1 font-semibold">
                {language === 'en' ? 'Pending' : 'प्रतीक्षारत'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[11px] block">{t.admin.statApprovedApplications}</span>
              <strong className="text-2xl font-bold text-emerald-700 font-mono">{approvedApps}</strong>
              <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">
                {language === 'en' ? 'Approved' : 'सत्यापित'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[11px] block">
                {language === 'en' ? 'Rejected' : 'अस्वीकृत'}
              </span>
              <strong className="text-2xl font-bold text-rose-700 font-mono">{rejectedApps}</strong>
              <span className="text-[10px] text-rose-600 block mt-1 font-semibold">
                {language === 'en' ? 'Rejected' : 'अमान्य'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/40 shadow-sm">
              <span className="text-amber-900 text-[11px] block font-bold">{t.admin.statIdCards}</span>
              <strong className="text-2xl font-bold text-amber-950 font-mono">{totalIdCards}</strong>
              <span className="text-[10px] text-emerald-700 block mt-1 font-bold">
                {activeIdCards} {language === 'en' ? 'Active' : 'सक्रिय'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[11px] block">{t.admin.statDonations}</span>
              <strong className="text-xl font-bold text-red-600 font-mono">
                ₹{totalDonationsAmount.toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                {donations.length} {language === 'en' ? 'Receipts' : 'रसीदें'}
              </span>
            </div>
          </div>

          {/* Recent Applications & Pending ID Verification Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Applications Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{language === 'en' ? 'Pending Service Applications' : 'प्रतीक्षारत सेवा आवेदन'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'View All →' : 'सभी देखें →'}
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {applications.filter((a) => a.status === 'Pending').length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">
                    {language === 'en' ? 'No pending applications.' : 'कोई प्रतीक्षारत आवेदन नहीं है।'}
                  </p>
                ) : (
                  applications
                    .filter((a) => a.status === 'Pending')
                    .slice(0, 4)
                    .map((app) => (
                      <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <strong className="text-slate-900 block font-bold">{app.fullName}</strong>
                          <span className="text-slate-500 block text-[11px]">
                            {language === 'en' ? app.serviceCategory : app.serviceTitleHi} • {app.mobile}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditApp(app)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                            title={language === 'en' ? 'Edit Form & Aadhaar' : 'फॉर्म व आधार एडिट'}
                          >
                            <Edit className="w-3 h-3" />
                            <span>{language === 'en' ? 'Edit' : 'एडिट'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setNewStatus('Approved');
                              setStatusRemark(
                                language === 'en' ? 'Approved upon verification' : 'सत्यापन उपरांत स्वीकृत'
                              );
                            }}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                          >
                            {language === 'en' ? 'Approve & Issue ID' : 'स्वीकृत व ID जारी करें'}
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Quick ID Card Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span>{language === 'en' ? 'Recently Issued ID Cards' : 'नवीनतम जारी पहचान पत्र'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('id_cards')}
                  className="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'All ID Cards →' : 'सभी ID Cards →'}
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {idCards.slice(0, 4).map((card, idx) => (
                  <div key={`${card.id}-${card.cardNumber || ''}-${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{card.fullName}</strong>
                        <span className="font-mono text-red-700 text-[10px] font-bold">
                          {card.cardNumber}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {language === 'en' ? card.categoryLabelEn : card.categoryLabelHi} • {card.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveIdCard(card)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold rounded-lg cursor-pointer"
                      >
                        {language === 'en' ? 'Print' : 'प्रिंट'}
                      </button>
                      <button
                        onClick={() => setVerifyModalCard(card)}
                        className="p-1 text-slate-500 hover:text-emerald-700 cursor-pointer"
                        title={language === 'en' ? 'Verify' : 'सत्यापन विवरण'}
                      >
                        <BadgeCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ID CARDS MANAGEMENT (NEW COMPLETE SYSTEM)
      ======================================================== */}
      {activeTab === 'id_cards' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Header & New Card CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  {t.admin.tabIdCards} {language === 'en' ? 'Management' : 'प्रबंधन'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? 'ID card generation, status tracking, and printing for all beneficiaries, students, and volunteers.'
                  : 'सभी स्वीकृत आवेदकों, विद्यार्थियों एवं स्वयंसेवकों के लिए पहचान पत्र निर्माण, स्थिति और प्रिंट व्यवस्था।'}
              </p>
            </div>

            <button
              onClick={() => setShowNewIdCardModal(true)}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.issueIdCardBtn}</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={idSearchQuery}
                onChange={(e) => setIdSearchQuery(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Search by name, card no, reg ID or phone...'
                    : 'नाम, कार्ड नंबर, Reg ID या फोन से खोजें...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={idCategoryFilter}
                onChange={(e) => setIdCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
              >
                <option value="all">{language === 'en' ? 'All Categories' : 'सभी श्रेणियां'}</option>
                <option value="student">{language === 'en' ? 'Student ID Card' : 'विद्यार्थी पहचान पत्र'}</option>
                <option value="orphanage">{language === 'en' ? 'Orphanage ID Card' : 'अनाथ आश्रम'}</option>
                <option value="old_age">{language === 'en' ? 'Senior Citizen ID Card' : 'वृद्ध आश्रम'}</option>
                <option value="widow">{language === 'en' ? 'Widow Support ID Card' : 'विधवा संबल'}</option>
                <option value="medical">{language === 'en' ? 'Medical Assistance ID Card' : 'निःशुल्क चिकित्सा'}</option>
                <option value="education">{language === 'en' ? 'Education Support ID Card' : 'शिक्षा सहायता'}</option>
                <option value="volunteer">{language === 'en' ? 'Volunteer ID Card' : 'स्वयंसेवक'}</option>
                <option value="beneficiary">{language === 'en' ? 'Beneficiary ID Card' : 'सामान्य लाभार्थी'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={idStatusFilter}
                onChange={(e) => setIdStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
              >
                <option value="all">{language === 'en' ? 'All Statuses' : 'सभी स्थितियां'}</option>
                <option value="Active">{language === 'en' ? 'Active' : 'सक्रिय'}</option>
                <option value="Approved">{language === 'en' ? 'Approved' : 'स्वीकृत'}</option>
                <option value="Pending">{language === 'en' ? 'Pending' : 'प्रतीक्षारत'}</option>
                <option value="Suspended">{language === 'en' ? 'Suspended' : 'निलंबित'}</option>
                <option value="Expired">{language === 'en' ? 'Expired' : 'समाप्त'}</option>
                <option value="Rejected">{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</option>
              </select>
            </div>
          </div>

          {/* ID Cards Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">{language === 'en' ? 'ID Card No.' : 'कार्ड संख्या'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Cardholder Name' : 'कार्डधारक'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Category' : 'पहचान श्रेणी'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Reg No.' : 'पंजीकरण सं.'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Mobile' : 'मोबाइल'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Validity' : 'वैधता'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Status' : 'स्थिति'}</th>
                  <th className="py-3 px-3 text-right">{language === 'en' ? 'Actions' : 'कार्य'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIdCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {language === 'en' ? 'No ID card records found.' : 'कोई पहचान पत्र रिकॉर्ड नहीं मिला।'}
                    </td>
                  </tr>
                ) : (
                  filteredIdCards.map((card, idx) => {
                    const cfg = ID_CARD_CATEGORY_CONFIG[card.category] || ID_CARD_CATEGORY_CONFIG.beneficiary;
                    const catLabel = language === 'en' ? (card.categoryLabelEn || card.category) : card.categoryLabelHi;
                    return (
                      <tr key={`${card.id}-${card.cardNumber || ''}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-black text-red-700">
                          {card.cardNumber}
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block">{card.fullName}</strong>
                          <span className="text-[10px] text-slate-400">{card.fatherOrHusbandName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                            {catLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{card.registrationNumber}</td>
                        <td className="py-3 px-3 font-mono">{card.mobile}</td>
                        <td className="py-3 px-3 font-medium text-slate-700">{card.validTill}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              card.status === 'Active' || card.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : card.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {language === 'en'
                              ? card.status
                              : card.status === 'Active'
                              ? 'सक्रिय'
                              : card.status === 'Approved'
                              ? 'स्वीकृत'
                              : card.status === 'Pending'
                              ? 'प्रतीक्षारत'
                              : card.status === 'Suspended'
                              ? 'निलंबित'
                              : card.status === 'Expired'
                              ? 'समाप्त'
                              : 'अस्वीकृत'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          {/* View & Print */}
                          <button
                            onClick={() => setActiveIdCard(card)}
                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded font-bold text-[11px] cursor-pointer"
                            title={language === 'en' ? 'View and print card' : 'कार्ड देखें व प्रिंट करें'}
                          >
                            <Printer className="w-3.5 h-3.5 inline mr-1" />
                            {language === 'en' ? 'Card' : 'कार्ड'}
                          </button>

                          {/* Digital Verification */}
                          <button
                            onClick={() => setVerifyModalCard(card)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-bold text-[11px] cursor-pointer"
                            title={language === 'en' ? 'Verification details' : 'सत्यापन विवरण'}
                          >
                            <BadgeCheck className="w-3.5 h-3.5 inline" />
                          </button>

                          {/* Quick Edit Status */}
                          <button
                            onClick={() => setSelectedCardForEdit(card)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                            title={language === 'en' ? 'Change status' : 'स्थिति बदलें'}
                          >
                            <Edit className="w-3.5 h-3.5 inline" />
                          </button>

                          {/* Delete Card */}
                          <button
                            onClick={() => {
                              setDeleteConfirmItem({
                                type: 'id_card',
                                id: card.id,
                                title: card.cardNumber,
                                details: `${card.fullName} (${catLabel}) • ${card.mobile || ''}`,
                              });
                            }}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer transition-colors"
                            title={language === 'en' ? 'Delete ID Card' : 'पहचान पत्र हटाएं'}
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: APPLICATIONS MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Service Applications Management' : 'सेवा सहायता आवेदन प्रबंधन'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Review applications for orphanage, senior care, widow support, healthcare, and education.'
                  : 'अनाथ आश्रम, वृद्ध आश्रम, विधवा संबल, चिकित्सा एवं शिक्षा सहायता आवेदनों की समीक्षा।'}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder={
                  language === 'en' ? 'Search by name, ID or phone...' : 'आवेदक नाम, आईडी या फोन...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl"
              />
            </div>
            <div>
              <select
                value={appCategoryFilter}
                onChange={(e) => setAppCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl"
              >
                <option value="all">{language === 'en' ? 'All Service Categories' : 'सभी सेवा श्रेणियां'}</option>
                <option value="orphanage">{language === 'en' ? 'Orphanage' : 'अनाथ आश्रम'}</option>
                <option value="old_age">{language === 'en' ? 'Old Age Home' : 'वृद्ध आश्रम'}</option>
                <option value="widow">{language === 'en' ? 'Widow Support' : 'विधवा आश्रम / संबल'}</option>
                <option value="education">{language === 'en' ? 'Free Education' : 'निःशुल्क शिक्षा'}</option>
                <option value="medical">{language === 'en' ? 'Free Medical' : 'निःशुल्क चिकित्सा'}</option>
              </select>
            </div>
            <div>
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl"
              >
                <option value="all">{language === 'en' ? 'All Statuses' : 'सभी स्थितियां'}</option>
                <option value="Pending">{language === 'en' ? 'Pending' : 'प्रतीक्षारत'}</option>
                <option value="Under Review">{language === 'en' ? 'Under Review' : 'समीक्षाधीन'}</option>
                <option value="Approved">{language === 'en' ? 'Approved' : 'स्वीकृत'}</option>
                <option value="Rejected">{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">{language === 'en' ? 'Application ID' : 'आवेदन आईडी'}</th>
                  <th className="py-3 px-3">{t.admin.applicantColumn}</th>
                  <th className="py-3 px-3">{t.admin.serviceColumn}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Mobile' : 'मोबाइल'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Location' : 'स्थान'}</th>
                  <th className="py-3 px-3">{t.admin.statusColumn}</th>
                  <th className="py-3 px-3 text-right">{t.admin.actionsColumn}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {language === 'en' ? 'No applications found.' : 'कोई आवेदन नहीं मिला'}
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app, idx) => {
                    const card = idCards.find(
                      (c) => c.sourceId === app.id || c.registrationNumber === app.id
                    );
                    const serviceTitle = language === 'en' ? app.serviceCategory : app.serviceTitleHi;
                    return (
                      <tr key={`${app.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-blue-900">{app.id}</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block">{app.fullName}</strong>
                          <span className="text-[11px] text-slate-400">{app.fatherOrHusbandName}</span>
                          {(app.photoUrl || app.aadhaarFrontUrl || app.aadhaarBackUrl) && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {app.photoUrl && (
                                <span className="inline-block px-1.5 py-0.2 text-[9px] bg-blue-50 text-blue-700 rounded font-semibold border border-blue-200">
                                  {language === 'en' ? 'Photo' : 'फोटो'}
                                </span>
                              )}
                              {app.aadhaarFrontUrl && (
                                <span className="inline-block px-1.5 py-0.2 text-[9px] bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
                                  {language === 'en' ? 'Aadhaar (F)' : 'आधार (आगे)'}
                                </span>
                              )}
                              {app.aadhaarBackUrl && (
                                <span className="inline-block px-1.5 py-0.2 text-[9px] bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
                                  {language === 'en' ? 'Aadhaar (B)' : 'आधार (पीछे)'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">{serviceTitle}</td>
                        <td className="py-3 px-3 font-mono">{app.mobile}</td>
                        <td className="py-3 px-3">{app.district}, {app.village}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              app.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'Under Review'
                                ? 'bg-amber-100 text-amber-800'
                                : app.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {language === 'en'
                              ? app.status
                              : app.status === 'Approved'
                              ? 'स्वीकृत'
                              : app.status === 'Under Review'
                              ? 'समीक्षाधीन'
                              : app.status === 'Rejected'
                              ? 'अस्वीकृत'
                              : 'प्रतीक्षारत'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          {/* उम्मीदवार फॉर्म एडिट */}
                          <button
                            onClick={() => handleOpenEditApp(app)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title={language === 'en' ? 'Edit Candidate Form & Aadhaar' : 'उम्मीदवार फॉर्म व आधार एडिट करें'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Edit Form' : 'फॉर्म एडिट'}</span>
                          </button>

                          {/* Print या PDF ऑप्शन */}
                          <button
                            onClick={() => setPrintableCandidate({ candidate: app, type: 'application' })}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                            title={language === 'en' ? 'Print or Save PDF' : 'प्रपत्र प्रिंट या PDF'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Print/PDF' : 'प्रिंट/PDF'}</span>
                          </button>

                          {/* विवरण देखें */}
                          <button
                            onClick={() => setActiveReceipt({ type: 'application', data: app })}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-bold text-[11px] cursor-pointer"
                            title={language === 'en' ? 'View Details' : 'विवरण देखें'}
                          >
                            {language === 'en' ? 'Details' : 'विवरण'}
                          </button>

                          {/* Quick action: स्वीकृत करें if pending/under review */}
                          {app.status !== 'Approved' && (
                            <button
                              onClick={() => {
                                updateApplicationStatus(
                                  app.id,
                                  'Approved',
                                  language === 'en' ? 'Approved by admin' : 'कार्यालय द्वारा स्वीकृत'
                                );
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold text-[11px] cursor-pointer"
                              title={language === 'en' ? 'Approve' : 'स्वीकृत करें'}
                            >
                              {language === 'en' ? 'Approve' : 'स्वीकृत करें'}
                            </button>
                          )}

                          {/* Quick action: अस्वीकृत करें if not rejected */}
                          {app.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                updateApplicationStatus(
                                  app.id,
                                  'Rejected',
                                  language === 'en' ? 'Incomplete documentation' : 'दस्तावेज अपूर्ण'
                                );
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[11px] cursor-pointer"
                              title={language === 'en' ? 'Reject' : 'अस्वीकृत करें'}
                            >
                              {language === 'en' ? 'Reject' : 'अस्वीकृत करें'}
                            </button>
                          )}

                          {/* ID Card link if exists or can be issued */}
                          {card ? (
                            <button
                              onClick={() => setActiveIdCard(card)}
                              className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded font-bold text-[11px] cursor-pointer"
                              title={language === 'en' ? 'View ID Card' : 'पहचान पत्र देखें'}
                            >
                              <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                              {language === 'en' ? 'ID Card' : 'पहचान पत्र'}
                            </button>
                          ) : (
                            app.status === 'Approved' && (
                              <button
                                onClick={() => {
                                  const newC = generateIdCardForRecord('application', app, 'Active');
                                  setActiveIdCard(newC);
                                }}
                                className="px-2 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded font-bold text-[11px] cursor-pointer"
                                title={language === 'en' ? 'Issue ID Card' : 'पहचान पत्र जारी करें'}
                              >
                                {language === 'en' ? '+ Issue ID' : '+ पहचान पत्र'}
                              </button>
                            )
                          )}

                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setNewStatus(app.status);
                              setStatusRemark(app.statusRemarks || '');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                            title={language === 'en' ? 'Change status' : 'विस्तृत स्थिति बदलें'}
                          >
                            <Edit className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmItem({
                                type: 'application',
                                id: app.id,
                                title: app.id,
                                details: `${app.fullName} • ${app.serviceTitleHi || app.serviceCategory} • ${app.mobile}`,
                              });
                            }}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer transition-colors"
                            title={language === 'en' ? 'Delete' : 'हटाएं'}
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Student Registry & ID Cards' : 'विद्यार्थी सूची एवं पहचान पत्र'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Official records of students enrolled in free education and coaching programs.'
                  : 'निःशुल्क शिक्षा, छात्रवृत्ति एवं कोचिंग अध्ययनरत विद्यार्थियों का आधिकारिक रिकॉर्ड।'}
              </p>
            </div>
            <button
              onClick={() => setShowNewStudentModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.addStudentBtn}</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">{language === 'en' ? 'Registration No.' : 'पंजीकरण संख्या'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Student Name' : 'छात्र का नाम'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Class' : 'कक्षा'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Parents' : 'माता / पिता'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Mobile' : 'मोबाइल'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'DOB' : 'जन्मतिथि'}</th>
                  <th className="py-3 px-3 text-right">{t.admin.actionsColumn}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu, idx) => {
                  const card = idCards.find(
                    (c) => c.sourceId === stu.id || c.registrationNumber === stu.registrationNumber
                  );
                  return (
                    <tr key={`${stu.id}-${stu.registrationNumber || ''}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-red-700">{stu.registrationNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{stu.name}</td>
                      <td className="py-3 px-3">{stu.studentClass}</td>
                      <td className="py-3 px-3 text-slate-600">{stu.fatherName}</td>
                      <td className="py-3 px-3 font-mono">{stu.mobile}</td>
                      <td className="py-3 px-3 font-mono">{stu.dob}</td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        {/* छात्र फॉर्म एडिट */}
                        <button
                          onClick={() => handleOpenEditStudent(stu)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title={language === 'en' ? 'Edit Student Form & Aadhaar' : 'छात्र फॉर्म व आधार एडिट करें'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Edit Form' : 'फॉर्म एडिट'}</span>
                        </button>

                        {/* छात्र Print या PDF */}
                        <button
                          onClick={() => setPrintableCandidate({ candidate: stu, type: 'student' })}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          title={language === 'en' ? 'Print or Save PDF' : 'छात्र प्रपत्र प्रिंट या PDF'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Print/PDF' : 'प्रिंट/PDF'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (card) {
                              setActiveIdCard(card);
                            } else {
                              const newCard = generateIdCardForRecord('student', stu, 'Active');
                              setActiveIdCard(newCard);
                            }
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold cursor-pointer"
                          title={language === 'en' ? 'View ID Card' : 'छात्र पहचान पत्र देखें'}
                        >
                          <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                          {language === 'en' ? 'ID Card' : 'ID Card'}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmItem({
                              type: 'student',
                              id: stu.id,
                              title: stu.registrationNumber || stu.id,
                              details: `${stu.name} (${stu.studentClass}) • ${stu.mobile}`,
                            });
                          }}
                          className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded cursor-pointer transition-colors"
                          title={language === 'en' ? 'Delete' : 'हटाएं'}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: VOLUNTEERS */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Volunteers Registry & ID Cards' : 'स्वयंसेवक रिकॉर्ड एवं परिचय पत्र'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Community workers and seva trust volunteer records with official ID generation.'
                  : 'ट्रस्ट के साथ जुड़े सामाजिक कार्यकर्ताओं का ब्यौरा एवं आधिकारिक सेवादार पहचान पत्र।'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">{language === 'en' ? 'Volunteer ID' : 'आईडी'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Volunteer' : 'स्वयंसेवक'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Preferred Service' : 'पसंदीदा सेवा'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Occupation / Skills' : 'पेशा / हुनर'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Mobile' : 'मोबाइल'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Availability' : 'उपलब्ध समय'}</th>
                  <th className="py-3 px-3 text-right">{t.admin.actionsColumn}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteers.map((vol, idx) => {
                  const card = idCards.find((c) => c.sourceId === vol.id);
                  return (
                    <tr key={`${vol.id}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">{vol.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {vol.name} ({vol.age} {language === 'en' ? 'yrs' : 'वर्ष'})
                      </td>
                      <td className="py-3 px-3 text-blue-900 font-semibold">{vol.preferredService}</td>
                      <td className="py-3 px-3 text-slate-600">{vol.occupation} • {vol.skills}</td>
                      <td className="py-3 px-3 font-mono">{vol.mobile}</td>
                      <td className="py-3 px-3">{vol.availableTime}</td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        {/* Edit Volunteer Button */}
                        <button
                          onClick={() => handleOpenEditVolunteer(vol)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-colors"
                          title={language === 'en' ? 'Edit Volunteer Details' : 'स्वयंसेवक विवरण संपादित करें'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Edit' : 'एडिट'}</span>
                        </button>

                        {card ? (
                          <button
                            onClick={() => setActiveIdCard(card)}
                            className="px-2 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold rounded cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                            {language === 'en' ? 'ID Card' : 'ID Card'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const created = generateIdCardForRecord('volunteer', vol, 'Active');
                              setActiveIdCard(created);
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 font-bold rounded cursor-pointer"
                          >
                            {language === 'en' ? '+ ID Card' : '+ ID कार्ड'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteConfirmItem({
                              type: 'volunteer',
                              id: vol.id,
                              title: vol.id,
                              details: `${vol.name} • ${vol.preferredService} • ${vol.mobile}`,
                            });
                          }}
                          className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded cursor-pointer transition-colors"
                          title={language === 'en' ? 'Delete' : 'हटाएं'}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DONATIONS MANAGEMENT */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Donations & Receipts Verification' : 'सहयोग राशि एवं दान सत्यापन'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Verification of donations received via UPI, QR code, and bank transfers.'
                  : 'UPI, QR कोड एवं बैंक ट्रांसफर के माध्यम से प्राप्त दान राशि का सत्यापन।'}
              </p>
            </div>
            <div className="text-sm font-bold text-slate-900 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              {language === 'en' ? 'Total Contributions: ' : 'कुल सहयोग: '}
              <strong className="text-red-700 text-base font-black">₹{totalDonationsAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3">{language === 'en' ? 'Receipt No.' : 'रसीद संख्या'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Donor Name' : 'दानदाता का नाम'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Amount' : 'राशि'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Method / Ref' : 'माध्यम / Ref'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Mobile' : 'मोबाइल'}</th>
                  <th className="py-3 px-3">{language === 'en' ? 'Verification' : 'सत्यापन स्थिति'}</th>
                  <th className="py-3 px-3 text-right">{language === 'en' ? 'Receipt' : 'रसीद'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((don, idx) => (
                  <tr key={`${don.id}-${don.receiptNumber || ''}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">{don.receiptNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{don.donorName}</td>
                    <td className="py-3 px-3 font-bold text-red-700 text-sm">₹{don.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <div>{don.paymentMethod}</div>
                      <span className="font-mono text-[10px] text-slate-400">{don.transactionId}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">{don.mobile}</td>
                    <td className="py-3 px-3">
                      {don.isVerified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {language === 'en' ? 'Verified' : 'सत्यापित'}
                        </span>
                      ) : (
                        <button
                          onClick={() => verifyDonation(don.id, true)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                        >
                          {language === 'en' ? 'Verify Now' : 'सत्यापित करें'}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveReceipt({ type: 'donation', data: don })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
                      >
                        {language === 'en' ? 'View Receipt' : 'रसीद देखें'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {language === 'en' ? 'Post New Announcement' : 'नई सूचना जोड़ें'}
            </h3>
            <form onSubmit={handleAddAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Announcement Title *' : 'सूचना का शीर्षक *'}
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder={
                    language === 'en' ? 'e.g. Free Eye Checkup Camp Notice' : 'उदा. आगामी रक्तदान शिविर सूचना'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Detailed Content *' : 'विस्तृत विवरण *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder={
                    language === 'en' ? 'Write the complete announcement content...' : 'सूचना का पूरा विवरण लिखें...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Announcement Photo / Poster Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Announcement Image / Poster (Photo Upload)' : 'सूचना की फोटो / पोस्टर अपलोड (वैकल्पिक)'}
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-xs hover:bg-blue-50 transition-colors">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{language === 'en' ? 'Upload Image / Photo' : 'फोटो / पोस्टर चुनें'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAnnImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {language === 'en' ? 'JPG, PNG, WebP (Camp photo, notice banner, etc.)' : 'JPG, PNG, WebP (शिविर, पोस्टर या कार्यक्रम की फोटो)'}
                    </span>
                  </div>

                  {annImagePreview && (
                    <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-white max-w-sm shadow-sm group">
                      <img
                        src={annImagePreview}
                        alt="Announcement Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-2 bg-slate-900/90 text-white text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {language === 'en' ? 'Photo Attached' : 'फोटो संलग्न की गई'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnnImagePreview('')}
                          className="text-red-300 hover:text-red-100 flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Remove' : 'हटाएं'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={annImportant}
                  onChange={(e) => setAnnImportant(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="font-bold text-slate-700">
                  {language === 'en' ? 'Mark as Important Notice' : 'इसे महत्वपूर्ण चिह्नित करें'}
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Publish Announcement' : 'सूचना प्रकाशित करें'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {language === 'en' ? 'Published Announcements' : 'प्रकाशित सूचनाएं'}
            </h3>
            <div className="space-y-4">
              {announcements.map((ann, idx) => (
                <div key={`${ann.id}-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-4 text-xs">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{ann.date}</span>
                      {ann.isImportant && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[9px]">
                          {language === 'en' ? 'Important' : 'महत्वपूर्ण'}
                        </span>
                      )}
                      {ann.imageUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {language === 'en' ? 'Photo Attached' : 'फोटो संलग्न'}
                        </span>
                      )}
                    </div>
                    <strong className="block text-slate-900 text-sm leading-snug">{ann.title}</strong>
                    <p className="text-slate-600 leading-relaxed">{ann.content}</p>

                    {ann.imageUrl && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewingImageModal(ann.imageUrl || null)}
                          className="group relative inline-block rounded-xl overflow-hidden border border-slate-300 shadow-xs cursor-pointer hover:border-blue-500 transition-colors"
                        >
                          <img
                            src={resolveAssetUrl(ann.imageUrl)}
                            alt={ann.title}
                            className="w-48 h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'View Photo' : 'फोटो देखें'}</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl cursor-pointer self-start shrink-0"
                    title={language === 'en' ? 'Delete' : 'हटाएं'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Image Preview Modal */}
      {previewingImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                {language === 'en' ? 'Announcement Photo Preview' : 'सूचना फोटो पूर्वावलोकन'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewingImageModal(null)}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                ✕ {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 max-h-[75vh] overflow-auto">
              <img
                src={resolveAssetUrl(previewingImageModal)}
                alt="Announcement Full Preview"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: TRUST SETTINGS & ID CARD CONFIG */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'en'
                ? 'Trust Settings & ID Card Configuration'
                : 'ट्रस्ट सेटिंग्स एवं पहचान पत्र प्रारूप नियंत्रण'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Manage ID card numbering format, validity duration, official bank details, UPI ID, and QR code upload.'
                : 'ID Card नंबरिंग फॉर्मेट, वैधता अवधि, बैंक विवरण, यूपीआई आईडी तथा वास्तविक क्यूआर कोड अपलोड करें।'}
            </p>
          </div>

          {settingsSaved && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                {language === 'en' ? 'Settings saved successfully!' : 'सेटिंग्स सफलतापूर्वक सहेज ली गई हैं!'}
              </span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            
            {/* ID CARD SYSTEM CONFIGURATION BOX */}
            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-4">
              <h3 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-700" />
                <span>
                  {language === 'en'
                    ? 'ID Card Numbering & Format Settings'
                    : 'पहचान पत्र नंबरिंग एवं प्रारूप सेटिंग्स'}
                </span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {language === 'en'
                  ? 'Set the ID card prefix, next sequential number, and card validity period in years.'
                  : 'यहाँ से ID Card का उपसर्ग (Prefix), अगला जारी होने वाला अनुक्रम, एवं कार्ड वैधता अवधि निर्धारित करें।'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'ID Card Prefix (e.g. LKST-2026-)' : 'ID Card Prefix (उदा. LKST-2026-)'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.idCardConfig?.prefix || 'LKST-2026-'}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        idCardConfig: {
                          ...tempSettings.idCardConfig,
                          prefix: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Next Sequence Number' : 'अगला नंबर'}
                  </label>
                  <input
                    type="number"
                    value={tempSettings.idCardConfig?.nextNumber || 1}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        idCardConfig: {
                          ...tempSettings.idCardConfig,
                          nextNumber: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Validity Period (Years)' : 'वैधता अवधि (वर्षों में)'}
                  </label>
                  <input
                    type="number"
                    value={tempSettings.idCardConfig?.validityYears || 3}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        idCardConfig: {
                          ...tempSettings.idCardConfig,
                          validityYears: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Card Helpline Number' : 'कार्ड हेल्पलाइन नंबर'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.idCardConfig?.emergencyHelpline || '9470635412'}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        idCardConfig: {
                          ...tempSettings.idCardConfig,
                          emergencyHelpline: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Real Donation QR Code Upload */}
            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-3">
              <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-700" />
                <span>
                  {language === 'en'
                    ? 'Upload Official Donation QR Code'
                    : 'वास्तविक दान QR कोड अपलोड करें'}
                </span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {language === 'en'
                  ? 'Upload the official UPI QR code image of the Trust bank account.'
                  : 'यहाँ ट्रस्ट के बैंक खाते का वास्तविक UPI QR कोड चित्र अपलोड करें।'}
              </p>

              <div className="flex items-center gap-6">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{language === 'en' ? 'Select New QR Code Image' : 'नया QR कोड चित्र चुनें'}</span>
                  <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                </label>

                {tempSettings.donationQrUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-400 bg-white p-1">
                    <img src={tempSettings.donationQrUrl} alt="Real QR Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Trust Name (English)' : 'ट्रस्ट का नाम (English)'}
                </label>
                <input
                  type="text"
                  value={tempSettings.name}
                  onChange={(e) => setTempSettings({ ...tempSettings, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Trust Name (Hindi)' : 'न्यास नाम (हिन्दी)'}
                </label>
                <input
                  type="text"
                  value={tempSettings.nameHi}
                  onChange={(e) => setTempSettings({ ...tempSettings, nameHi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Government Reg Number' : 'सरकारी पंजीकरण संख्या'}
                </label>
                <input
                  type="text"
                  value={tempSettings.registrationNumber}
                  onChange={(e) => setTempSettings({ ...tempSettings, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Chairperson Name' : 'कार्यालय अध्यक्ष का नाम'}
                </label>
                <input
                  type="text"
                  value={tempSettings.chairpersonName}
                  onChange={(e) => setTempSettings({ ...tempSettings, chairpersonName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              {/* Chairperson Official Photo Upload */}
              <div className="sm:col-span-2 p-4 bg-amber-50/70 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-900 text-sm">
                      {language === 'en' ? 'Chairperson Official Portrait Photo' : 'अध्यक्ष (सत्येन्द्र कुमार) आधिकारिक फ़ोटो'}
                    </label>
                    <p className="text-xs text-slate-600">
                      {language === 'en'
                        ? 'Upload your official photograph (ChatGPT Image / Passport Photo) to display on homepage and about page'
                        : 'वेबसाइट के मुख्य पृष्ठ एवं परिचय में अपनी असली फ़ोटो प्रदर्शित करें'}
                    </p>
                  </div>
                  {tempSettings.chairpersonPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, chairpersonPhotoUrl: '' })}
                      className="self-start sm:self-auto px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 font-semibold cursor-pointer"
                    >
                      {language === 'en' ? 'Reset to Default' : 'डिफ़ॉल्ट पर रीसेट करें'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-amber-400 overflow-hidden bg-white shadow-sm shrink-0">
                    <img
                      src={tempSettings.chairpersonPhotoUrl || CHAIRPERSON_PHOTO}
                      alt="Chairperson Preview"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md transition-colors">
                      <Upload className="w-4 h-4 text-amber-300" />
                      <span>{language === 'en' ? 'Choose Image File' : 'अपनी असली फ़ोटो चुनें (Upload Photo)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              setTempSettings({ ...tempSettings, chairpersonPhotoUrl: r.result as string });
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {language === 'en'
                        ? 'Supported: JPG, PNG, WEBP (Instant high-res preview)'
                        : 'समर्थित: JPG, PNG, WEBP (चुनते ही तुरंत सुरक्षित सेव होगी)'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Official Phone / WhatsApp' : 'आधिकारिक फोन / WhatsApp'}
                </label>
                <input
                  type="text"
                  value={tempSettings.phone}
                  onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Official Email' : 'आधिकारिक ईमेल'}
                </label>
                <input
                  type="email"
                  value={tempSettings.email}
                  onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Registered Office Address' : 'कार्यालय का पूरा पता'}
                </label>
                <input
                  type="text"
                  value={tempSettings.address}
                  onChange={(e) => setTempSettings({ ...tempSettings, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Trust UPI ID' : 'ट्रस्ट UPI ID'}
                </label>
                <input
                  type="text"
                  value={tempSettings.upiId}
                  onChange={(e) => setTempSettings({ ...tempSettings, upiId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Bank Info */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-700" />
                <span>
                  {language === 'en' ? 'Official Bank Account Details' : 'ट्रस्ट बैंक खाता विवरण'}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Bank Name' : 'बैंक का नाम'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.bankDetails.bankName}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        bankDetails: { ...tempSettings.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Account Number' : 'खाता संख्या'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.bankDetails.accountNumber}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        bankDetails: { ...tempSettings.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'IFSC Code' : 'IFSC कोड'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.bankDetails.ifscCode}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        bankDetails: { ...tempSettings.bankDetails, ifscCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Branch' : 'शाखा'}
                  </label>
                  <input
                    type="text"
                    value={tempSettings.bankDetails.branch}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        bankDetails: { ...tempSettings.bankDetails, branch: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {t.admin.saveSettingsBtn}
            </button>
          </form>
        </div>
      )}

      {/* TAB 9: SUPABASE CLOUD DATABASE SYNC */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                  <Database className="w-3.5 h-3.5" />
                  <span>Supabase PostgreSQL Cloud Storage</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {language === 'en' ? 'Supabase Database Management' : 'सुपाबेस क्लाउड डेटाबेस प्रबंधन'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {language === 'en'
                    ? 'All service applications, student admissions, volunteer registrations, ID cards, donations, and announcements are configured to save directly into your Supabase database.'
                    : 'सभी सेवा आवेदन, छात्र प्रवेश, स्वयंसेवक पंजीकरण, डिजिटल पहचान पत्र, दान रसीदें और सूचनाएं सीधे आपके Supabase डेटाबेस में सुरक्षित होने के लिए तैयार हैं।'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isManualSyncing || supabaseStatus.isSyncing}
                  onClick={async () => {
                    setIsManualSyncing(true);
                    setSyncFeedback(null);
                    const ok = await syncWithSupabase();
                    setIsManualSyncing(false);
                    if (ok) {
                      setSyncFeedback(
                        language === 'en'
                          ? 'Successfully synchronized all records with Supabase!'
                          : 'सभी रिकॉर्ड्स सफलतापूर्वक Supabase में सिंक हो गए हैं!'
                      );
                    } else {
                      setSyncFeedback(
                        language === 'en'
                          ? 'Sync initiated. Note: If tables are not created yet, please run the SQL script below.'
                          : 'सिंक प्रारंभ हुआ। यदि तालिकाएं अभी नहीं बनी हैं, तो कृपया नीचे दिए गए SQL कोड को रन करें।'
                      );
                    }
                  }}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isManualSyncing || supabaseStatus.isSyncing ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isManualSyncing || supabaseStatus.isSyncing
                      ? language === 'en'
                        ? 'Syncing Now...'
                        : 'सिंक हो रहा है...'
                      : language === 'en'
                      ? 'Sync All Data to Supabase'
                      : 'सारा डेटा Supabase में सिंक करें'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">
                        {language === 'en' ? 'SQL Copied!' : 'SQL कॉपी हो गया!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-300" />
                      <span>{language === 'en' ? 'Copy SQL Script' : 'SQL टेबल कोड कॉपी करें'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Feedback Alert */}
            {syncFeedback && (
              <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Connection Credentials Banner */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-700/60 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Project ID:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{SUPABASE_PROJECT_ID}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Supabase Endpoint:</span>
                <span className="font-mono text-slate-200 text-xs truncate block">{SUPABASE_URL}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Last Sync Status:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-emerald-300">
                    {supabaseStatus.lastSyncedAt ? `${language === 'en' ? 'Synced at' : 'अंतिम सिंक:'} ${supabaseStatus.lastSyncedAt}` : (language === 'en' ? 'Auto-sync active' : 'ऑटो-सिंक सक्रिय')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Entities Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">Applications</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalApps}</div>
              <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                Table: applications
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">ID Cards</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalIdCards}</div>
              <span className="text-[10px] text-blue-700 font-bold block bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                Table: id_cards
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">Students</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalStudents}</div>
              <span className="text-[10px] text-purple-700 font-bold block bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                Table: students
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">Volunteers</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalVolunteers}</div>
              <span className="text-[10px] text-amber-800 font-bold block bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                Table: volunteers
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">Donations</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{donations.length}</div>
              <span className="text-[10px] text-rose-700 font-bold block bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                Table: donations
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-slate-500 text-[11px] block">Announcements</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{announcements.length}</div>
              <span className="text-[10px] text-teal-700 font-bold block bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                Table: announcements
              </span>
            </div>
          </div>

          {/* Quick Setup Instructions & SQL Script Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-600" />
                  <span>
                    {language === 'en'
                      ? 'One-Time Database Table Setup (Supabase SQL Editor)'
                      : 'एक बार की तालिका सेटअप विधि (Supabase SQL Editor)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'en'
                    ? 'If your Supabase project is fresh, run this script once in your Supabase SQL Editor to initialize all tables.'
                    : 'यदि आपका Supabase प्रोजेक्ट नया है, तो सभी टेबल व अनुमतियाँ बनाने के लिए इस SQL कोड को Supabase में एक बार चलाएं।'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? (language === 'en' ? 'Copied!' : 'कॉपी हो गया!') : (language === 'en' ? 'Copy SQL Code' : 'SQL कोड कॉपी करें')}</span>
              </button>
            </div>

            {/* Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-[11px] mb-2">
                  1
                </span>
                <strong className="block text-slate-900 font-bold">
                  {language === 'en' ? 'Open SQL Editor' : 'SQL एडिटर खोलें'}
                </strong>
                <p className="text-slate-600 text-[11px]">
                  {language === 'en'
                    ? `Go to your Supabase project (yjbowhkgwatrwmuyvkja) and click on the "SQL Editor" icon in the left menu.`
                    : `अपने Supabase प्रोजेक्ट (yjbowhkgwatrwmuyvkja) में जाएं और बाएं मेनू से "SQL Editor" पर क्लिक करें।`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-[11px] mb-2">
                  2
                </span>
                <strong className="block text-slate-900 font-bold">
                  {language === 'en' ? 'Paste & Click RUN' : 'पेस्ट करें और RUN दबाएं'}
                </strong>
                <p className="text-slate-600 text-[11px]">
                  {language === 'en'
                    ? 'Click "New Query", paste the copied SQL script, and click the green "Run" button.'
                    : '"New Query" पर क्लिक करें, कॉपी किया गया SQL कोड पेस्ट करें और हरे रंग का "RUN" बटन दबाएं।'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-[11px] mb-2">
                  3
                </span>
                <strong className="block text-slate-900 font-bold">
                  {language === 'en' ? 'Verify Live Tables' : 'लाइव टेबल देखें'}
                </strong>
                <p className="text-slate-600 text-[11px]">
                  {language === 'en'
                    ? 'Go to "Table Editor" to see applications, id_cards, students, volunteers, donations and settings live!'
                    : '"Table Editor" में जाएं और सभी तालिकाओं में लाइव डेटा देखें!'}
                </p>
              </div>
            </div>

            {/* Collapsible SQL Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {language === 'en' ? 'PostgreSQL Table Schema Preview:' : 'PostgreSQL टेबल स्कीमा प्रीव्यू:'}
              </span>
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed shadow-inner">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS & DIALOGS
      ======================================================== */}

      {/* Application Status Change Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <h3 className="font-bold text-base text-slate-900">
              {language === 'en'
                ? `Update Application Status: ${selectedApp.id}`
                : `आवेदन स्थिति अद्यतन करें: ${selectedApp.id}`}
            </h3>
            <p className="text-xs text-slate-600">
              {language === 'en' ? 'Applicant: ' : 'आवेदक: '}
              <strong>{selectedApp.fullName}</strong> ({language === 'en' ? selectedApp.serviceCategory : selectedApp.serviceTitleHi})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Select New Status *' : 'नई स्थिति चुनें *'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 text-xs border rounded-xl"
              >
                <option value="Pending">{language === 'en' ? 'Pending' : 'प्रतीक्षारत'}</option>
                <option value="Under Review">{language === 'en' ? 'Under Review' : 'समीक्षाधीन'}</option>
                <option value="Approved">{language === 'en' ? 'Approved' : 'स्वीकृत'}</option>
                <option value="Rejected">{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</option>
                <option value="Completed">{language === 'en' ? 'Completed' : 'पूर्ण'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Office Remarks / Notes' : 'कार्यालय टिप्पणी / रिमार्क'}
              </label>
              <textarea
                rows={2}
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'e.g. Physical verification completed, approved...'
                    : 'उदा. भौतिक सत्यापन पूर्ण, सहायता स्वीकृत...'
                }
                className="w-full px-3 py-2 text-xs border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
              >
                {language === 'en' ? 'Save Status' : 'सुरक्षित करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit ID Card Status Modal */}
      {selectedCardForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <h3 className="font-bold text-base text-slate-900">
              {language === 'en'
                ? `Update ID Card Status: ${selectedCardForEdit.cardNumber}`
                : `पहचान पत्र स्थिति अद्यतन: ${selectedCardForEdit.cardNumber}`}
            </h3>
            <p className="text-xs text-slate-600">
              {language === 'en' ? 'Holder: ' : 'धारक: '}
              <strong>{selectedCardForEdit.fullName}</strong> ({language === 'en' ? selectedCardForEdit.categoryLabelEn : selectedCardForEdit.categoryLabelHi})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Card Status *' : 'कार्ड स्थिति *'}
                </label>
                <select
                  value={selectedCardForEdit.status}
                  onChange={(e) =>
                    setSelectedCardForEdit({
                      ...selectedCardForEdit,
                      status: e.target.value as IdCardStatus,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <option value="Active">{language === 'en' ? 'Active' : 'सक्रिय'}</option>
                  <option value="Approved">{language === 'en' ? 'Approved' : 'स्वीकृत'}</option>
                  <option value="Pending">{language === 'en' ? 'Pending' : 'प्रतीक्षारत'}</option>
                  <option value="Suspended">{language === 'en' ? 'Suspended' : 'निलंबित'}</option>
                  <option value="Expired">{language === 'en' ? 'Expired' : 'समाप्त'}</option>
                  <option value="Rejected">{language === 'en' ? 'Rejected' : 'अस्वीकृत'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Valid Till' : 'वैधता तिथि'}
                </label>
                <input
                  type="text"
                  value={selectedCardForEdit.validTill}
                  onChange={(e) =>
                    setSelectedCardForEdit({
                      ...selectedCardForEdit,
                      validTill: e.target.value,
                    })
                  }
                  placeholder={language === 'en' ? 'e.g. 2029-03-31 or Lifetime' : 'उदा. 2029-03-31 या आजीवन'}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Role / Class / Designation' : 'पद / भूमिका / वर्ग'}
                </label>
                <input
                  type="text"
                  value={selectedCardForEdit.roleOrClass || ''}
                  onChange={(e) =>
                    setSelectedCardForEdit({
                      ...selectedCardForEdit,
                      roleOrClass: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setSelectedCardForEdit(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                onClick={() => {
                  updateIdCard(selectedCardForEdit.id, {
                    status: selectedCardForEdit.status,
                    validTill: selectedCardForEdit.validTill,
                    roleOrClass: selectedCardForEdit.roleOrClass,
                  });
                  setSelectedCardForEdit(null);
                }}
                className="px-4 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-lg shadow cursor-pointer"
              >
                {language === 'en' ? 'Update Card' : 'अद्यतन करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe In-App Delete Confirmation Modal (Avoids window.confirm blocked by iframes) */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">
                  {deleteConfirmItem.type === 'id_card'
                    ? (language === 'en' ? 'Delete ID Card' : 'पहचान पत्र हटाएं')
                    : deleteConfirmItem.type === 'application'
                    ? (language === 'en' ? 'Delete Application' : 'आवेदन हटाएं')
                    : deleteConfirmItem.type === 'student'
                    ? (language === 'en' ? 'Delete Student Record' : 'विद्यार्थी रिकॉर्ड हटाएं')
                    : (language === 'en' ? 'Delete Volunteer' : 'स्वयंसेवक रिकॉर्ड हटाएं')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'en'
                    ? 'Are you sure you want to permanently delete this record? This action cannot be undone.'
                    : 'क्या आप वाकई इस रिकॉर्ड को स्थायी रूप से हटाना चाहते हैं? यह कार्य पूर्ववत नहीं किया जा सकता।'}
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-red-950 flex items-center gap-1.5 font-mono text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deleteConfirmItem.title}</span>
              </div>
              {deleteConfirmItem.details && (
                <div className="text-[11px] text-slate-700 pl-5.5 font-sans">
                  {deleteConfirmItem.details}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'en' ? 'Yes, Delete' : 'हाँ, हटाएं'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {actionToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionToast.message}</span>
          <button
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New ID Card Issue Modal */}
      {showNewIdCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {language === 'en' ? 'Issue New Official ID Card' : 'नवीन पहचान पत्र (ID Card) जारी करें'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {language === 'en'
                    ? 'Card number will be allocated sequentially.'
                    : 'कार्ड नंबर स्वतः अद्वितीय क्रम में आवंटित होगा।'}
                </span>
              </div>
              <button
                onClick={() => setShowNewIdCardModal(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIdCard} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'ID Card Category *' : 'पहचान पत्र श्रेणी *'}
                  </label>
                  <select
                    value={newCardCategory}
                    onChange={(e) => setNewCardCategory(e.target.value as IdCardCategory)}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-amber-50"
                  >
                    <option value="student">{language === 'en' ? 'Student ID Card' : 'विद्यार्थी पहचान पत्र'}</option>
                    <option value="orphanage">{language === 'en' ? 'Orphanage ID Card' : 'अनाथ आश्रम पहचान पत्र'}</option>
                    <option value="old_age">{language === 'en' ? 'Senior Citizen ID Card' : 'वरिष्ठ नागरिक पहचान पत्र'}</option>
                    <option value="widow">{language === 'en' ? 'Widow Support ID Card' : 'विधवा संबल पहचान पत्र'}</option>
                    <option value="medical">{language === 'en' ? 'Medical Assistance Card' : 'निःशुल्क चिकित्सा कार्ड'}</option>
                    <option value="education">{language === 'en' ? 'Education Support Card' : 'शिक्षा सहायता कार्ड'}</option>
                    <option value="volunteer">{language === 'en' ? 'Volunteer ID Card' : 'स्वयंसेवक पहचान पत्र'}</option>
                    <option value="beneficiary">{language === 'en' ? 'Beneficiary ID Card' : 'सामान्य लाभार्थी'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? "Cardholder's Full Name *" : 'कार्डधारक का पूरा नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Rahul Kumar' : 'उदा. राहुल कुमार'}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? "Father's / Husband's Name *" : 'पिता / पति का नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCardFather}
                    onChange={(e) => setNewCardFather(e.target.value)}
                    placeholder={language === 'en' ? "Father's Name" : 'पिता या पति का नाम'}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Date of Birth (DOB) *' : 'जन्मतिथि (DOB) *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newCardDob}
                    onChange={(e) => setNewCardDob(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Gender *' : 'लिंग *'}
                  </label>
                  <select
                    value={newCardGender}
                    onChange={(e) => setNewCardGender(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Male">{language === 'en' ? 'Male' : 'पुरुष'}</option>
                    <option value="Female">{language === 'en' ? 'Female' : 'महिला'}</option>
                    <option value="Other">{language === 'en' ? 'Other' : 'अन्य'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Mobile Number *' : 'मोबाइल नंबर *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCardMobile}
                    onChange={(e) => setNewCardMobile(e.target.value)}
                    placeholder="9470635412"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Blood Group' : 'रक्त समूह'}
                  </label>
                  <select
                    value={newCardBlood}
                    onChange={(e) => setNewCardBlood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Role / Class / Designation' : 'भूमिका / कक्षा / पद'}
                  </label>
                  <input
                    type="text"
                    value={newCardRole}
                    onChange={(e) => setNewCardRole(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Class 10th, Volunteer' : 'उदा. कक्षा 10वीं, सेवादार'}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Registration / Source ID' : 'पंजीकरण / आवेदन आईडी'}
                  </label>
                  <input
                    type="text"
                    value={newCardRegNo}
                    onChange={(e) => setNewCardRegNo(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. LKST-REG-9801' : 'उदा. LKST-REG-9801'}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Residential Address' : 'निवास का पता'}
                  </label>
                  <input
                    type="text"
                    value={newCardAddress}
                    onChange={(e) => setNewCardAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                {/* Photo & Aadhaar Card Uploads */}
                <div className="col-span-2 pt-2 border-t border-slate-200 space-y-3">
                  <span className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {language === 'en' ? 'Photo & Aadhaar Card Upload (Front & Back)' : 'फोटो एवं आधार कार्ड अपलोड (सामने व पीछे)'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Photo */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px]">{language === 'en' ? 'Passport Photo' : 'पासपोर्ट फोटो'}</span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-blue-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Photo' : 'फोटो चुनें'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewCardPhotoPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newCardPhotoPreview && (
                        <div className="relative w-12 h-14 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newCardPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewCardPhotoPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Aadhaar Front */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? 'Aadhaar (Front)' : 'आधार (सामने)'}</span>
                      </span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-emerald-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Front' : 'सामने का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewCardAadhaarFrontPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newCardAadhaarFrontPreview && (
                        <div className="relative w-16 h-10 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newCardAadhaarFrontPreview} alt="Front" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewCardAadhaarFrontPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Aadhaar Back */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? 'Aadhaar (Back)' : 'आधार (पीछे)'}</span>
                      </span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-emerald-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Back' : 'पीछे का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewCardAadhaarBackPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newCardAadhaarBackPreview && (
                        <div className="relative w-16 h-10 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newCardAadhaarBackPreview} alt="Back" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewCardAadhaarBackPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewIdCardModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  {language === 'en' ? 'Issue ID Card' : 'पहचान पत्र जारी करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Student Modal */}
      {showNewStudentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">
              {language === 'en' ? 'Register New Student' : 'नवीन छात्र पंजीकरण'}
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Student Full Name *' : 'छात्र का नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStuName}
                    onChange={(e) => setNewStuName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? "Father's Name *" : 'पिता का नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStuFather}
                    onChange={(e) => setNewStuFather(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? "Mother's Name *" : 'माता का नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStuMother}
                    onChange={(e) => setNewStuMother(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Class *' : 'कक्षा *'}
                  </label>
                  <select
                    value={newStuClass}
                    onChange={(e) => setNewStuClass(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    <option value="कक्षा 1">{language === 'en' ? 'Class 1st (कक्षा 1)' : 'कक्षा 1 (Class 1st)'}</option>
                    <option value="कक्षा 2">{language === 'en' ? 'Class 2nd (कक्षा 2)' : 'कक्षा 2 (Class 2nd)'}</option>
                    <option value="कक्षा 3">{language === 'en' ? 'Class 3rd (कक्षा 3)' : 'कक्षा 3 (Class 3rd)'}</option>
                    <option value="कक्षा 4">{language === 'en' ? 'Class 4th (कक्षा 4)' : 'कक्षा 4 (Class 4th)'}</option>
                    <option value="कक्षा 5">{language === 'en' ? 'Class 5th (कक्षा 5)' : 'कक्षा 5 (Class 5th)'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Date of Birth *' : 'जन्मतिथि *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newStuDob}
                    onChange={(e) => setNewStuDob(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Mobile Number *' : 'मोबाइल नंबर *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStuMobile}
                    onChange={(e) => setNewStuMobile(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                {/* Student Photo & Aadhaar Card Uploads */}
                <div className="col-span-2 pt-2 border-t border-slate-200 space-y-3">
                  <span className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {language === 'en' ? 'Student Photo & Aadhaar Card (Front & Back)' : 'छात्र फोटो एवं आधार कार्ड (सामने व पीछे)'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Student Photo */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px]">{language === 'en' ? 'Passport Photo' : 'पासपोर्ट फोटो'}</span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-blue-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Photo' : 'फोटो चुनें'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewStuPhotoPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newStuPhotoPreview && (
                        <div className="relative w-12 h-14 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newStuPhotoPreview} alt="Student Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewStuPhotoPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Aadhaar Front */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? 'Aadhaar (Front)' : 'आधार (सामने)'}</span>
                      </span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-emerald-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Front' : 'सामने का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewStuAadhaarFrontPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newStuAadhaarFrontPreview && (
                        <div className="relative w-16 h-10 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newStuAadhaarFrontPreview} alt="Front" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewStuAadhaarFrontPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Aadhaar Back */}
                    <div className="p-2.5 bg-slate-50 border rounded-xl space-y-1.5">
                      <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? 'Aadhaar (Back)' : 'आधार (पीछे)'}</span>
                      </span>
                      <label className="cursor-pointer flex flex-col items-center justify-center p-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg bg-white text-center">
                        <Upload className="w-4 h-4 text-emerald-600 mb-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium">{language === 'en' ? 'Upload Back' : 'पीछे का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewStuAadhaarBackPreview(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newStuAadhaarBackPreview && (
                        <div className="relative w-16 h-10 rounded border mx-auto overflow-hidden shadow-xs">
                          <img src={newStuAadhaarBackPreview} alt="Back" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewStuAadhaarBackPreview('')}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewStudentModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow cursor-pointer"
                >
                  {language === 'en' ? 'Register Student & Issue ID' : 'छात्र पंजीकृत करें एवं ID जारी करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT CANDIDATE APPLICATION MODAL (COMPACT & BALANCED)
      ======================================================== */}
      {editingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 border border-slate-200 my-4 text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    {language === 'en' ? 'Edit Application Form' : 'आवेदन फॉर्म संपादन'}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono font-bold text-red-700">{editingApp.id}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{editingApp.serviceTitleHi}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Print या PDF Option */}
                <button
                  type="button"
                  onClick={() =>
                    setPrintableCandidate({
                      candidate: {
                        ...editingApp,
                        fullName: editAppFullName,
                        fatherOrHusbandName: editAppFather,
                        motherName: editAppMother,
                        dob: editAppDob,
                        gender: editAppGender,
                        mobile: editAppMobile,
                        alternateMobile: editAppAlternateMobile,
                        emergencyContact: editAppEmergencyContact,
                        email: editAppEmail,
                        aadhaarNumber: editAppAadhaarNumber,
                        serviceCategory: editAppCategory,
                        address: editAppAddress,
                        village: editAppVillage,
                        district: editAppDistrict,
                        state: editAppState,
                        pinCode: editAppPinCode,
                        description: editAppDescription,
                        status: editAppStatus,
                        statusRemarks: editAppRemarks,
                        photoUrl: editAppPhotoPreview,
                        aadhaarFrontUrl: editAppAadhaarFrontPreview,
                        aadhaarBackUrl: editAppAadhaarBackPreview,
                      },
                      type: 'application',
                    })
                  }
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                  title={language === 'en' ? 'Print or PDF candidate form' : 'प्रपत्र प्रिंट या PDF निकालें'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Print/PDF' : 'प्रिंट/PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title={language === 'en' ? 'Close' : 'बंद करें'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveAppEdit} className="space-y-4 text-xs">
              
              {/* Section 1: Candidate Personal Details */}
              <div className="space-y-2.5">
                <span className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. {language === 'en' ? 'Personal & Contact Details' : 'व्यक्तिगत एवं संपर्क विवरण'}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Full Name *' : 'अभ्यर्थी का पूरा नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAppFullName}
                      onChange={(e) => setEditAppFullName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Father / Husband Name *' : 'पिता / पति का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAppFather}
                      onChange={(e) => setEditAppFather(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? "Mother's Name *" : 'माता का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAppMother}
                      onChange={(e) => setEditAppMother(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Date of Birth (DOB) *' : 'जन्मतिथि (DOB) *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editAppDob}
                      onChange={(e) => setEditAppDob(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Gender *' : 'लिंग *'}
                    </label>
                    <select
                      value={editAppGender}
                      onChange={(e) => setEditAppGender(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Male">{language === 'en' ? 'Male (पुरुष)' : 'पुरुष (Male)'}</option>
                      <option value="Female">{language === 'en' ? 'Female (महिला)' : 'महिला (Female)'}</option>
                      <option value="Other">{language === 'en' ? 'Other (अन्य)' : 'अन्य (Other)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Mobile Number *' : 'मोबाइल नंबर *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={editAppMobile}
                      onChange={(e) => setEditAppMobile(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Alternate Mobile' : 'वैकल्पिक मोबाइल'}
                    </label>
                    <input
                      type="tel"
                      value={editAppAlternateMobile}
                      onChange={(e) => setEditAppAlternateMobile(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Emergency Contact' : 'आपातकालीन संपर्क'}
                    </label>
                    <input
                      type="text"
                      value={editAppEmergencyContact}
                      onChange={(e) => setEditAppEmergencyContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Service Category *' : 'सेवा सहायता वर्ग *'}
                    </label>
                    <select
                      value={editAppCategory}
                      onChange={(e) => setEditAppCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-semibold bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="orphanage">अनाथ आश्रम (Orphanage Care)</option>
                      <option value="old_age">वृद्ध आश्रम (Senior Citizen Care)</option>
                      <option value="widow">विधवा आश्रम / संबल सहायता (Widow Support)</option>
                      <option value="education">निःशुल्क शिक्षा (Free Education)</option>
                      <option value="medical">निःशुल्क चिकित्सा (Free Medical Care)</option>
                      <option value="social_welfare">सामाजिक कल्याण (Social Welfare)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Application Status *' : 'आवेदन स्थिति *'}
                    </label>
                    <select
                      value={editAppStatus}
                      onChange={(e) => setEditAppStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-amber-50 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Pending">प्रतीक्षारत (Pending)</option>
                      <option value="Under Review">समीक्षाधीन (Under Review)</option>
                      <option value="Approved">स्वीकृत (Approved)</option>
                      <option value="Rejected">अस्वीकृत (Rejected)</option>
                      <option value="Completed">पूर्ण (Completed)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Complete Residential Address *' : 'निवास का पूरा पता *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAppAddress}
                      onChange={(e) => setEditAppAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'District / Village' : 'जिला / ग्राम'}
                    </label>
                    <input
                      type="text"
                      value={editAppDistrict}
                      onChange={(e) => setEditAppDistrict(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                      {language === 'en' ? 'Need Description' : 'आवश्यकता / विवरण'}
                    </label>
                    <input
                      type="text"
                      value={editAppDescription}
                      onChange={(e) => setEditAppDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Aadhaar Card & Documents (Compact + Collapsible Full View) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. {language === 'en' ? 'Aadhaar & Photo Verification' : 'आधार व फोटो सत्यापन'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold text-slate-600">आधार संख्या:</span>
                    <input
                      type="text"
                      value={editAppAadhaarNumber}
                      onChange={(e) => setEditAppAadhaarNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      className="px-2 py-0.5 border border-slate-300 rounded-md font-mono font-bold text-xs text-red-700 bg-white"
                    />
                  </div>
                </div>

                {/* Compact Document Previews */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {/* Photo Preview */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Photo' : 'फोटो'}
                    </span>
                    {editAppPhotoPreview ? (
                      <div className="relative w-14 h-18 mx-auto rounded overflow-hidden border border-slate-300 shadow-2xs">
                        <img src={editAppPhotoPreview} alt="Photo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditAppPhotoPreview('')}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-18 border border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                        <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span className="text-[9px] text-slate-500">{language === 'en' ? 'Upload' : 'अपलोड'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditAppPhotoPreview(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Aadhaar Front */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Aadhaar (F)' : 'आधार (आगे)'}
                    </span>
                    {editAppAadhaarFrontPreview ? (
                      <div className="relative w-full h-18 rounded overflow-hidden border border-slate-300 shadow-2xs">
                        <img src={editAppAadhaarFrontPreview} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditAppAadhaarFrontPreview('')}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-18 border border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                        <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span className="text-[9px] text-slate-500">{language === 'en' ? 'Upload Front' : 'आगे का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditAppAadhaarFrontPreview(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Aadhaar (B)' : 'आधार (पीछे)'}
                    </span>
                    {editAppAadhaarBackPreview ? (
                      <div className="relative w-full h-18 rounded overflow-hidden border border-slate-300 shadow-2xs">
                        <img src={editAppAadhaarBackPreview} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditAppAadhaarBackPreview('')}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-18 border border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50">
                        <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span className="text-[9px] text-slate-500">{language === 'en' ? 'Upload Back' : 'पीछे का भाग'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditAppAadhaarBackPreview(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Optional Toggle for Full Simulated Aadhaar Card */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAppAadhaarDetail(!showAppAadhaarDetail)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {showAppAadhaarDetail
                        ? (language === 'en' ? 'Hide Full Aadhaar View' : 'विस्तृत आधार दृश्य छिपाएं')
                        : (language === 'en' ? 'View / Edit Full Aadhaar Card' : 'विस्तृत आधार कार्ड दृश्य देखें')}
                    </span>
                    {showAppAadhaarDetail ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Full Aadhaar Card View if toggled */}
                {showAppAadhaarDetail && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <AadhaarCardView
                      fullName={editAppFullName || editingApp.fullName}
                      fatherOrHusbandName={editAppFather}
                      dob={editAppDob}
                      gender={editAppGender}
                      aadhaarNumber={editAppAadhaarNumber}
                      address={editAppAddress}
                      district={editAppDistrict}
                      state={editAppState}
                      pinCode={editAppPinCode}
                      photoUrl={editAppPhotoPreview}
                      aadhaarFrontUrl={editAppAadhaarFrontPreview}
                      aadhaarBackUrl={editAppAadhaarBackPreview}
                      onFrontChange={setEditAppAadhaarFrontPreview}
                      onBackChange={setEditAppAadhaarBackPreview}
                      onReload={handleReloadAppAadhaar}
                      editable={true}
                      language={language}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer font-bold text-xs transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 text-xs transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'Save Changes' : 'बदलाव सुरक्षित करें'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT STUDENT MODAL (FORM EDIT + CLASSES 1-5 + AADHAAR + PRINT/PDF)
      ======================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 border border-slate-300 my-6">
            
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {language === 'en' ? 'Edit Student Record & Enrollment' : 'विद्यार्थी फॉर्म संपादन एवं नामांकन विवरण'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-red-700">{editingStudent.registrationNumber}</span>
                    <span>•</span>
                    <span>कक्षा: {editStuClass}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Print या PDF Option */}
                <button
                  type="button"
                  onClick={() =>
                    setPrintableCandidate({
                      candidate: {
                        ...editingStudent,
                        name: editStuName,
                        fatherName: editStuFather,
                        motherName: editStuMother,
                        dob: editStuDob,
                        gender: editStuGender,
                        studentClass: editStuClass,
                        schoolOrInstitute: editStuSchool,
                        mobile: editStuMobile,
                        address: editStuAddress,
                        category: editStuCategory,
                        aadhaarNumber: editStuAadhaarNumber,
                        photoUrl: editStuPhotoPreview,
                        aadhaarFrontUrl: editStuAadhaarFrontPreview,
                        aadhaarBackUrl: editStuAadhaarBackPreview,
                      },
                      type: 'student',
                    })
                  }
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                  title={language === 'en' ? 'Print or PDF student form' : 'विद्यार्थी प्रपत्र प्रिंट या PDF निकालें'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Print / PDF Form' : 'प्रिंट या PDF फॉर्म'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveStudentEdit} className="space-y-6 text-xs">
              
              {/* Section 1: Academic & Personal Details */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>1. {language === 'en' ? 'Student Personal & Academic Details' : 'विद्यार्थी व्यक्तिगत एवं शैक्षणिक विवरण'}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Student Full Name *' : 'विद्यार्थी का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editStuName}
                      onChange={(e) => setEditStuName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? "Father's Name *" : 'पिता का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editStuFather}
                      onChange={(e) => setEditStuFather(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? "Mother's Name *" : 'माता का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editStuMother}
                      onChange={(e) => setEditStuMother(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Class (1st to 5th) *' : 'कक्षा (1 से 5वीं तक) *'}
                    </label>
                    <select
                      value={editStuClass}
                      onChange={(e) => setEditStuClass(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-bold text-slate-900 bg-amber-50"
                    >
                      <option value="कक्षा 1">कक्षा 1 (Class 1st)</option>
                      <option value="कक्षा 2">कक्षा 2 (Class 2nd)</option>
                      <option value="कक्षा 3">कक्षा 3 (Class 3rd)</option>
                      <option value="कक्षा 4">कक्षा 4 (Class 4th)</option>
                      <option value="कक्षा 5">कक्षा 5 (Class 5th)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Date of Birth *' : 'जन्मतिथि *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editStuDob}
                      onChange={(e) => setEditStuDob(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Gender *' : 'लिंग *'}
                    </label>
                    <select
                      value={editStuGender}
                      onChange={(e) => setEditStuGender(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl font-medium"
                    >
                      <option value="Male">{language === 'en' ? 'Male (पुरुष)' : 'पुरुष (Male)'}</option>
                      <option value="Female">{language === 'en' ? 'Female (महिला)' : 'महिला (Female)'}</option>
                      <option value="Other">{language === 'en' ? 'Other (अन्य)' : 'अन्य (Other)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Mobile Number *' : 'मोबाइल नंबर *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={editStuMobile}
                      onChange={(e) => setEditStuMobile(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Category *' : 'सामाजिक वर्ग *'}
                    </label>
                    <select
                      value={editStuCategory}
                      onChange={(e) => setEditStuCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl font-semibold"
                    >
                      <option value="General">सामान्य (General)</option>
                      <option value="OBC">पिछड़ा वर्ग (OBC)</option>
                      <option value="EBC">अत्यंत पिछड़ा वर्ग (EBC)</option>
                      <option value="SC">अनुसूचित जाति (SC)</option>
                      <option value="ST">अनुसूचित जनजाति (ST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'School / Primary Institute' : 'प्राथमिक विद्यालय का नाम'}
                    </label>
                    <input
                      type="text"
                      value={editStuSchool}
                      onChange={(e) => setEditStuSchool(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'en' ? 'Residential Address' : 'निवास का पता'}
                    </label>
                    <input
                      type="text"
                      value={editStuAddress}
                      onChange={(e) => setEditStuAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Student Aadhaar Card Show & Reload */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>2. {language === 'en' ? 'Student Aadhaar Card & Identity' : 'छात्र आधार कार्ड प्रदर्शन एवं सत्यापन'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">आधार संख्या:</span>
                    <input
                      type="text"
                      value={editStuAadhaarNumber}
                      onChange={(e) => setEditStuAadhaarNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      className="px-2.5 py-1 border border-slate-300 rounded-lg font-mono font-bold text-xs text-red-700 bg-white"
                    />
                  </div>
                </div>

                {/* Aadhaar Card Viewer & Live Controls */}
                <AadhaarCardView
                  fullName={editStuName || editingStudent.name}
                  fatherOrHusbandName={editStuFather}
                  dob={editStuDob}
                  gender={editStuGender}
                  aadhaarNumber={editStuAadhaarNumber}
                  address={editStuAddress || 'राजगीर, नालंदा, बिहार'}
                  district="नालंदा"
                  state="बिहार"
                  pinCode="803116"
                  photoUrl={editStuPhotoPreview}
                  aadhaarFrontUrl={editStuAadhaarFrontPreview}
                  aadhaarBackUrl={editStuAadhaarBackPreview}
                  onFrontChange={setEditStuAadhaarFrontPreview}
                  onBackChange={setEditStuAadhaarBackPreview}
                  onReload={handleReloadStudentAadhaar}
                  editable={true}
                  language={language}
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {/* Print / PDF Option */}
                  <button
                    type="button"
                    onClick={() =>
                      setPrintableCandidate({
                        candidate: {
                          ...editingStudent,
                          name: editStuName,
                          fatherName: editStuFather,
                          motherName: editStuMother,
                          dob: editStuDob,
                          gender: editStuGender,
                          studentClass: editStuClass,
                          schoolOrInstitute: editStuSchool,
                          mobile: editStuMobile,
                          address: editStuAddress,
                          category: editStuCategory,
                          aadhaarNumber: editStuAadhaarNumber,
                          photoUrl: editStuPhotoPreview,
                          aadhaarFrontUrl: editStuAadhaarFrontPreview,
                          aadhaarBackUrl: editStuAadhaarBackPreview,
                        },
                        type: 'student',
                      })
                    }
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-700" />
                    <span>{language === 'en' ? 'Print / PDF Form' : 'प्रिंट या PDF फॉर्म देखें'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReloadStudentAadhaar}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Reload stored Aadhaar' : 'मूल आधार रीलोड करें'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Reload Aadhaar' : 'आधार रीलोड'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer font-bold"
                  >
                    {language === 'en' ? 'Cancel' : 'रद्द करें'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{language === 'en' ? 'Save Changes' : 'बदलाव सुरक्षित करें'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT VOLUNTEER MODAL
      ======================================================== */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 border border-slate-300 my-6">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {language === 'en' ? 'Edit Volunteer Record' : 'स्वयंसेवक विवरण संपादन'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-emerald-800">{editingVolunteer.id}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{editVolPreferredService || 'सेवादार'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    editVolStatus === 'Active' || editVolStatus === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {editVolStatus}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingVolunteer(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Edit Volunteer Form */}
            <form onSubmit={handleSaveVolunteerEdit} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Full Name *' : 'स्वयंसेवक का पूरा नाम *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editVolName}
                    onChange={(e) => setEditVolName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Mobile Number *' : 'मोबाइल नंबर *'}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editVolMobile}
                    onChange={(e) => setEditVolMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Email Address' : 'ईमेल पता'}
                  </label>
                  <input
                    type="email"
                    value={editVolEmail}
                    onChange={(e) => setEditVolEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Age (Years) *' : 'उम्र (वर्ष) *'}
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={90}
                    required
                    value={editVolAge}
                    onChange={(e) => setEditVolAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Gender *' : 'लिंग *'}
                  </label>
                  <select
                    value={editVolGender}
                    onChange={(e) => setEditVolGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Male">{language === 'en' ? 'Male (पुरुष)' : 'पुरुष'}</option>
                    <option value="Female">{language === 'en' ? 'Female (महिला)' : 'महिला'}</option>
                    <option value="Other">{language === 'en' ? 'Other (अन्य)' : 'अन्य'}</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Status *' : 'स्थिति *'}
                  </label>
                  <select
                    value={editVolStatus}
                    onChange={(e) => setEditVolStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-amber-50 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Active">{language === 'en' ? 'Active (सक्रिय सेवादार)' : 'सक्रिय'}</option>
                    <option value="Approved">{language === 'en' ? 'Approved (स्वीकृत)' : 'स्वीकृत'}</option>
                    <option value="Pending">{language === 'en' ? 'Pending (प्रतीक्षारत)' : 'प्रतीक्षारत'}</option>
                  </select>
                </div>

                {/* Preferred Service */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Preferred Service *' : 'पसंदीदा सेवा क्षेत्र *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editVolPreferredService}
                    onChange={(e) => setEditVolPreferredService(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Free Education, Blood Camp' : 'उदा. अनाथ आश्रम, रक्तदान, निःशुल्क शिक्षा'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Occupation / Profession *' : 'पेशा / व्यवसाय *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editVolOccupation}
                    onChange={(e) => setEditVolOccupation(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Teacher, Student, Social Worker' : 'उदा. शिक्षक, छात्र, सामाजिक कार्यकर्ता'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Skills / Expertise' : 'हुनर / कौशल'}
                  </label>
                  <input
                    type="text"
                    value={editVolSkills}
                    onChange={(e) => setEditVolSkills(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Teaching, First Aid, IT' : 'उदा. शिक्षण, प्राथमिक उपचार, प्रबंधन'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Available Time */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Available Time *' : 'उपलब्ध समय *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editVolAvailableTime}
                    onChange={(e) => setEditVolAvailableTime(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Weekends, 2 hrs daily' : 'उदा. रविवार, प्रतिदिन 2 घंटे, अवकाश दिवस'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'District *' : 'ज़िला *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editVolDistrict}
                    onChange={(e) => setEditVolDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                {/* Aadhaar Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Aadhaar Number' : 'आधार संख्या'}
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={editVolAadhaarNumber}
                    onChange={(e) => setEditVolAadhaarNumber(e.target.value)}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Address (Full Width) */}
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Complete Residential Address *' : 'स्थायी निवास का पूरा पता *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editVolAddress}
                    onChange={(e) => setEditVolAddress(e.target.value)}
                    placeholder={language === 'en' ? 'Village/Ward, Post, Block, District' : 'ग्राम/वार्ड, पोस्ट, प्रखंड, ज़िला'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Photo & Aadhaar Documents Upload */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Volunteer Photo & Verification Documents' : 'स्वयंसेवक फोटो व पहचान दस्तावेज'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Photo Upload */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Passport Size Photo' : 'पासपोर्ट साइज फोटो'}
                    </span>
                    {editVolPhotoPreview ? (
                      <div className="relative w-20 h-24 mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-xs">
                        <img src={editVolPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditVolPhotoPreview('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-xs"
                          title={language === 'en' ? 'Remove' : 'हटाएं'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500">{language === 'en' ? 'Upload Photo' : 'फोटो अपलोड'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditVolPhotoPreview(ev.target?.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Aadhaar Front */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Aadhaar Card (Front)' : 'आधार कार्ड (आगे का भाग)'}
                    </span>
                    {editVolAadhaarFrontPreview ? (
                      <div className="relative w-full h-24 mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-xs">
                        <img src={editVolAadhaarFrontPreview} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditVolAadhaarFrontPreview('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500">{language === 'en' ? 'Upload Front' : 'आगे का भाग अपलोड'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditVolAadhaarFrontPreview(ev.target?.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {language === 'en' ? 'Aadhaar Card (Back)' : 'आधार कार्ड (पीछे का भाग)'}
                    </span>
                    {editVolAadhaarBackPreview ? (
                      <div className="relative w-full h-24 mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-xs">
                        <img src={editVolAadhaarBackPreview} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditVolAadhaarBackPreview('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500">{language === 'en' ? 'Upload Back' : 'पीछे का भाग अपलोड'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => setEditVolAadhaarBackPreview(ev.target?.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVolunteer(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer font-bold transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'Save Volunteer Changes' : 'स्वयंसेवक बदलाव सुरक्षित करें'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINTABLE CANDIDATE DOSSIER MODAL (PRINT & SAVE AS PDF)
      ======================================================== */}
      {printableCandidate && (
        <PrintableCandidateForm
          candidate={printableCandidate.candidate}
          type={printableCandidate.type}
          onClose={() => setPrintableCandidate(null)}
          language={language}
        />
      )}

    </div>
  );
};
