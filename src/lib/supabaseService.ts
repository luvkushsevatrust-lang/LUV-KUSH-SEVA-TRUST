import { supabase } from './supabase';
import {
  ServiceApplication,
  Student,
  IdCard,
  Volunteer,
  Donation,
  Announcement,
  TrustSettings,
  IdCardOrder,
  MembershipApplication,
  MembershipAuditLog,
  MembershipAuditStatus,
  MembershipRecordStatus,
} from '../types';

/**
 * SQL Schema definition that the user can run directly in the Supabase SQL Editor
 * to create all tables with RLS and public permissions.
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- LUV KUSH SEVA TRUST - COMPLETE SUPABASE DATABASE SCHEMA
-- Project ID: yjbowhkgwatrwmuyvkja
-- Copy & Run this script in your Supabase SQL Editor (SQL Query Runner)
-- ==============================================================================

-- 1. APPLICATIONS TABLE (सेवा आवेदन)
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  service_category TEXT,
  service_title_hi TEXT,
  full_name TEXT NOT NULL,
  father_or_husband_name TEXT,
  mother_name TEXT,
  dob TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  aadhaar_number TEXT,
  address TEXT,
  state TEXT,
  district TEXT,
  pincode TEXT,
  status TEXT DEFAULT 'Pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  remarks TEXT,
  photo_url TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  raw_data JSONB
);

-- 2. STUDENTS TABLE (विद्यार्थी)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  registration_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  dob TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  aadhaar_number TEXT,
  address TEXT,
  current_class TEXT,
  school_or_college TEXT,
  category TEXT,
  status TEXT DEFAULT 'Active',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  password TEXT,
  photo_url TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  raw_data JSONB
);

-- 3. ID CARDS TABLE (डिजिटल पहचान पत्र)
CREATE TABLE IF NOT EXISTS public.id_cards (
  id TEXT PRIMARY KEY,
  card_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  category_title_hi TEXT,
  category_title_en TEXT,
  full_name TEXT NOT NULL,
  father_or_husband_name TEXT,
  dob TEXT,
  gender TEXT,
  mobile TEXT,
  blood_group TEXT,
  aadhaar_number TEXT,
  address TEXT,
  photo_url TEXT,
  qr_code_value TEXT,
  issue_date TEXT,
  valid_upto TEXT,
  status TEXT DEFAULT 'Approved',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VOLUNTEERS TABLE (स्वयंसेवक)
CREATE TABLE IF NOT EXISTS public.volunteers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  father_or_husband_name TEXT,
  dob TEXT,
  gender TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  aadhaar_number TEXT,
  address TEXT,
  occupation TEXT,
  skills TEXT,
  preferred_service TEXT,
  availability TEXT,
  status TEXT DEFAULT 'Pending',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  raw_data JSONB
);

-- 5. DONATIONS TABLE (दान एवं रसीद)
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  donor_name TEXT NOT NULL,
  pan_or_aadhaar TEXT,
  pan_card TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT,
  amount NUMERIC NOT NULL,
  payment_mode TEXT,
  transaction_id TEXT,
  purpose TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Approved',
  approval_remarks TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_gateway TEXT DEFAULT 'manual',
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- 6. ANNOUNCEMENTS TABLE (सूचनाएं व नोटिस)
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  raw_data JSONB
);

-- 7. SETTINGS TABLE (ट्रस्ट सेटिंग्स)
CREATE TABLE IF NOT EXISTS public.trust_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_settings',
  trust_name TEXT,
  trust_name_en TEXT,
  registration_number TEXT,
  ngo_darpan_id TEXT,
  chairperson_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES (Allow Public Anon Access for Applet)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_settings ENABLE ROW LEVEL SECURITY;

-- Create Open Policies (if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access applications') THEN
    CREATE POLICY "Allow public access applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access students') THEN
    CREATE POLICY "Allow public access students" ON public.students FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access id_cards') THEN
    CREATE POLICY "Allow public access id_cards" ON public.id_cards FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access volunteers') THEN
    CREATE POLICY "Allow public access volunteers" ON public.volunteers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'Service role full access donations') THEN
    CREATE POLICY "Service role full access donations" ON public.donations FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'Authenticated admins manage donations') THEN
    CREATE POLICY "Authenticated admins manage donations" ON public.donations FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access announcements') THEN
    CREATE POLICY "Allow public access announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access trust_settings') THEN
    CREATE POLICY "Allow public access trust_settings" ON public.trust_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 8. CAREER & RECRUITMENT TABLES (भर्ती एवं रोजगार पोर्टल)
-- ==============================================================================

-- Jobs Table (रिक्तियां)
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_hi TEXT,
  category TEXT NOT NULL,
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
  status TEXT DEFAULT 'Active',
  description TEXT,
  description_hi TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  requirements_hi JSONB DEFAULT '[]'::jsonb,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB
);

-- Job Applications Table (आवेदन)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  job_title TEXT,
  job_category TEXT NOT NULL,
  position TEXT NOT NULL,
  full_name TEXT NOT NULL,
  father_or_guardian_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT,
  mobile TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT DEFAULT 'Nalanda',
  block TEXT NOT NULL,
  village TEXT NOT NULL,
  educational_qualification TEXT NOT NULL,
  professional_qualification TEXT,
  work_experience TEXT,
  resume_url TEXT,
  resume_file_name TEXT,
  photo_url TEXT,
  additional_docs_url TEXT,
  additional_docs_file_name TEXT,
  declaration_accepted BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Pending',
  status_remarks TEXT,
  interview_date TEXT,
  interview_time TEXT,
  interview_address TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  raw_data JSONB
);

-- Application Documents Table (दस्तावेज)
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placement Addresses Table (नियुक्ति एवं साक्षात्कार स्थल)
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

-- Application Status History Table (स्थिति इतिहास)
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  remarks TEXT,
  updated_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Career Tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_addresses' AND policyname = 'Allow all placement_addresses') THEN
    CREATE POLICY "Allow all placement_addresses" ON public.placement_addresses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_status_history' AND policyname = 'Allow all status_history') THEN
    CREATE POLICY "Allow all status_history" ON public.application_status_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 9. RAZORPAY PAYMENT SYSTEM & SMART ID ORDERS (नॉन-डिस्ट्रक्टिव)
-- ==============================================================================

-- A. Razorpay Orders (ऑर्डर ट्रैकिंग)
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('donation', 'smart_id_card')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  amount_paise BIGINT NOT NULL CHECK (amount_paise = ROUND(amount * 100)),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed')),
  donor_name TEXT NOT NULL,
  email TEXT,
  contact TEXT NOT NULL,
  notes JSONB DEFAULT '{}'::jsonb,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. Razorpay Payments (वेरिफाइड ट्रांजेक्शन)
CREATE TABLE IF NOT EXISTS public.razorpay_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL REFERENCES public.razorpay_orders(order_id),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('captured', 'authorized', 'failed', 'refunded')),
  method TEXT,
  bank TEXT,
  wallet TEXT,
  vpa TEXT,
  email TEXT,
  contact TEXT,
  error_code TEXT,
  error_description TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. Webhook Event Log (आईडेम्पोटेंट ऑडिट)
CREATE TABLE IF NOT EXISTS public.razorpay_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. Smart ID Card Orders (अलग सर्विस फीस टेबल)
CREATE TABLE IF NOT EXISTS public.id_card_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.razorpay_orders(order_id),
  payment_id TEXT REFERENCES public.razorpay_payments(payment_id),
  tier TEXT NOT NULL CHECK (tier IN ('special_service_200', 'general_associate_free')),
  applicant_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  service_category TEXT,
  amount_fee NUMERIC(10, 2) NOT NULL CHECK (amount_fee >= 0),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  admin_approved BOOLEAN NOT NULL DEFAULT FALSE,
  admin_approved_at TIMESTAMPTZ,
  admin_approved_by TEXT,
  card_issued BOOLEAN NOT NULL DEFAULT FALSE,
  id_card_id TEXT REFERENCES public.id_cards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- E. Extend donations table safely + unique receipt generator
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pan_card TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Approved';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approval_remarks TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE SEQUENCE IF NOT EXISTS public.donation_receipt_seq START WITH 2000 INCREMENT BY 1;

-- Indexes & Duplicate Prevention
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_purpose ON public.razorpay_orders(purpose);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_status ON public.razorpay_orders(status);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_order ON public.razorpay_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_id_card_orders_applicant ON public.id_card_orders(applicant_id);
CREATE INDEX IF NOT EXISTS idx_id_card_orders_paid ON public.id_card_orders(is_paid);
CREATE INDEX IF NOT EXISTS idx_donations_rzp_payment ON public.donations(razorpay_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_payment_id ON public.donations(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_order_id ON public.donations(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL AND razorpay_order_id <> '';

-- Enable Hardened RLS (service_role only for payment ledgers; no anon access)
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.donations FROM anon;
REVOKE ALL ON public.razorpay_orders FROM anon, authenticated;
REVOKE ALL ON public.razorpay_payments FROM anon, authenticated;
REVOKE ALL ON public.razorpay_webhooks FROM anon, authenticated;
REVOKE ALL ON public.id_card_orders FROM anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'razorpay_orders' AND policyname = 'Service role only razorpay_orders') THEN
    CREATE POLICY "Service role only razorpay_orders" ON public.razorpay_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'razorpay_payments' AND policyname = 'Service role only razorpay_payments') THEN
    CREATE POLICY "Service role only razorpay_payments" ON public.razorpay_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'razorpay_webhooks' AND policyname = 'Service role only razorpay_webhooks') THEN
    CREATE POLICY "Service role only razorpay_webhooks" ON public.razorpay_webhooks FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'id_card_orders' AND policyname = 'Service role only id_card_orders') THEN
    CREATE POLICY "Service role only id_card_orders" ON public.id_card_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

function getAdminToken(): string | null {
  try {
    return localStorage.getItem('lkst_admin_token');
  } catch {
    return null;
  }
}

function compactRawData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  const {
    photoUrl: _p,
    aadhaarFrontUrl: _af,
    aadhaarBackUrl: _ab,
    imageUrl: _img,
    ...rest
  } = obj;
  return rest;
}

function mapApplicationRow(row: any): ServiceApplication {
  const raw = row.raw_data || {};
  return {
    ...raw,
    id: row.id,
    serviceCategory: row.service_category || raw.serviceCategory,
    serviceTitleHi: row.service_title_hi || raw.serviceTitleHi,
    fullName: row.full_name || raw.fullName,
    fatherOrHusbandName: row.father_or_husband_name || raw.fatherOrHusbandName,
    motherName: row.mother_name || raw.motherName,
    dob: row.dob || raw.dob,
    gender: row.gender || raw.gender,
    mobile: row.mobile || raw.mobile,
    email: row.email || raw.email,
    aadhaarNumber: row.aadhaar_number || raw.aadhaarNumber,
    address: row.address || raw.address,
    state: row.state || raw.state,
    district: row.district || raw.district,
    pinCode: row.pincode || raw.pinCode || '803116',
    status: row.status || raw.status || 'Pending',
    submittedAt: row.submitted_at || raw.submittedAt,
    statusRemarks: row.remarks || raw.statusRemarks,
    photoUrl: row.photo_url || raw.photoUrl,
    aadhaarFrontUrl: row.aadhaar_front_url ?? raw.aadhaarFrontUrl,
    aadhaarBackUrl: row.aadhaar_back_url ?? raw.aadhaarBackUrl,
  };
}

function mapStudentRow(row: any): Student {
  const raw = row.raw_data || {};
  return {
    ...raw,
    id: row.id,
    registrationNumber: row.registration_number || raw.registrationNumber,
    name: row.full_name || raw.name,
    fatherName: row.father_name || raw.fatherName,
    motherName: row.mother_name || raw.motherName,
    dob: row.dob || raw.dob,
    gender: row.gender || raw.gender,
    mobile: row.mobile || raw.mobile,
    email: row.email || raw.email,
    aadhaarNumber: row.aadhaar_number || raw.aadhaarNumber,
    address: row.address || raw.address,
    district: raw.district || 'नालंदा',
    state: raw.state || 'बिहार',
    pinCode: raw.pinCode || '803116',
    studentClass: row.current_class || raw.studentClass,
    schoolOrInstitute: row.school_or_college || raw.schoolOrInstitute,
    category: row.category || raw.category || 'OBC',
    status: row.status || raw.status || 'Active',
    registeredAt: row.registered_at || raw.registeredAt,
    password: row.password || raw.password || 'password123',
    photoUrl: row.photo_url || raw.photoUrl,
    aadhaarFrontUrl: row.aadhaar_front_url ?? raw.aadhaarFrontUrl,
    aadhaarBackUrl: row.aadhaar_back_url ?? raw.aadhaarBackUrl,
  };
}

function mapIdCardRow(row: any): IdCard {
  const raw = row.raw_data || {};
  return {
    ...raw,
    id: row.id,
    cardNumber: row.card_number || raw.cardNumber,
    category: row.category || raw.category,
    categoryLabelHi: row.category_title_hi || raw.categoryLabelHi,
    categoryLabelEn: row.category_title_en || raw.categoryLabelEn,
    fullName: row.full_name || raw.fullName,
    fatherOrHusbandName: row.father_or_husband_name || raw.fatherOrHusbandName,
    dob: row.dob || raw.dob,
    gender: row.gender || raw.gender,
    mobile: row.mobile || raw.mobile,
    bloodGroup: row.blood_group || raw.bloodGroup,
    aadhaarNumber: row.aadhaar_number || raw.aadhaarNumber,
    address: row.address || raw.address,
    photoUrl: row.photo_url || raw.photoUrl,
    issueDate: row.issue_date || raw.issueDate,
    validTill: row.valid_upto || raw.validTill,
    status: row.status || raw.status || 'Approved',
    createdAt: row.created_at || raw.createdAt,
  };
}

function mapVolunteerRow(row: any): Volunteer {
  const raw = row.raw_data || {};
  return {
    ...raw,
    id: row.id,
    name: row.name || raw.name,
    age: raw.age || 25,
    gender: row.gender || raw.gender || 'Male',
    mobile: row.mobile || raw.mobile,
    email: row.email || raw.email,
    aadhaarNumber: row.aadhaar_number || raw.aadhaarNumber,
    address: row.address || raw.address,
    district: raw.district || 'नालंदा',
    occupation: row.occupation || raw.occupation || 'समाजसेवी',
    skills: row.skills || raw.skills || 'सामुदायिक सेवा',
    preferredService: row.preferred_service || raw.preferredService || 'जनसेवा',
    availableTime: row.availability || raw.availableTime || 'पूर्णकालिक',
    status: row.status || raw.status || 'Pending',
    registeredAt: row.registered_at || raw.registeredAt,
    photoUrl: row.photo_url || raw.photoUrl,
    aadhaarFrontUrl: row.aadhaar_front_url ?? raw.aadhaarFrontUrl,
    aadhaarBackUrl: row.aadhaar_back_url ?? raw.aadhaarBackUrl,
  };
}

const APPLICATION_LIST_COLS =
  'id, service_category, service_title_hi, full_name, father_or_husband_name, mother_name, dob, gender, mobile, email, aadhaar_number, address, state, district, pincode, status, submitted_at, remarks, photo_url';
const STUDENT_LIST_COLS =
  'id, registration_number, full_name, father_name, mother_name, dob, gender, mobile, email, aadhaar_number, address, current_class, school_or_college, category, status, registered_at, password, photo_url';
const ID_CARD_COLS =
  'id, card_number, category, category_title_hi, category_title_en, full_name, father_or_husband_name, dob, gender, mobile, blood_group, aadhaar_number, address, photo_url, qr_code_value, issue_date, valid_upto, status, created_at, raw_data';
const VOLUNTEER_LIST_COLS =
  'id, name, father_or_husband_name, dob, gender, mobile, email, aadhaar_number, address, occupation, skills, preferred_service, availability, status, registered_at, photo_url';
const DONATION_LIST_COLS =
  'id, receipt_number, donor_name, pan_or_aadhaar, pan_card, mobile, email, address, amount, payment_mode, transaction_id, purpose, is_verified, status, approval_remarks, approved_at, approved_by, payment_gateway, razorpay_order_id, razorpay_payment_id, donated_at';
const ID_CARD_ORDER_COLS =
  'id, order_id, payment_id, tier, applicant_id, full_name, mobile, email, service_category, amount_fee, is_paid, admin_approved, admin_approved_at, admin_approved_by, card_issued, id_card_id, created_at, updated_at';
const MEMBERSHIP_LIST_COLS =
  'id, membership_number, receipt_number, full_name, father_or_husband_name, dob, gender, mobile, email, address, district, state, pin_code, aadhaar_number, pan_card, occupation, qualification, photo_url, membership_type, fee_amount, payment_status, status, razorpay_order_id, razorpay_payment_id, payment_mode, paid_at, receipt_email_sent, receipt_email_sent_at, receipt_email_id, audit_status, audit_notes, audited_by, audited_at, created_at, updated_at';
const AUDIT_LOG_COLS =
  'id, membership_id, membership_number, action, previous_audit_status, new_audit_status, audit_notes, audited_by, created_at';
const ANNOUNCEMENT_COLS = 'id, title, date, content, is_important, image_url';
const SETTINGS_COLS =
  'id, trust_name, trust_name_en, registration_number, ngo_darpan_id, chairperson_name, phone, email, address, raw_data, updated_at';

function sanitizeFilterToken(val: string): string {
  return val.replace(/[,()*'";\\]/g, '').trim();
}

// Helper to safely execute Supabase calls without breaking offline / unconfigured apps
async function safeQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[SupabaseService] Query failed (falling back to local cache):', err);
    return null;
  }
}

export const SupabaseService = {
  // Test connection to Supabase
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from('applications').select('id').limit(1);
      if (error && error.code === '42P01') {
        // Table does not exist yet
        return {
          success: true,
          message: 'Connected to Supabase, but tables need to be created using the SQL script.',
        };
      }
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Connected and tables ready!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection failed' };
    }
  },

  // --- APPLICATIONS ---
  async fetchApplications(limit = 200): Promise<ServiceApplication[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(APPLICATION_LIST_COLS)
        .order('submitted_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map(mapApplicationRow);
    });
  },

  async fetchApplicationDetails(id: string): Promise<Partial<ServiceApplication> | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, aadhaar_front_url, aadhaar_back_url, raw_data')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const raw = data.raw_data || {};
      return {
        ...raw,
        id: data.id,
        aadhaarFrontUrl: data.aadhaar_front_url || raw.aadhaarFrontUrl || '',
        aadhaarBackUrl: data.aadhaar_back_url || raw.aadhaarBackUrl || '',
      };
    });
  },

  async lookupPublicApplication(appId: string, mobile?: string): Promise<ServiceApplication | null> {
    const cleanId = sanitizeFilterToken(appId).toUpperCase();
    const cleanMobile = sanitizeFilterToken(mobile || '');
    if (!cleanId) return null;

    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(APPLICATION_LIST_COLS)
        .ilike('id', `%${cleanId}%`)
        .limit(5);
      if (error || !data || data.length === 0) return null;
      const rows = data.map(mapApplicationRow);
      const exact = rows.find(
        (a) =>
          (a.id.toUpperCase() === cleanId || a.id.toUpperCase().includes(cleanId)) &&
          (!cleanMobile || (a.mobile && a.mobile.includes(cleanMobile)))
      );
      return exact || null;
    });
  },

  async saveApplication(app: ServiceApplication): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload: Record<string, any> = {
        id: app.id,
        service_category: app.serviceCategory,
        service_title_hi: app.serviceTitleHi,
        full_name: app.fullName,
        father_or_husband_name: app.fatherOrHusbandName,
        mother_name: app.motherName,
        dob: app.dob,
        gender: app.gender,
        mobile: app.mobile,
        email: app.email,
        aadhaar_number: app.aadhaarNumber,
        address: app.address,
        state: app.state,
        district: app.district,
        pincode: app.pinCode,
        status: app.status,
        submitted_at: app.submittedAt || new Date().toISOString(),
        remarks: app.statusRemarks,
        raw_data: compactRawData(app),
      };
      if (app.photoUrl !== undefined) payload.photo_url = app.photoUrl;
      if (app.aadhaarFrontUrl !== undefined) payload.aadhaar_front_url = app.aadhaarFrontUrl;
      if (app.aadhaarBackUrl !== undefined) payload.aadhaar_back_url = app.aadhaarBackUrl;
      const { error } = await supabase.from('applications').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async updateApplicationStatusOnly(
    id: string,
    status: string,
    remarks?: string
  ): Promise<boolean> {
    const res = await safeQuery(async () => {
      const updates: Record<string, any> = { status };
      if (remarks !== undefined) updates.remarks = remarks;
      const { error } = await supabase.from('applications').update(updates).eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  async deleteApplication(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- STUDENTS ---
  async fetchStudents(limit = 200): Promise<Student[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('students')
        .select(STUDENT_LIST_COLS)
        .order('registered_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map(mapStudentRow);
    });
  },

  async fetchStudentDetails(id: string): Promise<Partial<Student> | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, aadhaar_front_url, aadhaar_back_url, raw_data')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const raw = data.raw_data || {};
      return {
        ...raw,
        id: data.id,
        aadhaarFrontUrl: data.aadhaar_front_url || raw.aadhaarFrontUrl || '',
        aadhaarBackUrl: data.aadhaar_back_url || raw.aadhaarBackUrl || '',
      };
    });
  },

  async lookupStudentForLogin(identifier: string): Promise<Student | null> {
    const clean = sanitizeFilterToken(identifier);
    if (!clean) return null;
    const upper = clean.toUpperCase();
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : clean;

    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('students')
        .select(STUDENT_LIST_COLS)
        .or(`id.ilike.${upper},registration_number.ilike.${upper},mobile.eq.${last10}`)
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return mapStudentRow(data[0]);
    });
  },

  async saveStudent(stu: Student): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload: Record<string, any> = {
        id: stu.id,
        registration_number: stu.registrationNumber,
        full_name: stu.name,
        father_name: stu.fatherName,
        mother_name: stu.motherName,
        dob: stu.dob,
        gender: stu.gender,
        mobile: stu.mobile,
        email: stu.email,
        aadhaar_number: stu.aadhaarNumber,
        address: stu.address,
        current_class: stu.studentClass,
        school_or_college: stu.schoolOrInstitute,
        category: stu.category,
        status: stu.status,
        registered_at: stu.registeredAt || new Date().toISOString(),
        password: stu.password,
        raw_data: compactRawData(stu),
      };
      if (stu.photoUrl !== undefined) payload.photo_url = stu.photoUrl;
      if (stu.aadhaarFrontUrl !== undefined) payload.aadhaar_front_url = stu.aadhaarFrontUrl;
      if (stu.aadhaarBackUrl !== undefined) payload.aadhaar_back_url = stu.aadhaarBackUrl;
      const { error } = await supabase.from('students').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async updateStudentStatusOnly(id: string, status: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('students').update({ status }).eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  async deleteStudent(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- ID CARDS ---
  async fetchIdCards(limit = 200): Promise<IdCard[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('id_cards')
        .select(ID_CARD_COLS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map(mapIdCardRow);
    });
  },

  async lookupPublicIdCard(
    query: string,
    dob?: string
  ): Promise<{ card?: IdCard; app?: ServiceApplication; student?: Student } | null> {
    const clean = sanitizeFilterToken(query);
    if (!clean) return null;
    const upper = clean.toUpperCase();
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : clean;
    const cleanDob = sanitizeFilterToken(dob || '');

    return safeQuery(async () => {
      const orFilters = [
        `card_number.ilike.${upper}`,
        `id.ilike.${upper}`,
        `mobile.eq.${last10}`,
        `raw_data->>registrationNumber.ilike.${upper}`,
        `raw_data->>sourceId.ilike.${upper}`,
      ].join(',');

      const { data: cardRows } = await supabase
        .from('id_cards')
        .select(ID_CARD_COLS)
        .or(orFilters)
        .limit(5);

      if (cardRows && cardRows.length > 0) {
        const mappedCards = cardRows.map(mapIdCardRow);
        const directMatch = mappedCards.find(
          (c) =>
            c.cardNumber?.toUpperCase() === upper ||
            c.registrationNumber?.toUpperCase() === upper ||
            c.sourceId?.toUpperCase() === upper ||
            ((c.mobile === clean || c.mobile?.includes(clean)) && (!cleanDob || c.dob === cleanDob))
        );
        if (directMatch) return { card: directMatch };
      }

      // Fallback 1: check applications by exact ID or mobile
      const { data: appRows } = await supabase
        .from('applications')
        .select(APPLICATION_LIST_COLS)
        .or(`id.ilike.${upper},mobile.eq.${last10}`)
        .limit(3);
      if (appRows && appRows.length > 0) {
        const mappedApps = appRows.map(mapApplicationRow);
        const appMatch = mappedApps.find(
          (a) =>
            a.id.toUpperCase() === upper ||
            (a.mobile === clean && (!cleanDob || a.dob === cleanDob))
        );
        if (appMatch) return { app: appMatch };
      }

      // Fallback 2: check students by registration_number, id, or mobile
      const { data: stuRows } = await supabase
        .from('students')
        .select(STUDENT_LIST_COLS)
        .or(`registration_number.ilike.${upper},id.ilike.${upper},mobile.eq.${last10}`)
        .limit(3);
      if (stuRows && stuRows.length > 0) {
        const mappedStus = stuRows.map(mapStudentRow);
        const stuMatch = mappedStus.find(
          (s) =>
            s.registrationNumber?.toUpperCase() === upper ||
            s.id.toUpperCase() === upper ||
            (s.mobile === clean && (!cleanDob || s.dob === cleanDob))
        );
        if (stuMatch) return { student: stuMatch };
      }

      return null;
    });
  },

  async saveIdCard(card: IdCard): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload: Record<string, any> = {
        id: card.id,
        card_number: card.cardNumber,
        category: card.category,
        category_title_hi: card.categoryLabelHi,
        category_title_en: card.categoryLabelEn,
        full_name: card.fullName,
        father_or_husband_name: card.fatherOrHusbandName,
        dob: card.dob,
        gender: card.gender,
        mobile: card.mobile,
        blood_group: card.bloodGroup,
        aadhaar_number: card.aadhaarNumber,
        address: card.address,
        issue_date: card.issueDate,
        valid_upto: card.validTill,
        status: card.status,
        created_at: card.createdAt || new Date().toISOString(),
        raw_data: compactRawData(card),
      };
      if (card.photoUrl !== undefined) payload.photo_url = card.photoUrl;
      const { error } = await supabase.from('id_cards').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async deleteIdCard(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('id_cards').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- VOLUNTEERS ---
  async fetchVolunteers(limit = 200): Promise<Volunteer[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('volunteers')
        .select(VOLUNTEER_LIST_COLS)
        .order('registered_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map(mapVolunteerRow);
    });
  },

  async fetchVolunteerDetails(id: string): Promise<Partial<Volunteer> | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, aadhaar_front_url, aadhaar_back_url, raw_data')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const raw = data.raw_data || {};
      return {
        ...raw,
        id: data.id,
        aadhaarFrontUrl: data.aadhaar_front_url || raw.aadhaarFrontUrl || '',
        aadhaarBackUrl: data.aadhaar_back_url || raw.aadhaarBackUrl || '',
      };
    });
  },

  async saveVolunteer(vol: Volunteer): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload: Record<string, any> = {
        id: vol.id,
        name: vol.name,
        gender: vol.gender,
        mobile: vol.mobile,
        email: vol.email,
        aadhaar_number: vol.aadhaarNumber,
        address: vol.address,
        occupation: vol.occupation,
        skills: vol.skills,
        preferred_service: vol.preferredService,
        availability: vol.availableTime,
        status: vol.status,
        registered_at: vol.registeredAt || new Date().toISOString(),
        raw_data: compactRawData(vol),
      };
      if (vol.photoUrl !== undefined) payload.photo_url = vol.photoUrl;
      if (vol.aadhaarFrontUrl !== undefined) payload.aadhaar_front_url = vol.aadhaarFrontUrl;
      if (vol.aadhaarBackUrl !== undefined) payload.aadhaar_back_url = vol.aadhaarBackUrl;
      const { error } = await supabase.from('volunteers').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async updateVolunteerStatusOnly(id: string, status: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('volunteers').update({ status }).eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  async deleteVolunteer(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- DONATIONS ---
  async fetchDonations(limit = 200): Promise<Donation[] | null> {
    return safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const res = await fetch('/api/admin/donations', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const payload = await res.json();
            if (payload?.success && Array.isArray(payload.donations)) {
              return payload.donations;
            }
          }
        } catch {
          // fall through to Supabase Auth client if server proxy unreachable
        }
      }

      const { data, error } = await supabase
        .from('donations')
        .select(DONATION_LIST_COLS)
        .order('donated_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        receiptNumber: row.receipt_number || row.raw_data?.receiptNumber,
        donorName: row.donor_name || row.raw_data?.donorName,
        mobile: row.mobile || row.raw_data?.mobile,
        email: row.email || row.raw_data?.email,
        address: row.address || row.raw_data?.address,
        panCard: row.pan_card || row.pan_or_aadhaar || row.raw_data?.panCard,
        amount: Number(row.amount ?? row.raw_data?.amount ?? 0),
        paymentMethod: row.payment_mode || row.raw_data?.paymentMethod || 'UPI',
        transactionId: row.transaction_id || row.raw_data?.transactionId,
        message: row.purpose || row.raw_data?.message,
        isVerified: row.is_verified ?? row.raw_data?.isVerified ?? true,
        status: (row.status || row.raw_data?.status || (row.is_verified ? 'Approved' : 'Pending')) as any,
        approvalRemarks: row.approval_remarks || row.raw_data?.approvalRemarks,
        approvedAt: row.approved_at || row.raw_data?.approvedAt,
        approvedBy: row.approved_by || row.raw_data?.approvedBy,
        paymentGateway: (row.payment_gateway || row.raw_data?.paymentGateway || (row.razorpay_payment_id ? 'razorpay' : 'manual')) as any,
        razorpayOrderId: row.razorpay_order_id || row.raw_data?.razorpayOrderId,
        razorpayPaymentId: row.razorpay_payment_id || row.raw_data?.razorpayPaymentId,
        donatedAt: row.donated_at || row.raw_data?.donatedAt,
      }));
    });
  },

  async lookupApprovedReceipt(query: string): Promise<Donation | null> {
    const cleanQ = query.trim();
    if (cleanQ.length < 6) return null;

    // 1. Server exact-match endpoint (works with locked-down RLS)
    try {
      const res = await fetch(`/api/receipt-lookup?q=${encodeURIComponent(cleanQ)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.donation) {
          return data.donation as Donation;
        }
        if (data?.success && data.donation === null) {
          return null;
        }
      }
    } catch {
      // fall through to Supabase SECURITY DEFINER RPC
    }

    // 2. Direct Supabase RPC fallback (used on static Vercel hosting without Express server)
    return safeQuery(async () => {
      const { data, error } = await supabase.rpc('lookup_approved_donation_receipt', {
        p_query: cleanQ,
      });
      if (error || !data || !Array.isArray(data) || data.length === 0) return null;
      const row = data[0];
      return {
        id: row.id,
        receiptNumber: row.receipt_number,
        donorName: row.donor_name,
        mobile: row.mobile,
        amount: Number(row.amount || 0),
        paymentMethod: row.payment_mode || 'Razorpay',
        transactionId: row.transaction_id,
        message: row.purpose,
        isVerified: Boolean(row.is_verified),
        status: row.status || 'Approved',
        donatedAt: row.donated_at,
        approvedAt: row.approved_at,
        razorpayOrderId: row.razorpay_order_id,
        razorpayPaymentId: row.razorpay_payment_id,
        paymentGateway: row.payment_gateway || 'razorpay',
      } as Donation;
    });
  },

  async saveDonation(d: Donation): Promise<boolean> {
    const res = await safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch('/api/admin/donations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(d),
          });
          if (apiRes.ok) return true;
        } catch {
          // fall through to Supabase Auth client
        }
      }

      const payload: Record<string, any> = {
        id: d.id,
        receipt_number: d.receiptNumber,
        donor_name: d.donorName,
        mobile: d.mobile,
        email: d.email,
        address: d.address,
        pan_card: d.panCard,
        amount: d.amount,
        payment_mode: d.paymentMethod,
        transaction_id: d.transactionId,
        purpose: d.message,
        is_verified: d.isVerified,
        status: d.status || (d.isVerified ? 'Approved' : 'Pending'),
        approval_remarks: d.approvalRemarks || null,
        approved_at: d.approvedAt || null,
        approved_by: d.approvedBy || null,
        payment_gateway: d.paymentGateway || (d.razorpayPaymentId ? 'razorpay' : 'manual'),
        razorpay_order_id: d.razorpayOrderId,
        razorpay_payment_id: d.razorpayPaymentId,
        donated_at: d.donatedAt || new Date().toISOString(),
        raw_data: d,
      };
      let { error } = await supabase.from('donations').upsert(payload);
      if (error && (error.code === 'PGRST204' || String(error.message || '').includes('column'))) {
        const {
          address: _a,
          approval_remarks: _r,
          approved_at: _at,
          approved_by: _by,
          ...compatPayload
        } = payload;
        const retry = await supabase.from('donations').upsert(compatPayload);
        error = retry.error;
      }
      return !error;
    });
    return Boolean(res);
  },

  async deleteDonation(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch(`/api/admin/donations/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (apiRes.ok) return true;
        } catch {
          // fall through
        }
      }
      const { error } = await supabase.from('donations').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- SMART ID CARD ORDERS (Separated Service Fee Ledger) ---
  async fetchIdCardOrders(limit = 200): Promise<IdCardOrder[] | null> {
    return safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch('/api/admin/id-card-orders', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload?.success && Array.isArray(payload.orders)) {
              return payload.orders;
            }
          }
        } catch {
          // fall through
        }
      }

      const { data, error } = await supabase
        .from('id_card_orders')
        .select(ID_CARD_ORDER_COLS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        orderId: row.order_id || row.id,
        paymentId: row.payment_id,
        tier: row.tier,
        applicantId: row.applicant_id,
        fullName: row.full_name,
        mobile: row.mobile,
        email: row.email,
        serviceCategory: row.service_category,
        amountFee: Number(row.amount_fee || 0),
        isPaid: Boolean(row.is_paid),
        adminApproved: Boolean(row.admin_approved),
        adminApprovedAt: row.admin_approved_at,
        adminApprovedBy: row.admin_approved_by,
        cardIssued: Boolean(row.card_issued),
        idCardId: row.id_card_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    });
  },

  async saveIdCardOrder(order: Partial<IdCardOrder>): Promise<boolean> {
    const res = await safeQuery(async () => {
      const token = getAdminToken();
      if (token && (order.adminApproved || order.cardIssued) && (order.orderId || order.id)) {
        try {
          const targetId = order.orderId || order.id || '';
          const apiRes = await fetch(`/api/admin/id-card-orders/${encodeURIComponent(targetId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              adminApproved: Boolean(order.adminApproved),
              cardIssued: Boolean(order.cardIssued),
              idCardId: order.idCardId || null,
              adminName: order.adminApprovedBy || 'Admin',
            }),
          });
          if (apiRes.ok) return true;
        } catch {
          // fall through
        }
      }

      try {
        const regRes = await fetch('/api/id-card-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.orderId,
            paymentId: order.paymentId,
            tier: order.tier,
            applicantId: order.applicantId,
            fullName: order.fullName,
            mobile: order.mobile,
            email: order.email,
            serviceCategory: order.serviceCategory,
          }),
        });
        if (regRes.ok) return true;
      } catch {
        // fall through
      }

      const payload: any = {
        order_id: order.orderId && String(order.orderId).startsWith('order_') ? order.orderId : null,
        payment_id: order.paymentId || null,
        tier: order.tier,
        applicant_id: order.applicantId || null,
        full_name: order.fullName,
        mobile: order.mobile,
        email: order.email || null,
        service_category: order.serviceCategory || null,
        amount_fee: order.amountFee ?? (order.tier === 'special_service_200' ? 200 : 0),
        is_paid: order.isPaid ?? false,
        admin_approved: order.adminApproved ?? false,
        admin_approved_at: order.adminApprovedAt || null,
        admin_approved_by: order.adminApprovedBy || null,
        card_issued: order.cardIssued ?? false,
        id_card_id: order.idCardId || null,
        updated_at: new Date().toISOString(),
      };
      // Only pass id when it's a valid UUID (never non-UUID strings like ico-...)
      if (order.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id)) {
        payload.id = order.id;
      }
      const { error } = await supabase.from('id_card_orders').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async updateIdCardOrderApproval(orderId: string, approved: boolean, adminName: string = 'Admin'): Promise<boolean> {
    const res = await safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch(`/api/admin/id-card-orders/${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              adminApproved: approved,
              adminName,
            }),
          });
          if (apiRes.ok) return true;
        } catch {
          // fall through
        }
      }
      const { error } = await supabase
        .from('id_card_orders')
        .update({
          admin_approved: approved,
          admin_approved_at: approved ? new Date().toISOString() : null,
          admin_approved_by: approved ? adminName : null,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);
      return !error;
    });
    return Boolean(res);
  },

  // --- MEMBERSHIPS & ADMIN AUDIT ---
  async fetchMemberships(limit = 200): Promise<MembershipApplication[] | null> {
    return safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch('/api/admin/memberships', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload?.success && Array.isArray(payload.memberships)) {
              return payload.memberships.map((row: any) => ({
                id: row.id,
                membershipNumber: row.membership_number,
                receiptNumber: row.receipt_number,
                fullName: row.full_name,
                fatherOrHusbandName: row.father_or_husband_name,
                dob: row.dob,
                gender: row.gender,
                mobile: row.mobile,
                email: row.email,
                address: row.address,
                district: row.district,
                state: row.state,
                pinCode: row.pin_code,
                aadhaarNumber: row.aadhaar_number,
                panCard: row.pan_card,
                occupation: row.occupation,
                qualification: row.qualification,
                photoUrl: row.photo_url || row.raw_data?.photoUrl || undefined,
                membershipType: row.membership_type || 'Life Member',
                feeAmount: Number(row.fee_amount || 5000),
                paymentStatus: row.payment_status || 'Pending',
                status: row.status || 'Pending Payment',
                razorpayOrderId: row.razorpay_order_id,
                razorpayPaymentId: row.razorpay_payment_id,
                paymentMode: row.payment_mode,
                paidAt: row.paid_at,
                receiptEmailSent: Boolean(row.receipt_email_sent),
                receiptEmailSentAt: row.receipt_email_sent_at,
                receiptEmailId: row.receipt_email_id,
                auditStatus: row.audit_status || 'Pending Audit',
                auditNotes: row.audit_notes,
                auditedBy: row.audited_by,
                auditedAt: row.audited_at,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              }));
            }
          }
        } catch {
          // fall through to Supabase Auth authenticated client
        }
      }

      const { data, error } = await supabase
        .from('memberships')
        .select(MEMBERSHIP_LIST_COLS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        membershipNumber: row.membership_number,
        receiptNumber: row.receipt_number,
        fullName: row.full_name,
        fatherOrHusbandName: row.father_or_husband_name,
        dob: row.dob,
        gender: row.gender,
        mobile: row.mobile,
        email: row.email,
        address: row.address,
        district: row.district,
        state: row.state,
        pinCode: row.pin_code,
        aadhaarNumber: row.aadhaar_number,
        panCard: row.pan_card,
        occupation: row.occupation,
        qualification: row.qualification,
        photoUrl: row.photo_url || row.raw_data?.photoUrl || undefined,
        membershipType: row.membership_type || 'Life Member',
        feeAmount: Number(row.fee_amount || 5000),
        paymentStatus: row.payment_status || 'Pending',
        status: row.status || 'Pending Payment',
        razorpayOrderId: row.razorpay_order_id,
        razorpayPaymentId: row.razorpay_payment_id,
        paymentMode: row.payment_mode,
        paidAt: row.paid_at,
        receiptEmailSent: Boolean(row.receipt_email_sent),
        receiptEmailSentAt: row.receipt_email_sent_at,
        receiptEmailId: row.receipt_email_id,
        auditStatus: row.audit_status || 'Pending Audit',
        auditNotes: row.audit_notes,
        auditedBy: row.audited_by,
        auditedAt: row.audited_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    });
  },

  async lookupConfirmedMembership(query: string): Promise<MembershipApplication | null> {
    const cleanQ = query.trim();
    if (cleanQ.length < 6) return null;

    try {
      const res = await fetch(`/api/membership-lookup?q=${encodeURIComponent(cleanQ)}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success) {
          const row = payload.membership;
          if (!row) return null;
          return {
            id: row.id,
            membershipNumber: row.membership_number,
            receiptNumber: row.receipt_number,
            fullName: row.full_name,
            fatherOrHusbandName: row.father_or_husband_name || undefined,
            dob: row.dob || undefined,
            gender: row.gender || undefined,
            mobile: row.mobile,
            email: '',
            address: [row.district, row.state].filter(Boolean).join(', '),
            district: row.district,
            state: row.state,
            pinCode: row.pin_code || undefined,
            photoUrl: row.photo_url || undefined,
            membershipType: row.membership_type || 'Life Member',
            feeAmount: Number(row.fee_amount || 5000),
            paymentStatus: row.payment_status,
            status: row.status,
            paymentMode: row.payment_mode,
            razorpayOrderId: row.razorpay_order_id,
            razorpayPaymentId: row.razorpay_payment_id,
            paidAt: row.paid_at,
            receiptEmailSent: true,
            auditStatus: row.audit_status || 'Pending Audit',
            auditedAt: row.audited_at,
            createdAt: row.created_at,
          };
        }
      }
    } catch {
      // fall through to direct Supabase SECURITY DEFINER RPC
    }

    return safeQuery(async () => {
      const { data, error } = await supabase.rpc('lookup_confirmed_membership', { p_query: cleanQ });
      if (error || !data || !Array.isArray(data) || data.length === 0) return null;
      const row = data[0];
      return {
        id: row.id,
        membershipNumber: row.membership_number,
        receiptNumber: row.receipt_number,
        fullName: row.full_name,
        fatherOrHusbandName: row.father_or_husband_name || undefined,
        dob: row.dob || undefined,
        gender: row.gender || undefined,
        mobile: row.mobile,
        email: '',
        address: [row.district, row.state].filter(Boolean).join(', '),
        district: row.district,
        state: row.state,
        pinCode: row.pin_code || undefined,
        photoUrl: row.photo_url || undefined,
        membershipType: row.membership_type || 'Life Member',
        feeAmount: Number(row.fee_amount || 5000),
        paymentStatus: row.payment_status,
        status: row.status,
        paymentMode: row.payment_mode,
        razorpayOrderId: row.razorpay_order_id,
        razorpayPaymentId: row.razorpay_payment_id,
        paidAt: row.paid_at,
        receiptEmailSent: true,
        auditStatus: row.audit_status || 'Pending Audit',
        auditedAt: row.audited_at,
        createdAt: row.created_at,
      };
    });
  },

  async fetchMembershipAuditLogs(membershipId: string): Promise<MembershipAuditLog[]> {
    const res = await safeQuery(async () => {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch(
            `/api/admin/memberships/${encodeURIComponent(membershipId)}/audit-logs`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload?.success && Array.isArray(payload.logs)) {
              return payload.logs.map((row: any) => ({
                id: row.id,
                membershipId: row.membership_id,
                membershipNumber: row.membership_number,
                action: row.action,
                previousAuditStatus: row.previous_audit_status,
                newAuditStatus: row.new_audit_status,
                auditNotes: row.audit_notes,
                auditedBy: row.audited_by,
                createdAt: row.created_at,
              }));
            }
          }
        } catch {
          // fall through
        }
      }

      const { data, error } = await supabase
        .from('membership_audit_logs')
        .select(AUDIT_LOG_COLS)
        .eq('membership_id', membershipId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        membershipId: row.membership_id,
        membershipNumber: row.membership_number,
        action: row.action,
        previousAuditStatus: row.previous_audit_status,
        newAuditStatus: row.new_audit_status,
        auditNotes: row.audit_notes,
        auditedBy: row.audited_by,
        createdAt: row.created_at,
      }));
    });
    return res || [];
  },

  async auditMembership(params: {
    id: string;
    membershipNumber?: string;
    previousAuditStatus?: string;
    auditStatus: MembershipAuditStatus;
    auditNotes: string;
    status?: MembershipRecordStatus;
    auditedBy?: string;
  }): Promise<{ success: boolean; auditedBy?: string; auditedAt?: string; error?: string }> {
    try {
      const token = getAdminToken();
      if (token) {
        try {
          const apiRes = await fetch(
            `/api/admin/memberships/${encodeURIComponent(params.id)}/audit`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                auditStatus: params.auditStatus,
                auditNotes: params.auditNotes,
                status: params.status,
              }),
            }
          );
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload?.success) {
              return {
                success: true,
                auditedBy: payload.auditedBy || 'Admin',
                auditedAt: payload.auditedAt || new Date().toISOString(),
              };
            }
          }
        } catch {
          // fall through to Supabase authenticated JWT write
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      const auditorEmail = userData?.user?.email || params.auditedBy || 'Admin';
      const nowIso = new Date().toISOString();

      const updateFields: Record<string, any> = {
        audit_status: params.auditStatus,
        audit_notes: params.auditNotes || null,
        audited_by: auditorEmail,
        audited_at: nowIso,
        updated_at: nowIso,
      };
      if (params.status) {
        updateFields.status = params.status;
      }

      const { error: updErr } = await supabase
        .from('memberships')
        .update(updateFields)
        .eq('id', params.id);

      if (updErr) {
        return { success: false, error: updErr.message };
      }

      await supabase.from('membership_audit_logs').insert({
        membership_id: params.id,
        membership_number: params.membershipNumber || null,
        action:
          params.auditStatus === 'Audited & Verified'
            ? 'AUDIT_VERIFIED'
            : params.auditStatus === 'Flagged'
            ? 'AUDIT_FLAGGED'
            : 'AUDIT_UPDATED',
        previous_audit_status: params.previousAuditStatus || null,
        new_audit_status: params.auditStatus,
        audit_notes: params.auditNotes || null,
        audited_by: auditorEmail,
        created_at: nowIso,
      });

      return { success: true, auditedBy: auditorEmail, auditedAt: nowIso };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Audit update failed.' };
    }
  },

  // --- ANNOUNCEMENTS ---
  async fetchAnnouncements(limit = 20): Promise<Announcement[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(ANNOUNCEMENT_COLS)
        .order('date', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        date: row.date,
        content: row.content,
        isImportant: row.is_important ?? false,
        imageUrl: row.image_url,
      }));
    });
  },

  async saveAnnouncement(ann: Announcement): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
        id: ann.id,
        title: ann.title,
        date: ann.date,
        content: ann.content,
        is_important: ann.isImportant,
        image_url: ann.imageUrl,
        raw_data: compactRawData(ann),
      };
      const { error } = await supabase.from('announcements').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    const res = await safeQuery(async () => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      return !error;
    });
    return Boolean(res);
  },

  // --- SETTINGS ---
  async fetchSettings(): Promise<TrustSettings | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase
        .from('trust_settings')
        .select(SETTINGS_COLS)
        .eq('id', 'current_settings')
        .maybeSingle();
      if (error || !data) return null;
      return data.raw_data || null;
    });
  },

  async saveSettings(settings: TrustSettings): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
        id: 'current_settings',
        trust_name: settings.name,
        trust_name_en: settings.nameHi,
        registration_number: settings.registrationNumber,
        chairperson_name: settings.chairpersonName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        raw_data: settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('trust_settings').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  // --- BATCH SYNC ALL TO SUPABASE ---
  async syncAllToSupabase(allData: {
    applications: ServiceApplication[];
    students: Student[];
    idCards: IdCard[];
    volunteers: Volunteer[];
    donations: Donation[];
    announcements: Announcement[];
    settings: TrustSettings;
  }): Promise<{
    success: boolean;
    syncedCounts: {
      applications: number;
      students: number;
      idCards: number;
      volunteers: number;
      donations: number;
      announcements: number;
    };
    error?: string;
  }> {
    const counts = {
      applications: 0,
      students: 0,
      idCards: 0,
      volunteers: 0,
      donations: 0,
      announcements: 0,
    };

    try {
      // 1. Applications (Batch upsert)
      if (allData.applications.length > 0) {
        const appRows = allData.applications.map((app) => {
          const row: Record<string, any> = {
            id: app.id,
            service_category: app.serviceCategory,
            service_title_hi: app.serviceTitleHi,
            full_name: app.fullName,
            father_or_husband_name: app.fatherOrHusbandName,
            mother_name: app.motherName,
            dob: app.dob,
            gender: app.gender,
            mobile: app.mobile,
            email: app.email,
            aadhaar_number: app.aadhaarNumber,
            address: app.address,
            state: app.state,
            district: app.district,
            pincode: app.pinCode,
            status: app.status,
            submitted_at: app.submittedAt || new Date().toISOString(),
            remarks: app.statusRemarks,
            raw_data: compactRawData(app),
          };
          if (app.photoUrl !== undefined) row.photo_url = app.photoUrl;
          if (app.aadhaarFrontUrl !== undefined) row.aadhaar_front_url = app.aadhaarFrontUrl;
          if (app.aadhaarBackUrl !== undefined) row.aadhaar_back_url = app.aadhaarBackUrl;
          return row;
        });
        const { error } = await supabase.from('applications').upsert(appRows);
        if (!error) counts.applications = appRows.length;
      }

      // 2. Students (Batch upsert)
      if (allData.students.length > 0) {
        const stuRows = allData.students.map((stu) => {
          const row: Record<string, any> = {
            id: stu.id,
            registration_number: stu.registrationNumber,
            full_name: stu.name,
            father_name: stu.fatherName,
            mother_name: stu.motherName,
            dob: stu.dob,
            gender: stu.gender,
            mobile: stu.mobile,
            email: stu.email,
            aadhaar_number: stu.aadhaarNumber,
            address: stu.address,
            current_class: stu.studentClass,
            school_or_college: stu.schoolOrInstitute,
            category: stu.category,
            status: stu.status,
            registered_at: stu.registeredAt || new Date().toISOString(),
            password: stu.password,
            raw_data: compactRawData(stu),
          };
          if (stu.photoUrl !== undefined) row.photo_url = stu.photoUrl;
          if (stu.aadhaarFrontUrl !== undefined) row.aadhaar_front_url = stu.aadhaarFrontUrl;
          if (stu.aadhaarBackUrl !== undefined) row.aadhaar_back_url = stu.aadhaarBackUrl;
          return row;
        });
        const { error } = await supabase.from('students').upsert(stuRows);
        if (!error) counts.students = stuRows.length;
      }

      // 3. ID Cards (Batch upsert)
      if (allData.idCards.length > 0) {
        const cardRows = allData.idCards.map((card) => {
          const row: Record<string, any> = {
            id: card.id,
            card_number: card.cardNumber,
            category: card.category,
            category_title_hi: card.categoryLabelHi,
            category_title_en: card.categoryLabelEn,
            full_name: card.fullName,
            father_or_husband_name: card.fatherOrHusbandName,
            dob: card.dob,
            gender: card.gender,
            mobile: card.mobile,
            blood_group: card.bloodGroup,
            aadhaar_number: card.aadhaarNumber,
            address: card.address,
            issue_date: card.issueDate,
            valid_upto: card.validTill,
            status: card.status,
            created_at: card.createdAt || new Date().toISOString(),
            raw_data: compactRawData(card),
          };
          if (card.photoUrl !== undefined) row.photo_url = card.photoUrl;
          return row;
        });
        const { error } = await supabase.from('id_cards').upsert(cardRows);
        if (!error) counts.idCards = cardRows.length;
      }

      // 4. Volunteers (Batch upsert)
      if (allData.volunteers.length > 0) {
        const volRows = allData.volunteers.map((vol) => {
          const row: Record<string, any> = {
            id: vol.id,
            name: vol.name,
            gender: vol.gender,
            mobile: vol.mobile,
            email: vol.email,
            aadhaar_number: vol.aadhaarNumber,
            address: vol.address,
            occupation: vol.occupation,
            skills: vol.skills,
            preferred_service: vol.preferredService,
            availability: vol.availableTime,
            status: vol.status,
            registered_at: vol.registeredAt || new Date().toISOString(),
            raw_data: compactRawData(vol),
          };
          if (vol.photoUrl !== undefined) row.photo_url = vol.photoUrl;
          if (vol.aadhaarFrontUrl !== undefined) row.aadhaar_front_url = vol.aadhaarFrontUrl;
          if (vol.aadhaarBackUrl !== undefined) row.aadhaar_back_url = vol.aadhaarBackUrl;
          return row;
        });
        const { error } = await supabase.from('volunteers').upsert(volRows);
        if (!error) counts.volunteers = volRows.length;
      }

      // 5. Donations
      for (const don of allData.donations) {
        const ok = await this.saveDonation(don);
        if (ok) counts.donations++;
      }

      // 6. Announcements (Batch upsert)
      if (allData.announcements.length > 0) {
        const annRows = allData.announcements.map((ann) => ({
          id: ann.id,
          title: ann.title,
          date: ann.date,
          content: ann.content,
          is_important: ann.isImportant,
          image_url: ann.imageUrl,
          raw_data: compactRawData(ann),
        }));
        const { error } = await supabase.from('announcements').upsert(annRows);
        if (!error) counts.announcements = annRows.length;
      }

      // 7. Settings
      await this.saveSettings(allData.settings);

      return { success: true, syncedCounts: counts };
    } catch (err: any) {
      return { success: false, syncedCounts: counts, error: err?.message || 'Sync failed' };
    }
  },
};
