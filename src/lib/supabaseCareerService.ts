import { supabase } from './supabase';
import {
  JobVacancy,
  JobApplication,
  JobApplicationStatus,
  PlacementAddressInfo,
  ApplicationStatusHistory,
} from '../types/career';
import { INITIAL_JOB_VACANCIES, INITIAL_PLACEMENT_ADDRESS } from '../data/mockJobs';
import { safeSetItem } from '../utils/safeStorage';

const JOBS_STORAGE_KEY = 'lkst_career_jobs_v1';
const APPLICATIONS_STORAGE_KEY = 'lkst_career_applications_v1';
const PLACEMENT_STORAGE_KEY = 'lkst_career_placement_v1';
const STATUS_HISTORY_STORAGE_KEY = 'lkst_career_status_history_v1';

export const CAREER_SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- LUV KUSH SEVA TRUST - CAREER & RECRUITMENT DATABASE SCHEMA
-- Project ID: yjbowhkgwatrwmuyvkja
-- Copy & Run this script in your Supabase SQL Editor (SQL Query Runner)
-- ==============================================================================

-- 1. JOBS TABLE (नौकरी पद एवं रिक्तियां)
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_hi TEXT,
  category TEXT NOT NULL, -- 'teacher' | 'nursing'
  position TEXT NOT NULL,
  position_hi TEXT,
  qualification TEXT,
  qualification_hi TEXT,
  experience TEXT,
  experience_hi TEXT,
  salary TEXT,
  salary_hi TEXT,
  vacancies INTEGER DEFAULT 1,
  location TEXT,
  location_hi TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive' | 'Closed'
  description TEXT,
  description_hi TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  requirements_hi JSONB DEFAULT '[]'::jsonb,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 2. JOB APPLICATIONS TABLE (अभ्यर्थी ऑनलाइन आवेदन)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id TEXT PRIMARY KEY, -- e.g. LKST-JOB-2026-1001
  job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_title TEXT,
  job_category TEXT NOT NULL,
  position TEXT NOT NULL,
  
  -- Applicant Details
  full_name TEXT NOT NULL,
  father_or_guardian_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT,
  mobile TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Address (Nalanda, Bihar)
  address TEXT NOT NULL,
  district TEXT DEFAULT 'Nalanda',
  block TEXT NOT NULL,
  village TEXT NOT NULL,
  
  -- Qualifications & Experience
  educational_qualification TEXT NOT NULL,
  professional_qualification TEXT,
  work_experience TEXT,
  
  -- Document URLs
  resume_url TEXT,
  resume_file_name TEXT,
  photo_url TEXT,
  additional_docs_url TEXT,
  additional_docs_file_name TEXT,
  
  declaration_accepted BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Pending', -- 'Pending' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Not Selected'
  status_remarks TEXT,
  
  -- Interview Schedule
  interview_date TEXT,
  interview_time TEXT,
  interview_address TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  raw_data JSONB
);

