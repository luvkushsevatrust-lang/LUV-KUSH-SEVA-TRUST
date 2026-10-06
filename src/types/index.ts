export type ServiceCategory =
  | 'orphanage' // अनाथ आश्रम
  | 'old_age' // वृद्ध आश्रम
  | 'widow' // विधवा आश्रम
  | 'education' // निःशुल्क शिक्षा
  | 'medical' // निःशुल्क इलाज
  | 'social_welfare'; // स्वस्थ समाज, उन्नत समाज

export type ApplicationStatus =
  | 'Pending'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface ServiceApplication {
  id: string; // e.g. LKST-APP-2026-1001
  serviceCategory: ServiceCategory;
  serviceTitleHi: string;
  fullName: string;
  fatherOrHusbandName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  aadhaarNumber?: string;
  photoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  documentUrl?: string;
  description: string;
  emergencyContact: string;
  status: ApplicationStatus;
  statusRemarks?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export type IdCardCategory =
  | 'orphanage' // Orphanage ID Card (अनाथ आश्रम पहचान पत्र)
  | 'old_age' // Senior Citizen ID Card (वरिष्ठ नागरिक पहचान पत्र)
  | 'widow' // Widow Support ID Card (विधवा संबल पहचान पत्र)
  | 'education' // Education Support ID Card (शिक्षा सहायता पहचान पत्र)
  | 'medical' // Medical Assistance ID Card (चिकित्सा सहायता पहचान पत्र)
  | 'volunteer' // Volunteer ID Card (स्वयंसेवक पहचान पत्र)
  | 'student' // Student ID Card (विद्यार्थी पहचान पत्र)
  | 'beneficiary'; // Beneficiary ID Card (सामान्य लाभार्थी पहचान पत्र)

export type IdCardStatus =
  | 'Pending'
  | 'Approved'
  | 'Active'
  | 'Suspended'
  | 'Expired'
  | 'Rejected';

export interface IdCard {
  id: string; // e.g. LKST-IDC-001
  cardNumber: string; // Unique ID Card Number: LKST-2026-000001
  sourceType: 'application' | 'student' | 'volunteer';
  sourceId: string; // ID of application, student, or volunteer
  registrationNumber: string; // Registration/Application ID

  fullName: string;
  fatherOrHusbandName: string;
  motherName?: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  emergencyContact?: string;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  bloodGroup?: string;
  photoUrl?: string;
  aadhaarNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;

  category: IdCardCategory;
  categoryLabelHi: string;
  categoryLabelEn?: string;
  cardType: string;
  roleOrClass?: string;

  status: IdCardStatus;
  statusRemarks?: string;
  issueDate: string; // YYYY-MM-DD
  validTill: string; // YYYY-MM-DD or 'आजीवन (Lifetime)'

  verificationCode: string; // Unique secure verification code
  instructions?: string[];

  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  id: string; // LKST-STU-2026-101
  registrationNumber: string; // LKST-REG-9801
  name: string;
  fatherName: string;
  motherName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  studentClass: string;
  schoolOrInstitute: string;
  mobile: string;
  email?: string;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  aadhaarNumber?: string;
  photoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  parentOccupation?: string;
  previousClass?: string;
  previousMarks?: string;
  category: 'General' | 'OBC' | 'EBC' | 'SC' | 'ST';
  bloodGroup?: string;
  password?: string;
  status: ApplicationStatus;
  statusRemarks?: string;
  idCardNumber?: string;
  registeredAt: string;
}

export interface Volunteer {
  id: string; // LKST-VOL-2026-05
  name: string;
  mobile: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  district: string;
  skills: string;
  occupation: string;
  availableTime: string;
  preferredService: string;
  aadhaarNumber?: string;
  photoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  message?: string;
  status: 'Pending' | 'Approved' | 'Active';
  registeredAt: string;
}

export interface Donation {
  id: string;
  receiptNumber: string; // LKST-DON-2026-784
  donorName: string;
  mobile: string;
  email?: string;
  amount: number;
  paymentMethod: 'UPI' | 'QR Code' | 'Bank Transfer';
  transactionId?: string;
  screenshotUrl?: string;
  message?: string;
  isVerified: boolean;
  donatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  isImportant?: boolean;
  imageUrl?: string;
}

export interface TrustSettings {
  name: string;
  nameHi: string;
  tagline: string;
  secondaryTagline: string;
  registrationNumber: string;
  chairpersonName: string;
  chairpersonPhotoUrl?: string;
  address: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  upiId: string;
  donationQrUrl: string;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  stats: {
    beneficiaries: number;
    students: number;
    volunteers: number;
    medicalAssistance: number;
    elderlySupported: number;
  };
  idCardConfig: {
    prefix: string; // e.g. 'LKST-2026-'
    nextNumber: number; // e.g. 1
    validityYears: number; // e.g. 3
    chairpersonDesignation: string;
    emergencyHelpline: string;
  };
}

export type BgTheme = 'sandalwood' | 'amber' | 'sand' | 'sage' | 'sky' | 'white';
