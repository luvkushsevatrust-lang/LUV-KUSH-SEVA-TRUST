export type JobCategory = 'teacher' | 'nursing';

export type JobStatus = 'Active' | 'Inactive' | 'Closed';

export type JobApplicationStatus =
  | 'Pending'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Not Selected';

export interface JobVacancy {
  id: string; // e.g. 'LKST-JOB-01'
  title: string;
  titleHi: string;
  category: JobCategory;
  position: string;
  positionHi: string;
  qualification: string;
  qualificationHi: string;
  experience: string;
  experienceHi: string;
  salary?: string; // only when provided by admin (e.g. '₹15,000 - ₹25,000' or 'As per Trust Norms')
  salaryHi?: string;
  vacancies: number;
  location: string;
  locationHi: string;
  deadline: string;
  status: JobStatus;
  description: string;
  descriptionHi: string;
  requirements: string[];
  requirementsHi: string[];
  postedAt: string;
  updatedAt?: string;
}

export interface JobApplication {
  id: string; // e.g. 'LKST-JOB-2026-1001'
  jobId: string;
  jobTitle: string;
  jobCategory: JobCategory;
  position: string;

  // Applicant Personal Details
  fullName: string;
  fatherOrGuardianName: string;
  dob: string;
  gender?: 'Male' | 'Female' | 'Other';
  mobile: string;
  whatsappNumber: string;
  email: string;

  // Address
  address: string;
  district: string; // Nalanda
  block: string; // Rajgir | Islampur | Silao | Giriyak
  village: string;

  // Qualifications & Experience
  educationalQualification: string;
  professionalQualification: string;
  workExperience: string;

  // Uploaded Documents
  resumeUrl?: string;
  resumeFileName?: string;
  photoUrl?: string;
  additionalDocsUrl?: string;
  additionalDocsFileName?: string;

  declarationAccepted: boolean;
  status: JobApplicationStatus;
  statusRemarks?: string;

  // Interview Schedule (when status is Interview Scheduled)
  interviewDate?: string;
  interviewTime?: string;
  interviewAddress?: string;

  submittedAt: string;
  reviewedAt?: string;
}

export interface PlacementAddressInfo {
  id: string;
  title: string;
  titleHi: string;
  placementLocation: string;
  placementLocationHi: string;
  interviewAddress: string;
  interviewAddressHi: string;
  googleMapsUrl: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonDesignation: string;
  instructions: string[];
  instructionsHi: string[];
  placementPdfUrl?: string;
  placementPdfName?: string;
  updatedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  previousStatus: JobApplicationStatus;
  newStatus: JobApplicationStatus;
  remarks?: string;
  updatedBy: string;
  updatedAt: string;
}