-- 3. APPLICATION DOCUMENTS TABLE (दस्तावेज एवं सीवी फाइलें)
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT REFERENCES public.job_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'resume' | 'photo' | 'qualification' | 'experience' | 'other'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PLACEMENT ADDRESSES TABLE (नियुक्ति एवं साक्षात्कार पता)
CREATE TABLE IF NOT EXISTS public.placement_addresses (
  id TEXT PRIMARY KEY DEFAULT 'current_placement',
  title TEXT NOT NULL,
  title_hi TEXT,
  placement_location TEXT NOT NULL,
  placement_location_hi TEXT,
  interview_address TEXT NOT NULL,
  interview_address_hi TEXT,
  google_maps_url TEXT,
  contact_person_name TEXT,
  contact_person_phone TEXT,
  contact_person_designation TEXT,
  instructions JSONB DEFAULT '[]'::jsonb,
  instructions_hi JSONB DEFAULT '[]'::jsonb,
  placement_pdf_url TEXT,
  placement_pdf_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 5. APPLICATION STATUS HISTORY TABLE (आवेदन स्थिति इतिहास)
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT REFERENCES public.job_applications(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  remarks TEXT,
  updated_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- POLICIES: Public read for active jobs & placement addresses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Allow public select jobs') THEN
    CREATE POLICY "Allow public select jobs" ON public.jobs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Allow all jobs admin') THEN
    CREATE POLICY "Allow all jobs admin" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Allow public insert applications') THEN
    CREATE POLICY "Allow public insert applications" ON public.job_applications FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Allow all applications admin') THEN
    CREATE POLICY "Allow all applications admin" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_documents' AND policyname = 'Allow all application_documents') THEN
    CREATE POLICY "Allow all application_documents" ON public.application_documents FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_addresses' AND policyname = 'Allow all placement_addresses') THEN
    CREATE POLICY "Allow all placement_addresses" ON public.placement_addresses FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_status_history' AND policyname = 'Allow all status_history') THEN
    CREATE POLICY "Allow all status_history" ON public.application_status_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

export class SupabaseCareerService {
  /**
   * Load all jobs with local cache fallback
   */
  static async getJobs(): Promise<JobVacancy[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: JobVacancy[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          titleHi: row.title_hi || row.title,
          category: row.category,
          position: row.position,
          positionHi: row.position_hi || row.position,
          qualification: row.qualification || '',
          qualificationHi: row.qualification_hi || row.qualification || '',
          experience: row.experience || '',
          experienceHi: row.experience_hi || row.experience || '',
          salary: row.salary || '',
          salaryHi: row.salary_hi || row.salary || '',
          vacancies: row.vacancies || 1,
          location: row.location || 'Nalanda, Bihar',
          locationHi: row.location_hi || 'नालंदा, बिहार',
          deadline: row.deadline || '',
          status: row.status || 'Active',
          description: row.description || '',
          descriptionHi: row.description_hi || '',
          requirements: Array.isArray(row.requirements) ? row.requirements : [],
          requirementsHi: Array.isArray(row.requirements_hi) ? row.requirements_hi : [],
          postedAt: row.posted_at ? row.posted_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        safeSetItem(JOBS_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetch jobs failed, falling back to cached/initial jobs:', err);
    }

    const cached = localStorage.getItem(JOBS_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }

    safeSetItem(JOBS_STORAGE_KEY, JSON.stringify(INITIAL_JOB_VACANCIES));
    return INITIAL_JOB_VACANCIES;
  }

  /**
   * Save or update job vacancy
   */
  static async saveJob(job: JobVacancy): Promise<void> {
    try {
      await supabase.from('jobs').upsert({
        id: job.id,
        title: job.title,
        title_hi: job.titleHi,
        category: job.category,
        position: job.position,
        position_hi: job.positionHi,
        qualification: job.qualification,
        qualification_hi: job.qualificationHi,
        experience: job.experience,
        experience_hi: job.experienceHi,
        salary: job.salary,
        salary_hi: job.salaryHi,
        vacancies: job.vacancies,
        location: job.location,
        location_hi: job.locationHi,
        deadline: job.deadline,
        status: job.status,
        description: job.description,
        description_hi: job.descriptionHi,
        requirements: job.requirements,
        requirements_hi: job.requirementsHi,
        posted_at: job.postedAt,
        updated_at: new Date().toISOString(),
        raw_data: job,
      });
    } catch (err) {
      console.warn('Supabase saveJob failed (working locally):', err);
    }
  }

  /**
   * Delete job
   */
  static async deleteJob(id: string): Promise<void> {
    try {
      await supabase.from('jobs').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteJob failed:', err);
    }
  }

  /**
   * Get all job applications
   */
  static async getApplications(): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        const mapped: JobApplication[] = data.map((row: any) => ({
          id: row.id,
          jobId: row.job_id || '',
          jobTitle: row.job_title || '',
          jobCategory: row.job_category || 'teacher',
          position: row.position || '',
          fullName: row.full_name || '',
          fatherOrGuardianName: row.father_or_guardian_name || '',
          dob: row.dob || '',
          gender: row.gender,
          mobile: row.mobile || '',
          whatsappNumber: row.whatsapp_number || row.mobile || '',
          email: row.email || '',
          address: row.address || '',
          district: row.district || 'Nalanda',
          block: row.block || '',
          village: row.village || '',
          educationalQualification: row.educational_qualification || '',
          professionalQualification: row.professional_qualification || '',
          workExperience: row.work_experience || '',
          resumeUrl: row.resume_url,
          resumeFileName: row.resume_file_name,
          photoUrl: row.photo_url,
          additionalDocsUrl: row.additional_docs_url,
          additionalDocsFileName: row.additional_docs_file_name,
          declarationAccepted: Boolean(row.declaration_accepted),
          status: (row.status as JobApplicationStatus) || 'Pending',
          statusRemarks: row.status_remarks,
          interviewDate: row.interview_date,
          interviewTime: row.interview_time,
          interviewAddress: row.interview_address,
          submittedAt: row.submitted_at || new Date().toISOString(),
          reviewedAt: row.reviewed_at,
        }));
        safeSetItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase getApplications failed, falling back to cache:', err);
    }

    const cached = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  }

  /**
   * Submit new job application
   */
  static async submitApplication(app: JobApplication): Promise<void> {
    try {
      await supabase.from('job_applications').insert({
        id: app.id,
        job_id: app.jobId,
        job_title: app.jobTitle,
        job_category: app.jobCategory,
        position: app.position,
        full_name: app.fullName,
        father_or_guardian_name: app.fatherOrGuardianName,
        dob: app.dob,
        gender: app.gender,
        mobile: app.mobile,
        whatsapp_number: app.whatsappNumber,
        email: app.email,
        address: app.address,
        district: app.district,
        block: app.block,
        village: app.village,
        educational_qualification: app.educationalQualification,
        professional_qualification: app.professionalQualification,
        work_experience: app.workExperience,
        resume_url: app.resumeUrl,
        resume_file_name: app.resumeFileName,
        photo_url: app.photoUrl,
        additional_docs_url: app.additionalDocsUrl,
        additional_docs_file_name: app.additionalDocsFileName,
        declaration_accepted: app.declarationAccepted,
        status: app.status || 'Pending',
        submitted_at: app.submittedAt || new Date().toISOString(),
        raw_data: app,
      });

      // Also record initial status in history
      await supabase.from('application_status_history').insert({
        application_id: app.id,
        previous_status: null,
        new_status: 'Pending',
        remarks: 'Application submitted successfully online by applicant',
        updated_by: 'Applicant',
      });
    } catch (err) {
      console.warn('Supabase submitApplication failed (cached locally):', err);
    }
  }

  /**
   * Update application status (Shortlist, Schedule Interview, etc.)
   */
  static async updateApplicationStatus(
    id: string,
    newStatus: JobApplicationStatus,
    previousStatus: JobApplicationStatus,
    remarks?: string,
    interviewDetails?: { date?: string; time?: string; address?: string }
  ): Promise<void> {
    try {
      const updates: any = {
        status: newStatus,
        status_remarks: remarks || null,
        reviewed_at: new Date().toISOString(),
      };
      if (interviewDetails?.date) updates.interview_date = interviewDetails.date;
      if (interviewDetails?.time) updates.interview_time = interviewDetails.time;
      if (interviewDetails?.address) updates.interview_address = interviewDetails.address;

      await supabase.from('job_applications').update(updates).eq('id', id);

      // Log history
      await supabase.from('application_status_history').insert({
        application_id: id,
        previous_status: previousStatus,
        new_status: newStatus,
        remarks: remarks || '',
        updated_by: 'Admin',
      });
    } catch (err) {
      console.warn('Supabase updateApplicationStatus failed:', err);
    }
  }

  /**
   * Delete application
   */
  static async deleteApplication(id: string): Promise<void> {
    try {
      await supabase.from('job_applications').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteApplication failed:', err);
    }
  }

  /**
   * Track application by ID and Mobile
   */
  static async trackApplication(
    applicationId: string,
    mobile: string
  ): Promise<JobApplication | null> {
    const cleanId = applicationId.trim().toUpperCase();
    const cleanMobile = mobile.trim();

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', cleanId)
        .eq('mobile', cleanMobile)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          jobId: data.job_id || '',
          jobTitle: data.job_title || '',
          jobCategory: data.job_category || 'teacher',
          position: data.position || '',
          fullName: data.full_name || '',
          fatherOrGuardianName: data.father_or_guardian_name || '',
          dob: data.dob || '',
          gender: data.gender,
          mobile: data.mobile || '',
          whatsappNumber: data.whatsapp_number || '',
          email: data.email || '',
          address: data.address || '',
          district: data.district || 'Nalanda',
          block: data.block || '',
          village: data.village || '',
          educationalQualification: data.educational_qualification || '',
          professionalQualification: data.professional_qualification || '',
          workExperience: data.work_experience || '',
          resumeUrl: data.resume_url,
          resumeFileName: data.resume_file_name,
          photoUrl: data.photo_url,
          additionalDocsUrl: data.additional_docs_url,
          additionalDocsFileName: data.additional_docs_file_name,
          declarationAccepted: Boolean(data.declaration_accepted),
          status: (data.status as JobApplicationStatus) || 'Pending',
          statusRemarks: data.status_remarks,
          interviewDate: data.interview_date,
          interviewTime: data.interview_time,
          interviewAddress: data.interview_address,
          submittedAt: data.submitted_at || new Date().toISOString(),
          reviewedAt: data.reviewed_at,
        };
      }
    } catch (err) {
      console.warn('Supabase trackApplication error:', err);
    }

    // Check local storage cache
    const cached = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (cached) {
      try {
        const list: JobApplication[] = JSON.parse(cached);
        const found = list.find(
          (a) =>
            a.id.trim().toUpperCase() === cleanId &&
            a.mobile.replace(/\D/g, '') === cleanMobile.replace(/\D/g, '')
        );
        if (found) return found;
      } catch {
        // ignore
      }
    }

    return null;
  }

  /**
   * Placement & Interview Address Info
   */
  static async getPlacementAddress(): Promise<PlacementAddressInfo> {
    try {
      const { data, error } = await supabase
        .from('placement_addresses')
        .select('*')
        .eq('id', 'current_placement')
        .maybeSingle();

      if (!error && data) {
        const info: PlacementAddressInfo = {
          id: data.id,
          title: data.title || INITIAL_PLACEMENT_ADDRESS.title,
          titleHi: data.title_hi || INITIAL_PLACEMENT_ADDRESS.titleHi,
          placementLocation: data.placement_location || INITIAL_PLACEMENT_ADDRESS.placementLocation,
          placementLocationHi: data.placement_location_hi || INITIAL_PLACEMENT_ADDRESS.placementLocationHi,
          interviewAddress: data.interview_address || INITIAL_PLACEMENT_ADDRESS.interviewAddress,
          interviewAddressHi: data.interview_address_hi || INITIAL_PLACEMENT_ADDRESS.interviewAddressHi,
          googleMapsUrl: data.google_maps_url || INITIAL_PLACEMENT_ADDRESS.googleMapsUrl,
          contactPersonName: data.contact_person_name || INITIAL_PLACEMENT_ADDRESS.contactPersonName,
          contactPersonPhone: data.contact_person_phone || INITIAL_PLACEMENT_ADDRESS.contactPersonPhone,
          contactPersonDesignation: data.contact_person_designation || INITIAL_PLACEMENT_ADDRESS.contactPersonDesignation,
          instructions: Array.isArray(data.instructions) ? data.instructions : INITIAL_PLACEMENT_ADDRESS.instructions,
          instructionsHi: Array.isArray(data.instructions_hi) ? data.instructions_hi : INITIAL_PLACEMENT_ADDRESS.instructionsHi,
          placementPdfUrl: data.placement_pdf_url || '',
          placementPdfName: data.placement_pdf_name || '',
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        safeSetItem(PLACEMENT_STORAGE_KEY, JSON.stringify(info));
        return info;
      }
    } catch (err) {
      console.warn('Supabase getPlacementAddress error:', err);
    }

    const cached = localStorage.getItem(PLACEMENT_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    return INITIAL_PLACEMENT_ADDRESS;
  }

  static async savePlacementAddress(info: PlacementAddressInfo): Promise<void> {
    try {
      await supabase.from('placement_addresses').upsert({
        id: 'current_placement',
        title: info.title,
        title_hi: info.titleHi,
        placement_location: info.placementLocation,
        placement_location_hi: info.placementLocationHi,
        interview_address: info.interviewAddress,
        interview_address_hi: info.interviewAddressHi,
        google_maps_url: info.googleMapsUrl,
        contact_person_name: info.contactPersonName,
        contact_person_phone: info.contactPersonPhone,
        contact_person_designation: info.contactPersonDesignation,
        instructions: info.instructions,
        instructions_hi: info.instructionsHi,
        placement_pdf_url: info.placementPdfUrl,
        placement_pdf_name: info.placementPdfName,
        updated_at: new Date().toISOString(),
        raw_data: info,
      });
    } catch (err) {
      console.warn('Supabase savePlacementAddress error:', err);
    }
  }

  /**
   * Upload file to Supabase Storage bucket 'career-documents' with fallback to base64 Data URL
   */
  static async uploadDocument(
    file: File,
    folder: 'resumes' | 'photos' | 'placement_pdf' | 'additional'
  ): Promise<{ url: string; fileName: string }> {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${cleanFileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('career-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('career-documents')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl, fileName: file.name };
        }
      }
    } catch (uploadErr) {
      console.warn('Supabase storage upload error, falling back to data URL:', uploadErr);
    }

    // Reliable fallback: convert file to Base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          fileName: file.name,
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
